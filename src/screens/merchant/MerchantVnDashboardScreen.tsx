import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppImage } from '../../components/ui/AppImage';
import { OptimizedFlatList } from '../../components/ui/OptimizedFlatList';
import { ScreenSkeleton } from '../../components/ui/ScreenSkeleton';
import { STALE_TIME_MS_PROFILE } from '../../constants/globalPerformance';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/routes';
import { fetchMerchantLedger, type MerchantLedgerItem } from '../../services/viGlobalMerchantLedgerApi';
import { useWalletState } from '../../state/wallet';
import { FontFamily } from '../../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const GOLD = 'rgba(197, 160, 89, 0.98)';
const NAVY_CARD = 'rgba(20, 32, 52, 0.92)';
const TEXT = 'rgba(248, 250, 252, 0.96)';
const MUTED = 'rgba(226, 232, 240, 0.72)';

export function MerchantVnDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const wallet = useWalletState();
  const ledgerQuery = useQuery({
    queryKey: ['merchant', 'ledger'],
    queryFn: async () => {
      const r = await fetchMerchantLedger();
      if (!r?.items) return { items: [] as MerchantLedgerItem[], page: 1, limit: 20 };
      return r;
    },
    staleTime: STALE_TIME_MS_PROFILE,
  });
  const ledger = ledgerQuery.data?.items ?? [];
  const ledgerLoading = ledgerQuery.isPending;

  const qrPayload = useMemo(() => {
    return JSON.stringify({
      v: 1,
      kind: 'viglobal_vn_merchant',
      merchantPhone: user?.phone ?? '',
      merchantId: user?.serverUserId ?? null,
    });
  }, [user?.phone, user?.serverUserId]);

  const qrUri = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrPayload)}`;
  }, [qrPayload]);

  const kycOk = user?.kycVerified === true;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Ionicons name="storefront" size={22} color={GOLD} />
        <Text style={styles.headerTitle}>ViGlobal Merchant</Text>
      </View>

      {!kycOk ? (
        <View style={styles.kycBanner}>
          <Ionicons name="shield-outline" size={20} color="#FFB4B4" />
          <Text style={styles.kycText}>
            KYC required: you cannot receive QR payments until verification is complete (server{' '}
            <Text style={styles.kycMono}>isKYCVerified</Text>).
          </Text>
        </View>
      ) : null}

      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>Spendable VIG</Text>
        <Text style={styles.balanceVal}>{wallet.credits.toFixed(2)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1 · Show my QR to receive payment</Text>
        <Text style={styles.sectionSub}>Tourist app scans this code — platform fee 10–15% (default 12%) to treasury.</Text>
        <View style={styles.qrWrap}>
          <AppImage source={{ uri: qrUri }} style={styles.qrImg} accessibilityLabel="Merchant receive QR" />
        </View>
        <Text style={styles.monoHint} numberOfLines={3}>
          {qrPayload}
        </Text>
        {user?.businessCategory ? (
          <Text style={styles.catPill}>Category: {user.businessCategory}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>2 · Transaction history</Text>
        {ledgerLoading ? (
          <ScreenSkeleton rows={4} style={{ marginVertical: 8 }} />
        ) : (
          <OptimizedFlatList
            data={[...ledger]}
            keyExtractor={(item) => item.id}
            scrollEnabled={ledger.length > 4}
            style={ledger.length > 4 ? styles.ledgerList : undefined}
            ListEmptyComponent={<Text style={styles.empty}>No QR settlements yet.</Text>}
            renderItem={({ item }) => (
              <View style={styles.ledgerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ledgerAmt}>+{item.amountVIG.toFixed(2)} VIG</Text>
                  <Text style={styles.ledgerMeta}>QR settlement · payer {item.senderId.slice(0, 8)}…</Text>
                </View>
                <Text style={styles.ledgerDate}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
            )}
          />
        )}
      </View>

      <Pressable
        onPress={() => navigation.navigate('CashOut')}
        style={({ pressed }) => [styles.cashoutBtn, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
        accessibilityLabel="Cash out to local bank VND"
      >
        <Ionicons name="cash-outline" size={22} color="#0a1628" />
        <Text style={styles.cashoutText}>3 · Cash out to local bank (VND)</Text>
        <Ionicons name="chevron-forward" size={20} color="#0a1628" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#050B14', paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    marginTop: 4,
  },
  headerTitle: { fontSize: 20, fontFamily: FontFamily.extrabold, color: TEXT },
  kycBanner: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(180, 40, 40, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,120,120,0.45)',
    marginBottom: 12,
  },
  kycText: { flex: 1, color: '#FFE4E4', fontSize: 12, fontFamily: FontFamily.medium, lineHeight: 17 },
  kycMono: { fontFamily: FontFamily.bold },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  balanceLabel: { color: MUTED, fontFamily: FontFamily.semibold, fontSize: 13 },
  balanceVal: { color: GOLD, fontFamily: FontFamily.extrabold, fontSize: 22 },
  card: {
    backgroundColor: NAVY_CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: GOLD,
    marginBottom: 6,
  },
  sectionSub: { fontSize: 12, color: MUTED, fontFamily: FontFamily.regular, lineHeight: 17, marginBottom: 12 },
  qrWrap: { alignItems: 'center', marginBottom: 10 },
  qrImg: { width: 220, height: 220, borderRadius: 12, backgroundColor: '#fff' },
  monoHint: {
    fontSize: 10,
    color: MUTED,
    fontFamily: FontFamily.regular,
  },
  catPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(197,160,89,0.15)',
    color: GOLD,
    fontFamily: FontFamily.semibold,
    fontSize: 11,
  },
  ledgerList: { maxHeight: 220 },
  empty: { color: MUTED, fontFamily: FontFamily.regular, paddingVertical: 12 },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  ledgerAmt: { color: TEXT, fontFamily: FontFamily.bold, fontSize: 15 },
  ledgerMeta: { color: MUTED, fontSize: 11, fontFamily: FontFamily.regular, marginTop: 2 },
  ledgerDate: { color: MUTED, fontSize: 10, fontFamily: FontFamily.regular, maxWidth: 100, textAlign: 'right' },
  cashoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: GOLD,
    marginBottom: 24,
  },
  cashoutText: { flex: 1, color: '#0a1628', fontFamily: FontFamily.extrabold, fontSize: 15 },
});
