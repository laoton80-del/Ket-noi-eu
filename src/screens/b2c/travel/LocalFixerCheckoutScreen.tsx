import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../../navigation/routes';
import { calculateSplitPayment } from '../../../services/travel/LocalFixerService';
import { theme } from '../../../theme/theme';
import { FontFamily } from '../../../theme/typography';
import { formatCurrency } from '../../../utils/currencyFormatter';
import { applyWebStyles } from '../../../utils/applyWebStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'LocalFixerCheckout'>;

const EUR = 'EUR' as const;

export function LocalFixerCheckoutScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { fixerDisplayName, hoursBooked, hourlyRateEur } = route.params;

  const baseAmountEur = useMemo(
    () => Math.round(hoursBooked * hourlyRateEur * 100) / 100,
    [hoursBooked, hourlyRateEur]
  );

  const payout = useMemo(() => calculateSplitPayment(baseAmountEur), [baseAmountEur]);

  const breakdown = payout.ok ? payout.breakdown : null;

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0a1628', '#122038', '#1a2848']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.back, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="chevron-back" size={24} color="#F8F4EC" />
          </Pressable>
          <Text style={styles.topTitle}>Thanh toán Thổ Địa</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {!breakdown ? (
            <Text style={styles.error}>Không thể tính toán — số tiền không hợp lệ.</Text>
          ) : (
            <>
              <Text style={styles.subtle}>
                {fixerDisplayName} · {hoursBooked} giờ × {formatCurrency(hourlyRateEur, EUR)}/giờ
              </Text>

              <View style={styles.card} className={applyWebStyles('kn-glass')}>
                <Text style={styles.cardKicker}>Khách hàng</Text>
                <Text style={styles.cardTitle}>Biên lai thanh toán</Text>
                <View style={styles.line} />
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Giá dịch vụ</Text>
                  <Text style={styles.rowValue}>{formatCurrency(breakdown.baseAmountEur, EUR)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Phí nền tảng VIONA ({breakdown.fixerCustomerFeePercent.toFixed(1)}%)</Text>
                  <Text style={styles.rowValue}>{formatCurrency(breakdown.customerFeeEur, EUR)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.netLabel}>Tổng thanh toán</Text>
                  <Text style={styles.netValue}>{formatCurrency(breakdown.totalChargeToCustomerEur, EUR)}</Text>
                </View>
                <Text style={styles.footnote}>
                  Stripe Connect destination charge: khách trả {formatCurrency(breakdown.totalChargeToCustomerEur, EUR)},
                  VIONA giữ application fee {formatCurrency(breakdown.totalPlatformRevenueEur, EUR)} (demo / pilot).
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  navigation.navigate('FixerEarnings', {
                    fixerId: route.params.fixerId,
                    fixerDisplayName,
                    baseAmountEur: breakdown.baseAmountEur,
                  })
                }
                style={({ pressed }) => [styles.fixerCard, pressed && { opacity: 0.92 }]}
                className={applyWebStyles('kn-glass kn-neon-b2b')}
              >
                <Text style={styles.cardKicker}>Fixer Dashboard</Text>
                <Text style={styles.cardTitle}>Xem bảng thực nhận của Thổ Địa</Text>
                <View style={styles.row}>
                  <Text style={styles.rowLabelMuted}>Thực nhận dự kiến</Text>
                  <Text style={styles.netValue}>{formatCurrency(breakdown.netPayoutToFixerEur, EUR)}</Text>
                </View>
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a1628' },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.extrabold,
    fontSize: 17,
    color: '#FAF6EE',
  },
  scroll: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  subtle: {
    fontSize: 13,
    color: 'rgba(248,244,236,0.75)',
    fontFamily: FontFamily.medium,
    marginBottom: theme.spacing.md,
  },
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 213, 163, 0.3)',
    backgroundColor: 'rgba(8, 16, 32, 0.55)',
  },
  fixerCard: { borderColor: 'rgba(232, 213, 163, 0.45)', borderRadius: theme.radius.lg, padding: theme.spacing.md, marginBottom: theme.spacing.lg },
  cardKicker: {
    fontSize: 11,
    letterSpacing: 0.9,
    color: 'rgba(232, 213, 163, 0.9)',
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 18,
    color: '#FFF8E8',
    fontFamily: FontFamily.extrabold,
    marginBottom: 10,
  },
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  rowLabel: { fontSize: 14, color: 'rgba(248,244,236,0.92)', fontFamily: FontFamily.semibold, flex: 1 },
  rowLabelMuted: { fontSize: 13, color: 'rgba(248,244,236,0.6)', fontFamily: FontFamily.regular, flex: 1 },
  rowValue: { fontSize: 15, color: '#FAF6EE', fontFamily: FontFamily.extrabold },
  rowNeg: { fontSize: 15, color: '#FFB4B4', fontFamily: FontFamily.extrabold },
  rowMuted: { fontSize: 13, color: 'rgba(248,244,236,0.55)', fontFamily: FontFamily.medium },
  netLabel: { fontSize: 15, color: '#E8D5A3', fontFamily: FontFamily.extrabold, flex: 1 },
  netValue: { fontSize: 18, color: '#7CFFB2', fontFamily: FontFamily.extrabold },
  footnote: {
    marginTop: 12,
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(248,244,236,0.55)',
    fontFamily: FontFamily.regular,
  },
  error: { color: '#FFB4B4', fontFamily: FontFamily.semibold, fontSize: 14 },
});
