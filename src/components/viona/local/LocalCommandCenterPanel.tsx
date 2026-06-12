/**
 * Local universe command-center panel — VIONA six-universe reference replica.
 * Visual only: panel chrome, skyline backdrop, universe header, flagship tile tray.
 */
import { Ionicons } from '@expo/vector-icons';
import { type ReactElement, type ReactNode } from 'react';
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient as SvgGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { vionaReferencePanelGlass } from '../../../design/vionaReferenceVisualTokens';
import { premiumLuminousInk } from '../../../design/premiumTileVisualTokens';
import { FontFamily } from '../../../theme/typography';
import { VionaReferenceGlassPanel } from '../VionaReferenceGlass';
import { localConstellation } from '../../local/localConstellationTokens';

const EMERALD = localConstellation.accentEmerald;
const CYAN = localConstellation.accentCyan;

const SKYLINE_NODES: readonly (readonly [number, number, 'emerald' | 'cyan'])[] = [
  [18, 78, 'cyan'],
  [44, 70, 'emerald'],
  [72, 62, 'cyan'],
  [108, 68, 'emerald'],
  [142, 54, 'cyan'],
  [176, 60, 'emerald'],
  [210, 50, 'cyan'],
  [244, 58, 'emerald'],
  [278, 48, 'cyan'],
  [312, 54, 'emerald'],
  [346, 46, 'cyan'],
  [382, 56, 'emerald'],
];

export type LocalCommandCenterPanelProps = Readonly<{
  kicker: string;
  headline: string;
  subtitle: string;
  trustLine: string;
  safetyChips: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}>;

