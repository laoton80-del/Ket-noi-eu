import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppStateView } from '../components/ui/AppStateView';
import { PinFallbackModal } from '../components/PinFallbackModal';
import { PremiumCheckoutSheet } from '../components/PremiumCheckoutSheet';
import { SuccessCheckmark3D } from '../components/SuccessCheckmark3D';
import { WalletBiometricOverlay } from '../components/WalletBiometricOverlay';
import { DongSonSkeuomorphicButton } from '../components/DongSonSkeuomorphicButton';
import { getPersonaDisplayName } from '../config/aiPrompts';
import {
  formatMoneyByCurrency,
  getComboPricesByCountry,
  getLocalPriceMeta,
  getPricingByCountry,
} from '../config/Pricing';
import { normalizeCountryCodeOrSentinel, resolveCommercialCountryContext } from '../config/countryPacks';
import { APP_BRAND } from '../config/appBrand';
import { useAuth } from '../context/AuthContext';
import { getStrings } from '../i18n/strings';
import type { RootStackParamList } from '../navigation/routes';
import {
  createPlatformPayIntent,
  isPaymentsApiConfigured,
  pollTopupCreditEntitlement,
} from '../services/PaymentsService';
import { useAssistantSettings } from '../state/assistantSettings';
import type { Transaction } from '../state/wallet';
import { topupCreditsServer, useWalletState } from '../state/wallet';
import { trackGrowthEvent } from '../services/growth';
import { Colors } from '../theme/colors';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authenticateBiometric, getBiometricAvailability, isValidWalletPin } from '../security/biometricUnlock';
import { consumePendingSellResume } from '../services/selling/sellResumeStorage';

type FilterMode = 'all' | 'topup' | 'consume';
type Nav = NativeStackNavigationProp<RootStackParamList>;

