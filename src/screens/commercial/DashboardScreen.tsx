import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRICING_AUTHORITY, PRICING_BASELINE_CURRENCY } from '../../config/pricingConfig';
import type { RootStackParamList } from '../../navigation/routes';
import { calculateDailyTips, type TipSplitMethod } from '../../services/b2b/PayrollService';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { formatCurrency } from '../../utils/currencyFormatter';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MONTHLY_INTERMEDIARY_LEADS = 40;
const DEMO_MERCHANT_ID = 'merchant-lotus';

const FLASH_BROADCAST_FEE_MAJOR = PRICING_AUTHORITY.overageAndPlatformFees.flashSaleBroadcastMajor;
const FLASH_BROADCAST_LABEL = formatCurrency(FLASH_BROADCAST_FEE_MAJOR, PRICING_BASELINE_CURRENCY);

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width > 768;
  const [tipSplitMethod, setTipSplitMethod] = useState<TipSplitMethod>('EQUAL');

  const onFlashSale = () => {
    Alert.alert(
      'Phát sóng Flash Sale',
      `Xác nhận phát sóng push đến 500+ khách trong bán kính 5km?\n\nPhí: ${FLASH_BROADCAST_LABEL} / lần phát sóng. Thanh toán sẽ được xử lý qua cổng doanh nghiệp (Stripe) khi tích hợp hoàn tất.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tiếp tục',
          onPress: () => {
            Alert.alert(
              'Đang hoàn thiện',
                `Đội kỹ thuật sẽ kích hoạt thanh toán ${FLASH_BROADCAST_LABEL} và lịch phát sóng trên môi trường production. Bạn có thể liên hệ VIONA để ưu tiên onboarding.`
            );
          },
        },
      ]
    );
  };

  const estimatedClosedReferrals = Math.round(MONTHLY_INTERMEDIARY_LEADS * PRICING_AUTHORITY.commissionRates.directReferral);
  const projectedIntermediaryCommissionMajor =
    estimatedClosedReferrals * PRICING_AUTHORITY.tiers.Pro.displayPriceMajor * PRICING_AUTHORITY.commissionRates.intermediary;
  const platformShareMajor = projectedIntermediaryCommissionMajor * PRICING_AUTHORITY.passiveIncomeSplit.platform;
  const tipLedger = useMemo(
    () => calculateDailyTips(DEMO_MERCHANT_ID, tipSplitMethod),
    [tipSplitMethod]
  );

  return (
    <View
      style={[styles.shell, { backgroundColor: theme.colors.background }]}
      className={applyWebStyles('kn-glass kn-neon-b2b')}
    >
      <SafeAreaView style={[styles.safe, Platform.OS === 'web' && styles.safeWeb, isDesktopWeb && styles.safeDesktop]} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.75 }]}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.screenTitle}>Merchant</Text>
        <View style={styles.backSpacer} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, isDesktopWeb && styles.scrollDesktop]} showsVerticalScrollIndicator={false}>
        <Text style={styles.hero}>Bảng điều khiển</Text>
        <Text style={styles.heroSub}>Công cụ tăng trưởng doanh thu cho đối tác B2B — bắt đầu từ Flash Sale địa phương.</Text>

        <Pressable
          onPress={() => navigation.navigate('WalletB2B')}
          style={({ pressed }) => [styles.qrMarketingRow, pressed && { opacity: 0.9 }]}
          className={applyWebStyles('kn-glass kn-neon-b2b')}
          accessibilityRole="button"
          accessibilityLabel="Ví B2B và cước Lễ tân AI"
        >
          <View style={styles.qrMarketingIcon}>
            <Ionicons name="wallet-outline" size={26} color={theme.colors.primaryBright} />
          </View>
          <View style={styles.qrMarketingBody}>
            <Text style={styles.qrMarketingTitle}>Ví B2B &amp; Lễ tân AI (Voice)</Text>
            <Text style={styles.qrMarketingHint}>Theo dõi phút gọi AI, bản ghi và phí vượt gói — khách B2C gọi miễn phí.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Orders')}
          style={({ pressed }) => [styles.qrMarketingRow, pressed && { opacity: 0.9 }]}
          className={applyWebStyles('kn-glass kn-neon-b2b')}
          accessibilityRole="button"
          accessibilityLabel="Đơn mua sỉ và đơn AI"
        >
          <View style={styles.qrMarketingIcon}>
            <Ionicons name="cube-outline" size={26} color={theme.colors.primaryBright} />
          </View>
          <View style={styles.qrMarketingBody}>
            <Text style={styles.qrMarketingTitle}>Đơn mua sỉ (Voice AI)</Text>
            <Text style={styles.qrMarketingHint}>Đơn chốt tự động qua Lễ tân AI — cờ ngôn ngữ &amp; trạng thái.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('InternalTradeMarket')}
          style={({ pressed }) => [styles.qrMarketingRow, pressed && { opacity: 0.9 }]}
          className={applyWebStyles('kn-glass kn-neon-b2b')}
          accessibilityRole="button"
          accessibilityLabel="Sàn giao dịch nội bộ B2B"
        >
          <View style={styles.qrMarketingIcon}>
            <Ionicons name="swap-horizontal" size={26} color={theme.colors.primaryBright} />
          </View>
          <View style={styles.qrMarketingBody}>
            <Text style={styles.qrMarketingTitle}>Internal Trade Hub</Text>
            <Text style={styles.qrMarketingHint}>
              Tiệm nails/nhà hàng đặt hàng trực tiếp từ merchant wholesale với phí {PRICING_AUTHORITY.voiceAiTelecom.wholesaleCommissionPercent.toFixed(1)}%.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('PromoTools')}
          style={({ pressed }) => [styles.qrMarketingRow, pressed && { opacity: 0.9 }]}
          className={applyWebStyles('kn-glass kn-neon-b2b')}
          accessibilityRole="button"
          accessibilityLabel="Công cụ QR và Marketing"
        >
          <View style={styles.qrMarketingIcon}>
            <Ionicons name="qr-code-outline" size={26} color={theme.colors.primaryBright} />
          </View>
          <View style={styles.qrMarketingBody}>
            <Text style={styles.qrMarketingTitle}>Công Cụ QR & Marketing</Text>
            <Text style={styles.qrMarketingHint}>Tạo mã QR in tại tiệm — khách quét tải App, nhận Xu, bạn được ưu tiên hiển thị.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('AdBidding')}
          style={({ pressed }) => [styles.sponsoredTopRow, pressed && { opacity: 0.9 }]}
          className={applyWebStyles('kn-glass kn-neon-b2b')}
          accessibilityRole="button"
          accessibilityLabel="Đẩy top một tìm kiếm"
        >
          <View style={styles.sponsoredTopIcon}>
            <Ionicons name="trending-up" size={26} color={theme.colors.primaryBright} />
          </View>
          <View style={styles.sponsoredTopBody}>
            <Text style={styles.sponsoredTopTitle}>In-App Ad Bidding</Text>
            <Text style={styles.sponsoredTopHint}>Đặt ngân sách ngày + bid/impression. Trừ trực tiếp ví Stripe Wallet B2B.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </Pressable>

        <View style={[styles.dashboardGrid, isDesktopWeb && styles.dashboardGridDesktop]}>
          <Pressable
            onPress={onFlashSale}
            style={({ pressed }) => [
              styles.actionCard,
              styles.flashSaleCard,
              isDesktopWeb && styles.actionCardDesktop,
              pressed && { opacity: 0.9 },
            ]}
            className={applyWebStyles('kn-glass kn-neon-b2b')}
            accessibilityRole="button"
            accessibilityLabel="Phát sóng Flash Sale"
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="flash-outline" size={26} color={theme.hybrid.signalStrong} />
            </View>
            <View style={styles.actionBody}>
              <View style={styles.flashSaleTitleRow}>
                <Text style={styles.actionTitle}>Phát sóng Flash Sale</Text>
                <View style={styles.flashFeePill}>
                  <Text style={styles.flashFeePillText}>{FLASH_BROADCAST_LABEL}</Text>
                </View>
              </View>
              <Text style={styles.actionDetail}>
                Tiệm đang vắng? Bắn thông báo đến 500+ khách hàng quanh bán kính 5km. Phí: {FLASH_BROADCAST_LABEL} / lần phát sóng.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
          </Pressable>

          <View
            style={[styles.earningsCard, isDesktopWeb && styles.hintCardDesktop]}
            className={applyWebStyles('kn-glass kn-neon-b2b')}
          >
            <View style={styles.earningsHeader}>
              <Ionicons name="cash-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.earningsTitle}>Passive Income & Commission Earnings</Text>
            </View>
            <Text style={styles.earningsText}>Referral funnel (mock): {MONTHLY_INTERMEDIARY_LEADS} leads / month</Text>
            <Text style={styles.earningsText}>
              Intermediary commission ({Math.round(PRICING_AUTHORITY.commissionRates.intermediary * 100)}% of PRO):
              {' '}
              {formatCurrency(projectedIntermediaryCommissionMajor, PRICING_BASELINE_CURRENCY)}
            </Text>
            <Text style={styles.earningsText}>
              Platform retained share (30%): {formatCurrency(platformShareMajor, PRICING_BASELINE_CURRENCY)}
            </Text>
            <Text style={styles.earningsFootnote}>
              Baseline uses PRO tier ({formatCurrency(PRICING_AUTHORITY.tiers.Pro.displayPriceMajor, PRICING_BASELINE_CURRENCY)}) and direct-referral conversion (
              {Math.round(PRICING_AUTHORITY.commissionRates.directReferral * 100)}%).
            </Text>
          </View>
        </View>

        <View style={styles.earningsCard} className={applyWebStyles('kn-glass kn-neon-b2b')}>
          <View style={styles.earningsHeader}>
            <Ionicons name="people-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.earningsTitle}>Sổ Chấm Công & Tiền Tip</Text>
          </View>
          <View style={styles.tipMethodRow}>
            <Pressable
              onPress={() => setTipSplitMethod('EQUAL')}
              style={[styles.tipMethodChip, tipSplitMethod === 'EQUAL' && styles.tipMethodChipActive]}
            >
              <Text style={[styles.tipMethodChipText, tipSplitMethod === 'EQUAL' && styles.tipMethodChipTextActive]}>EQUAL</Text>
            </Pressable>
            <Pressable
              onPress={() => setTipSplitMethod('PERCENTAGE')}
              style={[styles.tipMethodChip, tipSplitMethod === 'PERCENTAGE' && styles.tipMethodChipActive]}
            >
              <Text style={[styles.tipMethodChipText, tipSplitMethod === 'PERCENTAGE' && styles.tipMethodChipTextActive]}>PERCENTAGE</Text>
            </Pressable>
          </View>
          <Text style={styles.earningsText}>
            Tổng tip hôm nay: {formatCurrency(tipLedger.totalTipsMajor, PRICING_BASELINE_CURRENCY)} · Merchant: {tipLedger.merchantId}
          </Text>
          {tipLedger.rows.map((row) => (
            <View key={row.staffId} style={styles.tipLedgerRow}>
              <Text style={styles.tipLedgerName}>{row.displayName}</Text>
              <Text style={styles.tipLedgerAmount}>{formatCurrency(row.allocatedTipMajor, PRICING_BASELINE_CURRENCY)}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => navigation.navigate('KOLPartnerDashboard')}
          style={({ pressed }) => [styles.kolVipEntry, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Quản lý đối tác KOL"
        >
          <Ionicons name="diamond-outline" size={16} color={theme.colors.text.tertiary} />
          <Text style={styles.kolVipEntryText}>Quản Lý Đối Tác KOL</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
        </Pressable>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeWeb: {
    backgroundColor: 'transparent',
  },
  safeDesktop: {
    alignSelf: 'stretch',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: { width: 40 },
  screenTitle: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  scroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 3,
  },
  scrollDesktop: {
    paddingHorizontal: theme.spacing.xxl,
  },
  dashboardGrid: {
    gap: theme.spacing.lg,
  },
  dashboardGridDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  hero: {
    ...theme.typeScale.h1,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  heroSub: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: theme.typeScale.body.lineHeight * 1.15,
  },
  qrMarketingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: theme.colors.surfaceMuted,
  },
  qrMarketingIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.hybrid.signalMutedBg,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
  },
  qrMarketingBody: {
    flex: 1,
    gap: 4,
  },
  qrMarketingTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  qrMarketingHint: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  sponsoredTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primaryBright,
    backgroundColor: theme.colors.surfaceMuted,
  },
  sponsoredTopIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(197, 160, 89, 0.2)',
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
  },
  sponsoredTopBody: {
    flex: 1,
    gap: 4,
  },
  sponsoredTopTitle: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
  },
  sponsoredTopHint: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  kolVipEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignSelf: 'center',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.22)',
    backgroundColor: 'rgba(15, 34, 56, 0.35)',
  },
  kolVipEntryText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.tertiary,
    letterSpacing: 0.3,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: theme.colors.surfaceMuted,
  },
  flashSaleCard: {
    borderColor: theme.hybrid.signalStrong,
    borderWidth: 2,
    shadowColor: theme.hybrid.signalStrong,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  flashSaleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  flashFeePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.hybrid.signalMutedBg,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
  },
  flashFeePillText: {
    fontSize: 12,
    fontFamily: FontFamily.extrabold,
    color: theme.hybrid.signalStrong,
  },
  actionCardDesktop: {
    flex: 1.3,
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.hybrid.signalMutedBg,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
  },
  actionBody: {
    flex: 1,
    gap: 6,
  },
  actionTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  actionDetail: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
  },
  earningsCard: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: 4,
  },
  earningsTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  earningsText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
  earningsFootnote: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.tertiary,
  },
  hintCardDesktop: {
    flex: 1,
    marginTop: 0,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  tipMethodRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 6,
  },
  tipMethodChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.surfaceMuted,
  },
  tipMethodChipActive: {
    borderColor: theme.hybrid.signalStrong,
    backgroundColor: theme.hybrid.signalMutedBg,
  },
  tipMethodChipText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
  },
  tipMethodChipTextActive: {
    color: theme.hybrid.signalStrong,
    fontFamily: FontFamily.extrabold,
  },
  tipLedgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  tipLedgerName: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
  tipLedgerAmount: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
  },
});
