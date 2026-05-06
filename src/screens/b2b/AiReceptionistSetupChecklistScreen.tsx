import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AI_RECEPTIONIST_FEATURE_CONFIGS } from '../../core/ai-receptionist/aiReceptionistFeatureConfig';
import {
  B2B_AI_RECEPTIONIST_MERCHANT_CUTOVER_CHECKLIST,
  type MerchantCutoverChecklistItem,
} from '../../core/ai-receptionist/merchantCutoverChecklistConfig';
import { getFeatureFlags, type FeatureFlagKey } from '../../core/feature-flags/featureFlags';
import type { RootStackParamList } from '../../navigation/routes';
import { useTranslation } from '../../i18n';
import {
  AI_RECEPTIONIST_GLOBAL_PILOT_POSTURE,
  getAiReceptionistPlaybook,
  INDUSTRY_GROUP_ORDER,
  industryGroupNameKey,
  listIndustriesByGroup,
} from '../../core/industries';
import type { IndustryId } from '../../core/industries';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type SetupChecklistItem = Readonly<{
  id: string;
  label: string;
  done: boolean;
  note: string;
}>;

const BASE_CHECKLIST_ORDER: readonly Readonly<{ id: string; label: string; note: string }>[] = [
  {
    id: 'merchant-verified',
    label: 'Merchant verified',
    note: 'Requires merchant identity and legal profile validation before production.',
  },
  {
    id: 'services-configured',
    label: 'Services configured',
    note: 'Service catalog should be complete before AI can route requests safely.',
  },
  {
    id: 'prices-configured',
    label: 'Prices configured',
    note: 'AI must use configured prices only; no free-form pricing.',
  },
  {
    id: 'business-hours-configured',
    label: 'Business hours configured',
    note: 'Policy engine must enforce opening hours and exceptions.',
  },
  {
    id: 'staff-capacity-configured',
    label: 'Staff/capacity configured',
    note: 'Prevent overbooking by defining slot and capacity limits.',
  },
  {
    id: 'fallback-contact-configured',
    label: 'Fallback contact configured',
    note: 'Human escalation contact is required for uncertainty and exceptions.',
  },
  {
    id: 'payment-account-connected',
    label: 'Payment account connected (if payment enabled)',
    note: 'Needed only when auto payment is enabled.',
  },
  {
    id: 'test-calls-passed',
    label: 'Test calls passed',
    note: 'Voice/call quality and fallback handoff must be validated first.',
  },
  {
    id: 'hold-confirm-tested',
    label: 'Booking hold/confirm tested',
    note: 'Use hold then confirm flow; never skip confirmation boundaries.',
  },
  {
    id: 'cost-cap-configured',
    label: 'Cost cap configured',
    note: 'Cost firewall should be configured before broad rollout.',
  },
  {
    id: 'human-fallback-tested',
    label: 'Human fallback tested',
    note: 'Escalation path must be verified for low confidence/high risk cases.',
  },
  {
    id: 'policy-pack-approved',
    label: 'Policy pack approved',
    note: 'Operations and compliance approval is required before production.',
  },
];

function getCutoverDone(item: MerchantCutoverChecklistItem, flags: ReturnType<typeof getFeatureFlags>): boolean {
  if (!item.relatedFlag) return false;
  return flags[item.relatedFlag];
}

function featureIsEnabled(requiredFlags: readonly FeatureFlagKey[], flags: ReturnType<typeof getFeatureFlags>): boolean {
  return requiredFlags.every((flag) => flags[flag]);
}

