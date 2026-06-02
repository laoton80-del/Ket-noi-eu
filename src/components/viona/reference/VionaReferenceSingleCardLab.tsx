/**
 * Phase B — My Requests single-card side-by-side lab (reference engine rebuild).
 */
import { useMemo, type ReactElement, type ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { vionaCrystalLabCard, vionaCrystalLabPage } from '../../../design/vionaCrystalLabTokens';
import { FontFamily } from '../../../theme/typography';
import { VionaCrystalCardLab } from './engine/VionaCrystalCardLab';
import { VionaTextGlowLab } from './engine/VionaTextGlowLab';
import { MyRequestsHeroScene } from './engine/labs/myRequests/MyRequestsHeroScene';

const SUBTITLE = ['Track and manage your', 'local requests in', 'real time.'] as const;

/** Lab comparison only — mirror of docs/design/reference/ */
const REFERENCE_MY_REQUESTS_PNG = require('../../../../assets/viona/lab-reference/viona-reference-local-card-my-requests.png');

export function isVionaReferenceSingleCardLabRouteEnabled(): boolean {
  const v = process.env.EXPO_PUBLIC_VIONA_REFERENCE_SINGLE_CARD_LAB;
  return v === '1' || v === 'true';
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

export function VionaReferenceSingleCardLab(): ReactElement {
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
    <View style={styles.page} testID="viona-reference-single-card-lab-root">
      <Text style={styles.pageTitle}>My Requests — reference vs engine replica</Text>
      <View style={[styles.compareRow, rowStyle]}>
        <CompareColumn label="REFERENCE" testID="viona-reference-single-card-ref-column">
          <View style={[styles.refFrame, { width: cardW, height: cardH }]}>
            <Image source={REFERENCE_MY_REQUESTS_PNG} style={styles.refImage} resizeMode="contain" accessibilityLabel="Reference" />
          </View>
        </CompareColumn>
        <CompareColumn label="IMPLEMENTED" testID="viona-reference-single-card-impl-column">
          <VionaCrystalCardLab
            width={cardW}
            height={cardH}
            testID="viona-reference-single-card-implemented"
            scene={<MyRequestsHeroScene />}
          >
            <VionaTextGlowLab title="My Requests" subtitleLines={SUBTITLE} />
          </VionaCrystalCardLab>
        </CompareColumn>
      </View>
      <Text style={styles.legend}>
        Engine: MyRequestsHeroScene (procedural) · no CTA · request-status check only
      </Text>
    </View>
  );
}

export function VionaReferenceSingleCardLabScreen(): ReactElement {
  if (!isVionaReferenceSingleCardLabRouteEnabled()) {
    return (
      <SafeAreaView style={styles.safe} testID="viona-reference-single-card-lab">
        <View style={styles.disabled}>
          <Text style={styles.disabledTitle}>Single-card lab off</Text>
          <Text style={styles.disabledBody}>Set EXPO_PUBLIC_VIONA_REFERENCE_SINGLE_CARD_LAB=true</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']} testID="viona-reference-single-card-lab">
      <ScrollView contentContainerStyle={styles.scroll}>
        <VionaReferenceSingleCardLab />
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
    maxWidth: 360,
  },
  disabled: { flex: 1, justifyContent: 'center', padding: 24 },
  disabledTitle: { fontFamily: FontFamily.semibold, fontSize: 18, color: '#fff' },
  disabledBody: { fontFamily: FontFamily.regular, fontSize: 14, color: 'rgba(200,220,215,0.8)', marginTop: 8 },
});
