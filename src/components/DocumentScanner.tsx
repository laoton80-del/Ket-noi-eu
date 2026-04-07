import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { scanDocumentWithAI, type DocumentScanAiResult } from '../services/OpenAIService';
import { FontFamily } from '../theme/typography';

export type DocumentScannerResult = DocumentScanAiResult;

export function toIsoDateFromDdMmYyyy(value: string | null): string {
  if (!value) return '';
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return '';
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

export function mapDocumentTypeToCoreType(input: string): 'passport' | 'visa_residency' | 'labor_contract' {
  const value = input.toLowerCase();
  if (value.includes('hộ chiếu') || value.includes('ho chieu') || value.includes('passport')) return 'passport';
  if (
    value.includes('thẻ cư trú') ||
    value.includes('the cu tru') ||
    value.includes('visa') ||
    value.includes('residency')
  ) {
    return 'visa_residency';
  }
  return 'labor_contract';
}

export function DocumentScanner({
  visible,
  onClose,
  onScanned,
  countryCode,
}: {
  visible: boolean;
  onClose: () => void;
  onScanned: (result: DocumentScannerResult) => void;
  countryCode?: string;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanning, setScanning] = useState(false);

  if (!visible) return null;

  const onCapture = async () => {
    if (!cameraRef.current || scanning) return;
    setScanning(true);
    try {
      const shot = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: true });
      if (!shot?.uri) return;
      const srcWidth = Math.max(1, shot.width ?? 1200);
      const srcHeight = Math.max(1, shot.height ?? 1800);
      const cropWidth = Math.round(srcWidth * 0.84);
      const cropHeight = Math.round(srcHeight * 0.56);
      const cropX = Math.max(0, Math.round((srcWidth - cropWidth) / 2));
      const cropY = Math.max(0, Math.round((srcHeight - cropHeight) / 2));
      const optimized = await manipulateAsync(
        shot.uri,
        [{ crop: { originX: cropX, originY: cropY, width: cropWidth, height: cropHeight } }, { resize: { width: 800 } }],
        { compress: 0.7, format: SaveFormat.JPEG, base64: true }
      );
      const base64 =
        optimized.base64 ??
        (await FileSystem.readAsStringAsync(optimized.uri, { encoding: FileSystem.EncodingType.Base64 }));
      const result = await scanDocumentWithAI(base64, countryCode);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onScanned(result);
    } finally {
      setScanning(false);
    }
  };

  return (
    <View style={styles.overlay}>
      {!permission ? (
        <View style={styles.permissionCard}>
          <ActivityIndicator color="#D4AF37" />
        </View>
      ) : !permission.granted ? (
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Cần quyền Camera</Text>
          <Pressable onPress={() => void requestPermission()} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.86 }]}>
            <Text style={styles.actionText}>Cho phép</Text>
          </Pressable>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.86 }]}>
            <Text style={styles.closeText}>Đóng</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.cameraWrap}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" enableTorch={flashEnabled} />
          <View style={styles.topBar}>
            <Pressable onPress={onClose} style={styles.iconBtn}>
              <Ionicons name="close" size={20} color="#FFE9C0" />
            </Pressable>
            <Pressable onPress={() => setFlashEnabled((v) => !v)} style={styles.iconBtn}>
              <Ionicons name={flashEnabled ? 'flash' : 'flash-off'} size={18} color="#FFE9C0" />
            </Pressable>
          </View>
          <View style={styles.boundingBox} />
          <Text style={styles.hintText}>Đặt giấy tờ vào khung, giữ máy ổn định rồi chụp</Text>
          <Pressable onPress={onCapture} disabled={scanning} style={({ pressed }) => [styles.captureOuter, pressed && { opacity: 0.85 }]}>
            <View style={styles.captureInner}>{scanning ? <ActivityIndicator color="#FFEAD0" /> : null}</View>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(12,10,8,0.72)' },
  permissionCard: {
    marginTop: 180,
    marginHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.45)',
    backgroundColor: 'rgba(28,22,16,0.9)',
    alignItems: 'center',
    padding: 16,
  },
  permissionTitle: { color: '#FFF0CF', fontSize: 16, fontFamily: FontFamily.bold, marginBottom: 12 },
  actionBtn: {
    minWidth: 120,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { color: '#FFE8D0', fontFamily: FontFamily.bold },
  closeBtn: {
    marginTop: 8,
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  closeText: { color: '#FFE8D0', fontSize: 12, fontFamily: FontFamily.medium },
  cameraWrap: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.45)',
    backgroundColor: 'rgba(21,17,12,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boundingBox: {
    marginTop: 170,
    marginHorizontal: 28,
    height: 250,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.92)',
    backgroundColor: 'transparent',
  },
  hintText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#FFE7C7',
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  captureOuter: {
    position: 'absolute',
    bottom: 42,
    alignSelf: 'center',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: 'rgba(212,175,55,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,232,170,0.24)',
  },
  captureInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#CB3D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

