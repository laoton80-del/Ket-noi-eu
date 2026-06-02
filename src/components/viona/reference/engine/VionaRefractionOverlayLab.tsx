/**
 * Lab-only refraction overlay — inner rim + lower caustic band.
 */
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement } from 'react';
import { View } from 'react-native';

import {
  vionaCrystalLabSemanticTokens,
  type VionaCrystalLabSemantic,
} from '../../../../design/vionaCrystalLabTokens';

export type VionaRefractionOverlayLabProps = {
  borderRadius: number;
  semantic?: VionaCrystalLabSemantic;
  refractHeightRatio?: number;
};

export function VionaRefractionOverlayLab({
  borderRadius,
  semantic = 'emerald',
  refractHeightRatio = 0.3,
}: VionaRefractionOverlayLabProps): ReactElement {
  const tokens = vionaCrystalLabSemanticTokens(semantic);
  return (
    <>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: borderRadius - 1,
          borderWidth: 1,
          borderColor: tokens.innerRim,
          margin: 1,
          opacity: 0.55,
          zIndex: 3,
        }}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[...tokens.lowerRefraction]}
        locations={[...tokens.lowerRefractionLocations]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: `${Math.round(refractHeightRatio * 100)}%`,
          borderBottomLeftRadius: borderRadius,
          borderBottomRightRadius: borderRadius,
          zIndex: 2,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 11,
          right: 11,
          bottom: 9,
          height: 1,
          backgroundColor: tokens.edgeHighlight,
          opacity: 0.28,
          zIndex: 4,
        }}
      />
    </>
  );
}
