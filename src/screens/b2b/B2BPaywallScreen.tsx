/**
 * B2B merchant upgrade surface — trial messaging & tier cards. Midnight Navy & Imperial Gold.
 * Stripe CTA is sandbox/mock only until backend checkout sessions are wired.
 */
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VionaCard } from '../../components/viona/VionaCard';
import { vionaTrust } from '../../components/viona/vionaTrustTokens';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import {
  calculateActualTrialDays,
  enforceV7TrapRestrictions,
  resolveV7MerchantTrialPhase,
  V7_TRIAL_TOP_SEO_DAY_CAP,
} from '../../monetization/v7MerchantTrialTrap';
import { MAIN_TAB, type RootStackParamList } from '../../navigation/routes';
import { isValidUuid } from '../../services/broker/V7AttributionService';
import {
  cancelStripeSubscription,
  isMerchantOnPowerSaasTier,
} from '../../services/billing/StripeSubscriptionService';

const SHELL_TOP = '#F0F3F8';
const SHELL_MID = vionaTrust.canvas;
const SHELL_DEEP = '#E2E8F0';
const PRIMARY_GOLD = '#B8952E';
const GOLD_DEEP = '#8B6914';
const GOLD_BRIGHT = '#FFF8E7';
const GOLD_MID = '#C9A227';
const THREAT_RED = '#B91C1C';
const INK_SUB = vionaTrust.inkMuted;
const INK = vionaTrust.ink;

