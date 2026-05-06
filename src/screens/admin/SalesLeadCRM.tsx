import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/routes';
import {
  generateDigitalFlyer,
  getMessengerDeepLink,
  getZaloDeepLink,
} from '../../services/marketing/DirectOutreachService';
import { initiateOutboundSalesCall } from '../../services/marketing/OutboundAiSalesService';
import {
  useOutboundAiSalesCrmStore,
  type OutboundAiCallLog,
  type OutboundSalesCallDisposition,
} from '../../state/outboundAiSalesCrm';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles, mergeWebClassNames } from '../../utils/applyWebStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const SALES_LEAD_STATUS = {
  NOT_CONTACTED: 'NOT_CONTACTED',
  DEMO_SENT: 'DEMO_SENT',
  TRIAL: 'TRIAL',
  PAID: 'PAID',
} as const;

export type SalesLeadStatus = (typeof SALES_LEAD_STATUS)[keyof typeof SALES_LEAD_STATUS];

export type SalesLeadRow = {
  readonly id: string;
  readonly businessName: string;
  readonly phone: string;
  readonly vertical: string;
  readonly city: string;
  /** Merchant HQ / GPS registration — selects Twilio local DID pool (mock). */
  readonly merchantCountryIso2?: string;
  readonly status: SalesLeadStatus;
  /** Unix ms when the 7-day freemium / trial hook expires (mock). */
  readonly sevenDayHookEndsAtMs: number;
};

type LeadOutreachFields = {
  zaloPhone: string;
  fbPageId: string;
};

const DISPOSITION_LABEL_VI: Record<OutboundSalesCallDisposition, string> = {
  answered: 'Đã nghe máy',
  busy: 'Máy bận',
  interested: 'Quan tâm',
  not_interested: 'Không quan tâm',
  no_answer: 'Không trả lời',
  failed: 'Lỗi / thiếu SĐT',
};

function buildLogsByLeadId(logs: readonly OutboundAiCallLog[]): Map<string, OutboundAiCallLog[]> {
  const m = new Map<string, OutboundAiCallLog[]>();
  for (const log of logs) {
    if (log.leadId === undefined) continue;
    const arr = m.get(log.leadId) ?? [];
    arr.push(log);
    m.set(log.leadId, arr);
  }
  for (const arr of m.values()) {
    arr.sort((a, b) => (a.createdAtIso < b.createdAtIso ? 1 : -1));
  }
  return m;
}

const STATUS_LABEL_VI: Record<SalesLeadStatus, string> = {
  [SALES_LEAD_STATUS.NOT_CONTACTED]: 'Chưa liên hệ',
  [SALES_LEAD_STATUS.DEMO_SENT]: 'Đã gửi Demo',
  [SALES_LEAD_STATUS.TRIAL]: 'Đang dùng thử (Trial)',
  [SALES_LEAD_STATUS.PAID]: 'Đã chốt (Paid)',
};

function mockLeads(): SalesLeadRow[] {
  const now = Date.now();
  const day = 86_400_000;
  return [
    {
      id: 'lead_nail_01',
      businessName: 'Salon Ngọc Trai — Praha 3',
      phone: '+420601***789',
      vertical: 'Nails / Spa',
      city: 'Praha',
      merchantCountryIso2: 'CZ',
      status: SALES_LEAD_STATUS.TRIAL,
      sevenDayHookEndsAtMs: now + 3 * day + 9 * 3_600_000,
    },
    {
      id: 'lead_wholesale_02',
      businessName: 'TNHH Thực Phẩm Sông Hồng (Berlin)',
      phone: '+49151***4420',
      vertical: 'Wholesale',
      city: 'Berlin',
      merchantCountryIso2: 'DE',
      status: SALES_LEAD_STATUS.DEMO_SENT,
      sevenDayHookEndsAtMs: now + 5 * day + 2 * 3_600_000,
    },
    {
      id: 'lead_hotel_03',
      businessName: 'Homestay Old Town Brno',
      phone: '+420777***112',
      vertical: 'Hospitality',
      city: 'Brno',
      merchantCountryIso2: 'CZ',
      status: SALES_LEAD_STATUS.NOT_CONTACTED,
      sevenDayHookEndsAtMs: now + 7 * day,
    },
    {
      id: 'lead_nail_04',
      businessName: 'Luxury Spa Karlovy Vary',
      phone: '+420353***001',
      vertical: 'Nails / Spa',
      city: 'Karlovy Vary',
      merchantCountryIso2: 'CZ',
      status: SALES_LEAD_STATUS.PAID,
      sevenDayHookEndsAtMs: now - day,
    },
    {
      id: 'lead_wholesale_05',
      businessName: 'EuroBeverage Import s.r.o.',
      phone: '+420222***556',
      vertical: 'Wholesale',
      city: 'Ostrava',
      merchantCountryIso2: 'CZ',
      status: SALES_LEAD_STATUS.TRIAL,
      sevenDayHookEndsAtMs: now + 14 * 3_600_000,
    },
  ];
}

