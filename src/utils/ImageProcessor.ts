/**
 * Client-side media optimization: all merchant/user photo uploads must be resized & WebP-encoded
 * before base64 or FormData — never ship multi‑MB camera originals to the API.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { Image as CompressorImage } from 'react-native-compressor';

import { MAX_MEDIA_UPLOAD_BYTES } from '../constants/mediaUploadLimits';

/** Long edge cap (matches product spec). */
export const MERCHANT_IMAGE_MAX_EDGE = 1080;
/** WebP quality (0–1). */
export const MERCHANT_IMAGE_WEBP_QUALITY = 0.8;
/** Hard ceiling — must match `MAX_MEDIA_UPLOAD_BYTES` on the API. */
export const HARD_MAX_UPLOAD_BYTES = MAX_MEDIA_UPLOAD_BYTES;
/** Target budget after optimization (bytes). */
export const TARGET_MAX_BYTES = 1.25 * 1024 * 1024;

export type OptimizedImageResult = Readonly<{
  uri: string;
  mimeType: 'image/webp';
  width?: number;
  height?: number;
  sizeBytes: number;
}>;

function getCropPicker(): typeof import('react-native-image-crop-picker').default | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-image-crop-picker').default as typeof import('react-native-image-crop-picker').default;
  } catch {
    return null;
  }
}

async function fileSizeBytes(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) return 0;
  return typeof info.size === 'number' ? info.size : 0;
}

/**
 * Native: fast downscale via react-native-compressor, then WebP via expo-image-manipulator.
 * Web: expo-image-picker + manipulate only (no native compressor / crop-picker).
 */
export async function compressLocalImageForUpload(localUri: string): Promise<OptimizedImageResult> {
  let working = localUri;

  if (Platform.OS !== 'web') {
    working = await CompressorImage.compress(working, {
      compressionMethod: 'manual',
      maxWidth: MERCHANT_IMAGE_MAX_EDGE,
      maxHeight: MERCHANT_IMAGE_MAX_EDGE,
      quality: MERCHANT_IMAGE_WEBP_QUALITY,
      output: 'jpg',
    });
  } else {
    working = (
      await manipulateAsync(
        working,
        [{ resize: { width: MERCHANT_IMAGE_MAX_EDGE } }],
        { compress: MERCHANT_IMAGE_WEBP_QUALITY, format: SaveFormat.JPEG }
      )
    ).uri;
  }

  let webp = await manipulateAsync(working, [], {
    format: SaveFormat.WEBP,
    compress: MERCHANT_IMAGE_WEBP_QUALITY,
  });

  let sizeBytes = await fileSizeBytes(webp.uri);
  let q = MERCHANT_IMAGE_WEBP_QUALITY;
  while (sizeBytes > TARGET_MAX_BYTES && q >= 0.45) {
    q = Math.round((q - 0.1) * 100) / 100;
    webp = await manipulateAsync(working, [], { format: SaveFormat.WEBP, compress: q });
    sizeBytes = await fileSizeBytes(webp.uri);
  }

  if (sizeBytes > HARD_MAX_UPLOAD_BYTES) {
    throw new Error('image_optimizer_hard_limit');
  }

  return {
    uri: webp.uri,
    mimeType: 'image/webp',
    width: webp.width,
    height: webp.height,
    sizeBytes,
  };
}

/**
 * Gallery / library pick for merchants — compresses before any network I/O.
 */
export async function pickAndCompressMerchantPhoto(): Promise<OptimizedImageResult> {
  if (Platform.OS === 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      throw new Error('image_picker_permission_denied');
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (res.canceled || !res.assets?.[0]?.uri) {
      throw new Error('image_pick_cancelled');
    }
    return compressLocalImageForUpload(res.assets[0].uri);
  }

  const CropPicker = getCropPicker();
  if (!CropPicker) {
    throw new Error('image_crop_picker_unavailable');
  }

  const img = await CropPicker.openPicker({
    mediaType: 'photo',
    cropping: false,
    compressImageQuality: 0.92,
    compressImageMaxWidth: MERCHANT_IMAGE_MAX_EDGE * 2,
  });

  const path = (img as { path?: string }).path;
  if (!path || path.length === 0) {
    throw new Error('image_pick_empty');
  }

  return compressLocalImageForUpload(
    path.startsWith('file') || path.startsWith('content') ? path : `file://${path}`
  );
}

/** Base64 payload without data-URL prefix (safe for JSON / OpenAI image_url construction). */
export async function optimizedImageToBase64(result: OptimizedImageResult): Promise<string> {
  return FileSystem.readAsStringAsync(result.uri, { encoding: FileSystem.EncodingType.Base64 });
}

/** Data URL for APIs that expect `data:image/webp;base64,...`. */
export async function optimizedImageToDataUrl(result: OptimizedImageResult): Promise<string> {
  const b64 = await optimizedImageToBase64(result);
  return `data:image/webp;base64,${b64}`;
}

/** Multipart field for React Native `fetch` uploads (WebP). */
export function appendOptimizedImageToFormData(
  fd: FormData,
  result: OptimizedImageResult,
  fieldName: string,
  filename = 'upload.webp'
): void {
  fd.append(fieldName, {
    uri: result.uri,
    name: filename,
    type: result.mimeType,
  } as unknown as Blob);
}
