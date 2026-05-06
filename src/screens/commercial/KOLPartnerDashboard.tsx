import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRICING_AUTHORITY, PRICING_BASELINE_CURRENCY } from '../../config/pricingConfig';
import type { RootStackParamList } from '../../navigation/routes';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { formatCurrency } from '../../utils/currencyFormatter';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DESKTOP_BREAKPOINT = 768;

/** Demo cohort — replace with API / ledger. */
const MOCK_B2C_USERS_INVITED = 1450;
const MOCK_B2B_MERCHANTS_INVITED = 23;
const MOCK_TOTAL_REVENUE_GENERATED_MAJOR_USD = 15000;

const VIP_TRACKING_DISPLAY = 'ketnoiglobal.com/vip/HoiNguoiVietBerlin';
const VIP_TRACKING_COPY_URL = `https://${VIP_TRACKING_DISPLAY}`;

function formatInt(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtLedgerInt(n: number): string {
  return formatCurrency(n, PRICING_BASELINE_CURRENCY, { maximumFractionDigits: 0 });
}

export function KOLPartnerDashboard() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const isDesktop = width > DESKTOP_BREAKPOINT;
  const isDesktopWeb = Platform.OS === 'web' && isDesktop;

  const directRate = PRICING_AUTHORITY.commissionRates.directReferral;
  const directPercentLabel = Math.round(directRate * 100);
  const passiveCommissionMajor = useMemo(
    () => MOCK_TOTAL_REVENUE_GENERATED_MAJOR_USD * directRate,
    [directRate]
  );

  const onCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(VIP_TRACKING_COPY_URL);
      Alert.alert('Đã sao chép', 'Liên kết VIP đã được copy vào clipboard.');
    } catch {
      Alert.alert('Lỗi', 'Không thể sao chép. Hãy thử lại.');
    }
  };

  const onCashOut = () => {
    Alert.alert(
      'Yêu cầu rút tiền',
      `Yêu cầu rút ${fmtLedgerInt(passiveCommissionMajor)} (demo). API payout & KYC sẽ được bật khi production.`,
      [{ text: 'Đóng' }]
    );
  };

  return (
    <View
      style={[styles.shell, { backgroundColor: theme.colors.background }]}
      className={applyWebStyles('kn-glass kn-neon-b2b')}
    >
      <SafeAreaView
        style={[styles.safe, Platform.OS === 'web' && styles.safeWeb, isDesktopWeb && styles.safeDesktop]}
        edges={['top', 'left', 'right']}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.75 }]}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.text.primary} />
          </Pressable>
          <Text style={styles.screenTitle}>VIP Partner</Text>
          <View style={styles.backSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headline}>Cổng Đối Tác VIP (KOL & Affiliate Hub)</Text>
          <Text style={styles.subline}>Đội quân đánh thuê — theo dõi hoa hồng thụ động trọn đời theo PRICING_AUTHORITY.</Text>

          <View style={[styles.linkCard, isDesktop && styles.linkCardDesktop]} className={applyWebStyles('kn-glass')}>
            <Text style={styles.linkLabel}>Magic Link (VIP tracking)</Text>
            <Text style={styles.linkUrl} selectable>
              {VIP_TRACKING_DISPLAY}
            </Text>
            <Pressable
              onPress={() => void onCopyLink()}
              style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.88 }]}
              className={applyWebStyles('kn-neon-b2b')}
              accessibilityRole="button"
              accessibilityLabel="Sao chép liên kết VIP"
            >
              <Ionicons name="copy-outline" size={18} color={theme.hybrid.onSignal} />
              <Text style={styles.copyBtnText}>Copy</Text>
            </Pressable>
          </View>

          <View style={[styles.metricsRow, isDesktop && styles.metricsRowDesktop]}>
            <View style={[styles.metricCard, isDesktop && styles.metricCardDesktop]} className={applyWebStyles('kn-glass')}>
              <Ionicons name="people-outline" size={22} color={theme.colors.primaryBright} />
              <Text style={styles.metricLabel}>Tổng User B2C Đã Mời</Text>
              <Text style={styles.metricValue}>{formatInt(MOCK_B2C_USERS_INVITED)}</Text>
            </View>
            <View style={[styles.metricCard, isDesktop && styles.metricCardDesktop]} className={applyWebStyles('kn-glass')}>
              <Ionicons name="business-outline" size={22} color={theme.colors.primaryBright} />
              <Text style={styles.metricLabel}>Tổng Doanh Nghiệp B2B Đã Mời</Text>
              <Text style={styles.metricValue}>{formatInt(MOCK_B2B_MERCHANTS_INVITED)}</Text>
            </View>
            <View style={[styles.metricCard, isDesktop && styles.metricCardDesktop]} className={applyWebStyles('kn-glass')}>
              <Ionicons name="stats-chart-outline" size={22} color={theme.colors.primaryBright} />
              <Text style={styles.metricLabel}>Tổng Doanh Thu Tạo Ra</Text>
              <Text style={styles.metricValue}>{fmtLedgerInt(MOCK_TOTAL_REVENUE_GENERATED_MAJOR_USD)}</Text>
            </View>
          </View>

          <View style={styles.moneyPanel} className={applyWebStyles('kn-glass kn-neon-b2b')}>
            <View style={styles.moneyPanelHeader}>
              <Ionicons name="wallet-outline" size={24} color={theme.colors.primaryBright} />
              <Text style={styles.moneyPanelTitle}>
                Hoa Hồng Thụ Động Của Bạn ({directPercentLabel}%)
              </Text>
            </View>
            <Text style={styles.moneyPanelFormula}>
              {fmtLedgerInt(MOCK_TOTAL_REVENUE_GENERATED_MAJOR_USD)} × {directPercentLabel}% (directReferral)
            </Text>
            <Text style={styles.moneyPanelAmount}>{fmtLedgerInt(passiveCommissionMajor)}</Text>
            <Text style={styles.moneyPanelFoot}>Neo từ PRICING_AUTHORITY.commissionRates.directReferral — settlement theo kỳ.</Text>
          </View>

          <Pressable
            onPress={onCashOut}
            style={({ pressed }) => [styles.cashOutBtn, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityLabel="Yêu cầu rút tiền"
          >
            <Ionicons name="cash-outline" size={22} color={theme.colors.DeepInkNavy} />
            <Text style={styles.cashOutBtnText}>YÊU CẦU RÚT TIỀN (CASH OUT)</Text>
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
  safeWeb: { backgroundColor: 'transparent' },
  safeDesktop: { alignSelf: 'stretch' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glass.borderSoft,
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
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl * 2,
  },
  scrollDesktop: {
    maxWidth: 1040,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: theme.spacing.xxl,
  },
  headline: {
    ...theme.typeScale.h1,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subline: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 18,
    paddingHorizontal: theme.spacing.sm,
  },
  linkCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.surfaceElevated,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  linkCardDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  linkLabel: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.tertiary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  linkUrl: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: theme.colors.primaryBright,
    flex: 1,
    minWidth: 200,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.hybrid.signalStrong,
    borderWidth: 1,
    borderColor: theme.colors.primaryBright,
  },
  copyBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.hybrid.onSignal,
  },
  metricsRow: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  metricsRowDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  metricCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    gap: theme.spacing.sm,
  },
  metricCardDesktop: {
    flex: 1,
    minWidth: 0,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
    lineHeight: 17,
  },
  metricValue: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
  },
  moneyPanel: {
    padding: theme.spacing.xl,
    borderRadius: theme.radius.xl,
    borderWidth: 1.5,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.surfaceMuted,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  moneyPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  moneyPanelTitle: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
    flex: 1,
  },
  moneyPanelFormula: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
  moneyPanelAmount: {
    fontSize: 32,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
  },
  moneyPanelFoot: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.tertiary,
    lineHeight: 16,
    marginTop: theme.spacing.xs,
  },
  cashOutBtn: {
    minHeight: 56,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.primaryBright,
    borderWidth: 2,
    borderColor: theme.colors.SignatureGold,
  },
  cashOutBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.DeepInkNavy,
    letterSpacing: 0.4,
  },
});