function formatHookCountdown(endMs: number, nowMs: number, status: SalesLeadStatus): string {
  if (status === SALES_LEAD_STATUS.PAID) {
    return 'Freemium hook: đã chuyển trả phí — không áp dụng đếm ngược.';
  }
  const delta = endMs - nowMs;
  if (delta <= 0) {
    return 'Móc 7 ngày: đã hết hạn — telesale chốt hoặc gia hạn thủ công.';
  }
  const d = Math.floor(delta / 86_400_000);
  const h = Math.floor((delta % 86_400_000) / 3_600_000);
  const m = Math.floor((delta % 3_600_000) / 60_000);
  const s = Math.floor((delta % 60_000) / 1000);
  return `Freemium 7 ngày còn: ${d}d ${h}h ${m}m ${s}s`;
}

function statusPillStyle(status: SalesLeadStatus): { bg: string; border: string } {
  switch (status) {
    case SALES_LEAD_STATUS.PAID:
      return { bg: 'rgba(129, 199, 132, 0.18)', border: 'rgba(129, 199, 132, 0.45)' };
    case SALES_LEAD_STATUS.TRIAL:
      return { bg: 'rgba(85, 144, 224, 0.2)', border: 'rgba(85, 144, 224, 0.45)' };
    case SALES_LEAD_STATUS.DEMO_SENT:
      return { bg: 'rgba(197, 160, 89, 0.2)', border: 'rgba(197, 160, 89, 0.5)' };
    default:
      return { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.14)' };
  }
}

async function openOutreachUrl(url: string, label: string): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Không mở được link', `Thiết bị không đăng ký scheme cho ${label}. Thử trên điện thoại có app đã cài.`);
      return;
    }
    await Linking.openURL(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Lỗi không xác định';
    Alert.alert('Lỗi mở link', msg);
  }
}

