import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VoiceAiReceptionistMerchantPanel } from '../../components/b2b/VoiceAiReceptionistMerchantPanel';
import { useAuth } from '../../context/AuthContext';
import { IndustryType, type IndustryTypeId } from '../../config/b2bIndustryType';
import { PRICING_AUTHORITY, PRICING_BASELINE_CURRENCY, type PackageName } from '../../config/pricingConfig';
import type { RootStackParamList } from '../../navigation/routes';
import { useB2bVoiceMerchantBillingStore } from '../../state/b2bVoiceMerchantBilling';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { formatCurrency } from '../../utils/currencyFormatter';
import { activateMerchantAccount } from '../../services/billing/StripeBillingService';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function roundMajor2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function WalletB2BScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [mockTier, setMockTier] = useState<'PRO' | 'POWER'>('POWER');
  const [mockIndustry, setMockIndustry] = useState<IndustryTypeId>(IndustryType.RETAIL);
  const [devKycOverride, setDevKycOverride] = useState(false);

  const isKycVerified = user?.kycVerified === true || devKycOverride;

  const merchantPackage: PackageName = mockTier === 'POWER' ? 'Power' : 'Pro';
  const usedVoiceAiMinutesThisMonth = mockTier === 'POWER' ? 215 : 10;

  const tel = PRICING_AUTHORITY.voiceAiTelecom;
  const pendingWholesaleCommissionMajor = useB2bVoiceMerchantBillingStore((s) => s.pendingWholesaleCommissionTotalMajorUsd());

  const { includedVoiceMins, voiceOverageMajor, leaseMajorLabel } = useMemo(() => {
    const included =
      merchantPackage === 'Power'
        ? Math.max(PRICING_AUTHORITY.tiers.Power.includedAiVoiceMinutes, tel.powerTierIncludedMinutes)
        : PRICING_AUTHORITY.tiers[merchantPackage].includedAiVoiceMinutes;
    const overMins = Math.max(0, usedVoiceAiMinutesThisMonth - included);
    const perMin =
      merchantPackage === 'Power' ? tel.powerTierOverageMinMajor : tel.payAsYouGoVoiceMinMajor;
    return {
      includedVoiceMins: included,
      voiceOverageMajor: roundMajor2(overMins * perMin),
      leaseMajorLabel: formatCurrency(tel.virtualNumberLeasePerMonthMajor, PRICING_BASELINE_CURRENCY),
    };
  }, [merchantPackage, tel, usedVoiceAiMinutesThisMonth]);

  /** Minh họa định giá CEO: GMV 5.000 USD-major × 1% (đồng bộ với mock `executeWholesaleOrder(..., 5000)`). */
  const wholesaleCommissionIllustrativeMajor = roundMajor2((5000 * tel.wholesaleCommissionPercent) / 100);

  const openTaxInvoices = useCallback(() => {
    const portal =
      process.env.EXPO_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL?.trim() ||
      process.env.EXPO_PUBLIC_STRIPE_BILLING_PORTAL_URL?.trim() ||
      '';
    if (portal.length > 0) {
      void Linking.openURL(portal).catch(() => {
        Alert.alert('Không mở được', 'Kiểm tra trình duyệt / URL cổng hóa đơn Stripe.');
      });
      return;
    }
    Alert.alert(
      'Hóa đơn thuế (EU VAT)',
      'Cấu hình EXPO_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL để mở cổng tải hóa đơn Stripe (automatic_tax + invoice_creation trên server).'
    );
  }, []);

  const openStripeConnectKyc = useCallback(() => {
    const mid = user?.serverUserId ?? user?.phone ?? 'merchant-demo';
    const r = activateMerchantAccount({
      merchantId: mid,
      stripeConnectAccountId: null,
      isKycVerified,
    });
    if (r.ok && !r.onboardingComplete && 'connectOnboardingUrl' in r) {
      void Linking.openURL(r.connectOnboardingUrl).catch(() => {
        Alert.alert('Stripe Connect', r.connectOnboardingUrl);
      });
      return;
    }
    Alert.alert('KYC', 'Tài khoản đã được đánh dấu xác minh (is_kyc_verified).');
  }, [isKycVerified, user?.phone, user?.serverUserId]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.8 }]}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Ví &amp; Lễ tân AI</Text>
        <View style={styles.topSpacer} />
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        className={applyWebStyles('kn-glass')}
      >
        <Text style={styles.hero}>Doanh nghiệp</Text>
        <Text style={styles.sub}>Theo dõi cước Voice AI Receptionist — khách B2C gọi miễn phí; merchant trả phút vượt gói.</Text>

        <Pressable
          onPress={() => setMockTier((t) => (t === 'POWER' ? 'PRO' : 'POWER'))}
          style={({ pressed }) => [styles.devToggle, pressed && { opacity: 0.86 }]}
        >
          <Text style={styles.devToggleText}>DEV: gói {mockTier}</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            setMockIndustry((i) =>
              i === IndustryType.RETAIL
                ? IndustryType.WHOLESALE
                : i === IndustryType.WHOLESALE
                  ? IndustryType.SERVICES
                  : IndustryType.RETAIL
            )
          }
          style={({ pressed }) => [styles.devToggle, pressed && { opacity: 0.86 }]}
        >
          <Text style={styles.devToggleText}>DEV: ngành {mockIndustry}</Text>
        </Pressable>

        <Pressable
          onPress={() => setDevKycOverride((v) => !v)}
          style={({ pressed }) => [styles.devToggle, pressed && { opacity: 0.86 }]}
        >
          <Text style={styles.devToggleText}>DEV: KYC verified = {isKycVerified ? 'on' : 'off'}</Text>
        </Pressable>

        <Pressable onPress={openStripeConnectKyc} style={({ pressed }) => [styles.kycCta, pressed && { opacity: 0.88 }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.primaryBright} />
          <Text style={styles.kycCtaText}>Stripe Connect KYC (onboarding)</Text>
          <Ionicons name="open-outline" size={16} color={theme.colors.text.secondary} />
        </Pressable>

        <Pressable onPress={openTaxInvoices} style={({ pressed }) => [styles.taxInvoicesBtn, pressed && { opacity: 0.88 }]}>
          <Ionicons name="document-text-outline" size={20} color={theme.hybrid.signalStrong} />
          <Text style={styles.taxInvoicesText}>Download Tax Invoices</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
        </Pressable>

        <View style={styles.billingCard}>
          <Text style={styles.billingTitle}>Cước Viễn Thông &amp; Lễ Tân AI</Text>
          <Text style={styles.billingLine}>
            Phí duy trì số điện thoại ảo: {leaseMajorLabel}/tháng
          </Text>
          <Text style={styles.billingLine}>
            Phút gọi đã dùng: {usedVoiceAiMinutesThisMonth}/{includedVoiceMins}. Phí phát sinh:{' '}
            {formatCurrency(voiceOverageMajor, PRICING_BASELINE_CURRENCY)}
          </Text>
          {mockIndustry === IndustryType.WHOLESALE ? (
            <>
              <Text style={styles.billingLine}>
                Phí hoa hồng chốt đơn AI ({tel.wholesaleCommissionPercent.toFixed(1).replace(/\.0$/, '')}%):{' '}
                {formatCurrency(wholesaleCommissionIllustrativeMajor, PRICING_BASELINE_CURRENCY)}
              </Text>
              <Text style={styles.billingHint}>
                Sổ chờ quyết toán (mock): {formatCurrency(pendingWholesaleCommissionMajor, PRICING_BASELINE_CURRENCY)} — cộng
                dồn mỗi lần AI chốt đơn sỉ.
              </Text>
            </>
          ) : null}
        </View>

        <Pressable
          onPress={() => navigation.navigate('Orders')}
          style={({ pressed }) => [styles.ordersLink, pressed && { opacity: 0.88 }]}
          className={applyWebStyles('kn-neon-b2b')}
        >
          <Ionicons name="cube-outline" size={20} color={theme.colors.primaryBright} />
          <Text style={styles.ordersLinkText}>Mở Đơn mua sỉ (Voice AI)</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
        </Pressable>

        <VoiceAiReceptionistMerchantPanel
          merchantPackage={merchantPackage}
          usedVoiceAiMinutesThisMonth={usedVoiceAiMinutesThisMonth}
          isKycVerified={isKycVerified}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  backBtn: {
    padding: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  topSpacer: {
    width: 40,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  hero: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  devToggle: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.5)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  devToggleText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: theme.colors.SignatureGold,
  },
  billingCard: {
    marginBottom: 14,
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.45)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  billingTitle: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  billingLine: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: theme.colors.primaryBright,
    lineHeight: 19,
  },
  billingHint: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  ordersLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.45)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  ordersLinkText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  kycCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.45)',
    backgroundColor: 'rgba(30, 58, 138, 0.25)',
  },
  kycCtaText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  taxInvoicesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.55)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  taxInvoicesText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.SignatureGold,
  },
});