export function AiReceptionistSetupChecklistScreen(): ReactElement {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const flags = useMemo(() => getFeatureFlags(), []);
  const [selectedIndustryId, setSelectedIndustryId] = useState<IndustryId | null>(null);

  const selectedPlaybook = useMemo(() => {
    if (!selectedIndustryId) return null;
    return getAiReceptionistPlaybook(selectedIndustryId);
  }, [selectedIndustryId]);

  const statusBadges = useMemo(() => {
    const demo = flags.b2bAiReceptionistDemoEnabled
      ? t('aiReceptionist.setup.badgeDemoOn')
      : t('aiReceptionist.setup.badgeDemoOff');
    const pilot = flags.b2bAiReceptionistPilotEnabled
      ? t('aiReceptionist.setup.badgePilotOn')
      : t('aiReceptionist.setup.badgePilotOff');
    const productionReady =
      flags.b2bAiReceptionistProductionEnabled &&
      flags.b2bAutoBookingEnabled &&
      flags.b2bAutoInventoryEnabled &&
      flags.b2bAutoBillPrintEnabled &&
      flags.b2bAutoPaymentEnabled;
    const production = productionReady
      ? t('aiReceptionist.setup.badgeProductionFlagsOn')
      : t('aiReceptionist.setup.badgeProductionLocked');
    return [demo, pilot, production] as const;
  }, [flags, t]);

  const setupChecklist = useMemo<readonly SetupChecklistItem[]>(() => {
    const itemDoneMap: Record<string, boolean> = {
      'merchant-verified': false,
      'services-configured': false,
      'prices-configured': false,
      'business-hours-configured': false,
      'staff-capacity-configured': false,
      'fallback-contact-configured': false,
      'payment-account-connected': !flags.b2bAutoPaymentEnabled || flags.b2bAiReceptionistProductionEnabled,
      'test-calls-passed': flags.b2bAiReceptionistPilotEnabled || flags.b2bAiReceptionistProductionEnabled,
      'hold-confirm-tested': flags.b2bAutoBookingEnabled,
      'cost-cap-configured': flags.b2bAiReceptionistProductionEnabled,
      'human-fallback-tested': flags.b2bAiReceptionistPilotEnabled || flags.b2bAiReceptionistProductionEnabled,
      'policy-pack-approved': flags.b2bAiReceptionistProductionEnabled,
    };

    return BASE_CHECKLIST_ORDER.map((item) => ({
      id: item.id,
      label: item.label,
      note: item.note,
      done: itemDoneMap[item.id] ?? false,
    }));
  }, [flags]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          >
            <Ionicons name="chevron-back" size={20} color="#E8EDF7" />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.kicker}>{t('aiReceptionist.setup.screenKicker')}</Text>
            <Text style={styles.title}>{t('aiReceptionist.setup.screenTitle')}</Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          {statusBadges.map((badge) => (
            <View key={badge} style={styles.badgePill}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('aiReceptionist.setup.safetySummaryTitle')}</Text>
          <Text style={styles.sectionBody}>{t('aiReceptionist.setup.safetySummaryBody1')}</Text>
          <Text style={styles.sectionBody}>{t('aiReceptionist.setup.safetySummaryBody2')}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('aiReceptionist.setup.industrySectionTitle')}</Text>
          <Text style={styles.sectionBody}>{t('aiReceptionist.setup.industrySectionBody')}</Text>
          {INDUSTRY_GROUP_ORDER.map((groupId) => (
            <View key={groupId} style={styles.industryGroupBlock}>
              <Text style={styles.industryGroupTitle}>{t(industryGroupNameKey(groupId))}</Text>
              <View style={styles.industryChipWrap}>
                {listIndustriesByGroup(groupId).map((def) => {
                  const active = def.id === selectedIndustryId;
                  return (
                    <Pressable
                      key={def.id}
                      onPress={() => setSelectedIndustryId(def.id)}
                      style={({ pressed }) => [
                        styles.industryChip,
                        active && styles.industryChipActive,
                        pressed && { opacity: 0.88 },
                      ]}
                    >
                      <Text style={[styles.industryChipText, active && styles.industryChipTextActive]}>
                        {t(def.nameKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
          {!selectedIndustryId ? (
            <View style={styles.industryHintBox}>
              <Text style={styles.industryHintTitle}>{t('aiReceptionist.setup.industryNoneTitle')}</Text>
              <Text style={styles.industryHintBody}>{t('aiReceptionist.setup.industryNoneBody')}</Text>
            </View>
          ) : null}
          {selectedPlaybook ? (
            <>
              <Text style={styles.sectionTitle}>{t('aiReceptionist.setup.disclaimerTitle')}</Text>
              <Text style={styles.sectionBody}>{t(selectedPlaybook.disclaimerKey)}</Text>
              <Text style={styles.sectionTitle}>{t('aiReceptionist.setup.playbookSummaryTitle')}</Text>
              <Text style={styles.sectionBody}>
                {t('aiReceptionist.playbook.bookingModeLabel', { mode: selectedPlaybook.bookingMode })}
              </Text>
              <Text style={styles.sectionBody}>
                {t('aiReceptionist.playbook.riskLabel', { risk: selectedPlaybook.riskLevel })}
              </Text>
              <Text style={styles.sectionBody}>
                {t('aiReceptionist.playbook.confirmationLabel', { policy: selectedPlaybook.confirmationPolicy })}
              </Text>
              <Text style={styles.sectionTitle}>{t('aiReceptionist.pilot.industryPlaybook')}</Text>
              <Text style={styles.sectionBody}>
                {t('aiReceptionist.pilot.blockedActions')}: {selectedPlaybook.blockedActions.join(', ')}
              </Text>
              <Text style={styles.sectionBody}>
                {t('aiReceptionist.pilot.allowedActions')}: {selectedPlaybook.allowedActions.join(', ')}
              </Text>
              <Text style={styles.sectionTitle}>{t('aiReceptionist.pilot.postureCardTitle')}</Text>
              <Text style={styles.sectionBody}>
                {t('aiReceptionist.pilot.statusLabel')} — {AI_RECEPTIONIST_GLOBAL_PILOT_POSTURE.pilotReadiness}
              </Text>
              <Text style={styles.sectionBody}>{t('aiReceptionist.pilot.manualOpsRequired')}</Text>
              <Text style={styles.sectionBody}>{t('aiReceptionist.pilot.noAutoBooking')}</Text>
              <Text style={styles.sectionBody}>{t('aiReceptionist.pilot.noPayment')}</Text>
              <Text style={styles.sectionBody}>{t('aiReceptionist.pilot.noInventoryChange')}</Text>
              <Text style={styles.sectionBody}>{t('aiReceptionist.pilot.noBillPrinting')}</Text>
              <Text style={styles.sectionBody}>{t('aiReceptionist.pilot.consentRequired')}</Text>
            </>
          ) : null}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('aiReceptionist.setup.merchantChecklistTitle')}</Text>
          {setupChecklist.map((item) => (
            <View key={item.id} style={styles.listRow}>
              <Ionicons
                name={item.done ? 'checkmark-circle' : 'lock-closed'}
                size={18}
                color={item.done ? '#7AE4FF' : '#FACC15'}
              />
              <View style={styles.listTextWrap}>
                <Text style={styles.listTitle}>{item.label}</Text>
                <Text style={styles.listNote}>{item.note}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Foundation guardrails (Phase 1 configs)</Text>
          {B2B_AI_RECEPTIONIST_MERCHANT_CUTOVER_CHECKLIST.map((item) => {
            const done = getCutoverDone(item, flags);
            return (
              <View key={item.id} style={styles.listRow}>
                <Ionicons
                  name={done ? 'checkmark-circle' : 'time-outline'}
                  size={18}
                  color={done ? '#7AE4FF' : '#F59E0B'}
                />
                <View style={styles.listTextWrap}>
                  <Text style={styles.listTitle}>{item.title}</Text>
                  <Text style={styles.listNote}>{item.acceptanceCriteria}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionCardWarning}>
          <Text style={styles.sectionTitle}>{t('aiReceptionist.setup.productionGateTitle')}</Text>
          <Text style={styles.sectionBody}>{t('aiReceptionist.setup.productionGateBody')}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Automation capabilities</Text>
          {AI_RECEPTIONIST_FEATURE_CONFIGS.filter((f) => f.surface === 'production').map((feature) => {
            const enabled = featureIsEnabled(feature.requiredFlags, flags);
            return (
              <View key={feature.id} style={styles.capRow}>
                <View style={styles.capTextWrap}>
                  <Text style={styles.capTitle}>{feature.title}</Text>
                  <Text style={styles.capNote}>{feature.description}</Text>
                </View>
                <View style={[styles.capStatus, enabled ? styles.capStatusOn : styles.capStatusOff]}>
                  <Text style={styles.capStatusText}>{enabled ? 'Ready' : 'Locked / Requires setup'}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => navigation.navigate('AiReceptionistDemoSimulator')}
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.86 }]}
          >
            <Text style={styles.actionBtnText}>{t('aiReceptionist.setup.ctaDemo')}</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('AiReceptionistPilotRequest')}
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.86 }]}
          >
            <Text style={styles.actionBtnText}>{t('aiReceptionist.setup.ctaPilot')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0C1017',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232,237,247,0.15)',
    backgroundColor: 'rgba(20,27,40,0.88)',
  },
  backBtnPressed: {
    opacity: 0.84,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: 'rgba(232,237,247,0.62)',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F4F7FF',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgePill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(122,228,255,0.45)',
    backgroundColor: 'rgba(61,90,254,0.16)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E8EDF7',
  },
  sectionCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(232,237,247,0.08)',
    backgroundColor: '#151C27',
    gap: 10,
  },
  sectionCardWarning: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.4)',
    backgroundColor: 'rgba(250,204,21,0.09)',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F4F7FF',
  },
  sectionBody: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(232,237,247,0.72)',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  listTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E8EDF7',
  },
  listNote: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(232,237,247,0.62)',
  },
  capRow: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(232,237,247,0.08)',
    backgroundColor: 'rgba(12,16,23,0.78)',
    gap: 8,
  },
  capTextWrap: {
    gap: 3,
  },
  capTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E8EDF7',
  },
  capNote: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(232,237,247,0.58)',
  },
  capStatus: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  capStatusOn: {
    backgroundColor: 'rgba(34,197,94,0.2)',
  },
  capStatusOff: {
    backgroundColor: 'rgba(245,158,11,0.18)',
  },
  capStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F4F7FF',
  },
  actionRow: {
    gap: 8,
  },
  actionBtn: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(159,183,255,0.42)',
    backgroundColor: 'rgba(61,90,254,0.18)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DCE8FF',
  },
  industryGroupBlock: {
    gap: 8,
    marginTop: 4,
  },
  industryGroupTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C7D7FF',
  },
  industryChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  industryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(122,228,255,0.35)',
    backgroundColor: 'rgba(122,228,255,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  industryChipActive: {
    borderColor: 'rgba(125,211,252,0.85)',
    backgroundColor: 'rgba(59,130,246,0.28)',
  },
  industryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4E9FF',
  },
  industryChipTextActive: {
    color: '#F4F7FF',
  },
  industryHintBox: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.35)',
    backgroundColor: 'rgba(250,204,21,0.08)',
    padding: 10,
    gap: 4,
  },
  industryHintTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FDE68A',
  },
  industryHintBody: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(232,237,247,0.72)',
  },
});
