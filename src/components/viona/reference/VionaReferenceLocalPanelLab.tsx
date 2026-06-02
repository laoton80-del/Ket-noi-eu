/**
 * VIONA Wave 3B — Reference visual lab: one Local Universe panel (isolated).
 * Visual truth target: uploaded six-universe reference. Not production Local.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, type ReactElement, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient as SvgGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import {
  premiumLuminousInk,
  premiumUniverseAccentSpec,
  type VionaUniverseAccent,
} from '../../../design/premiumTileVisualTokens';
import {
  vionaReferenceCardGlass,
  vionaReferenceCardShellShadow,
  vionaReferenceCardWebGlass,
  vionaReferenceCtaOrbStyle,
  vionaReferenceLabLocalPanel,
  vionaReferenceTokensForAccent,
} from '../../../design/vionaReferenceVisualTokens';
import { FontFamily } from '../../../theme/typography';
import {
  VionaCornerSpecular,
  VionaFloorReflection,
  VionaGlassSurface,
  VionaGradientBorder,
  VionaInnerRim,
  VionaRefractionGlow,
  VionaReferenceGlassPanel,
  VionaSpecularShine,
  VionaTopEdgeHighlight,
} from '../VionaReferenceGlass';

const EMERALD = 'rgba(72, 210, 165, 1)';
const CYAN = 'rgba(92, 205, 255, 1)';
const GOLD = 'rgba(246, 212, 110, 1)';
const VIOLET = 'rgba(178, 91, 255, 1)';

type LabCardId = 'my-requests' | 'booking-assist' | 'legal-wealth' | 'community';

type LabCardDef = Readonly<{
  id: LabCardId;
  title: string;
  accent: VionaUniverseAccent;
}>;

const LAB_CARDS: readonly LabCardDef[] = [
  { id: 'my-requests', title: 'My Requests', accent: 'emerald' },
  { id: 'booking-assist', title: 'Booking Assist', accent: 'cyan' },
  { id: 'legal-wealth', title: 'Legal & Wealth', accent: 'gold' },
  { id: 'community', title: 'Community Events / Services', accent: 'violet' },
] as const;

export function isVionaReferenceLocalPanelLabRouteEnabled(): boolean {
  if (__DEV__) return true;
  const v = process.env.EXPO_PUBLIC_VIONA_REFERENCE_LOCAL_PANEL_LAB;
  return v === '1' || v === 'true';
}

function LabRefractionGrid(): ReactElement {
  const lines: readonly (readonly [number, number, number, number])[] = [
    [0, 36, 400, 82],
    [0, 68, 400, 114],
    [48, 0, 128, 128],
    [168, 0, 288, 128],
    [288, 0, 400, 128],
  ];
  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 130" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
      {lines.map(([x1, y1, x2, y2], i) => (
        <Line
          key={`lab-refract-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={CYAN}
          strokeWidth={0.7}
          strokeOpacity={0.22}
        />
      ))}
    </Svg>
  );
}

function LabPanelSkyline(): ReactElement {
  const nodes: readonly (readonly [number, number, 'emerald' | 'cyan'])[] = [
    [24, 74, 'cyan'],
    [56, 66, 'emerald'],
    [92, 58, 'cyan'],
    [128, 64, 'emerald'],
    [168, 50, 'cyan'],
    [204, 56, 'emerald'],
    [248, 44, 'cyan'],
    [286, 52, 'emerald'],
    [324, 42, 'cyan'],
    [362, 48, 'emerald'],
  ];
  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 130" preserveAspectRatio="xMidYMax slice" style={StyleSheet.absoluteFill}>
      <Defs>
        <SvgGradient id="labSkyWash" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={CYAN} stopOpacity={0.04} />
          <Stop offset="55%" stopColor={EMERALD} stopOpacity={0.08} />
          <Stop offset="100%" stopColor="#000" stopOpacity={0} />
        </SvgGradient>
        <RadialGradient id="labHorizonPulse" cx="50%" cy="94%" rx="58%" ry="28%">
          <Stop offset="0%" stopColor={CYAN} stopOpacity={0.18} />
          <Stop offset="45%" stopColor={EMERALD} stopOpacity={0.1} />
          <Stop offset="100%" stopColor={EMERALD} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="labNodeCyan" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={CYAN} stopOpacity={0.85} />
          <Stop offset="100%" stopColor={CYAN} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="labNodeEmerald" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={EMERALD} stopOpacity={0.8} />
          <Stop offset="100%" stopColor={EMERALD} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Path d="M0 0 L400 0 L400 130 L0 130 Z" fill="url(#labHorizonPulse)" />
      <Path
        d="M0 86 L18 74 L42 80 L66 58 L96 68 L122 52 L156 64 L186 42 L222 54 L256 36 L290 48 L324 32 L358 46 L400 38 L400 130 L0 130 Z"
        fill="url(#labSkyWash)"
        opacity={0.92}
      />
      <Path
        d="M0 100 Q90 84 180 92 T360 86 T400 84"
        fill="none"
        stroke={CYAN}
        strokeOpacity={0.28}
        strokeWidth={1.6}
      />
      <Path
        d="M0 108 Q140 94 260 102 T400 96"
        fill="none"
        stroke={EMERALD}
        strokeOpacity={0.2}
        strokeWidth={1.1}
      />
      {nodes.map(([x, y, tone], i) => (
        <G key={`lab-node-${i}`}>
          <Circle cx={x} cy={y} r={5.5} fill={tone === 'cyan' ? 'url(#labNodeCyan)' : 'url(#labNodeEmerald)'} />
          <Circle
            cx={x}
            cy={y}
            r={2.2}
            fill={tone === 'cyan' ? CYAN : EMERALD}
            opacity={0.95}
          />
          {i < nodes.length - 1 ? (
            <Line
              x1={x}
              y1={y}
              x2={nodes[i + 1]![0]}
              y2={nodes[i + 1]![1]}
              stroke={tone === 'cyan' ? CYAN : EMERALD}
              strokeOpacity={0.22}
              strokeWidth={0.9}
            />
          ) : null}
        </G>
      ))}
      <Path
        d="M48 118 Q200 108 352 118"
        fill="none"
        stroke={CYAN}
        strokeOpacity={0.14}
        strokeWidth={0.8}
        strokeDasharray="3 5"
      />
    </Svg>
  );
}

function LabMicroSceneArt({ children }: { children: ReactNode }): ReactElement {
  return (
    <View style={styles.sceneSlot} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 220 140" preserveAspectRatio="xMidYMax meet">
        <G transform="translate(0,-4)">{children}</G>
      </Svg>
    </View>
  );
}

function LabPlatform({ cx, fill }: { cx: number; fill: string }): ReactElement {
  return (
    <G>
      <Ellipse cx={cx} cy={122} rx={78} ry={14} fill={fill} opacity={0.55} />
      <Ellipse cx={cx} cy={119} rx={54} ry={8} fill={fill} opacity={0.42} />
      <Ellipse
        cx={cx}
        cy={117}
        rx={38}
        ry={4.5}
        fill="none"
        stroke="rgba(235, 252, 255, 0.55)"
        strokeWidth={1.5}
      />
    </G>
  );
}

function LabSceneMyRequests(): ReactElement {
  return (
    <LabMicroSceneArt>
      <LabPlatform cx={110} fill="rgba(72, 210, 165, 0.5)" />
      <Ellipse cx={110} cy={52} rx={28} ry={28} fill="rgba(72, 210, 165, 0.35)" />
      <Ellipse cx={110} cy={52} rx={18} ry={18} fill="rgba(72, 210, 165, 0.55)" />
      <Rect x={104} y={18} width={12} height={52} rx={6} fill="rgba(72, 210, 165, 0.75)" />
      <Rect x={106} y={20} width={8} height={48} rx={4} fill="rgba(180, 255, 230, 0.35)" />
      <Path
        d="M110 70 L110 108"
        stroke="rgba(120, 255, 210, 0.85)"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Circle cx={110} cy={70} r={14} fill="rgba(72, 210, 165, 0.92)" />
      <Circle cx={110} cy={70} r={9} fill="rgba(180, 255, 230, 0.45)" />
      <Path
        d="M110 64 L110 76 M104 70 L116 70"
        stroke="#fff"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Path
        d="M98 48 Q110 38 122 48"
        fill="none"
        stroke="rgba(200, 255, 240, 0.9)"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </LabMicroSceneArt>
  );
}

function LabSceneBookingAssist(): ReactElement {
  return (
    <LabMicroSceneArt>
      <LabPlatform cx={110} fill="rgba(92, 205, 255, 0.48)" />
      <Ellipse cx={110} cy={58} rx={34} ry={34} fill="rgba(92, 205, 255, 0.28)" />
      <Rect x={78} y={32} width={64} height={58} rx={10} fill="rgba(8, 28, 48, 0.85)" stroke={CYAN} strokeWidth={2.2} />
      <Rect x={78} y={32} width={64} height={16} rx={10} fill="rgba(92, 205, 255, 0.75)" />
      <Rect x={86} y={54} width={10} height={10} rx={2} fill="rgba(92, 205, 255, 0.9)" />
      <Rect x={102} y={54} width={10} height={10} rx={2} fill="rgba(92, 205, 255, 0.55)" />
      <Rect x={118} y={54} width={10} height={10} rx={2} fill="rgba(92, 205, 255, 0.55)" />
      <Rect x={86} y={70} width={10} height={10} rx={2} fill="rgba(92, 205, 255, 0.4)" />
      <Rect x={102} y={70} width={10} height={10} rx={2} fill="rgba(92, 205, 255, 0.85)" />
      <Path
        d="M92 40 h36"
        stroke="rgba(220, 248, 255, 0.7)"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </LabMicroSceneArt>
  );
}

function LabSceneLegalWealth(): ReactElement {
  return (
    <LabMicroSceneArt>
      <LabPlatform cx={110} fill="rgba(246, 212, 110, 0.45)" />
      <Ellipse cx={110} cy={56} rx={30} ry={30} fill="rgba(246, 212, 110, 0.22)" />
      <Path d="M110 28 L110 88" stroke={GOLD} strokeWidth={2.4} strokeLinecap="round" />
      <Path
        d="M78 48 L142 48"
        stroke={GOLD}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      <Path
        d="M86 48 L86 72 Q110 82 134 72 L134 48"
        fill="rgba(246, 212, 110, 0.35)"
        stroke={GOLD}
        strokeWidth={2}
      />
      <Path
        d="M74 48 L86 48 M134 48 L146 48"
        stroke="rgba(255, 240, 200, 0.9)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx={86} cy={48} r={5} fill="rgba(246, 212, 110, 0.95)" />
      <Circle cx={134} cy={48} r={5} fill="rgba(246, 212, 110, 0.95)" />
      <Path
        d="M98 62 L110 72 L122 62"
        fill="rgba(255, 235, 170, 0.5)"
        stroke={GOLD}
        strokeWidth={1.6}
      />
    </LabMicroSceneArt>
  );
}

function LabSceneCommunity(): ReactElement {
  return (
    <LabMicroSceneArt>
      <LabPlatform cx={110} fill="rgba(178, 91, 255, 0.48)" />
      <Ellipse cx={110} cy={58} rx={32} ry={32} fill="rgba(178, 91, 255, 0.24)" />
      <Circle cx={88} cy={58} r={14} fill="rgba(178, 91, 255, 0.85)" stroke={VIOLET} strokeWidth={1.8} />
      <Circle cx={132} cy={58} r={14} fill="rgba(178, 91, 255, 0.85)" stroke={VIOLET} strokeWidth={1.8} />
      <Circle cx={110} cy={44} r={16} fill="rgba(210, 160, 255, 0.95)" stroke={VIOLET} strokeWidth={2} />
      <Path
        d="M88 72 Q110 88 132 72"
        fill="none"
        stroke="rgba(220, 180, 255, 0.75)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Rect x={96} y={78} width={28} height={18} rx={6} fill="rgba(120, 50, 200, 0.75)" stroke={VIOLET} strokeWidth={1.6} />
      <Circle cx={110} cy={87} r={4} fill="rgba(255, 255, 255, 0.85)" />
    </LabMicroSceneArt>
  );
}

function LabMicroScene({ id }: { id: LabCardId }): ReactElement {
  switch (id) {
    case 'my-requests':
      return <LabSceneMyRequests />;
    case 'booking-assist':
      return <LabSceneBookingAssist />;
    case 'legal-wealth':
      return <LabSceneLegalWealth />;
    case 'community':
      return <LabSceneCommunity />;
    default:
      return <LabSceneMyRequests />;
  }
}

function LabReferenceCard({
  card,
  width,
  height,
}: {
  card: LabCardDef;
  width: number;
  height: number;
}): ReactElement {
  const tokens = vionaReferenceTokensForAccent(card.accent);
  const bw = vionaReferenceCardGlass.borderWidth;
  const borderRadius = vionaReferenceLabLocalPanel.cardBorderRadius;
  const innerRadius = Math.max(0, borderRadius - bw);
  const spec = premiumUniverseAccentSpec(card.accent);

  return (
    <View style={{ width, height }}>
      <VionaGradientBorder
        borderRadius={borderRadius}
        borderWidth={bw}
        colors={tokens.borderGradient}
        style={[vionaReferenceCardShellShadow(card.accent), { width: '100%', height: '100%' }]}
      >
        <View
          style={[
            {
              width: '100%',
              height: '100%',
              borderRadius: innerRadius,
              overflow: 'hidden',
              backgroundColor: 'rgba(0, 1, 4, 0.72)',
            },
            vionaReferenceCardWebGlass(),
          ]}
        >
          <VionaGlassSurface tokens={tokens} borderRadius={innerRadius} />
          <VionaRefractionGlow borderRadius={innerRadius} tokens={tokens} heightRatio={0.32} />
          <VionaFloorReflection borderRadius={innerRadius} tokens={tokens} />
          <VionaCornerSpecular borderRadius={innerRadius} tokens={tokens} />
          <VionaSpecularShine borderRadius={innerRadius} tokens={tokens} />
          <VionaInnerRim borderRadius={innerRadius} color={tokens.innerRim} />
          <VionaTopEdgeHighlight borderRadius={innerRadius} color={tokens.edgeHighlight} />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(0, 3, 8, 0.72)', 'rgba(0, 3, 8, 0.12)', 'transparent']}
            locations={[0, 0.35, 0.55]}
            style={[StyleSheet.absoluteFill, { zIndex: 2 }]}
          />
          <View style={styles.cardInner}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {card.title}
            </Text>
            <LabMicroScene id={card.id} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${card.title} preview`}
              style={[styles.ctaOrb, vionaReferenceCtaOrbStyle(card.accent)]}
            >
              <Ionicons name="chevron-forward" size={14} color={spec.inkHover} />
            </Pressable>
          </View>
        </View>
      </VionaGradientBorder>
    </View>
  );
}

export function VionaReferenceLocalPanelLab(): ReactElement {
  const { width } = useWindowDimensions();
  const pad = 16;
  const panelWidth = Math.min(Math.max(width - pad * 2, 280), vionaReferenceLabLocalPanel.panelMaxWidth);
  const isDesktopRow = width >= vionaReferenceLabLocalPanel.desktopCardRowMinWidth;
  const gap = vionaReferenceLabLocalPanel.cardGap;
  const cardCount = LAB_CARDS.length;
  const cardWidth = isDesktopRow
    ? (panelWidth - vionaReferenceLabLocalPanel.panelPadding * 2 - gap * (cardCount - 1)) / cardCount
    : Math.min(168, panelWidth - vionaReferenceLabLocalPanel.panelPadding * 2);
  const cardHeight = Math.round(cardWidth / vionaReferenceLabLocalPanel.cardAspect);

  const cardRowStyle = useMemo(
    (): StyleProp<ViewStyle> =>
      isDesktopRow
        ? { flexDirection: 'row', gap, alignItems: 'stretch' }
        : { flexDirection: 'row', flexWrap: 'wrap', gap, justifyContent: 'center' },
    [isDesktopRow, gap]
  );

  return (
    <View style={styles.page} testID="viona-reference-local-panel-lab-root">
      <View style={[styles.panelWrap, { width: panelWidth }]}>
        <VionaReferenceGlassPanel
          testID="viona-reference-local-panel-lab-panel"
          borderRadius={vionaReferenceLabLocalPanel.panelBorderRadius}
          skyline={<LabPanelSkyline />}
          refractionGrid={<LabRefractionGrid />}
          style={{ width: '100%' }}
        >
          <View style={styles.panelBody}>
            <View style={styles.header}>
              <View style={styles.headerBadge}>
                <View style={styles.headerDot} />
                <Text style={styles.headerKicker}>LOCAL UNIVERSE</Text>
              </View>
              <Text style={styles.headerTitle}>Local</Text>
              <Text style={styles.headerSub}>Request clarity · trusted local services</Text>
            </View>
            <View style={cardRowStyle}>
              {LAB_CARDS.map((card) => (
                <LabReferenceCard key={card.id} card={card} width={cardWidth} height={cardHeight} />
              ))}
            </View>
          </View>
        </VionaReferenceGlassPanel>
      </View>
    </View>
  );
}

export function VionaReferenceLocalPanelLabScreen(): ReactElement {
  if (!isVionaReferenceLocalPanelLabRouteEnabled()) {
    return (
      <SafeAreaView style={styles.screenSafe} edges={['top', 'bottom']} testID="viona-reference-local-panel-lab">
        <View style={styles.disabledWrap}>
          <Text style={styles.disabledTitle}>Reference lab is off</Text>
          <Text style={styles.disabledBody}>
            Set <Text style={styles.mono}>EXPO_PUBLIC_VIONA_REFERENCE_LOCAL_PANEL_LAB=true</Text> or use a dev client.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screenSafe} edges={['top', 'bottom']} testID="viona-reference-local-panel-lab">
      <View style={styles.labScroll}>
        <VionaReferenceLocalPanelLab />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenSafe: {
    flex: 1,
    backgroundColor: vionaReferenceLabLocalPanel.pageBackground,
    width: '100%',
  },
  labScroll: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  page: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelWrap: {
    alignSelf: 'center',
    maxWidth: '100%',
  },
  panelBody: {
    padding: vionaReferenceLabLocalPanel.panelPadding,
    gap: 12,
  },
  header: {
    gap: vionaReferenceLabLocalPanel.headerGap,
    paddingBottom: 2,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: EMERALD,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 0 8px rgba(72, 210, 165, 0.9)' } as ViewStyle)
      : {}),
  },
  headerKicker: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: 'rgba(120, 255, 210, 0.92)',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: premiumLuminousInk.title,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: premiumLuminousInk.subtitle,
    opacity: 0.88,
  },
  cardInner: {
    flex: 1,
    width: '100%',
    height: '100%',
    zIndex: 3,
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  cardTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: premiumLuminousInk.title,
    maxWidth: '78%',
    zIndex: 4,
  },
  sceneSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 4,
    height: '58%',
    zIndex: 2,
  },
  ctaOrb: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  disabledWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  disabledTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    color: premiumLuminousInk.title,
    marginBottom: 8,
  },
  disabledBody: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: premiumLuminousInk.subtitle,
  },
  mono: {
    fontFamily: FontFamily.medium,
    color: CYAN,
  },
});
