/**
 * Disk-backed image cache on native (FastImage). Web uses `AppImage.web.tsx` (RN `Image` only).
 */

import React, { type ReactElement } from 'react';
import { type ImageProps as RNImageProps, type ImageResizeMode } from 'react-native';
import FastImage, { type FastImageProps } from 'react-native-fast-image';

type AppImageProps = Omit<RNImageProps, 'source'> & {
  source: FastImageProps['source'];
  /** FastImage cache policy for remote HTTP(S) URLs (default: immutable). */
  cache?: 'immutable' | 'web' | 'cacheOnly';
};

function isRemoteRequireSource(src: FastImageProps['source']): src is number {
  return typeof src === 'number';
}

function normalizeSource(
  src: FastImageProps['source'],
  cacheOverride: AppImageProps['cache']
): FastImageProps['source'] {
  if (isRemoteRequireSource(src)) return src;
  if (Array.isArray(src)) return src;
  if (src && typeof src === 'object' && 'uri' in src && typeof src.uri === 'string') {
    const u = src.uri;
    const isHttp = u.startsWith('http://') || u.startsWith('https://');
    if (isHttp) {
      return {
        ...src,
        cache: cacheOverride ?? FastImage.cacheControl.immutable,
      };
    }
  }
  return src;
}

/**
 * Drop-in replacement for `<Image />` with aggressive caching for remote URLs on iOS/Android.
 */
export function AppImage({
  source,
  cache,
  resizeMode,
  ...rest
}: AppImageProps): ReactElement {
  const mode = resizeMode as ResizeMode | undefined;

  const norm = normalizeSource(source, cache);
  return (
    <FastImage
      source={norm}
      resizeMode={mode as FastImageProps['resizeMode']}
      {...(rest as Omit<FastImageProps, 'source' | 'resizeMode'>)}
    />
  );
}

type ResizeMode = ImageResizeMode;
