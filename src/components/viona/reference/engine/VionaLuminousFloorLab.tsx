/**
 * Lab-only luminous floor / stage light at panel or card bottom.
 */
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement } from 'react';
import { View } from 'react-native';

import {
  vionaCrystalLabSemanticTokens,
  type VionaCrystalLabSemantic,
} from '../../../../design/vionaCrystalLabTokens';

export type VionaLuminousFloorLabProps = {
  borderRadius: number;
  semantic?: VionaCrystalLabSemantic;
  heightRatio?: number;
};

export function VionaLuminousFloorLab({
  borderRadius,
  semantic = 'emerald',
  heightRatio = 0.24,
}: VionaLuminousFloorLabProps): ReactElement {
  const tokens = vionaCrystalLabSemanticTokens(semantic);
  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[...tokens.floorReflection]}
        locations={[...tokens.floorReflectionLocations]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          left: '8%',
          right: '8%',
          bottom: 0,
          height: `${Math.round(heightRatio * 100)}%`,
          borderRadius: borderRadius * 0.4,
          zIndex: 1,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          backgroundColor: tokens.semanticGlow,
          opacity: 0.12,
          zIndex: 2,
        }}
      />
    </>
  );
}