export function SalesLeadCRM() {
  const navigation = useNavigation<Nav>();
  const [leads] = useState<SalesLeadRow[]>(() => mockLeads());
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [outreachByLeadId, setOutreachByLeadId] = useState<Record<string, LeadOutreachFields>>({});
  const outboundLogs = useOutboundAiSalesCrmStore((s) => s.logs);
  const logsByLeadId = useMemo(() => buildLogsByLeadId(outboundLogs), [outboundLogs]);

  useEffect(() => {
    setOutreachByLeadId((prev) => {
      const next: Record<string, LeadOutreachFields> = { ...prev };
      leads.forEach((l) => {
        if (next[l.id] === undefined) {
          next[l.id] = { zaloPhone: '', fbPageId: '' };
        }
      });
      return next;
    });
  }, [leads]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const patchOutreach = useCallback((leadId: string, patch: Partial<LeadOutreachFields>) => {
    setOutreachByLeadId((prev) => {
      const cur: LeadOutreachFields = prev[leadId] ?? { zaloPhone: '', fbPageId: '' };
      return { ...prev, [leadId]: { ...cur, ...patch } };
    });
  }, []);

  const onShockDemo = useCallback((lead: SalesLeadRow) => {
    Alert.alert(
      'GỬI SHOCK DEMO (mock)',
      [
        `Merchant: ${lead.businessName}`,
        `SĐT: ${lead.phone}`,
        '',
        'Đã render bản ghi cá nhân hoá: Lễ tân AI thoại với “khách giả lập” (CS/DE) về đặt lịch / đơn sỉ.',
        'Đang gửi qua Zalo OA + SMS gateway (mock) — SLA nội bộ: 2 phút.',
      ].join('\n'),
      [{ text: 'Đóng', style: 'default' }]
    );
  }, []);

  const onZaloFlyer = useCallback(
    async (lead: SalesLeadRow, zaloPhone: string) => {
      const trimmed = zaloPhone.trim();
      if (trimmed.length === 0) {
        Alert.alert('Thiếu SĐT (Zalo)', 'Nhập số điện thoại hoặc Zalo ID số để mở deep link — tránh spam: chỉ gửi khi đã đồng ý.');
        return;
      }
      const message = generateDigitalFlyer(lead.businessName, lead.vertical);
      const url = getZaloDeepLink(trimmed, message);
      await openOutreachUrl(url, 'Zalo');
    },
    []
  );

  const onAiOutboundMock = useCallback(async (lead: SalesLeadRow, zaloPhone: string) => {
    const dial = zaloPhone.trim();
    if (dial.length === 0) {
      Alert.alert('Thiếu SĐT', 'Nhập Số ĐT (Zalo) đầy đủ để mock Twilio outbound — CRM sẽ gắn transcript vào lead này.');
      return;
    }
    if (dial.includes('*')) {
      Alert.alert('SĐT không hợp lệ', 'Bỏ ký tự * trong hồ sơ CRM; nhập số thật vào ô Zalo trước khi gọi.');
      return;
    }
    try {
      const r = await initiateOutboundSalesCall(
        dial,
        lead.businessName,
        lead.id,
        lead.merchantCountryIso2 ?? 'US'
      );
      Alert.alert(
        'Outbound AI (mock)',
        `Disposition: ${r.disposition}\nSID: ${r.twilioCallSidMock}\nLocal DID plan: ${r.twilioProvisioning.dialCode} (${r.twilioProvisioning.countryCode})`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lỗi';
      Alert.alert('Outbound AI', msg);
    }
  }, []);

  const onMessengerFlyer = useCallback(async (lead: SalesLeadRow, fbPageId: string) => {
    const trimmed = fbPageId.trim();
    if (trimmed.length === 0) {
      Alert.alert('Thiếu Facebook Page ID', 'Nhập Page ID (số) hoặc username page để mở m.me.');
      return;
    }
    const message = generateDigitalFlyer(lead.businessName, lead.vertical);
    const url = getMessengerDeepLink(trimmed, message);
    await openOutreachUrl(url, 'Messenger');
  }, []);

  const renderItem: ListRenderItem<SalesLeadRow> = useCallback(
    ({ item }) => {
      const pill = statusPillStyle(item.status);
      const o = outreachByLeadId[item.id] ?? { zaloPhone: '', fbPageId: '' };
      const aiHistory = logsByLeadId.get(item.id) ?? [];
      return (
        <View style={styles.leadCard} className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}>
          <View style={styles.leadTop}>
            <View style={styles.leadTitleBlock}>
              <Text style={styles.leadName}>{item.businessName}</Text>
              <Text style={styles.leadMeta}>
                {item.vertical} · {item.city}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: pill.bg, borderColor: pill.border }]}>
              <Text style={styles.statusPillText}>{STATUS_LABEL_VI[item.status]}</Text>
            </View>
          </View>
          <Text style={styles.leadPhoneLabel}>Hồ sơ (CRM)</Text>
          <Text style={styles.leadPhone}>{item.phone}</Text>
          <Text style={styles.countdown}>{formatHookCountdown(item.sevenDayHookEndsAtMs, nowMs, item.status)}</Text>

          <View style={styles.outreachBlock}>
            <Text style={styles.inputLabel}>Số ĐT (Zalo)</Text>
            <TextInput
              value={o.zaloPhone}
              onChangeText={(t) => patchOutreach(item.id, { zaloPhone: t })}
              placeholder="VD: 84912345678 hoặc Zalo ID số"
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="phone-pad"
              style={styles.textInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.inputLabel}>Facebook Page ID</Text>
            <TextInput
              value={o.fbPageId}
              onChangeText={(t) => patchOutreach(item.id, { fbPageId: t })}
              placeholder="VD: 123456789012345 hoặc @username"
              placeholderTextColor={theme.colors.text.tertiary}
              style={styles.textInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.flyerBtnRow}>
            <Pressable
              onPress={() => void onZaloFlyer(item, o.zaloPhone)}
              style={({ pressed }) => [styles.btnZalo, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel={`Bắn tờ rơi Zalo cho ${item.businessName}`}
            >
              <Text style={styles.btnZaloText}>💬 BẮN TỜ RƠI ZALO</Text>
            </Pressable>
            <Pressable
              onPress={() => void onMessengerFlyer(item, o.fbPageId)}
              style={({ pressed }) => [styles.btnMessenger, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel={`Bắn tờ rơi Messenger cho ${item.businessName}`}
            >
              <Text style={styles.btnMessengerText}>💬 BẮN TỜ RƠI MESSENGER</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => void onAiOutboundMock(item, o.zaloPhone)}
            style={({ pressed }) => [styles.btnOutboundAi, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityLabel={`Gọi outbound AI mock cho ${item.businessName}`}
          >
            <Ionicons name="call-outline" size={18} color={theme.colors.primaryBright} />
            <Text style={styles.btnOutboundAiText}>📞 GỌI OUTBOUND AI (MOCK)</Text>
          </Pressable>

          <View style={styles.aiHistoryBlock}>
            <Text style={styles.aiHistoryTitle}>Lịch sử gọi AI</Text>
            {aiHistory.length === 0 ? (
              <Text style={styles.aiHistoryEmpty}>Chưa có cuộc gọi gắn lead — dùng nút Outbound AI hoặc Campaign screen.</Text>
            ) : (
              aiHistory.map((log) => (
                <View key={log.id} style={styles.aiHistoryRow} className={applyWebStyles('kn-glass')}>
                  <Text style={styles.aiHistoryMeta}>
                    {new Date(log.createdAtIso).toLocaleString('vi-VN')} · {DISPOSITION_LABEL_VI[log.disposition]}
                  </Text>
                  <Text style={styles.aiHistoryTranscript}>{log.transcriptVi}</Text>
                </View>
              ))
            )}
          </View>

          <Pressable
            onPress={() => onShockDemo(item)}
            style={({ pressed }) => [styles.shockBtn, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityLabel={`Gửi shock demo cho ${item.businessName}`}
          >
            <Ionicons name="flash" size={18} color={theme.colors.onAccent} />
            <Text style={styles.shockBtnText}>GỬI SHOCK DEMO</Text>
          </Pressable>
        </View>
      );
    },
    [nowMs, onShockDemo, outreachByLeadId, patchOutreach, onZaloFlyer, onMessengerFlyer, onAiOutboundMock, logsByLeadId]
  );

  const keyExtractor = useCallback((item: SalesLeadRow) => item.id, []);

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader} className={applyWebStyles('kn-glass')}>
        <Text style={styles.listHeaderTitle}>Pipeline Telesale</Text>
        <Text style={styles.listHeaderSub}>
          {leads.length} lead B2B — điền SĐT Zalo + Page ID; Outbound AI (mock) ghi transcript vào cột “Lịch sử gọi AI”.
        </Text>
      </View>
    ),
    [leads.length]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          CRM Telesale
        </Text>
        <View style={styles.topSpacer} />
      </View>
      <FlatList
        data={leads}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        windowSize={8}
        extraData={{ outreachByLeadId, outboundLogs }}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  listHeader: {
    marginBottom: 4,
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    gap: 6,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
  },
  listHeaderSub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  leadCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    backgroundColor: 'rgba(8, 18, 32, 0.55)',
  },
  leadTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  leadTitleBlock: {
    flex: 1,
    gap: 4,
  },
  leadName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  leadMeta: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  leadPhoneLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.tertiary,
  },
  leadPhone: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: theme.colors.primaryBright,
  },
  countdown: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: theme.colors.success,
    lineHeight: 17,
  },
  outreachBlock: {
    gap: 6,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
    marginTop: 4,
  },
  textInput: {
    minHeight: 42,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.primary,
  },
  flyerBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  btnZalo: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 140,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: theme.radius.md,
    backgroundColor: '#0068FF',
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 255, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00B4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  btnZaloText: {
    fontSize: 12,
    fontFamily: FontFamily.extrabold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  btnMessenger: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 140,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: theme.radius.md,
    backgroundColor: '#0084FF',
    borderWidth: 1,
    borderColor: 'rgba(162, 89, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A259FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  btnMessengerText: {
    fontSize: 12,
    fontFamily: FontFamily.extrabold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  shockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.components.button.variant.primary.background,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
  },
  shockBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    color: theme.components.button.variant.primary.text,
    letterSpacing: 0.4,
  },
  btnOutboundAi: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 102, 0.45)',
    backgroundColor: 'rgba(0, 255, 102, 0.12)',
  },
  btnOutboundAiText: {
    fontSize: 12,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.success,
    letterSpacing: 0.3,
  },
  aiHistoryBlock: {
    marginTop: 6,
    gap: 8,
  },
  aiHistoryTitle: {
    fontSize: 12,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
    letterSpacing: 0.4,
  },
  aiHistoryEmpty: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.tertiary,
    lineHeight: 16,
  },
  aiHistoryRow: {
    padding: 10,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  aiHistoryMeta: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.secondary,
  },
  aiHistoryTranscript: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.primary,
    lineHeight: 16,
  },
});
