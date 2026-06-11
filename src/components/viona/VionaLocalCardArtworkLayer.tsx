/**
 * VIONA Wave 3B — full-card textless artwork layer (mini-poster; renders when PNG exists).
 */
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import type { VionaLocalCardArtworkKey } from '../../design/vionaLocalCardArtworkAssets';
import {
  getVionaLocalCardArtworkImageSource,
  vionaLocalCardArtworkLayout,
  VIONA_LOCAL_CARD_ARTWORK_TIER_BY_KEY,
} from '../../design/vionaLocalCardArtworkAssets';

export type VionaLocalCardArtworkLayerProps = Readonly<{
  artworkKey: VionaLocalCardArtworkKey;
}>;

export function VionaLocalCardArtworkLayer({
  artworkKey,
}: VionaLocalCardArtworkLayerProps): ReactElement | null {
  const source = getVionaLocalCardArtworkImageSource(artworkKey);
  if (!source) return null;

  const tier = VIONA_LOCAL_CARD_ARTWORK_TIER_BY_KEY[artworkKey];
  const imageOpacity = vionaLocalCardArtworkLayout.imageOpacity[tier];
  const safeHeight = vionaLocalCardArtworkLayout.textSafeGradientHeight[tier];

  return (
    <View pointerEvents="none" style={styles.fill}>
      <Image
        source={source}
        accessibilityIgnoresInvertColors
        style={[styles.image, { opacity: imageOpacity }]}
        resizeMode="cover"
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(3, 8, 18, 0.82)', 'rgba(3, 8, 18, 0.42)', 'transparent']}
        locations={[0, 0.45, 1]}
        style={[styles.textSafeBand, { height: safeHeight }]}
      />
      <View style={styles.bottomVeil} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  textSafeBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bottomVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '22%',
    backgroundColor: 'rgba(3, 8, 18, 0.28)',
  },
});
