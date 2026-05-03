import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  B2C_TRAVEL_PACKAGE_SUB_USD,
  MINH_KHANG_LIVE_INTERPRETER_PER_MIN_CREDITS,
  PRICING_BASELINE_CURRENCY,
} from '../../config/pricingConfig';
import type { RootStackParamList } from '../../navigation/routes';
import { prepareTravelVoiceSession } from '../../services/ai/MinhKhangService';
import type { NearbyMerchantPreview, TravelContext } from '../../services/context/UserContextService';
import { getTravelContext } from '../../services/context/UserContextService';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles, mergeWebClassNames } from '../../utils/applyWebStyles';
import { formatCurrency } from '../../utils/currencyFormatter';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type StayFilter = 'all' | 'hotel' | 'homestay';

function liveFxSnapshot(countryCode: string): { readonly pairLabel: string; readonly rateLine: string; readonly asOf: string } {
  const cc = countryCode.toUpperCase();
  const jitter = 1 + (Date.now() % 23) / 15_000;
  const vndPerUsd = Math.round(26_000 * jitter);
  const vndPerEur = Math.round(28_200 * jitter);
  const vndPerCzk = Math.round(1_118 * jitter);
  const asOf = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  if (cc === 'CZ') {
    return {
      pairLabel: 'CZK → VND',
      rateLine: `1 CZK ≈ ${vndPerCzk.toLocaleString('vi-VN')} ₫ (minh họa thời gian thực)`,
      asOf,
    };
  }
  if (
    cc === 'DE' ||
    cc === 'FR' ||
    cc === 'AT' ||
    cc === 'NL' ||
    cc === 'BE' ||
    cc === 'IE' ||
    cc === 'IT' ||
    cc === 'ES'
  ) {
    return {
      pairLabel: 'EUR → VND',
      rateLine: `1 EUR ≈ ${vndPerEur.toLocaleString('vi-VN')} ₫ (minh họa thời gian thực)`,
      asOf,
    };
  }
  return {
    pairLabel: 'USD → VND',
    rateLine: `1 USD ≈ ${vndPerUsd.toLocaleString('vi-VN')} ₫ (minh họa thời gian thực)`,
    asOf,
  };
}

function filterMerchants(
  list: readonly NearbyMerchantPreview[],
  stay: StayFilter,
  nearMeOnly: boolean
): NearbyMerchantPreview[] {
  let rows = [...list];
  if (stay === 'hotel') rows = rows.filter((m) => m.kind === 'hotel');
  if (stay === 'homestay') rows = rows.filter((m) => m.kind === 'homestay');
  if (nearMeOnly) rows = rows.filter((m) => m.distanceM <= 700);
  return rows.sort((a, b) => a.distanceM - b.distanceM);
}

