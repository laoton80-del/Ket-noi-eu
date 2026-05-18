import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRICING_AUTHORITY, PRICING_BASELINE_CURRENCY } from '../../config/pricingConfig';
import type { RootStackParamList } from '../../navigation/routes';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { formatCurrency } from '../../utils/currencyFormatter';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type TradeBuyerType = 'Nail Salon' | 'Restaurant';
type TradeListing = Readonly<{
  id: string;
  wholesaleMerchant: string;
  productLabel: string;
  unitLabel: string;
  minOrderUnits: number;
  pricePerUnitMajor: number;
  servedBuyerTypes: readonly TradeBuyerType[];
  stockBadge: 'Sẵn kho' | 'Giao 24h';
}>;

const LISTINGS: readonly TradeListing[] = [
  {
    id: 'wh-lacquer',
    wholesaleMerchant: 'An Đông Wholesale CZ',
    productLabel: 'Gel polish premium set',
    unitLabel: 'set',
    minOrderUnits: 10,
    pricePerUnitMajor: 6.8,
    servedBuyerTypes: ['Nail Salon'],
    stockBadge: 'Sẵn kho',
  },
  {
    id: 'wh-acrylic',
    wholesaleMerchant: 'Saigon Pro Nails Supply',
    productLabel: 'Bột acrylic + liquid combo',
    unitLabel: 'combo',
    minOrderUnits: 12,
    pricePerUnitMajor: 9.6,
    servedBuyerTypes: ['Nail Salon'],
    stockBadge: 'Giao 24h',
  },
  {
    id: 'wh-pho-broth',
    wholesaleMerchant: 'Viet Food Logistics EU',
    productLabel: 'Nước lèo phở cô đặc 5L',
    unitLabel: 'can',
    minOrderUnits: 20,
    pricePerUnitMajor: 12.5,
    servedBuyerTypes: ['Restaurant'],
    stockBadge: 'Sẵn kho',
  },
  {
    id: 'wh-rice-noodle',
    wholesaleMerchant: 'Mekong Wholesale Kitchen',
    productLabel: 'Bánh phở tươi chuẩn nhà hàng',
    unitLabel: 'kg',
    minOrderUnits: 30,
    pricePerUnitMajor: 2.4,
    servedBuyerTypes: ['Restaurant'],
    stockBadge: 'Giao 24h',
  },
];

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

export function InternalTradeMarketScreen() {
  const navigation = useNavigation<Nav>();
  const feePct = PRICING_AUTHORITY.voiceAiTelecom.wholesaleCommissionPercent;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.82 }]}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>B2B Trade Hub</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} className={applyWebStyles('kn-glass')}>
        <View style={styles.heroCard} className={applyWebStyles('kn-glass kn-neon-b2b')}>
          <Text style={styles.heroTitle}>Sàn nội bộ cho Merchant đã xác minh</Text>
          <Text style={styles.heroSub}>
            Nail Salons và Restaurants mua sỉ trực tiếp từ nhà bán buôn trong hệ sinh thái VIONA. Phí giao dịch nội bộ:
            {' '}
            {feePct.toFixed(1)}%.
          </Text>
        </View>

        {LISTINGS.map((item) => {
          const gross = round2(item.pricePerUnitMajor * item.minOrderUnits);
          const fee = round2((gross * feePct) / 100);
          const total = round2(gross + fee);
          return (
            <View key={item.id} style={styles.rowCard} className={applyWebStyles('kn-glass')}>
              <View style={styles.rowTop}>
                <Text style={styles.rowProduct}>{item.productLabel}</Text>
                <View style={styles.stockPill}>
                  <Text style={styles.stockPillText}>{item.stockBadge}</Text>
                </View>
              </View>
              <Text style={styles.rowMerchant}>{item.wholesaleMerchant}</Text>
              <Text style={styles.rowMeta}>
                Khách phù hợp: {item.servedBuyerTypes.join(' / ')} · MOQ {item.minOrderUnits} {item.unitLabel}
              </Text>
              <Text style={styles.rowPrice}>
                {formatCurrency(item.pricePerUnitMajor, PRICING_BASELINE_CURRENCY)} / {item.unitLabel}
              </Text>
              <View style={styles.totalsBlock}>
                <Text style={styles.totalLine}>Tạm tính: {formatCurrency(gross, PRICING_BASELINE_CURRENCY)}</Text>
                <Text style={styles.totalLine}>
                  Phí wholesale B2B ({feePct.toFixed(1)}%): {formatCurrency(fee, PRICING_BASELINE_CURRENCY)}
                </Text>
                <Text style={styles.totalStrong}>Tổng đơn: {formatCurrency(total, PRICING_BASELINE_CURRENCY)}</Text>
              </View>
              <Pressable
                onPress={() =>
                  Alert.alert(
                    'Đặt mua nội bộ',
                    `Đơn demo đã tạo với tổng ${formatCurrency(total, PRICING_BASELINE_CURRENCY)}. Đơn sẽ đi vào mục "Orders".`
                  )
                }
                style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
                className={applyWebStyles('kn-neon-b2b')}
              >
                <Text style={styles.ctaText}>Đặt mua ngay</Text>
                <Ionicons name="cart" size={18} color={theme.hybrid.onSignal} />
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 6 },
  backBtn: { padding: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: FontFamily.bold, color: theme.colors.text.primary },
  spacer: { width: 40 },
  scroll: { padding: 16, paddingBottom: 36, gap: 12 },
  heroCard: {
    borderRadius: theme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.45)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 8,
  },
  heroTitle: { fontSize: 18, fontFamily: FontFamily.extrabold, color: theme.colors.primaryBright, marginBottom: 6 },
  heroSub: { fontSize: 13, lineHeight: 19, fontFamily: FontFamily.regular, color: theme.colors.text.secondary },
  rowCard: {
    borderRadius: theme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.35)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowProduct: { flex: 1, fontSize: 16, fontFamily: FontFamily.bold, color: theme.colors.text.primary },
  stockPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.radius.pill, backgroundColor: theme.hybrid.signalMutedBg },
  stockPillText: { fontSize: 11, fontFamily: FontFamily.bold, color: theme.hybrid.signalStrong },
  rowMerchant: { fontSize: 13, fontFamily: FontFamily.semibold, color: theme.colors.primaryBright },
  rowMeta: { fontSize: 12, lineHeight: 17, fontFamily: FontFamily.regular, color: theme.colors.text.secondary },
  rowPrice: { fontSize: 14, fontFamily: FontFamily.extrabold, color: theme.colors.text.primary, marginTop: 2 },
  totalsBlock: { marginTop: 6, gap: 3 },
  totalLine: { fontSize: 12, fontFamily: FontFamily.medium, color: theme.colors.text.secondary },
  totalStrong: { fontSize: 13, fontFamily: FontFamily.extrabold, color: theme.colors.primaryBright },
  cta: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: theme.hybrid.signalStrong,
  },
  ctaText: { fontSize: 13, fontFamily: FontFamily.extrabold, color: theme.hybrid.onSignal },
});