/** Mock processed volume — replace with ledger aggregate when live. */
const MOCK_BOOKINGS_EUR = 12_847;

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatEur(value: number): string {
  return `€${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function GoldCheck({ label }: Readonly<{ label: string }>): ReactElement {
  return (
    <View style={styles.checkRow}>
      <Ionicons name="checkmark-circle" size={20} color={PRIMARY_GOLD} />
      <Text style={styles.eliteFeatureText}>{label}</Text>
    </View>
  );
}

export function B2BPaywallScreen(): ReactElement {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [cancelBusy, setCancelBusy] = useState(false);

  const isPowerSubscriber = isMerchantOnPowerSaasTier(user);
  const merchantIdForBilling = (user?.serverUserId?.trim() || user?.phone?.trim() || '').trim();

  /** Production: bind to Supabase `merchants.created_at`. Dev-only: `EXPO_PUBLIC_DEV_MERCHANT_CREATED_AT`. */
  const merchantCreatedAtIso =
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_DEV_MERCHANT_CREATED_AT?.trim() : undefined;

  const cap = V7_TRIAL_TOP_SEO_DAY_CAP;

  const trapComplianceLine = useMemo(() => {
    if (!merchantCreatedAtIso) {
      return t('b2bPaywallUi.trapPendingSync');
    }
    try {
      const days = calculateActualTrialDays(merchantCreatedAtIso);
      const phase = resolveV7MerchantTrialPhase(days);
      const displayDay = Math.min(days, cap);
      const base =
        phase === 'top_seo_window'
          ? t('b2bPaywallUi.trapTopSeo', { cap, day: displayDay })
          : t('b2bPaywallUi.trapGate', { cap });
      const mid = user?.serverUserId?.trim();
      if (mid && isValidUuid(mid)) {
        const enf = enforceV7TrapRestrictions(mid, days);
        if (enf.requiresVigTopUp) {
          return `${base} ${t('b2bPaywallUi.trapEnforcementVio')}`;
        }
      }
      return base;
    } catch {
      return t('b2bPaywallUi.trapPendingSync');
    }
  }, [merchantCreatedAtIso, user?.serverUserId, t, cap]);

  const onUpgrade = useCallback(() => {
    Alert.alert(t('b2bPaywallUi.stripeSandboxAlert'));
  }, [t]);

  const onContinuePilotRequest = useCallback(() => {
    navigation.navigate('AiReceptionistPilotRequest');
  }, [navigation]);

  const onCancelSubscription = useCallback(async () => {
    if (!merchantIdForBilling) {
      Alert.alert(t('b2bPaywallUi.alertCancelErr'), t('b2bPaywallUi.alertCancelNoMerchant'));
      return;
    }
    setCancelBusy(true);
    try {
      const result = await cancelStripeSubscription(merchantIdForBilling);
      Alert.alert(result.ok ? t('b2bPaywallUi.alertCancelOk') : t('b2bPaywallUi.alertCancelErr'), result.message);
    } finally {
      setCancelBusy(false);
    }
  }, [merchantIdForBilling, t]);

  const onBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Tabs', { screen: MAIN_TAB.B2B.merchant });
  }, [navigation]);

  const metricAmount = formatEur(MOCK_BOOKINGS_EUR);

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={[SHELL_TOP, SHELL_MID, SHELL_DEEP]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backRow, pressed && styles.backPressed]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('b2bPaywallUi.backA11y')}
        >
          <Ionicons name="chevron-back" size={26} color={vionaTrust.ink} />
          <Text style={styles.backText}>{t('b2bPaywallUi.backExit')}</Text>
        </Pressable>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.kicker}>{t('b2bPaywallUi.kicker')}</Text>

          <View style={styles.titleBlock}>
            <Text style={styles.warningTitle} accessibilityRole="header">
              {t('b2bPaywallUi.warningTitle')}
            </Text>
            <LinearGradient
              colors={['rgba(196,30,58,0.9)', PRIMARY_GOLD, 'rgba(212,175,55,0.85)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.titleAccentBar}
            />
          </View>

          <Text style={styles.subThreat}>{t('b2bPaywallUi.subThreat')}</Text>

          <View style={styles.trapStrip}>
            <Ionicons name="alarm-outline" size={18} color={PRIMARY_GOLD} />
            <Text style={styles.trapStripText}>{trapComplianceLine}</Text>
          </View>

          <View style={styles.glassWrap}>
            <BlurView intensity={Platform.OS === 'ios' ? 24 : 18} tint="light" style={StyleSheet.absoluteFillObject} />
            <LinearGradient
              colors={['rgba(255,255,255,0.92)', 'rgba(248,250,252,0.98)', 'rgba(241,245,249,0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.glassInner}>
              <Text style={styles.metricLabel}>{t('b2bPaywallUi.metricLabel')}</Text>
              <Text style={styles.metricValue}>{metricAmount}</Text>
              <Text style={styles.metricCopy}>{t('b2bPaywallUi.metricCopy', { amount: metricAmount })}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>{t('b2bPaywallUi.chooseLane')}</Text>

          <VionaCard surfaceVariant="light" style={styles.pricingCard}>
            <Text style={styles.tierBadge}>{t('b2bPaywallUi.tier1Badge')}</Text>
            <Text style={styles.secondaryTitle}>{t('b2bPaywallUi.tier1Title')}</Text>
            <Text style={styles.secondaryPrice}>{t('b2bPaywallUi.tier1Price')}</Text>
            <Text style={styles.secondaryBody}>{t('b2bPaywallUi.tier1Body')}</Text>
            <View style={styles.secondaryFoot}>
              <Ionicons name="wallet-outline" size={18} color={INK_SUB} />
              <Text style={styles.secondaryHint}>{t('b2bPaywallUi.tier1Hint')}</Text>
            </View>
          </VionaCard>

          <View style={styles.eliteShell}>
            <LinearGradient
              colors={['rgba(252,248,235,0.98)', 'rgba(255,255,255,0.99)', 'rgba(248,250,252,0.98)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.eliteGlow} />
            <View style={styles.eliteInner}>
              <Text style={styles.tierBadgeGold}>{t('b2bPaywallUi.tier2Badge')}</Text>
              <Text style={styles.eliteTitle}>{t('b2bPaywallUi.tier2Title')}</Text>
              <Text style={styles.elitePrice}>
                {t('b2bPaywallUi.tier2Price')}
                <Text style={styles.elitePriceSuffix}>{t('b2bPaywallUi.tier2PerMonth')}</Text>
              </Text>
              <Text style={styles.eliteSub}>{t('b2bPaywallUi.tier2Sub')}</Text>
              <View style={styles.eliteFeatures}>
                <GoldCheck label={t('b2bPaywallUi.tier2Feat1')} />
                <GoldCheck label={t('b2bPaywallUi.tier2Feat2')} />
                <GoldCheck label={t('b2bPaywallUi.tier2Feat3')} />
              </View>
            </View>
          </View>

          {isPowerSubscriber ? (
            <View style={styles.cancelComplianceShell} accessibilityRole="summary">
              <Text style={styles.cancelComplianceTitle}>{t('b2bPaywallUi.cancelTitle')}</Text>
              <Text style={styles.cancelComplianceBody}>{t('b2bPaywallUi.cancelBody')}</Text>
              <Pressable
                onPress={onCancelSubscription}
                disabled={cancelBusy}
                style={({ pressed }) => [
                  styles.cancelSubscriptionBtn,
                  (pressed || cancelBusy) && styles.cancelSubscriptionBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('b2bPaywallUi.cancelA11y')}
              >
                {cancelBusy ? (
                  <ActivityIndicator color={PRIMARY_GOLD} />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={22} color={THREAT_RED} />
                    <Text style={styles.cancelSubscriptionText}>{t('b2bPaywallUi.cancelBtn')}</Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : null}

          <VionaCard surfaceVariant="muted" style={styles.pricingCardWholesale}>
            <Text style={styles.tierBadge}>{t('b2bPaywallUi.tier3Badge')}</Text>
            <Text style={styles.wholesaleTitle}>{t('b2bPaywallUi.tier3Title')}</Text>
            <Text style={styles.wholesalePrice}>{t('b2bPaywallUi.tier3Price')}</Text>
            <Text style={styles.wholesaleBody}>{t('b2bPaywallUi.tier3Body')}</Text>
            <View style={styles.wholesaleFoot}>
              <Ionicons name="git-network-outline" size={18} color={PRIMARY_GOLD} />
              <Text style={styles.wholesaleHint}>{t('b2bPaywallUi.tier3Hint')}</Text>
            </View>
          </VionaCard>

          <Pressable
            onPress={onUpgrade}
            style={({ pressed }) => [styles.ctaOuter, pressed && styles.ctaPressed]}
            accessibilityRole="button"
            accessibilityLabel={t('b2bPaywallUi.ctaA11y')}
          >
            <LinearGradient
              colors={[GOLD_DEEP, GOLD_MID, GOLD_BRIGHT, GOLD_MID, GOLD_DEEP]}
              locations={[0, 0.25, 0.5, 0.72, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>{t('b2bPaywallUi.ctaPrimary')}</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={onContinuePilotRequest}
            style={({ pressed }) => [styles.secondaryPilotCta, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityLabel={t('b2bPaywallUi.ctaPilot')}
          >
            <Text style={styles.secondaryPilotCtaText}>{t('b2bPaywallUi.ctaPilot')}</Text>
          </Pressable>

          <View style={styles.stripeRow}>
            <Text style={styles.stripeText}>{t('b2bPaywallUi.stripeRow')}</Text>
            <View style={styles.cardIcons}>
              <View style={[styles.cardChip, styles.cardChipWide]} />
              <View style={[styles.cardChip, styles.cardChipMid]} />
              <View style={[styles.cardChip, styles.cardChipNarrow]} />
            </View>
          </View>

          <Text style={styles.legalHint}>{t('b2bPaywallUi.legalHint')}</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: SHELL_MID,
  },
  safe: {
    flex: 1,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 4,
    gap: 2,
    alignSelf: 'flex-start',
  },
  backPressed: {
    opacity: 0.75,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: INK,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 4,
    color: INK_SUB,
    marginBottom: 10,
  },
  titleBlock: {
    marginBottom: 10,
  },
  warningTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '300',
    letterSpacing: 0.3,
    color: INK,
    marginBottom: 10,
  },
  titleAccentBar: {
    height: 3,
    borderRadius: 2,
    opacity: 0.85,
    marginBottom: 4,
    maxWidth: '100%',
  },
  subThreat: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    color: INK_SUB,
    marginBottom: 14,
  },
  trapStrip: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    backgroundColor: 'rgba(212,175,55,0.08)',
    marginBottom: 18,
  },
  trapStripText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: INK,
  },
  glassWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: vionaTrust.border,
    marginBottom: 28,
  },
  glassInner: {
    padding: 20,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: INK_SUB,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 36,
    fontWeight: '200',
    letterSpacing: 1,
    color: PRIMARY_GOLD,
    marginBottom: 12,
  },
  metricCopy: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    color: INK,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: INK_SUB,
    marginBottom: 14,
  },
  eliteShell: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: PRIMARY_GOLD,
    shadowColor: PRIMARY_GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  eliteGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(184,149,46,0.25)',
  },
  eliteInner: {
    padding: 20,
  },
  tierBadge: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: INK_SUB,
    marginBottom: 8,
  },
  tierBadgeGold: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: PRIMARY_GOLD,
    marginBottom: 10,
  },
  eliteTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: INK,
    marginBottom: 4,
  },
  elitePrice: {
    fontSize: 30,
    fontWeight: '700',
    color: PRIMARY_GOLD,
    marginBottom: 8,
  },
  elitePriceSuffix: {
    fontSize: 16,
    fontWeight: '600',
    color: INK_SUB,
  },
  eliteSub: {
    fontSize: 13,
    lineHeight: 19,
    color: INK_SUB,
    marginBottom: 16,
  },
  eliteFeatures: {
    gap: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  eliteFeatureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: INK,
  },
  pricingCard: {
    marginBottom: 16,
  },
  pricingCardWholesale: {
    marginBottom: 28,
  },
  secondaryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: INK,
    marginBottom: 4,
  },
  secondaryPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: INK_SUB,
    marginBottom: 10,
  },
  secondaryBody: {
    fontSize: 13,
    lineHeight: 20,
    color: INK_SUB,
    marginBottom: 12,
  },
  secondaryFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryHint: {
    fontSize: 12,
    fontWeight: '600',
    color: INK_SUB,
  },
  wholesaleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: INK,
    marginBottom: 4,
  },
  wholesalePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: PRIMARY_GOLD,
    marginBottom: 10,
  },
  wholesaleBody: {
    fontSize: 13,
    lineHeight: 20,
    color: INK_SUB,
    marginBottom: 12,
  },
  wholesaleFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wholesaleHint: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(212,175,55,0.75)',
  },
  cancelComplianceShell: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(196,30,58,0.85)',
    backgroundColor: 'rgba(196,30,58,0.12)',
  },
  cancelComplianceTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: INK,
    marginBottom: 8,
  },
  cancelComplianceBody: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: INK_SUB,
    marginBottom: 14,
  },
  cancelSubscriptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THREAT_RED,
    backgroundColor: vionaTrust.surface,
    minHeight: 52,
  },
  cancelSubscriptionBtnPressed: {
    opacity: 0.88,
  },
  cancelSubscriptionText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
    color: THREAT_RED,
  },
  ctaOuter: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: PRIMARY_GOLD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  ctaPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.992 }],
  },
  ctaGradient: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.4,
    color: '#1a0f00',
    textAlign: 'center',
  },
  stripeRow: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  stripeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: 'rgba(148,163,184,0.85)',
  },
  cardIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardChip: {
    height: 22,
    borderRadius: 4,
    backgroundColor: 'rgba(226,232,240,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  cardChipWide: {
    width: 40,
  },
  cardChipMid: {
    width: 32,
  },
  cardChipNarrow: {
    width: 24,
  },
  legalHint: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    color: 'rgba(100,116,139,0.95)',
  },
  secondaryPilotCta: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.45)',
    backgroundColor: 'rgba(212,175,55,0.12)',
    paddingVertical: 11,
    alignItems: 'center',
    marginBottom: 14,
  },
  secondaryPilotCtaText: {
    fontSize: 13,
    fontWeight: '800',
    color: INK,
  },
});
