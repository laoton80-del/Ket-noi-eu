/**
 * VIONA Wave 3B — Neon-prompt material lab (My Requests reference card).
 * Gradient-wrapper rim (no outer borderWidth) · black crystal body · lab-only.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, type ReactElement, type ReactNode } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  vionaCrystalLabBody,
  vionaCrystalLabCard,
  vionaCrystalLabOuterGlowStyle,
  vionaCrystalLabPage,
  vionaCrystalLabSemanticTokens,
  vionaCrystalLabText,
  vionaCrystalLabTitleGlowStyle,
} from '../../../design/vionaCrystalLabTokens';
import { vionaReferenceCardWebGlass } from '../../../design/vionaReferenceVisualTokens';
import { FontFamily } from '../../../theme/typography';
import { neonCardBoxShadow } from '../../ui/neonCardTheme';
import { VionaLuminousFloorLab } from './engine/VionaLuminousFloorLab';
import { VionaRefractionOverlayLab } from './engine/VionaRefractionOverlayLab';
import { VionaSpecularOverlayLab } from './engine/VionaSpecularOverlayLab';
import { MyRequestsHeroScene } from './engine/labs/myRequests/MyRequestsHeroScene';

const REFERENCE_MY_REQUESTS_PNG = require('../../../../assets/viona/lab-reference/viona-reference-local-card-my-requests.png');

const SUBTITLE = ['Track and manage your', 'local requests in', 'real time.'] as const;

const NEON_RGB = { r: 72, g: 210, b: 165 } as const;

export function isVionaNeonCardLabRouteEnabled(): boolean {
  const v = process.env.EXPO_PUBLIC_VIONA_NEON_CARD_LAB;
  return v === '1' || v === 'true';
}

export type VionaNeonReferenceCardProps = Readonly<{
  width?: number;
  height?: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}>;

function VionaNeonStatusPillLab(): ReactElement {
  const tokens = vionaCrystalLabSemanticTokens('emerald');
  return (
    <View
      style={[
        styles.pill,
        Platform.OS === 'web'
          ? ({
              boxShadow: `0 0 8px ${tokens.semanticGlow.replace(/0\.\d+\)/, '0.22)')}`,
            } as ViewStyle)
          : {
              shadowColor: tokens.edgeGlow,
              shadowOpacity: 0.28,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 0 },
            },
      ]}
    >
      <LinearGradient
        colors={['rgba(120, 255, 210, 0.55)', 'rgba(72, 210, 165, 0.12)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pillBorder}
      >
        <View style={styles.pillInner}>
          <Text style={styles.pillText}>LOCAL</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

/** Reusable My Requests reference card — neon gradient wrapper + crystal overlays. */
export function VionaNeonReferenceCard({
  width = vionaCrystalLabCard.width,
  height = vionaCrystalLabCard.height,
  testID = 'viona-neon-reference-card',
  style,
}: VionaNeonReferenceCardProps): ReactElement {
  const tokens = vionaCrystalLabSemanticTokens('emerald');
  const borderRadius = vionaCrystalLabCard.borderRadius;
  const innerRadius = Math.max(0, borderRadius - 1);
  const innerW = width - 2;
  const innerH = height - 2;
  const webGlow = neonCardBoxShadow(NEON_RGB, false);

  return (
    <View
      testID={testID}
      style={[
        { width, height, borderRadius, alignSelf: 'center' },
        vionaCrystalLabOuterGlowStyle('emerald'),
        Platform.OS === 'web' ? ({ boxShadow: webGlow } as ViewStyle) : null,
        style,
      ]}
    >
      <LinearGradient
        colors={[
          tokens.borderGradient[0],
          tokens.borderGradient[1],
          'rgba(0, 0, 0, 0.42)',
          'rgba(0, 0, 0, 0.72)',
        ]}
        locations={[0, 0.28, 0.62, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width, height, borderRadius, padding: 1 }}
      >
        <View
          style={[
            {
              width: innerW,
              height: innerH,
              borderRadius: innerRadius,
              overflow: 'hidden',
              backgroundColor: vionaCrystalLabBody.deep,
            },
            vionaReferenceCardWebGlass(),
          ]}
        >
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { borderRadius: innerRadius, backgroundColor: 'rgba(0, 1, 3, 0.92)' }]}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(0,0,1,0.9)', 'rgba(0,2,4,0.55)', 'transparent']}
            locations={[0, 0.34, 0.52]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '46%',
              borderTopLeftRadius: innerRadius,
              borderTopRightRadius: innerRadius,
            }}
          />
          <VionaSpecularOverlayLab borderRadius={innerRadius} semantic="emerald" heightRatio={0.18} />
          <VionaRefractionOverlayLab borderRadius={innerRadius} semantic="emerald" refractHeightRatio={0.26} />
          <VionaLuminousFloorLab borderRadius={innerRadius} semantic="emerald" heightRatio={0.18} />
          <View style={styles.textBlock}>
            <VionaNeonStatusPillLab />
            <Text style={[styles.title, vionaCrystalLabTitleGlowStyle()]}>My Requests</Text>
            <View style={styles.subBlock}>
              {SUBTITLE.map((line) => (
                <Text key={line} style={styles.sub}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
          <View style={styles.scene}>
            <MyRequestsHeroScene />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function CompareColumn({
  label,
  children,
  testID,
}: {
  label: string;
  children: ReactNode;
  testID?: string;
}): ReactElement {
  return (
    <View style={styles.compareColumn} testID={testID}>
      <Text style={styles.compareLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function VionaNeonCardLab(): ReactElement {
  const { width } = useWindowDimensions();
  const stackVertical = width < 520;
  const cardW = vionaCrystalLabCard.width;
  const cardH = vionaCrystalLabCard.height;

  const rowStyle = useMemo(
    (): StyleProp<ViewStyle> =>
      stackVertical
        ? { flexDirection: 'column', alignItems: 'center', gap: 20 }
        : { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 20 },
    [stackVertical]
  );

  return (
    <View style={styles.page} testID="viona-neon-card-lab-root">
      <Text style={styles.pageTitle}>My Requests — reference vs neon material lab</Text>
      <View style={[styles.compareRow, rowStyle]}>
        <CompareColumn label="REFERENCE" testID="viona-neon-card-ref-column">
          <View style={[styles.refFrame, { width: cardW, height: cardH }]}>
            <Image source={REFERENCE_MY_REQUESTS_PNG} style={styles.refImage} resizeMode="contain" accessibilityLabel="Reference" />
          </View>
        </CompareColumn>
        <CompareColumn label="NEON LAB" testID="viona-neon-card-impl-column">
          <VionaNeonReferenceCard width={cardW} height={cardH} testID="viona-neon-card-implemented" />
        </CompareColumn>
      </View>
      <Text style={styles.legend}>
        Gradient-wrapper rim · black crystal body · emerald edge only · MyRequestsHeroScene · no production integration
      </Text>
    </View>
  );
}

export function VionaNeonCardLabScreen(): ReactElement {
  if (!isVionaNeonCardLabRouteEnabled()) {
    return (
      <SafeAreaView style={styles.safe} testID="viona-neon-card-lab">
        <View style={styles.disabled}>
          <Text style={styles.disabledTitle}>Neon card lab off</Text>
          <Text style={styles.disabledBody}>Set EXPO_PUBLIC_VIONA_NEON_CARD_LAB=true</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']} testID="viona-neon-card-lab">
      <ScrollView contentContainerStyle={styles.scroll}>
        <VionaNeonCardLab />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: vionaCrystalLabPage.background },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 24 },
  page: { alignItems: 'center', width: '100%', paddingHorizontal: 16 },
  pageTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: vionaCrystalLabPage.sectionTitle,
    marginBottom: 16,
    textAlign: 'center',
  },
  compareRow: { width: '100%', maxWidth: 520 },
  compareColumn: { alignItems: 'center', gap: 8, flexShrink: 0 },
  compareLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: vionaCrystalLabPage.label,
  },
  refFrame: { borderRadius: vionaCrystalLabCard.borderRadius, overflow: 'hidden', backgroundColor: '#020608' },
  refImage: { width: '100%', height: '100%' },
  legend: {
    marginTop: 18,
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: 'rgba(130,160,155,0.6)',
    textAlign: 'center',
    maxWidth: 380,
  },
  disabled: { flex: 1, justifyContent: 'center', padding: 24 },
  disabledTitle: { fontFamily: FontFamily.semibold, fontSize: 18, color: '#fff' },
  disabledBody: { fontFamily: FontFamily.regular, fontSize: 14, color: 'rgba(200,220,215,0.8)', marginTop: 8 },
  textBlock: {
    flex: 1,
    zIndex: 6,
    paddingTop: 10,
    paddingHorizontal: 11,
    paddingBottom: 6,
    gap: 5,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 14.5,
    lineHeight: 17,
    color: vionaCrystalLabText.titleEmerald,
    letterSpacing: -0.12,
  },
  subBlock: { gap: 1, marginTop: 1 },
  sub: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    lineHeight: 13,
    color: vionaCrystalLabText.subtitle,
  },
  scene: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '72%',
    zIndex: 5,
    opacity: 0.92,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginBottom: 2,
  },
  pillBorder: {
    padding: 1,
    borderRadius: 999,
  },
  pillInner: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 4, 8, 0.88)',
  },
  pillText: {
    fontFamily: FontFamily.semibold,
    fontSize: 8,
    letterSpacing: 1.1,
    color: 'rgba(120, 255, 210, 0.92)',
  },
});
