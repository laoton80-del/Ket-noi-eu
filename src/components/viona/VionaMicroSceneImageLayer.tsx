/**
 * VIONA Wave 3B — textless PNG micro-scene layer (bright object/scene, not dark poster).
 */
import type { ReactElement } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import type { VionaMicroSceneKey } from '../../design/vionaMicroSceneAssets';
import {
  getVionaMicroSceneAsset,
  vionaMicroSceneTileLayout,
} from '../../design/vionaMicroSceneAssets';

export type VionaMicroSceneImageLayerProps = Readonly<{
  microSceneKey: VionaMicroSceneKey;
  /** Large lower-band scene for Local command-center reference. */
  prominent?: boolean;
}>;

export function VionaMicroSceneImageLayer({
  microSceneKey,
  prominent = false,
}: VionaMicroSceneImageLayerProps): ReactElement | null {
  const asset = getVionaMicroSceneAsset(microSceneKey);
  if (!asset) return null;

  return (
    <View pointerEvents="none" style={prominent ? styles.slotProminent : styles.slotCorner}>
      <Image
        source={asset.source}
        accessibilityIgnoresInvertColors
        style={[
          styles.image,
          prominent ? styles.imageProminent : styles.imageCorner,
        ]}
        resizeMode="contain"
      />
      <View style={[styles.veil, prominent ? styles.veilProminent : styles.veilCorner]} />
    </View>
  );
}

const styles = StyleSheet.create({
  slotCorner: {
    width: vionaMicroSceneTileLayout.slotWidth,
    height: vionaMicroSceneTileLayout.slotHeight,
    overflow: 'hidden',
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
  slotProminent: {
    width: vionaMicroSceneTileLayout.prominentSlotWidth,
    height: vionaMicroSceneTileLayout.prominentSlotHeight,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageCorner: {
    opacity: vionaMicroSceneTileLayout.imageOpacity,
  },
  imageProminent: {
    opacity: vionaMicroSceneTileLayout.prominentImageOpacity,
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 10, 22, 0.42)',
  },
  veilCorner: {
    opacity: vionaMicroSceneTileLayout.veilOpacity,
  },
  veilProminent: {
    opacity: vionaMicroSceneTileLayout.prominentVeilOpacity,
    backgroundColor: 'rgba(4, 10, 22, 0.28)',
  },
});
