/**
 * Travel dynamic hero lighting network — Local grammar, Travel midnight/cyan semantics.
 * Card-hover accents shift network primary/secondary coherently; baseline returns to cyan.
 */
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { LocalHeroNetworkPulse } from '../viona/local/LocalHeroNetworkPulse';
import { LocalLightingNetworkEdge } from '../viona/local/LocalLightingNetworkEdge';
import type { TravelSemanticAccent } from './TravelGlassCard';
import { resolveTravelHeroNetworkLighting } from './travelHeroSemanticLighting';

export type TravelHeroLightingNetworkProps = Readonly<{
  /** Card-hover semantic accent — drives network primary/secondary when boosted. */
  hoverAccent?: TravelSemanticAccent | null;
  boosted: boolean;
  radius?: number;
  testID?: string;
}>;

export function TravelHeroLightingNetwork({
  hoverAccent = null,
  boosted,
  radius = 18,
  testID = 'travel-hero-lighting-network',
}: TravelHeroLightingNetworkProps): ReactElement {
  const [reduceMotion, setReduceMotion] = useState(false);
  const lighting = useMemo(
    () => resolveTravelHeroNetworkLighting(hoverAccent, boosted),
    [hoverAccent, boosted]
  );

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((value) => {
        if (mounted) setReduceMotion(Boolean(value));
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (value: boolean) =>
      setReduceMotion(Boolean(value))
    );
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  return (
    <View pointerEvents="none" testID={testID} style={styles.root}>
      <LinearGradient
        pointerEvents="none"
        colors={[...lighting.textSafeWash]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.08, y: 0.35 }}
        end={{ x: 0.62, y: 0.55 }}
        style={styles.textSafeField}
      />
      <LocalLightingNetworkEdge
        accent={lighting.networkPrimary}
        secondaryAccent={lighting.networkSecondary}
        tier="hero"
        boosted={boosted}
        radius={radius}
      />
      <LocalHeroNetworkPulse
        accent={lighting.networkPrimary}
        secondaryAccent={lighting.networkSecondary}
        active={boosted}
        reducedMotion={reduceMotion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    overflow: 'hidden',
  },
  textSafeField: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '58%',
  },
});