export function TravelHospitalityScreen() {
  const navigation = useNavigation<Nav>();
  const [ctx, setCtx] = useState<TravelContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [stayFilter, setStayFilter] = useState<StayFilter>('all');
  const [nearMeOnly, setNearMeOnly] = useState(true);
  const [voiceMeta, setVoiceMeta] = useState<string>('');
  const lastWelcomeCityKeyRef = useRef<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    void getTravelContext()
      .then((c) => setCtx(c))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    void prepareTravelVoiceSession().then((s) => {
      setVoiceMeta(`${s.creditsPerClockMinute} Xu/phút · ${s.mode}`);
    });
  }, []);

  useEffect(() => {
    if (!ctx?.welcomeGreetingVi) return;
    const key = `${ctx.countryCode}:${ctx.city}`;
    if (lastWelcomeCityKeyRef.current === key) return;
    lastWelcomeCityKeyRef.current = key;
    Alert.alert('Concierge du lịch', ctx.welcomeGreetingVi);
  }, [ctx]);

  const fx = useMemo(() => liveFxSnapshot(ctx?.countryCode ?? 'CZ'), [ctx?.countryCode]);

  const merchants = useMemo(
    () => (ctx ? filterMerchants(ctx.nearbyMerchants, stayFilter, nearMeOnly) : []),
    [ctx, stayFilter, nearMeOnly]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.82 }]}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.topTitle}>Lưu trú &amp; Concierge</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero} className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}>
          <Text style={styles.heroKicker}>Travel Concierge · Minh Khang</Text>
          <Text style={styles.heroTitle}>GPS · Giờ địa phương · Near Me</Text>
          <Text style={styles.heroSub}>
            Phiên dịch: {MINH_KHANG_LIVE_INTERPRETER_PER_MIN_CREDITS} Xu/phút — Travel Pass 7 ngày{' '}
            {formatCurrency(B2C_TRAVEL_PACKAGE_SUB_USD, PRICING_BASELINE_CURRENCY)} (neo ledger).
          </Text>
          {voiceMeta.length > 0 ? <Text style={styles.heroVoice}>{voiceMeta}</Text> : null}
        </View>

        <View style={styles.ctxCard} className={applyWebStyles('kn-glass')}>
          {loading ? (
            <Text style={styles.muted}>Đang lấy vị trí…</Text>
          ) : ctx ? (
            <>
              <View style={styles.ctxRow}>
                <Ionicons name="location" size={20} color={theme.colors.primaryBright} />
                <Text style={styles.ctxStrong}>
                  {ctx.city}, {ctx.country}
                </Text>
              </View>
              <Text style={styles.ctxLine}>Giờ địa phương: {ctx.localTime}</Text>
              <Text style={styles.ctxLine}>GPS: {ctx.latitude.toFixed(4)}, {ctx.longitude.toFixed(4)}</Text>
              <Text style={styles.ctxLine}>Weather code (mock): {ctx.weatherCode}</Text>
            </>
          ) : (
            <Text style={styles.muted}>Không đọc được ngữ cảnh — bật quyền vị trí.</Text>
          )}
        </View>

        <View style={styles.fxCard} className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}>
          <Text style={styles.fxTitle}>Tỷ giá trực tiếp (minh họa)</Text>
          <Text style={styles.fxPair}>{fx.pairLabel}</Text>
          <Text style={styles.fxRate}>{fx.rateLine}</Text>
          <Text style={styles.fxAsOf}>Cập nhật: {fx.asOf}</Text>
          <Text style={styles.fxLegal}>Chỉ mang tính concierge — không phải niêm yết Forex.</Text>
        </View>

        <View style={styles.passCard} className={applyWebStyles('kn-glass')}>
          <Text style={styles.passTitle}>Traveler Pass (7 ngày)</Text>
          <Text style={styles.passPrice}>{formatCurrency(B2C_TRAVEL_PACKAGE_SUB_USD, PRICING_BASELINE_CURRENCY)}</Text>
          <Text style={styles.passBul}>
            • Minh Khang trong pool Pass (unlimited theo điều khoản sản phẩm){'\n'}• Zero-fee đặt chỗ địa phương (khi bật
            cổng thanh toán){'\n'}• travelPackageSub {formatCurrency(B2C_TRAVEL_PACKAGE_SUB_USD, PRICING_BASELINE_CURRENCY)} / 7 ngày
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Near Me — Hotels &amp; Homestays</Text>
        <View style={styles.filterRow}>
          {(['all', 'hotel', 'homestay'] as const).map((k) => (
            <Pressable
              key={k}
              onPress={() => setStayFilter(k)}
              style={[styles.chip, stayFilter === k && styles.chipOn]}
              className={mergeWebClassNames('kn-glass', stayFilter === k ? 'kn-neon-b2b' : undefined)}
            >
              <Text style={[styles.chipText, stayFilter === k && styles.chipTextOn]}>
                {k === 'all' ? 'Tất cả' : k === 'hotel' ? 'Khách sạn' : 'Homestay'}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.nearRow}>
          <Text style={styles.nearLabel}>Chỉ trong ~700m</Text>
          <Switch value={nearMeOnly} onValueChange={setNearMeOnly} />
        </View>

        {merchants.map((m) => (
          <View key={m.id} style={styles.stayCard} className={applyWebStyles('kn-glass')}>
            <View style={styles.stayTop}>
              <Ionicons name={m.kind === 'hotel' ? 'business-outline' : 'home-outline'} size={22} color={theme.colors.SignatureGold} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stayName}>{m.name}</Text>
                <Text style={styles.stayMeta}>
                  {m.kind === 'hotel' ? 'Hotel' : 'Homestay'} · ~{Math.round(m.distanceM)} m
                </Text>
              </View>
            </View>
          </View>
        ))}
        {ctx && merchants.length === 0 ? (
          <Text style={styles.muted}>Không có chỗ phù hợp bộ lọc — tắt Near Me hoặc đổi loại.</Text>
        ) : null}

        <View style={styles.ctaRow}>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
            onPress={() => navigation.navigate('LiveInterpreter', { scenario: 'travel', guidedEntry: true })}
            className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}
          >
            <Ionicons name="mic" size={22} color={theme.colors.onAccent} />
            <Text style={styles.ctaText}>Minh Khang · Phiên dịch Travel Mode</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.backgroundDeep },
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
  scroll: { padding: 16, paddingBottom: 48, gap: 14 },
  hero: {
    padding: 18,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    gap: 8,
    backgroundColor: 'rgba(12, 24, 44, 0.55)',
  },
  heroKicker: {
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
  },
  heroSub: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  heroVoice: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: theme.colors.success,
  },
  ctxCard: {
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    gap: 6,
  },
  ctxRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctxStrong: { fontSize: 16, fontFamily: FontFamily.bold, color: theme.colors.text.primary, flex: 1 },
  ctxLine: { fontSize: 12, fontFamily: FontFamily.medium, color: theme.colors.text.secondary },
  muted: { fontSize: 13, fontFamily: FontFamily.medium, color: theme.colors.text.tertiary },
  fxCard: {
    padding: 16,
    borderRadius: theme.radius.lg,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: 'rgba(197, 160, 89, 0.08)',
  },
  fxTitle: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
  },
  fxPair: { fontSize: 15, fontFamily: FontFamily.bold, color: theme.colors.text.primary },
  fxRate: { fontSize: 14, fontFamily: FontFamily.semibold, color: theme.colors.success },
  fxAsOf: { fontSize: 11, fontFamily: FontFamily.regular, color: theme.colors.text.tertiary },
  fxLegal: { fontSize: 10, fontFamily: FontFamily.medium, color: theme.colors.text.tertiary, marginTop: 4 },
  passCard: {
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    gap: 8,
  },
  passTitle: { fontSize: 13, fontFamily: FontFamily.bold, color: theme.colors.text.primary },
  passPrice: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
  },
  passBul: { fontSize: 12, fontFamily: FontFamily.regular, color: theme.colors.text.secondary, lineHeight: 18 },
  sectionTitle: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    marginTop: 4,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
  },
  chipOn: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
  },
  chipText: { fontSize: 12, fontFamily: FontFamily.bold, color: theme.colors.text.secondary },
  chipTextOn: { color: theme.colors.primaryBright },
  nearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 4,
  },
  nearLabel: { fontSize: 13, fontFamily: FontFamily.semibold, color: theme.colors.text.primary },
  stayCard: {
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  stayTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stayName: { fontSize: 15, fontFamily: FontFamily.bold, color: theme.colors.text.primary },
  stayMeta: { fontSize: 12, fontFamily: FontFamily.medium, color: theme.colors.text.secondary },
  ctaRow: { marginTop: 8 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.2)',
  },
  ctaText: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.onAccent,
  },
});
