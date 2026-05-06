import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/routes';
import {
  initiateOutboundSalesCall,
  parseOutboundLeadCsv,
  type ParsedCampaignLead,
} from '../../services/marketing/OutboundAiSalesService';
import { executeColdCallCampaign } from '../../services/marketing/OutboundAISniperService';
import { useOutboundAiSalesCrmStore } from '../../state/outboundAiSalesCrm';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles, mergeWebClassNames } from '../../utils/applyWebStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function OutboundCampaignScreen() {
  const navigation = useNavigation<Nav>();
  const [csvDraft, setCsvDraft] = useState('');
  const [queue, setQueue] = useState<readonly ParsedCampaignLead[]>([]);
  const [activeCalls, setActiveCalls] = useState(0);
  const [campaignRunning, setCampaignRunning] = useState(false);
  const [sniperRunning, setSniperRunning] = useState(false);

  const logs = useOutboundAiSalesCrmStore((s) => s.logs);

  const interestedClosed = useMemo(
    () => logs.filter((l) => l.disposition === 'interested').length,
    [logs]
  );

  const onPasteClipboard = useCallback(async () => {
    try {
      const t = await Clipboard.getStringAsync();
      if (t.trim().length === 0) {
        Alert.alert('Clipboard trống', 'Sao chép file CSV (phone,name) rồi thử lại.');
        return;
      }
      setCsvDraft(t);
    } catch {
      Alert.alert('Clipboard', 'Không đọc được clipboard trên thiết bị này.');
    }
  }, []);

  const onParseCsv = useCallback(() => {
    const parsed = parseOutboundLeadCsv(csvDraft);
    if (parsed.length === 0) {
      Alert.alert('CSV', 'Không parse được dòng hợp lệ. Định dạng: phone,businessName (mỗi dòng một lead).');
      return;
    }
    setQueue(parsed);
    Alert.alert('Đã import', `${parsed.length} lead — sẵn sàng Start Campaign.`);
  }, [csvDraft]);

  const onStartCampaign = useCallback(async () => {
    if (queue.length === 0) {
      Alert.alert('Chưa có lead', 'Import CSV trước khi chạy auto-dialer.');
      return;
    }
    if (campaignRunning) return;
    setCampaignRunning(true);
    for (const row of queue) {
      setActiveCalls((n) => n + 1);
      try {
        await initiateOutboundSalesCall(row.phone, row.businessName);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Lỗi';
        Alert.alert('Cuộc gọi lỗi', msg);
      } finally {
        setActiveCalls((n) => Math.max(0, n - 1));
      }
      await new Promise<void>((r) => setTimeout(r, 120));
    }
    setCampaignRunning(false);
    Alert.alert('Campaign', 'Đã quét xong hàng đợi (mock Twilio+AI).');
  }, [campaignRunning, queue]);

  const onTriggerSalesSniper = useCallback(async () => {
    const phones =
      queue.length > 0
        ? queue.map((q) => q.phone)
        : ['+4915112345670', '+33612345678', '+420601555019', '+390212345678'];
    if (sniperRunning) return;
    setSniperRunning(true);
    try {
      const summary = await executeColdCallCampaign(phones);
      Alert.alert(
        'Sales Sniper · SEO90',
        `Attempted: ${summary.attempted}\nInterested: ${summary.interested}\nOnboarding links (email/data): ${summary.onboardingLinksSent}\n(Lễ Tân AI — Zero-SMS; configure EXPO_PUBLIC_MARKETING_ONBOARDING_EMAIL_WEBHOOK_URL for live rails.)`
      );
    } catch (e) {
      Alert.alert('Sniper', e instanceof Error ? e.message : 'Lỗi');
    } finally {
      setSniperRunning(false);
    }
  }, [queue, sniperRunning]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          Outbound AI Sales
        </Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero} className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}>
          <Text style={styles.heroTitle}>📞 Outbound AI Sales Force</Text>
          <Text style={styles.heroSub}>
            Mock Twilio Voice + OpenAI Realtime / Gemini — dialer tuần tự, ghi CRM disposition + transcript.
          </Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.metricCardWide]} className={applyWebStyles('kn-glass')}>
            <Text style={styles.metricLabel}>Số cuộc gọi đang thực hiện</Text>
            <Text style={styles.metricValue}>{activeCalls}</Text>
          </View>
          <View style={[styles.metricCard, styles.metricCardWide]} className={applyWebStyles('kn-glass')}>
            <Text style={styles.metricLabel}>Số chủ tiệm đã chốt (Interested)</Text>
            <Text style={[styles.metricValue, styles.metricValueGreen]}>{interestedClosed}</Text>
          </View>
        </View>

        <View style={styles.uploadCard} className={applyWebStyles('kn-glass')}>
          <Text style={styles.sectionTitle}>Upload Lead List (CSV)</Text>
          <Text style={styles.sectionHint}>Mỗi dòng: phone,businessName — hoặc dán từ clipboard.</Text>
          <TextInput
            value={csvDraft}
            onChangeText={setCsvDraft}
            placeholder={'+420601111222,Salon ABC\n+491511234567,Wholesale XYZ'}
            placeholderTextColor={theme.colors.text.tertiary}
            multiline
            style={styles.csvInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.uploadActions}>
            <Pressable onPress={onPasteClipboard} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}>
              <Ionicons name="clipboard-outline" size={18} color={theme.colors.primaryBright} />
              <Text style={styles.secondaryBtnText}>Dán từ Clipboard</Text>
            </Pressable>
            <Pressable onPress={onParseCsv} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}>
              <Ionicons name="document-text-outline" size={18} color={theme.colors.primaryBright} />
              <Text style={styles.secondaryBtnText}>Parse CSV</Text>
            </Pressable>
          </View>
          <Text style={styles.queueHint}>Hàng đợi: {queue.length} lead</Text>
        </View>

        <Pressable
          onPress={() => void onStartCampaign()}
          disabled={campaignRunning || queue.length === 0}
          style={({ pressed }) => [
            styles.startMega,
            (campaignRunning || queue.length === 0) && styles.startMegaDisabled,
            pressed && !campaignRunning && queue.length > 0 && { opacity: 0.92 },
          ]}
          className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}
          accessibilityRole="button"
          accessibilityLabel="Start AI auto dialer campaign"
        >
          {campaignRunning ? (
            <ActivityIndicator color={theme.colors.onAccent} />
          ) : (
            <Ionicons name="call" size={28} color={theme.colors.onAccent} />
          )}
          <Text style={styles.startMegaText}>START CAMPAIGN · AI AUTO-DIALER</Text>
          <Text style={styles.startMegaSub}>{campaignRunning ? 'Đang quét hàng đợi…' : 'Twilio outbound + AI voice (mock)'}</Text>
        </Pressable>

        <Pressable
          onPress={() => void onTriggerSalesSniper()}
          disabled={sniperRunning}
          style={({ pressed }) => [
            styles.sniperBtn,
            sniperRunning && styles.sniperBtnDisabled,
            pressed && !sniperRunning && { opacity: 0.92 },
          ]}
          className={applyWebStyles('kn-glass')}
          accessibilityRole="button"
          accessibilityLabel="Trigger outbound AI sniper for European salons"
        >
          {sniperRunning ? (
            <ActivityIndicator color={theme.colors.primaryBright} />
          ) : (
            <Ionicons name="navigate-circle" size={26} color={theme.colors.primaryBright} />
          )}
          <Text style={styles.sniperBtnTitle}>Trigger Sales Sniper</Text>
          <Text style={styles.sniperBtnSub}>
            Lễ Tân AI · 90-day SEO trial pitch (EU) — interested leads auto-SMS onboarding (Twilio webhook).
          </Text>
        </Pressable>

        <View style={styles.logPreview} className={applyWebStyles('kn-glass')}>
          <Text style={styles.sectionTitle}>Nhật ký gần nhất</Text>
          {logs.slice(0, 6).map((l) => (
            <View key={l.id} style={styles.logLine}>
              <Text style={styles.logMeta}>
                {l.disposition.toUpperCase()} · {l.businessName}
              </Text>
              <Text style={styles.logTr} numberOfLines={2}>
                {l.transcriptVi}
              </Text>
            </View>
          ))}
          {logs.length === 0 ? <Text style={styles.empty}>Chưa có log — chạy campaign hoặc gọi từ CRM.</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B1220' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  backBtn: { padding: 8 },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  topSpacer: { width: 40 },
  scroll: { padding: 16, paddingBottom: 48, gap: 16 },
  hero: {
    padding: 16,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 8,
  },
  heroTitle: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
  },
  heroSub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flexGrow: 1,
    minWidth: 140,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    gap: 6,
  },
  metricCardWide: {
    flexBasis: '47%',
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
  },
  metricValue: {
    fontSize: 28,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
  },
  metricValueGreen: {
    color: theme.colors.success,
  },
  uploadCard: {
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
  },
  sectionHint: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.tertiary,
    lineHeight: 16,
  },
  csvInput: {
    minHeight: 120,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.primary,
    textAlignVertical: 'top',
  },
  uploadActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.45)',
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
  },
  queueHint: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
  },
  startMega: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.22)',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 22,
    elevation: 14,
  },
  startMegaDisabled: {
    opacity: 0.45,
  },
  startMegaText: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.onAccent,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  startMegaSub: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: theme.colors.onAccent,
    opacity: 0.92,
    textAlign: 'center',
  },
  sniperBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(85, 144, 224, 0.45)',
    backgroundColor: 'rgba(85, 144, 224, 0.12)',
  },
  sniperBtnDisabled: { opacity: 0.5 },
  sniperBtnTitle: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  sniperBtnSub: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  logPreview: {
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    gap: 10,
  },
  logLine: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  logMeta: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
  },
  logTr: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  empty: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.tertiary,
  },
});
