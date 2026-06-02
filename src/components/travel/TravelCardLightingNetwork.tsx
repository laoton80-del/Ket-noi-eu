/**
 * Travel card lighting network accent — Local card-tier grammar, Travel accents.
 */
import type { ReactElement } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { LocalLightingNetworkEdge } from '../viona/local/LocalLightingNetworkEdge';
import {
  travelSemanticTokens,
  type TravelSemanticAccent,
} from './TravelGlassCard';

export type TravelCardLightingNetworkProps = Readonly<{
  accent: TravelSemanticAccent;
  accentSecondary?: TravelSemanticAccent;
  boosted?: boolean;
  radius?: number;
}>;

export function TravelCardLightingNetwork({
  accent,
  accentSecondary,
  boosted = false,
  radius = 14,
}: TravelCardLightingNetworkProps): ReactElement {
  const tokens = travelSemanticTokens(accent);
  const secondary = accentSecondary ? travelSemanticTokens(accentSecondary) : null;

  return (
    <View pointerEvents="none" style={styles.root}>
      <LinearGradient
        pointerEvents="none"
        colors={[`${tokens.glow}`, 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0.55, y: 0.5 }}
        style={styles.leftWash}
      />
      <LocalLightingNetworkEdge
        accent={tokens.ink}
        secondaryAccent={secondary?.ink}
        tier="card"
        boosted={boosted}
        radius={radius}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    overflow: 'hidden',
  },
  leftWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '48%',
    opacity: 0.35,
  },
});