function interpolate(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{${key}}`).join(value);
  }
  return out;
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

function maskIdempotencyKey(key: string): string {
  if (key.length <= 10) return key;
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

export function ComboWalletScreen() {
  const navigation = useNavigation<Nav>();
  const { user, setPendingRedirect } = useAuth();
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const w = strings.comboWallet;
  const biometricReason = w.biometricReason;
  const [country, setCountry] = useState(() => normalizeCountryCodeOrSentinel(user?.country));
  const [filter, setFilter] = useState<FilterMode>('all');
  const wallet = useWalletState();
  const [displayCredits, setDisplayCredits] = useState(wallet.credits);
  const creditAnimTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locale = languageCode === 'vi' ? 'vi-VN' : languageCode === 'cs' ? 'cs-CZ' : languageCode === 'de' ? 'de-DE' : 'en-GB';
  const commercialCtx = useMemo(() => resolveCommercialCountryContext(country), [country]);
  const comboCards = useMemo(() => getComboPricesByCountry(country, locale), [country, locale]);
  const unitPricing = useMemo(() => getPricingByCountry(country), [country]);
  const [checkoutComboId, setCheckoutComboId] = useState<string | null>(null);
  const [checkoutIdempotencyKey, setCheckoutIdempotencyKey] = useState<string | null>(null);
  const [platformPayClientSecret, setPlatformPayClientSecret] = useState<string | null>(null);
  const [loadingComboId, setLoadingComboId] = useState<string | null>(null);
  const [showPaySuccess, setShowPaySuccess] = useState(false);
  const [paymentFailureMessage, setPaymentFailureMessage] = useState<string | null>(null);
  const [topupPending, setTopupPending] = useState(false);
  const inboundPersonaName = getPersonaDisplayName('loan');
  const outboundPersonaName = getPersonaDisplayName('leona');
  const [walletUnlocked, setWalletUnlocked] = useState(false);
  const [pinGateVisible, setPinGateVisible] = useState(false);
  const prevCreditsRef = useRef(wallet.credits);
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handleWalletUnlockTap = useCallback(async () => {
    const availability = await getBiometricAvailability();
    if (availability === 'ready') {
      const ok = await authenticateBiometric(biometricReason);
      if (ok) setWalletUnlocked(true);
      return;
    }
    setPinGateVisible(true);
  }, [biometricReason]);

  useFocusEffect(
    useCallback(() => {
      setWalletUnlocked(false);
      let active = true;
      void (async () => {
        const availability = await getBiometricAvailability();
        if (!active) return;
        if (availability === 'ready') {
          const ok = await authenticateBiometric(biometricReason);
          if (active && ok) setWalletUnlocked(true);
        }
      })();
      return () => {
        active = false;
      };
    }, [biometricReason])
  );

  useEffect(() => {
    if (!user) {
      setPendingRedirect('Wallet');
      navigation.navigate('Login');
    }
  }, [navigation, setPendingRedirect, user]);

  useEffect(() => {
    if (user?.country) {
      setCountry(normalizeCountryCodeOrSentinel(user.country));
    }
  }, [user?.country]);

  useEffect(() => {
    return () => {
      if (creditAnimTimerRef.current) {
        clearInterval(creditAnimTimerRef.current);
        creditAnimTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (displayCredits === wallet.credits) return;
    if (creditAnimTimerRef.current) {
      clearInterval(creditAnimTimerRef.current);
      creditAnimTimerRef.current = null;
    }

    const start = displayCredits;
    const end = wallet.credits;
    const durationMs = 700;
    const fps = 30;
    const totalSteps = Math.max(1, Math.floor((durationMs / 1000) * fps));
    let step = 0;

    creditAnimTimerRef.current = setInterval(() => {
      step += 1;
      const t = Math.min(1, step / totalSteps);
      const eased = 1 - (1 - t) * (1 - t);
      const nextValue = Math.round(start + (end - start) * eased);
      setDisplayCredits(nextValue);
      if (t >= 1) {
        if (creditAnimTimerRef.current) {
          clearInterval(creditAnimTimerRef.current);
          creditAnimTimerRef.current = null;
        }
      }
    }, Math.round(1000 / fps));
  }, [displayCredits, wallet.credits]);

  useEffect(() => {
    const prev = prevCreditsRef.current;
    const next = wallet.credits;
    prevCreditsRef.current = next;
    if (next <= prev) return;
    glowAnim.setValue(0);
    Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 220, useNativeDriver: false }),
      Animated.timing(glowAnim, { toValue: 0, duration: 760, useNativeDriver: false }),
    ]).start();
  }, [glowAnim, wallet.credits]);

  if (!user) return null;

  const filterLabels: Record<FilterMode, string> = {
    all: w.filterAll,
    topup: w.filterTopup,
    consume: w.filterConsume,
  };

  const txRows = wallet.transactions.filter((tx) => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const checkoutCombo = comboCards.find((combo) => combo.id === checkoutComboId) ?? null;
  const walletGlowStyle = {
    shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.32] }),
    borderColor: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.glass.borderSoft, theme.colors.primaryBright],
    }),
  };

  const openCheckout = async (comboId: string) => {
    if (!walletUnlocked) {
      Alert.alert(w.walletLockedTitle, w.walletLockedBody);
      return;
    }
    const combo = comboCards.find((item) => item.id === comboId);
    if (!combo || !combo.purchasable) return;
    const backendOk = Boolean(process.env.EXPO_PUBLIC_BACKEND_API_BASE?.trim());
    if (!backendOk) {
      Alert.alert(w.backendMissingTitle, w.backendMissingBody);
      return;
    }
    if (!isPaymentsApiConfigured()) {
      Alert.alert(w.paymentsMissingTitle, w.paymentsMissingBody);
      return;
    }
    setPaymentFailureMessage(null);
    setLoadingComboId(comboId);
    try {
      const idempotencyKey = `topup-${combo.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      if (__DEV__) {
        console.log('[wallet-topup] intent key', maskIdempotencyKey(idempotencyKey));
      }
      const secret = await createPlatformPayIntent({
        amount: combo.amount,
        currency: combo.currencyCode,
        comboId: combo.id,
        idempotencyKey,
        commercialCountryCode: commercialCtx.countryCode,
        merchantCountryCode: commercialCtx.merchantCountryCode,
        displayCurrency: commercialCtx.displayCurrency,
      });
      if (!secret) {
        Alert.alert(w.paymentInitFailTitle, w.paymentInitFailBody);
        return;
      }
      setCheckoutIdempotencyKey(idempotencyKey);
      setPlatformPayClientSecret(secret);
      setCheckoutComboId(comboId);
    } finally {
      setLoadingComboId(null);
    }
  };

  const runNativePay = async () => {
    if (!checkoutCombo) return;
    setTopupPending(true);
    const showPaymentFailure = (message: string) => {
      setPaymentFailureMessage(message);
      setTopupPending(false);
    };
    try {
      const verified = await pollTopupCreditEntitlement({
        country,
        comboId: checkoutCombo.id,
        provider: 'platform_pay',
        idempotencyKey: checkoutIdempotencyKey ?? undefined,
      });
      if (__DEV__) {
        console.log(
          '[wallet-topup] verify result',
          JSON.stringify({
            key: checkoutIdempotencyKey ? maskIdempotencyKey(checkoutIdempotencyKey) : null,
            verified,
          })
        );
      }
      if (!verified) {
        setCheckoutComboId(null);
        setCheckoutIdempotencyKey(null);
        setPlatformPayClientSecret(null);
        showPaymentFailure(w.paymentNotVerifiedBody);
        Alert.alert(w.paymentNotVerifiedTitle, w.paymentNotVerifiedBody, [
          { text: w.alertClose, style: 'cancel' },
          { text: w.alertRetry, onPress: () => void runNativePay() },
        ]);
        return;
      }
      const paymentEventId = checkoutIdempotencyKey?.trim() ?? '';
      if (!paymentEventId) {
        showPaymentFailure(w.paymentMissingIdBody);
        Alert.alert(w.paymentMissingIdTitle, w.paymentMissingIdBody);
        return;
      }
      const topup = await topupCreditsServer(checkoutCombo.turns, paymentEventId);
      if (!topup.ok) {
        showPaymentFailure(w.creditsNotCreditedBody);
        Alert.alert(w.creditsNotCreditedTitle, w.creditsNotCreditedBody, [
          { text: w.alertLater, style: 'cancel' },
          { text: w.alertRetry, onPress: () => void runNativePay() },
        ]);
        return;
      }
      setCheckoutComboId(null);
      setCheckoutIdempotencyKey(null);
      setPlatformPayClientSecret(null);
      setTopupPending(false);
      setPaymentFailureMessage(null);
      setShowPaySuccess(true);
      void trackGrowthEvent('successful_credit_topup', {
        value: checkoutCombo.turns,
        meta: { comboId: checkoutCombo.id, country: commercialCtx.countryCode },
      });
      const resume = await consumePendingSellResume();
      if (resume) {
        navigation.navigate(resume.route, resume.params as never);
      }
    } catch {
      showPaymentFailure(w.connectionInterruptedBody);
      Alert.alert(w.connectionInterruptedTitle, w.connectionInterruptedBody, [
        { text: w.alertClose, style: 'cancel' },
        { text: w.alertRetry, onPress: () => void runNativePay() },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.walletLayer}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>{APP_BRAND.name}</Text>
        <Text style={styles.launchHint}>{APP_BRAND.launchSubtitle}</Text>
        <Text style={styles.subtitle}>{w.screenSubtitle}</Text>
        <Animated.View style={[styles.walletCardGlowWrap, walletGlowStyle]}>
          <DongSonSkeuomorphicButton variant="card" watermarkOpacity={0.1} style={styles.walletCard}>
            <Text style={styles.walletBalanceLabel}>{w.balanceLabel}</Text>
            <View style={styles.balanceRow}>
              <Ionicons name="call" size={18} color={theme.colors.primary} />
              <Text style={styles.walletBalance}>{displayCredits} Credits</Text>
            </View>
            <Text style={styles.hint}>{interpolate(w.balanceHint, { country: country || 'ZZ' })}</Text>
          </DongSonSkeuomorphicButton>
        </Animated.View>
        <Text style={styles.unitPrice}>
          {interpolate(w.unitPriceLine, {
            inboundName: inboundPersonaName,
            inboundPrice: getLocalPriceMeta(unitPricing.internalCallPriceCzk, country, locale).label,
            outboundName: outboundPersonaName,
            outboundPrice: getLocalPriceMeta(unitPricing.externalCallPriceCzk, country, locale).label,
          })}
        </Text>
        {paymentFailureMessage ? (
          <AppStateView
            variant="paymentFailure"
            layout="embedded"
            title={w.paymentNotVerifiedTitle}
            message={paymentFailureMessage}
            retryLabel={w.alertRetry}
            onRetry={() => void runNativePay()}
            style={styles.paymentFailureState}
          />
        ) : null}

        {comboCards.map((combo) => (
          <View key={combo.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.planName}>{combo.name}</Text>
              <Text style={styles.turns}>{combo.purchasable ? `${combo.turns} Credits` : '—'}</Text>
            </View>
            <Text style={styles.gift}>{interpolate(w.giftLine, { gift: combo.gift })}</Text>
            <Text style={styles.price}>{interpolate(w.packPriceLine, { amount: combo.amountLabel })}</Text>
            {combo.purchasable ? (
              <Pressable
                onPress={() => {
                  void openCheckout(combo.id);
                }}
                disabled={loadingComboId === combo.id}
                style={({ pressed }) => [
                  styles.buyButton,
                  loadingComboId === combo.id && styles.buyButtonDisabled,
                  pressed && { opacity: 0.82 },
                ]}
              >
                {loadingComboId === combo.id ? (
                  <View style={styles.buyLoadingRow}>
                    <ActivityIndicator size="small" color={theme.colors.onAccent} />
                    <Text style={styles.buyButtonText}>{w.buyInitInProgress}</Text>
                  </View>
                ) : (
                  <Text style={styles.buyButtonText}>
                    {combo.turns} Credits - {combo.amountLabel}
                  </Text>
                )}
              </Pressable>
            ) : (
              <Text style={styles.enterpriseCta}>{w.enterpriseCta}</Text>
            )}
          </View>
        ))}

        <Text style={styles.sectionTitle}>{w.historySectionTitle}</Text>
        <Text style={styles.historyFootnote}>{w.historyFootnote}</Text>
        <View style={styles.segmentWrap}>
          {(['all', 'topup', 'consume'] as FilterMode[]).map((key) => (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={({ pressed }) => [
                styles.segmentBtn,
                filter === key && styles.segmentBtnActive,
                pressed && { opacity: 0.84 },
              ]}
            >
              <Text style={[styles.segmentText, filter === key && styles.segmentTextActive]}>{filterLabels[key]}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.historyWrap}>
          {txRows.length === 0 ? (
            <AppStateView
              variant="empty"
              layout="embedded"
              message={w.emptyHistory}
            />
          ) : (
            txRows.slice(0, 18).map((tx: Transaction) => (
              <View key={tx.id} style={styles.txCard}>
                <View style={[styles.txIcon, tx.type === 'topup' ? styles.txIconTopup : styles.txIconConsume]}>
                  <Ionicons
                    name={tx.type === 'topup' ? 'arrow-up' : 'flash'}
                    size={15}
                    color={tx.type === 'topup' ? theme.colors.primaryBright : theme.colors.text.primary}
                  />
                </View>
                <View style={styles.txBody}>
                  <Text style={styles.txDescription}>{tx.description}</Text>
                  <Text style={styles.txDate}>
                    {tx.timestampSnapshotLabel ?? formatDate(tx.date, locale)}
                    {tx.paymentSnapshotLabel
                      ? ` | ${tx.paymentSnapshotLabel}`
                      : tx.paymentAmount && tx.paymentCurrencyCode
                        ? ` | ${formatMoneyByCurrency(tx.paymentAmount, tx.paymentCurrencyCode, locale)}`
                      : ''}
                  </Text>
                </View>
                <Text style={[styles.txAmount, tx.type === 'topup' ? styles.txAmountTopup : styles.txAmountConsume]}>
                  {tx.type === 'topup' ? '+' : '-'}
                  {tx.amount} Credits
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
        {!walletUnlocked ? (
          <WalletBiometricOverlay onUnlockPress={() => void handleWalletUnlockTap()} onPinPress={() => setPinGateVisible(true)} />
        ) : null}
      </View>
      <PinFallbackModal
        visible={pinGateVisible}
        title={w.unlockWalletTitle}
        onClose={() => setPinGateVisible(false)}
        onVerify={(pin) => {
          if (isValidWalletPin(pin)) {
            setWalletUnlocked(true);
            setPinGateVisible(false);
          } else {
            Alert.alert(w.pinWrongTitle, w.pinWrongBody);
          }
        }}
      />
      <PremiumCheckoutSheet
        visible={!!checkoutCombo}
        amountLabel={checkoutCombo?.amountLabel ?? ''}
        amountValue={checkoutCombo?.amount ?? 0}
        currencyCode={checkoutCombo?.currencyCode ?? commercialCtx.displayCurrency}
        merchantCountryCode={commercialCtx.merchantCountryCode}
        platformPayClientSecret={platformPayClientSecret ?? undefined}
        onClose={() => {
          setCheckoutComboId(null);
          setCheckoutIdempotencyKey(null);
          setPlatformPayClientSecret(null);
        }}
        onNativePayPress={() => {
          void runNativePay();
        }}
        onFallbackPayPress={() => {
          setCheckoutComboId(null);
          setCheckoutIdempotencyKey(null);
          setPlatformPayClientSecret(null);
          Alert.alert(w.closeCheckoutTitle, w.closeCheckoutBody);
        }}
      />
      {topupPending ? (
        <View style={styles.pendingOverlay}>
          <ActivityIndicator size="small" color={theme.colors.primaryBright} />
          <Text style={styles.pendingText}>{w.pendingVerifyText}</Text>
        </View>
      ) : null}
      <SuccessCheckmark3D
        visible={showPaySuccess}
        onClose={() => {
          setShowPaySuccess(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  walletLayer: { flex: 1, position: 'relative' },
  content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 120 },
  brand: {
    fontSize: theme.typeScale.h1.fontSize,
    fontFamily: theme.typeScale.h1.fontFamily,
    color: theme.colors.text.primary,
  },
  launchHint: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.textSoft,
  },
  subtitle: {
    marginTop: 4,
    fontSize: theme.typeScale.h2.fontSize,
    fontFamily: theme.typeScale.h2.fontFamily,
    color: theme.colors.primary,
  },
  historyFootnote: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: Colors.textSoft,
    marginBottom: 6,
    lineHeight: 16,
  },
  walletCard: {
    marginTop: 0,
  },
  walletCardGlowWrap: {
    marginTop: 10,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  walletBalanceLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 24,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.extrabold,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hint: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
    color: Colors.textSoft,
  },
  unitPrice: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.semibold,
    color: theme.colors.primary,
  },
  paymentFailureState: {
    marginTop: 10,
    marginBottom: 2,
  },
  card: {
    marginTop: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glass,
    padding: 14,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: { fontSize: 20, color: Colors.text, fontFamily: FontFamily.extrabold },
  turns: { fontSize: 13, color: Colors.textSoft, fontFamily: FontFamily.regular },
  gift: {
    fontSize: 12,
    color: theme.colors.primary,
    fontFamily: FontFamily.medium,
    marginBottom: 2,
  },
  price: { fontSize: 16, color: Colors.primary, marginTop: 2, fontFamily: FontFamily.semibold },
  buyButton: {
    marginTop: 12,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  buyButtonDisabled: {
    opacity: 0.72,
  },
  buyLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buyButtonText: {
    color: theme.colors.onAccent,
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
  enterpriseCta: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSoft,
    fontFamily: FontFamily.medium,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 16,
    color: Colors.text,
    fontFamily: FontFamily.extrabold,
  },
  segmentWrap: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    marginBottom: 10,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 34,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: theme.colors.executive.card,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
  },
  segmentText: {
    fontSize: 12,
    color: Colors.textSoft,
    fontFamily: FontFamily.medium,
  },
  segmentTextActive: {
    color: Colors.text,
    fontFamily: FontFamily.semibold,
  },
  historyWrap: {
    gap: 10,
    marginBottom: 8,
  },
  txCard: {
    minHeight: 64,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
  txIcon: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  txIconTopup: {
    backgroundColor: 'rgba(197, 160, 89, 0.22)',
  },
  txIconConsume: {
    backgroundColor: 'rgba(229, 115, 115, 0.2)',
  },
  txBody: {
    flex: 1,
    paddingRight: 8,
  },
  txDescription: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: FontFamily.medium,
    marginBottom: 2,
  },
  txDate: {
    fontSize: 11,
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
  },
  txAmount: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  txAmountTopup: {
    color: theme.colors.primary,
  },
  txAmountConsume: {
    color: theme.colors.danger,
  },
  pendingOverlay: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.overlay.dim,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 120,
  },
  pendingText: {
    color: theme.colors.text.primary,
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
});
