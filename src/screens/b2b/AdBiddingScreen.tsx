import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRICING_BASELINE_CURRENCY } from '../../config/pricingConfig';
import type { RootStackParamList } from '../../navigation/routes';
import { getMerchantWalletMajor, upsertMerchantAdBid } from '../../services/b2b/AdBiddingService';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { formatCurrency } from '../../utils/currencyFormatter';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEMO_MERCHANT_ID = 'm-rest-01';

export function AdBiddingScreen() {
  const navigation = useNavigation<Nav>();
  const [dailyBudgetMajor, setDailyBudgetMajor] = useState(5);
  const [bidMajor, setBidMajor] = useState(1.5);
  const walletBalanceMajor = useMemo(() => getMerchantWalletMajor(DEMO_MERCHANT_ID), [dailyBudgetMajor, bidMajor]);

  const onActivate = () => {
    const res = upsertMerchantAdBid({
      merchantId: DEMO_MERCHANT_ID,
      dailyBudgetMajor,
      bidPerPriorityImpressionMajor: bidMajor,
    });
    if (!res.ok) {
      Alert.alert('Không thể kích hoạt', res.messageVi);
      return;
    }
    Alert.alert(
      'Chiến dịch đã bật',
      `Bid ${formatCurrency(res.row.bidPerPriorityImpressionMajor, PRICING_BASELINE_CURRENCY)} / lượt ưu tiên.\nTrừ ví: ${formatCurrency(res.row.dailyBudgetMajor, PRICING_BASELINE_CURRENCY)}.\nSố dư mới: ${formatCurrency(res.row.walletBalanceMajorAfter, PRICING_BASELINE_CURRENCY)}.`
    );
    setDailyBudgetMajor((v) => v);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.82 }]}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Ad Bidding</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} className={applyWebStyles('kn-glass')}>
        <View style={styles.walletCard} className={applyWebStyles('kn-glass kn-neon-b2b')}>
          <Text style={styles.walletTitle}>Ví Stripe B2B</Text>
          <Text style={styles.walletBalance}>{formatCurrency(walletBalanceMajor, PRICING_BASELINE_CURRENCY)}</Text>
          <Text style={styles.walletHint}>Ngân sách quảng cáo theo ngày sẽ bị trừ trực tiếp từ ví này.</Text>
        </View>

        <View style={styles.panel} className={applyWebStyles('kn-glass')}>
          <Text style={styles.panelTitle}>Ngân sách ngày</Text>
          <Text style={styles.value}>{formatCurrency(dailyBudgetMajor, PRICING_BASELINE_CURRENCY)} / ngày</Text>
          <Slider
            minimumValue={1}
            maximumValue={50}
            step={0.5}
            value={dailyBudgetMajor}
            onValueChange={setDailyBudgetMajor}
            minimumTrackTintColor={theme.colors.primaryBright}
            maximumTrackTintColor={theme.colors.glass.borderSoft}
            thumbTintColor={theme.colors.SignatureGold}
          />
        </View>

        <View style={styles.panel} className={applyWebStyles('kn-glass')}>
          <Text style={styles.panelTitle}>Giá bid ưu tiên</Text>
          <Text style={styles.value}>{formatCurrency(bidMajor, PRICING_BASELINE_CURRENCY)} / lượt hiển thị ưu tiên</Text>
          <Slider
            minimumValue={0.5}
            maximumValue={5}
            step={0.05}
            value={bidMajor}
            onValueChange={setBidMajor}
            minimumTrackTintColor={theme.hybrid.signalStrong}
            maximumTrackTintColor={theme.colors.glass.borderSoft}
            thumbTintColor={theme.colors.primaryBright}
          />
          <Text style={styles.panelHint}>
            Feed B2C VIONA Local ưu tiên xếp hạng merchant theo bid đang active, sau đó mới tới quality score.
          </Text>
        </View>

        <Pressable
          onPress={onActivate}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
          className={applyWebStyles('kn-neon-b2b')}
        >
          <Ionicons name="trending-up" size={22} color={theme.hybrid.onSignal} />
          <Text style={styles.ctaText}>Kích hoạt chiến dịch</Text>
        </Pressable>
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
  walletCard: {
    borderRadius: theme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.45)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  walletTitle: { fontSize: 13, fontFamily: FontFamily.semibold, color: theme.colors.text.secondary },
  walletBalance: { fontSize: 28, fontFamily: FontFamily.extrabold, color: theme.colors.primaryBright, marginTop: 2 },
  walletHint: { fontSize: 12, lineHeight: 17, fontFamily: FontFamily.regular, color: theme.colors.text.secondary, marginTop: 6 },
  panel: {
    borderRadius: theme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  panelTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: theme.colors.text.primary, marginBottom: 6 },
  value: { fontSize: 16, fontFamily: FontFamily.extrabold, color: theme.colors.primaryBright, marginBottom: 8 },
  panelHint: { marginTop: 8, fontSize: 12, lineHeight: 17, fontFamily: FontFamily.regular, color: theme.colors.text.secondary },
  cta: {
    marginTop: 6,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.hybrid.signalStrong,
  },
  ctaText: { fontSize: 15, fontFamily: FontFamily.extrabold, color: theme.hybrid.onSignal },
});
