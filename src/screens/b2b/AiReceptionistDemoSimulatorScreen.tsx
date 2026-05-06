import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/routes';
import { useTranslation } from '../../i18n';
import {
  getAiReceptionistPlaybook,
  INDUSTRY_GROUP_ORDER,
  industryGroupNameKey,
  listIndustriesByGroup,
} from '../../core/industries';
import type { IndustryId } from '../../core/industries';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type DemoScenario = Readonly<{
  customerName: string;
  language: string;
  intent: string;
  sampleService: string;
  requestedTime: string;
  customerPhonePreview: string;
  transcriptCustomer: string;
  transcriptAi: string;
  transcriptConfirm: string;
  transcriptFallback: string;
  aiDraftResponse: string;
}>;

const TIMELINE_STEPS: readonly string[] = [
  'Incoming call',
  'Language detected',
  'Intent detected',
  'Service checked',
  'Time requested',
  'Booking request drafted',
  'Merchant confirmation required',
];

function buildDemoScenario(
  industryId: IndustryId,
  t: (key: string, options?: Record<string, unknown>) => string
): DemoScenario {
  const pb = getAiReceptionistPlaybook(industryId);
  const svc = pb.demoHintService;
  return {
    customerName: t('aiReceptionist.playbookDemo._generic.customerName'),
    language: t('aiReceptionist.playbookDemo._generic.language'),
    intent: t('aiReceptionist.playbookDemo._generic.intent', { service: svc }),
    sampleService: t('aiReceptionist.playbookDemo._generic.sampleService', { service: svc }),
    requestedTime: t('aiReceptionist.playbookDemo._generic.requestedTime'),
    customerPhonePreview: t('aiReceptionist.playbookDemo._generic.customerPhonePreview'),
    transcriptCustomer: t('aiReceptionist.playbookDemo._generic.transcriptCustomer', { service: svc }),
    transcriptAi: t('aiReceptionist.playbookDemo._generic.transcriptAi'),
    transcriptConfirm: t('aiReceptionist.playbookDemo._generic.transcriptConfirm'),
    transcriptFallback: t('aiReceptionist.playbookDemo._generic.transcriptFallback'),
    aiDraftResponse: t('aiReceptionist.playbookDemo._generic.aiDraftResponse'),
  };
}

