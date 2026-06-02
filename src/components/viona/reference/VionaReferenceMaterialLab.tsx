/**
 * Phase A — Crystal material lab (reference visual engine rebuild).
 */
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { vionaCrystalLabCard, vionaCrystalLabPage } from '../../../design/vionaCrystalLabTokens';
import { FontFamily } from '../../../theme/typography';
import {
  VionaCrystalCardLab,
  VionaCrystalPanelLab,
  VionaLuminousFloorLab,
  VionaRefractionOverlayLab,
  VionaSpecularOverlayLab,
  VionaTextGlowLab,
} from './engine';

export function isVionaReferenceMaterialLabRouteEnabled(): boolean {
  const v = process.env.EXPO_PUBLIC_VIONA_REFERENCE_MATERIAL_LAB;
  return v === '1' || v === 'true';
}

function Section({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Swatch({ label, children }: { label: string; children: ReactNode }): ReactElement {
  return (
    <View style={styles.swatch}>
      <Text style={styles.swatchLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function VionaReferenceMaterialLab(): ReactElement {
  const br = 12;
  const sw = 160;
  const sh = 100;

  return (
    <View style={styles.page} testID="viona-reference-material-lab-root">
      <Text style={styles.pageTitle}>Crystal material lab — reference engine</Text>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Section title="VionaCrystalPanelLab">
          <VionaCrystalPanelLab width="100%" testID="material-lab-panel">
            <Text style={styles.panelHint}>Luminous stage panel shell</Text>
          </VionaCrystalPanelLab>
        </Section>

        <Section title="VionaCrystalCardLab">
          <VionaCrystalCardLab width={vionaCrystalLabCard.width} height={vionaCrystalLabCard.height} testID="material-lab-card">
            <VionaTextGlowLab title="My Requests" subtitleLines={['Track and manage your', 'local requests in', 'real time.']} />
          </VionaCrystalCardLab>
        </Section>

        <View style={styles.swatchRow}>
          <Swatch label="VionaSpecularOverlayLab">
            <View style={[styles.swatchBox, { width: sw, height: sh, borderRadius: br }]}>
              <View style={styles.swatchBody} />
              <VionaSpecularOverlayLab borderRadius={br} />
            </View>
          </Swatch>
          <Swatch label="VionaRefractionOverlayLab">
            <View style={[styles.swatchBox, { width: sw, height: sh, borderRadius: br }]}>
              <View style={styles.swatchBody} />
              <VionaRefractionOverlayLab borderRadius={br} />
            </View>
          </Swatch>
        </View>

        <View style={styles.swatchRow}>
          <Swatch label="VionaLuminousFloorLab">
            <View style={[styles.swatchBox, { width: sw, height: sh, borderRadius: br }]}>
              <View style={styles.swatchBody} />
              <VionaLuminousFloorLab borderRadius={br} />
            </View>
          </Swatch>
          <Swatch label="VionaTextGlowLab">
            <View style={[styles.swatchBox, { width: sw, height: sh, borderRadius: br, padding: 12, justifyContent: 'flex-start' }]}>
              <LinearGradient
                colors={['rgba(0,1,3,0.9)', 'rgba(0,2,4,0.7)']}
                style={StyleSheet.absoluteFill}
              />
              <VionaTextGlowLab title="My Requests" subtitleLines={['Track and manage', 'your local requests']} />
            </View>
          </Swatch>
        </View>
      </ScrollView>
    </View>
  );
}

export function VionaReferenceMaterialLabScreen(): ReactElement {
  if (!isVionaReferenceMaterialLabRouteEnabled()) {
    return (
      <SafeAreaView style={styles.safe} testID="viona-reference-material-lab">
        <View style={styles.disabled}>
          <Text style={styles.disabledTitle}>Material lab off</Text>
          <Text style={styles.disabledBody}>Set EXPO_PUBLIC_VIONA_REFERENCE_MATERIAL_LAB=true</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']} testID="viona-reference-material-lab">
      <VionaReferenceMaterialLab />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: vionaCrystalLabPage.background },
  page: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  pageTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: vionaCrystalLabPage.sectionTitle,
    textAlign: 'center',
    marginBottom: 12,
  },
  scroll: { paddingBottom: 32, gap: 20 },
  section: { gap: 10 },
  sectionTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: vionaCrystalLabPage.label,
  },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  swatch: { alignItems: 'center', gap: 6 },
  swatchLabel: { fontFamily: FontFamily.medium, fontSize: 9, color: vionaCrystalLabPage.label },
  swatchBox: { overflow: 'hidden', backgroundColor: 'rgba(0,1,3,0.95)' },
  swatchBody: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,2,4,0.85)' },
  panelHint: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: 'rgba(180,210,200,0.65)',
  },
  disabled: { flex: 1, justifyContent: 'center', padding: 24 },
  disabledTitle: { fontFamily: FontFamily.semibold, fontSize: 18, color: '#fff' },
  disabledBody: { fontFamily: FontFamily.regular, fontSize: 14, color: 'rgba(200,220,215,0.8)', marginTop: 8 },
});
