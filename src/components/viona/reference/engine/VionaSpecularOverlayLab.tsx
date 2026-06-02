/**
 * Lab-only specular overlay — top-left shine + top edge line.
 */
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  vionaCrystalLabSemanticTokens,
  type VionaCrystalLabSemantic,
} from '../../../../design/vionaCrystalLabTokens';

export type VionaSpecularOverlayLabProps = {
  borderRadius: number;
  semantic?: VionaCrystalLabSemantic;
  heightRatio?: number;
};

export function VionaSpecularOverlayLab({
  borderRadius,
  semantic = 'emerald',
  heightRatio = 0.2,
}: VionaSpecularOverlayLabProps): ReactElement {
  const tokens = vionaCrystalLabSemanticTokens(semantic);
  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[...tokens.specularTop]}
        locations={[...tokens.specularLocations]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.65 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${Math.round(heightRatio * 100)}%`,
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
          zIndex: 4,
        }}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[...tokens.cornerSpecular]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '38%',
          height: '22%',
          borderTopLeftRadius: borderRadius,
          zIndex: 4,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 7,
          right: 7,
          height: 1,
          backgroundColor: tokens.edgeHighlight,
          opacity: 0.42,
          zIndex: 5,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 5,
          left: 1,
          bottom: 12,
          width: 1,
          backgroundColor: tokens.edgeHighlight,
          opacity: 0.22,
          zIndex: 5,
        }}
      />
    </>
  );
}
