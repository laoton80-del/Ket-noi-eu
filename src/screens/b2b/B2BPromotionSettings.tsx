/**
 * Merchant-owned Leona promo rules — no AI-discounts; only pre-approved codes.
 */
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/routes';
import { useB2bMerchantPromoSettingsStore } from '../../state/b2bMerchantPromoSettings';

const BG = '#121212';
const BG_CARD = 'rgba(26, 26, 36, 0.92)';
const BORDER = 'rgba(197, 160, 89, 0.35)';
const GOLD = '#C5A059';
const GOLD_DIM = 'rgba(197, 160, 89, 0.55)';
const TEXT = '#F4F7FF';
const MUTED = 'rgba(232, 237, 247, 0.55)';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function B2BPromotionSettings(): ReactElement {
  const navigation = useNavigation<Nav>();
  const hydrate = useB2bMerchantPromoSettingsStore((s) => s.hydrate);
  const allow = useB2bMerchantPromoSettingsStore((s) => s.allowPreApprovedPromos);
  const setAllow = useB2bMerchantPromoSettingsStore((s) => s.setAllowPreApprovedPromos);
  const promoCode = useB2bMerchantPromoSettingsStore((s) => s.promoCode);
  const setPromoCode = useB2bMerchantPromoSettingsStore((s) => s.setPromoCode);
  const discountPct = useB2bMerchantPromoSettingsStore((s) => s.discountPercent);
  const setDiscountPct = useB2bMerchantPromoSettingsStore((s) => s.setDiscountPercent);
  const minCart = useB2bMerchantPromoSettingsStore((s) => s.minCartUsd);
  const setMinCart = useB2bMerchantPromoSettingsStore((s) => s.setMinCartUsd);
  const queue = useB2bMerchantPromoSettingsStore((s) => s.humanTouchQueue);
  const dismiss = useB2bMerchantPromoSettingsStore((s) => s.dismissHumanTouch);

  const [codeDraft, setCodeDraft] = useState(promoCode);
  const [pctDraft, setPctDraft] = useState(String(discountPct));
  const [cartDraft, setCartDraft] = useState(String(minCart));

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    setCodeDraft(promoCode);
  }, [promoCode]);

  useEffect(() => {
    setPctDraft(String(discountPct));
  }, [discountPct]);

  useEffect(() => {
    setCartDraft(String(minCart));
  }, [minCart]);

  const saveForm = useCallback(() => {
    setPromoCode(codeDraft);
    const p = parseFloat(pctDraft.replace(',', '.'));
    setDiscountPct(Number.isFinite(p) ? p : 0);
    const c = parseFloat(cartDraft.replace(',', '.'));
    setMinCart(Number.isFinite(c) ? c : 50);
  }, [cartDraft, codeDraft, pctDraft, setDiscountPct, setMinCart, setPromoCode]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={24} color={TEXT} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          Ưu đãi & Lễ tân AI
        </Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>QUY TẮC DO CHỦ TIỆM ĐẶT</Text>
        <Text style={styles.lead}>
          Leona không tự giảm giá. Chỉ khi bạn bật công tắc bên dưới và điền mã đã duyệt, cô ấy mới được
          gợi ý mã đó cho khách đang phân vân — và chỉ khi giỏ hàng đạt ngưỡng bạn chọn.
        </Text>

        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.cardTitle}>Cho phép AI dùng ưu đãi đã duyệt</Text>
              <Text style={styles.cardHint}>
                Khách mới phân vân giá — Leona chỉ được dùng mã bạn nhập ở dưới (không tự chế giảm giá).
              </Text>
            </View>
            <Switch
              value={allow}
              onValueChange={setAllow}
              trackColor={{ false: '#2A3444', true: 'rgba(197, 160, 89, 0.45)' }}
              thumbColor={allow ? GOLD : '#888888'}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mã ưu đãi (Auto-Closer)</Text>
          <Text style={styles.fieldLabel}>Mã code</Text>
          <TextInput
            value={codeDraft}
            onChangeText={setCodeDraft}
            onBlur={saveForm}
            placeholder="WELCOME10"
            placeholderTextColor={MUTED}
            autoCapitalize="characters"
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Giá trị giảm (%)</Text>
          <TextInput
            value={pctDraft}
            onChangeText={setPctDraft}
            onBlur={saveForm}
            keyboardType="decimal-pad"
            placeholder="10"
            placeholderTextColor={MUTED}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Điều kiện: giỏ tối thiểu (USD)</Text>
          <TextInput
            value={cartDraft}
            onChangeText={setCartDraft}
            onBlur={saveForm}
            keyboardType="decimal-pad"
            placeholder="50"
            placeholderTextColor={MUTED}
            style={styles.input}
          />
          <Text style={styles.example}>
            Ví dụ: Code <Text style={styles.exampleGold}>WELCOME10</Text>, giảm{' '}
            <Text style={styles.exampleGold}>10%</Text> khi giỏ &gt; <Text style={styles.exampleGold}>$50</Text>.
          </Text>
          <Pressable onPress={saveForm} style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.9 }]}>
            <Text style={styles.saveBtnText}>Lưu cấu hình</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Needs Human Touch</Text>
          <Text style={styles.cardHint}>
            Các tình huống Leona không được phép giảm giá tự ý — chờ bạn xử lý.
          </Text>
          {queue.length === 0 ? (
            <Text style={styles.emptyQueue}>Chưa có yêu cầu chờ.</Text>
          ) : (
            queue.map((row) => (
              <View key={row.id} style={styles.queueRow}>
                <View style={styles.queueTextCol}>
                  <Text style={styles.queueSummary} numberOfLines={4}>
                    {row.summaryVi}
                  </Text>
                  <Text style={styles.queueTime}>{new Date(row.createdAtIso).toLocaleString('vi-VN')}</Text>
                </View>
                <Pressable
                  onPress={() => dismiss(row.id)}
                  style={({ pressed }) => [styles.dismissBtn, pressed && { opacity: 0.88 }]}
                >
                  <Text style={styles.dismissText}>Xong</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 8,
  },
  iconBtn: { padding: 8 },
  topTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: GOLD,
    textAlign: 'center',
  },
  topSpacer: { width: 40 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40, gap: 14 },
  kicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    color: GOLD_DIM,
  },
  lead: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED,
    lineHeight: 21,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: BG_CARD,
    padding: 14,
    gap: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleTextCol: { flex: 1, minWidth: 0, gap: 6 },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: TEXT,
  },
  cardHint: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: GOLD_DIM,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    backgroundColor: 'rgba(18, 18, 22, 0.9)',
  },
  example: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    lineHeight: 18,
  },
  exampleGold: { color: GOLD, fontWeight: '800' },
  saveBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(197, 160, 89, 0.22)',
    borderWidth: 1,
    borderColor: BORDER,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: GOLD,
  },
  emptyQueue: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED,
    fontStyle: 'italic',
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  queueTextCol: { flex: 1, minWidth: 0, gap: 4 },
  queueSummary: { fontSize: 13, fontWeight: '700', color: TEXT, lineHeight: 19 },
  queueTime: { fontSize: 10, fontWeight: '600', color: MUTED },
  dismissBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderWidth: 1,
    borderColor: BORDER,
  },
  dismissText: { fontSize: 12, fontWeight: '800', color: GOLD },
});