export function AiReceptionistDemoSimulatorScreen(): ReactElement {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [selectedIndustryId, setSelectedIndustryId] = useState<IndustryId | null>(null);

  const scenario = useMemo(
    () => (selectedIndustryId ? buildDemoScenario(selectedIndustryId, t) : null),
    [selectedIndustryId, t]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.84 }]}
          >
            <Ionicons name="chevron-back" size={20} color="#E8EDF7" />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.kicker}>AI Receptionist</Text>
            <Text style={styles.title}>Lễ Tân AI Demo</Text>
          </View>
        </View>

        <View style={styles.simulatedBadge}>
          <Text style={styles.simulatedBadgeText}>SIMULATED DEMO</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Safety disclaimer</Text>
          <Text style={styles.cardBody}>This is a simulated demo.</Text>
          <Text style={styles.cardBody}>No real call is made.</Text>
          <Text style={styles.cardBody}>No booking is created.</Text>
          <Text style={styles.cardBody}>Merchant confirmation is required.</Text>
          <Text style={styles.cardBody}>AI may make mistakes.</Text>
          <Text style={styles.cardBody}>No live AI model is invoked from this screen.</Text>
        </View>

        {!selectedIndustryId ? (
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>{t('aiReceptionist.demo.selectIndustryPrompt')}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('aiReceptionist.demo.industrySectionTitle')}</Text>
          {INDUSTRY_GROUP_ORDER.map((groupId) => (
            <View key={groupId} style={styles.groupBlock}>
              <Text style={styles.groupTitle}>{t(industryGroupNameKey(groupId))}</Text>
              <View style={styles.selectorRow}>
                {listIndustriesByGroup(groupId).map((def) => {
                  const active = def.id === selectedIndustryId;
                  return (
                    <Pressable
                      key={def.id}
                      onPress={() => setSelectedIndustryId(def.id)}
                      style={({ pressed }) => [
                        styles.selectorChip,
                        active && styles.selectorChipActive,
                        pressed && { opacity: 0.88 },
                      ]}
                    >
                      <Text style={[styles.selectorChipText, active && styles.selectorChipTextActive]}>
                        {t(def.nameKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {selectedIndustryId && scenario ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('aiReceptionist.demo.playbookTitle')}</Text>
              <Text style={styles.cardBody}>{t(getAiReceptionistPlaybook(selectedIndustryId).disclaimerKey)}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Simulated call timeline</Text>
              {TIMELINE_STEPS.map((step, idx) => (
                <View key={step} style={styles.timelineRow}>
                  <View style={styles.timelineDotWrap}>
                    <View style={styles.timelineDot} />
                    {idx < TIMELINE_STEPS.length - 1 ? <View style={styles.timelineLine} /> : null}
                  </View>
                  <Text style={styles.timelineText}>{step}</Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Transcript preview</Text>
              <Text style={styles.metaLine}>Customer: {scenario.customerName}</Text>
              <Text style={styles.metaLine}>Language: {scenario.language}</Text>
              <Text style={styles.transcriptLine}>Customer: {scenario.transcriptCustomer}</Text>
              <Text style={styles.transcriptLine}>AI receptionist: {scenario.transcriptAi}</Text>
              <Text style={styles.transcriptLine}>Confirmation: {scenario.transcriptConfirm}</Text>
              <Text style={styles.transcriptLine}>Fallback: {scenario.transcriptFallback}</Text>
              <Text style={styles.noteLine}>Demo note: Conversation preview only. No backend action is performed.</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Booking request preview (draft)</Text>
              <Text style={styles.metaLine}>Intent: {scenario.intent}</Text>
              <Text style={styles.metaLine}>Service: {scenario.sampleService}</Text>
              <Text style={styles.metaLine}>Date/time: {scenario.requestedTime}</Text>
              <Text style={styles.metaLine}>Customer phone: {scenario.customerPhonePreview}</Text>
              <View style={styles.pendingPill}>
                <Text style={styles.pendingPillText}>Pending merchant confirmation</Text>
              </View>
              <Text style={styles.noteLine}>{scenario.aiDraftResponse}</Text>
              <Text style={styles.noteLine}>Safety: Not created in system.</Text>
            </View>
          </>
        ) : null}

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => navigation.navigate('AiReceptionistSetupChecklist')}
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.86 }]}
          >
            <Text style={styles.actionBtnText}>Configure setup</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('AiReceptionistPilotRequest')}
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.86 }]}
          >
            <Text style={styles.actionBtnText}>Request pilot</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('MerchantDashboard')}
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.86 }]}
          >
            <Text style={styles.actionBtnText}>Back to merchant dashboard</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0C1017' },
  scroll: { paddingHorizontal: 16, paddingBottom: 28, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
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
  headerTextWrap: { flex: 1, minWidth: 0 },
  kicker: { fontSize: 11, fontWeight: '700', color: 'rgba(232,237,247,0.62)' },
  title: { fontSize: 27, fontWeight: '900', color: '#F4F7FF' },
  simulatedBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.55)',
    backgroundColor: 'rgba(250,204,21,0.15)',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  simulatedBadgeText: { fontSize: 11, fontWeight: '800', color: '#F9E7A4', letterSpacing: 0.5 },
  promptCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(122,228,255,0.35)',
    backgroundColor: 'rgba(61,90,254,0.12)',
    padding: 14,
  },
  promptTitle: { fontSize: 14, fontWeight: '800', color: '#E8EDF7', lineHeight: 20 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(232,237,247,0.08)',
    backgroundColor: '#151C27',
    padding: 14,
    gap: 7,
  },
  groupBlock: { gap: 8, marginTop: 4 },
  groupTitle: { fontSize: 12, fontWeight: '800', color: '#C7D7FF' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#F4F7FF' },
  cardBody: { fontSize: 13, color: 'rgba(232,237,247,0.74)', lineHeight: 18 },
  selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectorChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(122,228,255,0.35)',
    backgroundColor: 'rgba(122,228,255,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  selectorChipActive: {
    borderColor: 'rgba(125,211,252,0.75)',
    backgroundColor: 'rgba(59,130,246,0.25)',
  },
  selectorChipText: { fontSize: 11, fontWeight: '700', color: '#D4E9FF' },
  selectorChipTextActive: { color: '#F4F7FF' },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  timelineDotWrap: { width: 16, alignItems: 'center' },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7AE4FF', marginTop: 4 },
  timelineLine: { width: 2, height: 16, backgroundColor: 'rgba(122,228,255,0.32)', marginTop: 3 },
  timelineText: { flex: 1, fontSize: 13, color: 'rgba(232,237,247,0.72)', lineHeight: 18 },
  metaLine: { fontSize: 12, color: 'rgba(186,230,253,0.9)' },
  transcriptLine: { fontSize: 13, color: 'rgba(232,237,247,0.76)', lineHeight: 19 },
  noteLine: { fontSize: 12, color: 'rgba(248,250,252,0.58)', lineHeight: 17 },
  pendingPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(245,158,11,0.18)',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  pendingPillText: { fontSize: 11, fontWeight: '700', color: '#F4F7FF' },
  actionRow: { gap: 8, marginTop: 2 },
  actionBtn: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(159,183,255,0.42)',
    backgroundColor: 'rgba(61,90,254,0.18)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 13, fontWeight: '800', color: '#DCE8FF' },
});
