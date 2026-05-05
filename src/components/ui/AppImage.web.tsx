/**
 * Web: RN `Image` only — avoids `react-native-fast-image` (`requireNativeComponent` unavailable on web).
 * API mirrors native `AppImage.tsx` (named export, same props surface).
 */

import React, { type ReactElement } from 'react';
import {
  Image,
  View,
  type ImageProps as RNImageProps,
  type ImageResizeMode,
} from 'react-native';

type AppImageProps = Omit<RNImageProps, 'source'> & {
  /** Same shapes as native FastImage `source`; `cache` is accepted and ignored on web. */
  source: RNImageProps['source'] | null | undefined;
  cache?: 'immutable' | 'web' | 'cacheOnly';
};

type ResizeMode = ImageResizeMode;

export function AppImage({
  source,
  cache: _cache,
  resizeMode,
  ...rest
}: AppImageProps): ReactElement {
  const mode = resizeMode as ResizeMode | undefined;

  if (source == null) {
    return (
      <View
        style={rest.style}
        accessibilityLabel={rest.accessibilityLabel}
        testID={rest.testID}
        accessibilityElementsHidden={rest.accessibilityElementsHidden}
        importantForAccessibility={rest.importantForAccessibility}
      />
    );
  }

  if (typeof source === 'number') {
    return <Image source={source} resizeMode={mode} {...rest} />;
  }

  if (
    typeof source === 'object' &&
    !Array.isArray(source) &&
    'uri' in source &&
    typeof (source as { uri?: unknown }).uri === 'string'
  ) {
    const { uri } = source as { uri: string };
    return <Image source={{ uri }} resizeMode={mode} {...rest} />;
  }

  return <Image source={source as RNImageProps['source']} resizeMode={mode} {...rest} />;
}
