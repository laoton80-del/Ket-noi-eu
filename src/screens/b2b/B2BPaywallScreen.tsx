/**
 * B2B "Toll Station" — 90-day trap / premium paywall. Midnight Navy & Imperial Gold.
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

import { useAuth } from '../../context/AuthContext';
import {
  calculateActualTrialDays,
  enforceV7TrapRestrictions,
  getV7TrialTrapPendingSyncCopy,
  getV7TrialTrapSurfaceCopy,
} from '../../monetization/v7MerchantTrialTrap';
import { MAIN_TAB, type RootStackParamList } from '../../navigation/routes';
import { isValidUuid } from '../../services/broker/V7AttributionService';
import {
  cancelStripeSubscription,
  isMerchantOnPowerSaasTier,
} from '../../services/billing/StripeSubscriptionService';

const MIDNIGHT_NAVY = '#0A192F';
const PRIMARY_GOLD = '#D4AF37';
const GOLD_DEEP = '#8B6914';
const GOLD_BRIGHT = '#FFF8E7';
const GOLD_MID = '#E8C547';
const THREAT_RED = '#C41E3A';

/** Mock processed volume — replace with ledger aggregate when live. */
const MOCK_BOOKINGS_EUR = 12_847;

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function handleStripeCheckout(): void {
  Alert.alert('Stripe Sandbox Checkout Initiated');
}

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
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [cancelBusy, setCancelBusy] = useState(false);

  const isPowerSubscriber = isMerchantOnPowerSaasTier(user);
  const merchantIdForBilling = (user?.serverUserId?.trim() || user?.phone?.trim() || '').trim();

  /** Production: bind to Supabase `merchants.created_at`. Dev-only: `EXPO_PUBLIC_DEV_MERCHANT_CREATED_AT`. */
  const merchantCreatedAtIso =
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_DEV_MERCHANT_CREATED_AT?.trim() : undefined;

  const trapComplianceLine = useMemo(() => {
    if (!merchantCreatedAtIso) {
      return getV7TrialTrapPendingSyncCopy();
    }
    try {
      const days = calculateActualTrialDays(merchantCreatedAtIso);
      const base = getV7TrialTrapSurfaceCopy(days);
      const mid = user?.serverUserId?.trim();
      if (mid && isValidUuid(mid)) {
        const enf = enforceV7TrapRestrictions(mid, days);
        if (enf.requiresVigTopUp) {
          return `${base} Enforcement: featured placement suspended until VIG top-up.`;
        }
      }
      return base;
    } catch {
      return getV7TrialTrapPendingSyncCopy();
    }
  }, [merchantCreatedAtIso, user?.serverUserId]);

  const onUpgrade = useCallback(() => {
    handleStripeCheckout();
  }, []);

  const onCancelSubscription = useCallback(async () => {
    if (!merchantIdForBilling) {
      Alert.alert('Không hủy được', 'Thiếu mã merchant — đăng nhập lại hoặc đồng bộ hồ sơ.');
      return;
    }
    setCancelBusy(true);
    try {
      const result = await cancelStripeSubscription(merchantIdForBilling);
      Alert.alert(result.ok ? 'Đã lên lịch hủy' : 'Lỗi', result.message);
    } finally {
      setCancelBusy(false);
    }
  }, [merchantIdForBilling]);

  const onBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Tabs', { screen: MAIN_TAB.B2B.merchant });
  }, [navigation]);

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={[MIDNIGHT_NAVY, '#050B18', MIDNIGHT_NAVY]}
        locations={[0, 0.45, 1]}
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
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color="rgba(255,248,231,0.92)" />
          <Text style={styles.backText}>Exit</Text>
        </Pressable>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.kicker}>TOLL STATION</Text>

          <View style={styles.titleBlock}>
            <Text style={styles.warningTitle} accessibilityRole="header">
              Warning: Premium Access Expires in 7 Days.
            </Text>
            <LinearGradient
              colors={['rgba(196,30,58,0.9)', PRIMARY_GOLD, 'rgba(212,175,55,0.85)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.titleAccentBar}
            />
          </View>

          <Text style={styles.subThreat}>
            Your trial runway is closing. Lock in automation before client data and routing priority reset.
          </Text>

          <View style={styles.trapStrip}>
            <Ionicons name="alarm-outline" size={18} color={PRIMARY_GOLD} />
            <Text style={styles.trapStripText}>{trapComplianceLine}</Text>
          </View>

          <View style={styles.glassWrap}>
            <BlurView intensity={Platform.OS === 'ios' ? 48 : 36} tint="dark" style={StyleSheet.absoluteFillObject} />
            <LinearGradient
              colors={['rgba(212,175,55,0.14)', 'rgba(10,25,47,0.2)', 'rgba(255,255,255,0.06)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.glassInner}>
              <Text style={styles.metricLabel}>Lifetime platform value (display)</Text>
              <Text style={styles.metricValue}>{formatEur(MOCK_BOOKINGS_EUR)}</Text>
              <Text style={styles.metricCopy}>
                {`ViGlobal has processed ${formatEur(MOCK_BOOKINGS_EUR)} in bookings for you. Don't lose your automated AI receptionist and VIP client data.`}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Choose your SaaS lane (V7)</Text>

          <View style={styles.secondaryCard}>
            <Text style={styles.tierBadge}>Tier 1</Text>
            <Text style={styles.secondaryTitle}>Pay-as-you-go</Text>
            <Text style={styles.secondaryPrice}>VIG Token top-up</Text>
            <Text style={styles.secondaryBody}>
              Metered voice, SMS, and booking events. Best when volume is unpredictable — top up tokens and scale down
              anytime.
            </Text>
            <View style={styles.secondaryFoot}>
              <Ionicons name="wallet-outline" size={18} color="rgba(226,232,240,0.55)" />
              <Text style={styles.secondaryHint}>Entry path · no annual lock-in</Text>
            </View>
          </View>

          <View style={styles.eliteShell}>
            <LinearGradient
              colors={['rgba(212,175,55,0.22)', 'rgba(10,25,47,0.95)', 'rgba(5,11,24,0.98)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.eliteGlow} />
            <View style={styles.eliteInner}>
              <Text style={styles.tierBadgeGold}>Tier 2 · RECOMMENDED</Text>
              <Text style={styles.eliteTitle}>Power SaaS Elite</Text>
              <Text style={styles.elitePrice}>
                €139<Text style={styles.elitePriceSuffix}>/month</Text>
              </Text>
              <Text style={styles.eliteSub}>Full-stack automation, data sovereignty, and VIP retention tooling.</Text>
              <View style={styles.eliteFeatures}>
                <GoldCheck label="Unlimited AI receptionist & intelligent routing" />
                <GoldCheck label="VIP client profiles, history, and retention signals" />
                <GoldCheck label="Real-time booking intelligence & staff handoff" />
              </View>
            </View>
          </View>

          {isPowerSubscriber ? (
            <View style={styles.cancelComplianceShell} accessibilityRole="summary">
              <Text style={styles.cancelComplianceTitle}>Power SaaS — EU cancellation</Text>
              <Text style={styles.cancelComplianceBody}>
                You may cancel anytime. Access continues until the end of your paid period — no extra steps or retention
                calls required.
              </Text>
              <Pressable
                onPress={onCancelSubscription}
                disabled={cancelBusy}
                style={({ pressed }) => [
                  styles.cancelSubscriptionBtn,
                  (pressed || cancelBusy) && styles.cancelSubscriptionBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Cancel Power subscription at end of billing period"
              >
                {cancelBusy ? (
                  <ActivityIndicator color={GOLD_BRIGHT} />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={22} color={THREAT_RED} />
                    <Text style={styles.cancelSubscriptionText}>Cancel Subscription</Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : null}

          <View style={styles.wholesaleCard}>
            <Text style={styles.tierBadge}>Tier 3</Text>
            <Text style={styles.wholesaleTitle}>Wholesale Corridor</Text>
            <Text style={styles.wholesalePrice}>1% platform fee</Text>
            <Text style={styles.wholesaleBody}>
              B2B wholesale & supply volume — lowest headline take for merchants moving stock through ViGlobal’s verified
              trade lane (qualifying SKUs; see Merchant Ops).
            </Text>
            <View style={styles.wholesaleFoot}>
              <Ionicons name="git-network-outline" size={18} color={PRIMARY_GOLD} />
              <Text style={styles.wholesaleHint}>Stack with Tier 1 or 2 for AI + voice</Text>
            </View>
          </View>

          <Pressable
            onPress={onUpgrade}
            style={({ pressed }) => [styles.ctaOuter, pressed && styles.ctaPressed]}
            accessibilityRole="button"
            accessibilityLabel="Secure My Business and Upgrade Now"
          >
            <LinearGradient
              colors={[GOLD_DEEP, GOLD_MID, GOLD_BRIGHT, GOLD_MID, GOLD_DEEP]}
              locations={[0, 0.25, 0.5, 0.72, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Secure My Business & Upgrade Now</Text>
            </LinearGradient>
          </Pressable>

          <View style={styles.stripeRow}>
            <Text style={styles.stripeText}>Secured by Stripe</Text>
            <View style={styles.cardIcons}>
              <View style={[styles.cardChip, styles.cardChipWide]} />
              <View style={[styles.cardChip, styles.cardChipMid]} />
              <View style={[styles.cardChip, styles.cardChipNarrow]} />
            </View>
          </View>

          <Text style={styles.legalHint}>
            Subscription renews monthly until cancelled. Taxes may apply. ViGlobal B2B terms apply.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: MIDNIGHT_NAVY,
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
    color: 'rgba(255,248,231,0.88)',
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
    color: 'rgba(212,175,55,0.75)',
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
    color: GOLD_BRIGHT,
    textShadowColor: THREAT_RED,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
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
    color: 'rgba(226,232,240,0.78)',
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
    color: 'rgba(241,245,249,0.9)',
  },
  glassWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
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
    color: 'rgba(226,232,240,0.55)',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 36,
    fontWeight: '200',
    letterSpacing: 1,
    color: GOLD_BRIGHT,
    marginBottom: 12,
  },
  metricCopy: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    color: 'rgba(241,245,249,0.92)',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(212,175,55,0.65)',
    marginBottom: 14,
  },
  eliteShell: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: PRIMARY_GOLD,
    shadowColor: PRIMARY_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 14,
  },
  eliteGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,248,231,0.25)',
  },
  eliteInner: {
    padding: 20,
  },
  tierBadge: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: 'rgba(148,163,184,0.95)',
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
    color: GOLD_BRIGHT,
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
    color: 'rgba(226,232,240,0.7)',
  },
  eliteSub: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(226,232,240,0.72)',
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
    color: 'rgba(248,250,252,0.95)',
  },
  secondaryCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  secondaryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: 'rgba(226,232,240,0.88)',
    marginBottom: 4,
  },
  secondaryPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(148,163,184,0.95)',
    marginBottom: 10,
  },
  secondaryBody: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(148,163,184,0.9)',
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
    color: 'rgba(148,163,184,0.75)',
  },
  wholesaleCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.28)',
    backgroundColor: 'rgba(10,25,47,0.55)',
  },
  wholesaleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: 'rgba(248,250,252,0.92)',
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
    color: 'rgba(148,163,184,0.92)',
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
    color: GOLD_BRIGHT,
    marginBottom: 8,
  },
  cancelComplianceBody: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: 'rgba(226,232,240,0.88)',
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
    backgroundColor: 'rgba(10,25,47,0.65)',
    minHeight: 52,
  },
  cancelSubscriptionBtnPressed: {
    opacity: 0.88,
  },
  cancelSubscriptionText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
    color: GOLD_BRIGHT,
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
});
