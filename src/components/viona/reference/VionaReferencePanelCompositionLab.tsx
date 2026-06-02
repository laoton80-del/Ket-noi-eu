/**
 * Phase D — Local panel composition lab (reference engine rebuild).
 */
import { useMemo, type ReactElement } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { vionaCrystalLabCard, vionaCrystalLabPage } from '../../../design/vionaCrystalLabTokens';
import { FontFamily } from '../../../theme/typography';
import { VionaCrystalPanelLab } from './engine';
import { MyRequestsReplicaCard } from './engine/labs/myRequests/MyRequestsReplicaCard';

export function isVionaReferencePanelCompositionLabRouteEnabled(): boolean {
  const v = process.env.EXPO_PUBLIC_VIONA_REFERENCE_PANEL_COMPOSITION_LAB;
  return v === '1' || v === 'true';
}

const FLAGSHIP_LABELS = [
  { id: 'my-requests', title: 'My Requests', live: true },
  { id: 'booking', title: 'Booking Assist', live: false },
  { id: 'legal', title: 'Legal & Wealth', live: false },
  { id: 'community', title: 'Community Events', live: false },
] as const;

function GatedCardPlaceholder({ title }: { title: string }): ReactElement {
  return (
    <View style={styles.gatedCard}>
      <Text style={styles.gatedTitle}>{title}</Text>
      <Text style={styles.gatedBody}>Phase C gated — My Requests must score ≥8 on all dimensions</Text>
    </View>
  );
}

export function VionaReferencePanelCompositionLab(): ReactElement {
  const { width } = useWindowDimensions();
  const panelW = Math.min(Math.max(width - 32, 280), vionaCrystalLabCard.panelMaxWidth);
  const isRow = width >= 620;
  const gap = 10;
  const cardW = isRow
    ? (panelW - 28 - gap * 3) / 4
    : Math.min(168, panelW - 28);
  const cardH = Math.round(cardW / 0.68);

  const rowStyle = useMemo(
    (): StyleProp<ViewStyle> =>
      isRow
        ? { flexDirection: 'row', gap, alignItems: 'stretch' }
        : { flexDirection: 'row', flexWrap: 'wrap', gap, justifyContent: 'center' },
    [isRow, gap]
  );

  return (
    <View style={styles.page} testID="viona-reference-panel-composition-lab-root">
      <Text style={styles.pageTitle}>Local panel composition lab</Text>
      <VionaCrystalPanelLab width={panelW} testID="viona-reference-panel-composition-panel">
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={styles.dot} />
            <Text style={styles.kicker}>LOCAL UNIVERSE</Text>
          </View>
          <Text style={styles.headline}>Local</Text>
          <Text style={styles.sub}>Request clarity · trusted local services</Text>
        </View>
        <View style={rowStyle}>
          {FLAGSHIP_LABELS.map((f) =>
            f.live ? (
              <MyRequestsReplicaCard
                key={f.id}
                width={cardW}
                height={cardH}
                testID={`panel-composition-card-${f.id}`}
              />
            ) : (
              <View key={f.id} style={{ width: cardW, height: cardH }}>
                <GatedCardPlaceholder title={f.title} />
              </View>
            )
          )}
        </View>
      </VionaCrystalPanelLab>
      <Text style={styles.note}>Only My Requests uses engine hero art · other cards gated until Phase C</Text>
    </View>
  );
}

export function VionaReferencePanelCompositionLabScreen(): ReactElement {
  if (!isVionaReferencePanelCompositionLabRouteEnabled()) {
    return (
      <SafeAreaView style={styles.safe} testID="viona-reference-panel-composition-lab">
        <View style={styles.disabled}>
          <Text style={styles.disabledTitle}>Panel composition lab off</Text>
          <Text style={styles.disabledBody}>Set EXPO_PUBLIC_VIONA_REFERENCE_PANEL_COMPOSITION_LAB=true</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']} testID="viona-reference-panel-composition-lab">
      <ScrollView contentContainerStyle={styles.scroll}>
        <VionaReferencePanelCompositionLab />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: vionaCrystalLabPage.background },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  page: { alignItems: 'center', width: '100%', paddingHorizontal: 16, gap: 12 },
  pageTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: vionaCrystalLabPage.sectionTitle,
    letterSpacing: 0.5,
  },
  header: { gap: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(98,232,168,1)' },
  kicker: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: 'rgba(120, 255, 210, 0.92)',
  },
  headline: { fontFamily: FontFamily.bold, fontSize: 22, color: '#fff' },
  sub: { fontFamily: FontFamily.medium, fontSize: 12, color: 'rgba(200,220,215,0.75)' },
  gatedCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(72,210,165,0.2)',
    backgroundColor: 'rgba(0,2,4,0.85)',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  gatedTitle: { fontFamily: FontFamily.semibold, fontSize: 12, color: 'rgba(180,220,210,0.7)', textAlign: 'center' },
  gatedBody: { fontFamily: FontFamily.regular, fontSize: 9, color: 'rgba(140,170,165,0.55)', textAlign: 'center' },
  note: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: 'rgba(130,160,155,0.6)',
    textAlign: 'center',
    maxWidth: 400,
  },
  disabled: { flex: 1, justifyContent: 'center', padding: 24 },
  disabledTitle: { fontFamily: FontFamily.semibold, fontSize: 18, color: '#fff' },
  disabledBody: { fontFamily: FontFamily.regular, fontSize: 14, color: 'rgba(200,220,215,0.8)', marginTop: 8 },
});
