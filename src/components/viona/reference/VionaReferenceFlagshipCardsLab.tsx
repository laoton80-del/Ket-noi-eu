/**
 * Phase C — Four flagship cards lab (gated until My Requests passes ≥8).
 */
import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { vionaCrystalLabPage } from '../../../design/vionaCrystalLabTokens';
import { FontFamily } from '../../../theme/typography';

export function isVionaReferenceFlagshipCardsLabRouteEnabled(): boolean {
  const v = process.env.EXPO_PUBLIC_VIONA_REFERENCE_FLAGSHIP_CARDS_LAB;
  return v === '1' || v === 'true';
}

export function VionaReferenceFlagshipCardsLab(): ReactElement {
  return (
    <View style={styles.page} testID="viona-reference-flagship-cards-lab-root">
      <Text style={styles.title}>Phase C — Flagship cards lab</Text>
      <Text style={styles.body}>
        Blocked: My Requests single-card lab has not reached ≥8 on all scoring dimensions.
      </Text>
      <Text style={styles.body}>
        Build dedicated art for Booking Assist, Legal & Wealth, and Community Events only after
        My Requests passes the acceptance gate.
      </Text>
      <Text style={styles.hint}>Use /viona-reference-single-card-my-requests for active work.</Text>
    </View>
  );
}

export function VionaReferenceFlagshipCardsLabScreen(): ReactElement {
  if (!isVionaReferenceFlagshipCardsLabRouteEnabled()) {
    return (
      <SafeAreaView style={styles.safe} testID="viona-reference-flagship-cards-lab">
        <View style={styles.disabled}>
          <Text style={styles.disabledTitle}>Flagship cards lab off</Text>
          <Text style={styles.disabledBody}>Set EXPO_PUBLIC_VIONA_REFERENCE_FLAGSHIP_CARDS_LAB=true</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']} testID="viona-reference-flagship-cards-lab">
      <VionaReferenceFlagshipCardsLab />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: vionaCrystalLabPage.background, justifyContent: 'center' },
  page: { padding: 24, gap: 12, alignItems: 'center' },
  title: { fontFamily: FontFamily.bold, fontSize: 18, color: '#fff', textAlign: 'center' },
  body: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: 'rgba(200,220,215,0.85)', textAlign: 'center' },
  hint: { fontFamily: FontFamily.medium, fontSize: 12, color: 'rgba(98,232,168,0.8)', marginTop: 8 },
  disabled: { flex: 1, justifyContent: 'center', padding: 24 },
  disabledTitle: { fontFamily: FontFamily.semibold, fontSize: 18, color: '#fff' },
  disabledBody: { fontFamily: FontFamily.regular, fontSize: 14, color: 'rgba(200,220,215,0.8)', marginTop: 8 },
});
