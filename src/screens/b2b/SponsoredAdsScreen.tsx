import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
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
const SLIDER_MIN_MAJOR = 1;
const SLIDER_MAX_MAJOR = 25;
const ESTIMATED_REACH_B2C_PER_DAY = 500;

export function SponsoredAdsScreen() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const isDesktop = width > DESKTOP_BREAKPOINT;
  const isDesktopWeb = Platform.OS === 'web' && isDesktop;

  const defaultPerDay = PRICING_AUTHORITY.overageAndPlatformFees.sponsoredListingPerDayMajor;
  const [dailyBudgetMajor, setDailyBudgetMajor] = useState(defaultPerDay);

  const ctaLabel = useMemo(
    () => `KÍCH HOẠT TOP 1 NGAY (-${formatCurrency(dailyBudgetMajor, PRICING_BASELINE_CURRENCY)}/Ngày)`,
    [dailyBudgetMajor]
  );

  const onActivate = () => {
    Alert.alert(
      'Kích hoạt TOP 1',
      `Xác nhận đấu thầu vị trí với ngân sách ${formatCurrency(dailyBudgetMajor, PRICING_BASELINE_CURRENCY)}/ngày? Thanh toán qua cổng doanh nghiệp sẽ được bật khi production sẵn sàng.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xác nhận (demo)', onPress: () => undefined },
      ]
    );
  };

  return (
    <View style={[styles.shell, { backgroundColor: theme.colors.background }]} className={applyWebStyles('kn-glass')}>
      <SafeAreaView
        style={[styles.safe, Platform.OS === 'web' && styles.safeWeb, isDesktopWeb && styles.safeDesktop]}
        edges={['top', 'left', 'right']}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.75 }]}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.text.primary} />
          </Pressable>
          <Text style={styles.screenTitle}>TOP 1</Text>
          <View style={styles.backSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headline}>Chiến Dịch Quảng Cáo TOP 1 (Sponsored Listings)</Text>
          <Text style={styles.subline}>Đấu thầu vị trí — thanh toán theo ngày, minh bạch theo PRICING_AUTHORITY.</Text>

          <View style={[styles.panelRow, isDesktop && styles.panelRowDesktop]}>
            <View style={[styles.fomoPanel, isDesktop && styles.panelHalf]} className={applyWebStyles('kn-glass')}>
              <View style={styles.fomoHeader}>
                <Ionicons name="warning" size={22} color={theme.colors.RouteError} />
                <Text style={styles.fomoTitle}>Trạng thái đấu thầu</Text>
              </View>
              <View className={applyWebStyles('kn-neon-sos')} style={styles.fomoUrgencyWrap}>
                <Text style={styles.fomoUrgencyText}>
                  Vị trí hiện tại của tiệm: #15. Có 3 đối thủ đang chạy quảng cáo trong khu vực của bạn!
                </Text>
              </View>
              <Text style={styles.fomoFoot}>Dữ liệu minh họa — bảng xếp hạng thời gian thực sẽ đồng bộ Radar / Search B2C.</Text>
            </View>

            <View style={[styles.controlPanel, isDesktop && styles.panelHalf]} className={applyWebStyles('kn-glass')}>
              <Text style={styles.controlTitle}>Bảng điều khiển</Text>
              <Text style={styles.controlLabel}>Ngân sách mỗi ngày ({PRICING_BASELINE_CURRENCY})</Text>
              <Text style={styles.budgetValue}>{formatCurrency(dailyBudgetMajor, PRICING_BASELINE_CURRENCY)}</Text>
              <Slider
                style={styles.slider}
                minimumValue={SLIDER_MIN_MAJOR}
                maximumValue={SLIDER_MAX_MAJOR}
                step={0.5}
                value={dailyBudgetMajor}
                onValueChange={setDailyBudgetMajor}
                minimumTrackTintColor={theme.colors.primaryBright}
                maximumTrackTintColor={theme.colors.glass.borderSoft}
                thumbTintColor={theme.colors.SignatureGold}
              />
              <Text style={styles.sliderHint}>
                Mặc định neo: {formatCurrency(defaultPerDay, PRICING_BASELINE_CURRENCY)}/ngày (sponsoredListingPerDayMajor).
              </Text>

              <View style={styles.reachCard}>
                <Ionicons name="people-outline" size={20} color={theme.hybrid.signalStrong} />
                <Text style={styles.reachTitle}>Ước tính tiếp cận</Text>
                <Text style={styles.reachBody}>Tiếp cận ~{ESTIMATED_REACH_B2C_PER_DAY} khách hàng B2C mỗi ngày</Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={onActivate}
            style={({ pressed }) => [styles.ctaMassive, pressed && { opacity: 0.92 }]}
            className={applyWebStyles('kn-neon-b2b')}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
          >
            <Ionicons name="trophy" size={26} color={theme.hybrid.onSignal} />
            <Text style={styles.ctaMassiveText}>{ctaLabel}</Text>
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
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: theme.spacing.xxl,
  },
  headline: {
    ...theme.typeScale.h1,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  subline: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 18,
  },
  panelRow: {
    gap: theme.spacing.lg,
  },
  panelRowDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  panelHalf: {
    flex: 1,
    minWidth: 0,
  },
  fomoPanel: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.surfaceElevated,
    gap: theme.spacing.md,
  },
  fomoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  fomoTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  fomoUrgencyWrap: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(229, 115, 115, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 115, 115, 0.45)',
  },
  fomoUrgencyText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.RouteError,
    textAlign: 'center',
  },
  fomoFoot: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.tertiary,
    lineHeight: 17,
  },
  controlPanel: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    gap: theme.spacing.sm,
  },
  controlTitle: {
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
    marginBottom: theme.spacing.xs,
  },
  controlLabel: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
  },
  budgetValue: {
    fontSize: 28,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  slider: {
    width: '100%',
    height: 44,
    marginTop: theme.spacing.xs,
  },
  sliderHint: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.tertiary,
    lineHeight: 17,
    marginTop: theme.spacing.xs,
  },
  reachCard: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.hybrid.signalMutedBg,
    gap: 6,
  },
  reachTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  reachBody: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
    lineHeight: 19,
  },
  ctaMassive: {
    marginTop: theme.spacing.xl,
    minHeight: 64,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.hybrid.signalStrong,
    borderWidth: 2,
    borderColor: theme.colors.primaryBright,
  },
  ctaMassiveText: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: theme.hybrid.onSignal,
    textAlign: 'center',
    flexShrink: 1,
    letterSpacing: 0.3,
  },
});