function LocalRefractionGrid(): ReactElement {
  const lines: readonly (readonly [number, number, number, number])[] = [
    [0, 40, 400, 88],
    [0, 72, 400, 120],
    [40, 0, 120, 130],
    [160, 0, 280, 130],
    [280, 0, 400, 130],
  ];
  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 130" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
      {lines.map(([x1, y1, x2, y2], i) => (
        <Line
          key={`refract-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={CYAN}
          strokeWidth={0.65}
          strokeOpacity={vionaReferencePanelGlass.refractionGridOpacity}
        />
      ))}
    </Svg>
  );
}

function LocalCommandCenterSkyline(): ReactElement {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 400 130"
      preserveAspectRatio="xMidYMax slice"
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <SvgGradient id="localReplicaSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={CYAN} stopOpacity={0.05} />
          <Stop offset="40%" stopColor={EMERALD} stopOpacity={0.1} />
          <Stop offset="100%" stopColor={EMERALD} stopOpacity={0.01} />
        </SvgGradient>
        <RadialGradient id="localReplicaHorizon" cx="50%" cy="92%" rx="62%" ry="34%">
          <Stop offset="0%" stopColor={CYAN} stopOpacity={0.15} />
          <Stop offset="50%" stopColor={EMERALD} stopOpacity={0.08} />
          <Stop offset="100%" stopColor={EMERALD} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="localReplicaNodeCyan" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={CYAN} stopOpacity={0.65} />
          <Stop offset="100%" stopColor={CYAN} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="localReplicaNodeEmerald" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={EMERALD} stopOpacity={0.6} />
          <Stop offset="100%" stopColor={EMERALD} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Path d="M0 0 L400 0 L400 130 L0 130 Z" fill="url(#localReplicaHorizon)" />
      <Path
        d="M0 88 L20 76 L44 82 L68 60 L98 70 L124 54 L158 66 L188 44 L224 56 L258 38 L292 50 L326 34 L360 48 L400 40 L400 130 L0 130 Z"
        fill="url(#localReplicaSky)"
        opacity={0.8}
      />
      {[48, 64, 80, 96, 112].map((y) => (
        <Line
          key={`grid-h-${y}`}
          x1={0}
          y1={y}
          x2={400}
          y2={y}
          stroke={CYAN}
          strokeOpacity={0.035}
          strokeWidth={0.85}
        />
      ))}
      {[32, 72, 112, 152, 192, 232, 272, 312, 352].map((x) => (
        <Line
          key={`grid-v-${x}`}
          x1={x}
          y1={32}
          x2={x}
          y2={130}
          stroke={EMERALD}
          strokeOpacity={0.04}
          strokeWidth={0.85}
        />
      ))}
      <Path
        d="M0 104 Q80 88 160 96 T320 90 T400 88"
        fill="none"
        stroke={CYAN}
        strokeOpacity={0.2}
        strokeWidth={1.4}
      />
      <Path
        d="M0 112 Q120 98 240 106 T400 100"
        fill="none"
        stroke={EMERALD}
        strokeOpacity={0.14}
        strokeWidth={1.05}
      />
      <Path
        d="M24 72 Q108 56 200 64 T376 52"
        fill="none"
        stroke={CYAN}
        strokeOpacity={0.1}
        strokeWidth={0.9}
        strokeDasharray="4 6"
      />
      <Path
        d="M40 84 Q140 74 260 80 T388 76"
        fill="none"
        stroke={EMERALD}
        strokeOpacity={0.1}
        strokeWidth={0.85}
      />
      <Path
        d="M48 64 L88 56 L128 62 L168 50 L208 58 L248 46 L288 54"
        fill="none"
        stroke={CYAN}
        strokeOpacity={0.12}
        strokeWidth={0.8}
      />
      {SKYLINE_NODES.map(([cx, cy, tone], i) => (
        <Circle
          key={`halo-${i}`}
          cx={cx}
          cy={cy}
          r={4.5}
          fill={tone === 'cyan' ? 'url(#localReplicaNodeCyan)' : 'url(#localReplicaNodeEmerald)'}
          opacity={0.9}
        />
      ))}
      {SKYLINE_NODES.map(([cx, cy, tone], i) => (
        <Circle
          key={`core-${i}`}
          cx={cx}
          cy={cy}
          r={1.4}
          fill={tone === 'cyan' ? CYAN : EMERALD}
          opacity={0.95}
        />
      ))}
    </Svg>
  );
}

export function LocalCommandCenterPanel({
  kicker,
  headline,
  subtitle,
  trustLine,
  safetyChips,
  children,
  style,
  testID = 'local-command-center-panel',
}: LocalCommandCenterPanelProps): ReactElement {
  return (
    <VionaReferenceGlassPanel
      testID={testID}
      style={[styles.panelRoot, style]}
      skyline={<LocalCommandCenterSkyline />}
      refractionGrid={
        <View style={styles.refractionGridSlot} pointerEvents="none">
          <LocalRefractionGrid />
        </View>
      }
      flagshipFloor={
        <View style={styles.flagshipFloor} testID="local-command-center-flagship">
          {children}
        </View>
      }
    >
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.universeIconWell}>
              <Ionicons name="location" size={12} color={EMERALD} accessibilityIgnoresInvertColors />
            </View>
            <View style={styles.titleCopy}>
              <Text style={styles.universeTitle}>{kicker}</Text>
              <Text style={styles.universeTagline} numberOfLines={1}>
                {headline}
              </Text>
            </View>
          </View>
          <Text style={styles.compactMeta} numberOfLines={2}>
            {subtitle}
            {' · '}
            {trustLine}
          </Text>
          <View style={styles.chipRow}>{safetyChips}</View>
        </View>
      </View>
    </VionaReferenceGlassPanel>
  );
}

const styles = StyleSheet.create({
  panelRoot: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    ...(Platform.OS !== 'web'
      ? {
          shadowColor: EMERALD,
          shadowOpacity: 0.28,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        }
      : {}),
  },
  refractionGridSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '68%',
    zIndex: 1,
    opacity: 0.9,
  },
  body: {
    width: '100%',
    minWidth: 0,
  },
  header: {
    paddingHorizontal: 9,
    paddingTop: 4,
    paddingBottom: 1,
    gap: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minWidth: 0,
  },
  universeIconWell: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(72, 210, 165, 0.45)',
    backgroundColor: 'rgba(72, 210, 165, 0.12)',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 0 12px rgba(72, 210, 165, 0.2)' } as ViewStyle)
      : {}),
  },
  titleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  universeTitle: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: EMERALD,
  },
  universeTagline: {
    fontSize: 8.5,
    lineHeight: 11,
    fontFamily: FontFamily.semibold,
    color: premiumLuminousInk.subtitle,
  },
  compactMeta: {
    fontSize: 7.5,
    lineHeight: 10,
    fontFamily: FontFamily.medium,
    color: premiumLuminousInk.subtitleMinimum,
    marginTop: 1,
    paddingLeft: 29,
    opacity: 0.92,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginTop: 2,
    paddingLeft: 29,
  },
  flagshipFloor: {
    marginHorizontal: 8,
    marginBottom: 8,
    marginTop: 0,
    paddingHorizontal: 2,
    paddingTop: 2,
    minWidth: 0,
    alignSelf: 'stretch',
    position: 'relative',
  },
});
