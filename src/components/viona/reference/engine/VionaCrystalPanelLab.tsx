/**
 * Lab-only crystal panel shell — luminous stage container.
 */
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement, ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Stop } from 'react-native-svg';

import {
  vionaCrystalLabCard,
  vionaCrystalLabOuterGlowStyle,
  vionaCrystalLabPage,
} from '../../../../design/vionaCrystalLabTokens';
import { vionaReferencePanelWebGlass } from '../../../../design/vionaReferenceVisualTokens';
import { VionaLuminousFloorLab } from './VionaLuminousFloorLab';
import { VionaRefractionOverlayLab } from './VionaRefractionOverlayLab';
import { VionaSpecularOverlayLab } from './VionaSpecularOverlayLab';

const EMERALD = 'rgba(72, 210, 165, 1)';
const CYAN = 'rgba(92, 205, 255, 1)';

function PanelStageBackdrop(): ReactElement {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 140" preserveAspectRatio="xMidYMax slice" style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="panelStageHorizon" cx="50%" cy="94%" rx="62%" ry="30%">
          <Stop offset="0%" stopColor={CYAN} stopOpacity={0.16} />
          <Stop offset="50%" stopColor={EMERALD} stopOpacity={0.1} />
          <Stop offset="100%" stopColor={EMERALD} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Path d="M0 0 L400 0 L400 140 L0 140 Z" fill="url(#panelStageHorizon)" />
      <Path
        d="M0 92 L24 78 L52 86 L78 64 L108 74 L134 58 L162 70 L192 48 L228 60 L264 42 L298 54 L334 38 L368 52 L400 44 L400 140 L0 140 Z"
        fill="none"
        stroke={EMERALD}
        strokeWidth={0.8}
        strokeOpacity={0.14}
      />
      {[52, 68, 84, 100, 116].map((y) => (
        <Line key={`h-${y}`} x1={0} y1={y} x2={400} y2={y} stroke={CYAN} strokeOpacity={0.04} strokeWidth={0.7} />
      ))}
      {[
        [32, 88],
        [88, 72],
        [148, 80],
        [208, 66],
        [268, 74],
        [328, 62],
      ].map(([x, y], i) => (
        <Circle key={`n-${i}`} cx={x} cy={y} r={2.2} fill={i % 2 === 0 ? EMERALD : CYAN} opacity={0.35} />
      ))}
    </Svg>
  );
}

export type VionaCrystalPanelLabProps = {
  width: number | '100%';
  testID?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function VionaCrystalPanelLab({
  width,
  testID,
  style,
  children,
}: VionaCrystalPanelLabProps): ReactElement {
  const borderRadius = vionaCrystalLabCard.panelBorderRadius;
  const bw = 1.25;
  const innerRadius = Math.max(0, borderRadius - bw);

  return (
    <View
      testID={testID}
      style={[
        { width, borderRadius, backgroundColor: vionaCrystalLabPage.background },
        vionaCrystalLabOuterGlowStyle('emerald'),
        style,
      ]}
    >
      <LinearGradient
        colors={[
          'rgba(120, 255, 210, 0.55)',
          'rgba(72, 210, 165, 0.28)',
          'rgba(0, 0, 0, 0.4)',
          'rgba(0, 0, 0, 0.58)',
        ]}
        locations={[0, 0.32, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius, padding: bw }}
      >
        <View
          style={[
            {
              borderRadius: innerRadius,
              overflow: 'hidden',
              backgroundColor: 'rgba(0, 1, 3, 0.88)',
            },
            vionaReferencePanelWebGlass(),
          ]}
        >
          <View style={styles.backdrop}>
            <PanelStageBackdrop />
          </View>
          <VionaSpecularOverlayLab borderRadius={innerRadius} semantic="emerald" heightRatio={0.16} />
          <VionaRefractionOverlayLab borderRadius={innerRadius} semantic="emerald" refractHeightRatio={0.22} />
          <VionaLuminousFloorLab borderRadius={innerRadius} semantic="emerald" heightRatio={0.2} />
          <View style={styles.content}>{children}</View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.95,
    zIndex: 0,
  },
  content: {
    zIndex: 4,
    padding: 14,
    gap: 12,
  },
});
