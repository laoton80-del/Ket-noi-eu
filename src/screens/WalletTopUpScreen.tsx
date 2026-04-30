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
import { TrustSurfaceCard } from '../components/TrustSurfaceCard';
import { getPersonaDisplayName } from '../config/aiPrompts';
import {
  formatMoneyByCurrency,
  getLocalPriceMeta,
  getPricingByCountry,
  getWalletPackagePricesByCountry,
} from '../config/commercialSpine';
import {
  B2C_AVATAR_FRAME_CREDITS,
  B2C_PASSPORT_BADGE_CREDITS_PER_YEAR,
  PRICING_AUTHORITY,
} from '../config/pricingConfig';
import { normalizeCountryCodeOrSentinel, resolveCommercialCountryContext } from '../config/countryPacks';
import { APP_BRAND } from '../config/appBrand';
import { useAuth } from '../context/AuthContext';
import { getStrings } from '../i18n/strings';
import type { RootStackParamList } from '../navigation/routes';
import {
  createPlatformPayIntent,
  isPaymentsApiConfigured,
  pollTopupCreditEntitlement,
  toPlatformPayIntentRequest,
  toTopupVerifyRequest,
} from '../services/PaymentsService';
import { useAssistantSettings } from '../state/assistantSettings';
import type { Transaction } from '../state/wallet';
import { reserveAndCommitCredits, topupCreditsServer, useWalletState } from '../state/wallet';
import { trackGrowthEvent } from '../services/growth';
import { theme } from '../theme/theme';
import { applyWebStyles, mergeWebClassNames } from '../utils/applyWebStyles';
import { FontFamily } from '../theme/typography';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authenticateBiometric, getBiometricAvailability, isValidWalletPin } from '../security/biometricUnlock';
import { consumePendingSellResume } from '../services/selling/sellResumeStorage';

/** Temporary diagnostic: set `EXPO_PUBLIC_WALLET_DIAGNOSTIC_SKIP_CHECKOUT_SHEET=1` so Wallet mounts without `PremiumCheckoutSheet`. Remove after crash is isolated. */
const WALLET_DIAGNOSTIC_SKIP_PREMIUM_CHECKOUT_SHEET =
  __DEV__ && process.env.EXPO_PUBLIC_WALLET_DIAGNOSTIC_SKIP_CHECKOUT_SHEET === '1';

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

export function WalletTopUpScreen() {
  const navigation = useNavigation<Nav>();
  const { user, setPendingRedirect } = useAuth();
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const w = strings.walletTopUp;
  const u = strings.utility;
  const biometricReason = w.biometricReason;
  const [country, setCountry] = useState(() => normalizeCountryCodeOrSentinel(user?.country));
  const [filter, setFilter] = useState<FilterMode>('all');
  const wallet = useWalletState();
  const [displayCredits, setDisplayCredits] = useState(wallet.credits);
  const creditAnimTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locale = languageCode === 'vi' ? 'vi-VN' : languageCode === 'cs' ? 'cs-CZ' : languageCode === 'de' ? 'de-DE' : 'en-GB';
  const commercialCtx = useMemo(() => resolveCommercialCountryContext(country), [country]);
  const walletPackCards = useMemo(() => getWalletPackagePricesByCountry(country, locale), [country, locale]);
  const unitPricing = useMemo(() => getPricingByCountry(country), [country]);
  const [checkoutPackId, setCheckoutPackId] = useState<string | null>(null);
  const [checkoutIdempotencyKey, setCheckoutIdempotencyKey] = useState<string | null>(null);
  const [platformPayClientSecret, setPlatformPayClientSecret] = useState<string | null>(null);
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);
  const [showPaySuccess, setShowPaySuccess] = useState(false);
  const onPaySuccessClose = useCallback(() => {
    setShowPaySuccess(false);
  }, []);
  const [paymentFailureMessage, setPaymentFailureMessage] = useState<string | null>(null);
  const [topupPending, setTopupPending] = useState(false);
  const [cosmeticLoadingId, setCosmeticLoadingId] = useState<string | null>(null);
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

  if (__DEV__) {
    console.log('[diag][WalletTopUp] hooks settled', { hasUser: Boolean(user) });
  }

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

  const checkoutPack = walletPackCards.find((pack) => pack.id === checkoutPackId) ?? null;
  const walletGlowStyle = {
    shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.26] }),
    borderColor: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.hybrid.signalSubtleBorder, theme.hybrid.signatureLine],
    }),
  };

  const openCheckout = async (packId: string) => {
    if (!walletUnlocked) {
      Alert.alert(w.walletLockedTitle, w.walletLockedBody);
      return;
    }
    const pack = walletPackCards.find((item) => item.id === packId);
    if (!pack || !pack.purchasable) return;
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
    setLoadingPackId(packId);
    try {
      const walletPackageId = pack.id;
      const idempotencyKey = `topup-${walletPackageId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      if (__DEV__) {
        console.log('[wallet-topup] intent key', maskIdempotencyKey(idempotencyKey));
      }
      const secret = await createPlatformPayIntent(
        toPlatformPayIntentRequest({
          walletPackageId,
          amount: pack.amount,
          currency: pack.currencyCode,
          idempotencyKey,
          commercialCountryCode: commercialCtx.countryCode,
          merchantCountryCode: commercialCtx.merchantCountryCode,
          displayCurrency: commercialCtx.displayCurrency,
        })
      );
      if (!secret) {
        Alert.alert(w.paymentInitFailTitle, w.paymentInitFailBody);
        return;
      }
      setCheckoutIdempotencyKey(idempotencyKey);
      setPlatformPayClientSecret(secret);
      setCheckoutPackId(packId);
    } finally {
      setLoadingPackId(null);
    }
  };

  const tryBuyVirtualItem = async (item: { id: string; title: string; priceXu: number }) => {
    if (!walletUnlocked) {
      Alert.alert(w.walletLockedTitle, w.walletLockedBody);
      return;
    }
    if (wallet.credits < item.priceXu) {
      Alert.alert('Không đủ VIG Token', `Bạn cần ${item.priceXu} VIG Token để mua "${item.title}". Nạp thêm VIG Token để tiếp tục.`);
      return;
    }
    const backendOk = Boolean(process.env.EXPO_PUBLIC_BACKEND_API_BASE?.trim());
    if (!backendOk) {
      Alert.alert(
        'Kết nối máy chủ',
        'Mua vật phẩm bằng VIG Token cần API ví an toàn. Khi máy chủ được bật, giao dịch sẽ ghi nhận tự động trên lịch sử ví.'
      );
      return;
    }
    setCosmeticLoadingId(item.id);
    try {
      const idempotencyKey = `virtual-${item.id}-${user.phone}-${Date.now()}`;
      const { ok } = await reserveAndCommitCredits(item.priceXu, idempotencyKey);
      if (!ok) {
        Alert.alert('Không thể mua', 'Máy chủ từ chối giao dịch. Kiểm tra số dư hoặc thử lại sau.');
        return;
      }
      Alert.alert('Thành công', `Đã mở khóa: ${item.title}. Hiển thị trên hồ sơ khi đồng bộ hoàn tất.`);
    } finally {
      setCosmeticLoadingId(null);
    }
  };

  const runNativePay = async () => {
    if (!checkoutPack) return;
    setTopupPending(true);
    const showPaymentFailure = (message: string) => {
      setPaymentFailureMessage(message);
      setTopupPending(false);
    };
    try {
      const walletPackageId = checkoutPack.id;
      const verified = await pollTopupCreditEntitlement(
        toTopupVerifyRequest({
          country,
          walletPackageId,
          idempotencyKey: checkoutIdempotencyKey ?? undefined,
        })
      );
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
        setCheckoutPackId(null);
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
      const topup = await topupCreditsServer(checkoutPack.turns, paymentEventId);
      if (!topup.ok) {
        showPaymentFailure(w.creditsNotCreditedBody);
        Alert.alert(w.creditsNotCreditedTitle, w.creditsNotCreditedBody, [
          { text: w.alertLater, style: 'cancel' },
          { text: w.alertRetry, onPress: () => void runNativePay() },
        ]);
        return;
      }
      setCheckoutPackId(null);
      setCheckoutIdempotencyKey(null);
      setPlatformPayClientSecret(null);
      setTopupPending(false);
      setPaymentFailureMessage(null);
      setShowPaySuccess(true);
      void trackGrowthEvent('successful_credit_topup', {
        value: checkoutPack.turns,
        // LEGACY analytics key name: value is WalletPackageId (same semantics as payments wire `comboId`).
        meta: { comboId: checkoutPack.id, country: commercialCtx.countryCode },
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

  if (__DEV__) {
    console.log('[diag][WalletTopUp] render main ui');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.walletLayer}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>{APP_BRAND.name}</Text>
        <Text style={styles.launchHint}>{APP_BRAND.launchSubtitle}</Text>
        <Text style={styles.subtitle}>{w.screenSubtitle}</Text>

        <View style={styles.remittanceBlock}>
          <Text style={styles.remittanceKicker}>Fintech — Kiều hối</Text>
          <View style={styles.remittanceBtnOuter}>
            <Pressable
              onPress={() =>
                Alert.alert(
                  'Chuyển tiền về Việt Nam',
                  'Kênh kiều hối đang Beta. Bạn sẽ gửi ngoại tệ (theo khu vực nguồn) an toàn về tài khoản VND — đội Fintech sẽ mở đăng ký sớm.',
                  [{ text: 'Đã hiểu' }]
                )
              }
              style={({ pressed }) => [styles.remittanceBtn, pressed && { opacity: 0.9 }]}
              className={applyWebStyles('kn-neon-b2b')}
              accessibilityRole="button"
              accessibilityLabel="Chuyển tiền về Việt Nam (BETA)"
            >
              <View style={styles.betaBadge}>
                <Text style={styles.betaBadgeText}>BETA</Text>
              </View>
              <Ionicons name="earth-outline" size={22} color={theme.hybrid.onSignal} />
              <Text style={styles.remittanceBtnText}>Chuyển tiền về Việt Nam (BETA)</Text>
            </Pressable>
          </View>
          <Text style={styles.fxTicker} accessibilityLiveRegion="polite">
            Tỷ giá tham chiếu (minh họa): 1 USD ≈ 26,000 VND — neo thực tế theo FX khi kênh mở.
          </Text>
        </View>

        <Animated.View style={StyleSheet.flatten([styles.walletCardGlowWrap, walletGlowStyle])}>
          <TrustSurfaceCard cardTone="trust" watermarkOpacity={0.04} style={styles.walletCard}>
            <Text style={styles.walletBalanceLabel}>{w.balanceLabel}</Text>
            <View style={styles.balanceRow}>
              <Ionicons name="call" size={18} color={theme.hybrid.signalStrong} />
              <Text style={styles.walletBalance}>
                {interpolate(w.balanceCreditsDisplay, { credits: String(displayCredits) })}
              </Text>
            </View>
            <View style={styles.trustChip}>
              <Ionicons name="shield-checkmark" size={14} color={theme.hybrid.trustChipText} />
              <Text style={styles.trustChipLabel}>{w.trustVerifiedBadge}</Text>
            </View>
            <Text style={styles.hint}>{interpolate(w.balanceHint, { country: country || 'ZZ' })}</Text>
          </TrustSurfaceCard>
        </Animated.View>

        <Pressable
          onPress={() => navigation.navigate('CashOut')}
          style={({ pressed }) => [styles.cashOutEntry, pressed && { opacity: 0.9 }]}
          className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}
          accessibilityRole="button"
          accessibilityLabel="Quy đổi tiền mặt từ hoa hồng"
        >
          <Ionicons name="wallet-outline" size={22} color={theme.colors.primaryBright} />
          <View style={styles.cashOutEntryText}>
            <Text style={styles.cashOutEntryTitle}>Quy Đổi Tiền Mặt</Text>
            <Text style={styles.cashOutEntrySub}>Rút hoa hồng giới thiệu (Cash-Out) — kiểm soát hạn mức</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={theme.colors.primaryBright} />
        </Pressable>

        <Text style={styles.unitPrice}>
          {interpolate(w.unitPriceLine, {
            inboundName: inboundPersonaName,
            inboundPrice: getLocalPriceMeta(unitPricing.internalCallPriceCzk, country, locale).label,
            outboundName: outboundPersonaName,
            outboundPrice: getLocalPriceMeta(unitPricing.externalCallPriceCzk, country, locale).label,
          })}
        </Text>

        <View style={styles.virtualStoreSection}>
          <View style={styles.virtualStoreHeader}>
            <Ionicons name="color-wand-outline" size={22} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, styles.virtualStoreTitle]}>Cửa hàng Vật phẩm</Text>
          </View>
          <Text style={styles.virtualStoreSub}>
            Gamification & VIP — khung avatar và huy hiệu xác minh; thanh toán bằng VIG Token qua ví.
          </Text>
        </View>
        <View style={styles.virtualCard}>
          <View style={styles.virtualRowTop}>
            <View style={styles.virtualIconBubble}>
              <Ionicons name="disc-outline" size={22} color={theme.hybrid.signalStrong} />
            </View>
            <View style={styles.virtualMeta}>
              <Text style={styles.virtualItemTitle}>Khung Avatar Trống Đồng</Text>
              <Text style={styles.virtualItemSub}>Viền avatar phong cách Đông Sơn — nổi bật trên Radar & hồ sơ.</Text>
            </View>
          </View>
          <View style={styles.virtualRowBottom}>
            <Text style={styles.virtualPrice}>{B2C_AVATAR_FRAME_CREDITS} VIG Token</Text>
            <Pressable
              onPress={() =>
                void tryBuyVirtualItem({
                  id: 'bronze_drum_frame',
                  title: 'Khung Avatar Trống Đồng',
                  priceXu: B2C_AVATAR_FRAME_CREDITS,
                })
              }
              disabled={cosmeticLoadingId !== null}
              style={({ pressed }) => [
                styles.virtualBuyBtn,
                (pressed || cosmeticLoadingId !== null) && { opacity: 0.82 },
              ]}
            >
              {cosmeticLoadingId === 'bronze_drum_frame' ? (
                <ActivityIndicator size="small" color={theme.hybrid.onSignal} />
              ) : (
                <Text style={styles.virtualBuyText}>Mua</Text>
              )}
            </Pressable>
          </View>
        </View>
        <View style={styles.virtualCard}>
          <View style={styles.virtualRowTop}>
            <View style={styles.virtualIconBubble}>
              <Ionicons name="shield-checkmark" size={22} color={theme.hybrid.trustChipText} />
            </View>
            <View style={styles.virtualMeta}>
              <Text style={styles.virtualItemTitle}>Huy hiệu Xác minh Hộ chiếu</Text>
              <Text style={styles.virtualItemSub}>Huy hiệu xác minh hộ chiếu — {B2C_PASSPORT_BADGE_CREDITS_PER_YEAR} VIG Token/năm, gia hạn theo năm.</Text>
            </View>
          </View>
          <View style={styles.virtualRowBottom}>
            <Text style={styles.virtualPrice}>{B2C_PASSPORT_BADGE_CREDITS_PER_YEAR} VIG Token / năm</Text>
            <Pressable
              onPress={() =>
                void tryBuyVirtualItem({
                  id: 'passport_verified_badge',
                  title: 'Huy hiệu Xác minh Hộ chiếu (1 năm)',
                  priceXu: B2C_PASSPORT_BADGE_CREDITS_PER_YEAR,
                })
              }
              disabled={cosmeticLoadingId !== null}
              style={({ pressed }) => [
                styles.virtualBuyBtn,
                (pressed || cosmeticLoadingId !== null) && { opacity: 0.82 },
              ]}
            >
              {cosmeticLoadingId === 'passport_verified_badge' ? (
                <ActivityIndicator size="small" color={theme.hybrid.onSignal} />
              ) : (
                <Text style={styles.virtualBuyText}>Mua</Text>
              )}
            </Pressable>
          </View>
        </View>

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

        {walletPackCards.map((pack) => (
          <View key={pack.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.planName}>{pack.name}</Text>
              <Text style={styles.turns}>
                {pack.purchasable ? u.packTurnsCredits.replace('{turns}', String(pack.turns)) : '—'}
              </Text>
            </View>
            <Text style={styles.gift}>{interpolate(w.giftLine, { gift: pack.gift })}</Text>
            <Text style={styles.price}>{interpolate(w.packPriceLine, { amount: pack.amountLabel })}</Text>
            {pack.purchasable ? (
              <Pressable
                onPress={() => {
                  void openCheckout(pack.id);
                }}
                disabled={loadingPackId === pack.id}
                style={({ pressed }) => [
                  styles.buyButton,
                  loadingPackId === pack.id && styles.buyButtonDisabled,
                  pressed && { opacity: 0.82 },
                ]}
              >
                {loadingPackId === pack.id ? (
                  <View style={styles.buyLoadingRow}>
                    <ActivityIndicator size="small" color={theme.hybrid.onSignal} />
                    <Text style={styles.buyButtonText}>{w.buyInitInProgress}</Text>
                  </View>
                ) : (
                  <Text style={styles.buyButtonText}>
                    {interpolate(w.buyPackCtaLine, {
                      turns: String(pack.turns),
                      amount: pack.amountLabel,
                    })}
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
                    color={tx.type === 'topup' ? theme.hybrid.signalStrong : theme.colors.text.primary}
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
                  {tx.amount} VIG Token
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
      {!WALLET_DIAGNOSTIC_SKIP_PREMIUM_CHECKOUT_SHEET ? (
        <PremiumCheckoutSheet
          visible={!!checkoutPack}
          amountLabel={checkoutPack?.amountLabel ?? ''}
          amountValue={checkoutPack?.amount ?? 0}
          currencyCode={checkoutPack?.currencyCode ?? commercialCtx.displayCurrency}
          merchantCountryCode={commercialCtx.merchantCountryCode}
          platformPayClientSecret={platformPayClientSecret ?? undefined}
          onClose={() => {
            setCheckoutPackId(null);
            setCheckoutIdempotencyKey(null);
            setPlatformPayClientSecret(null);
          }}
          onNativePayPress={() => {
            void runNativePay();
          }}
          onFallbackPayPress={() => {
            setCheckoutPackId(null);
            setCheckoutIdempotencyKey(null);
            setPlatformPayClientSecret(null);
            Alert.alert(w.closeCheckoutTitle, w.closeCheckoutBody);
          }}
        />
      ) : null}
      {topupPending ? (
        <View style={styles.pendingOverlay}>
          <ActivityIndicator size="small" color={theme.hybrid.signal} />
          <Text style={styles.pendingText}>{w.pendingVerifyText}</Text>
        </View>
      ) : null}
      <SuccessCheckmark3D visible={showPaySuccess} onClose={onPaySuccessClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  walletLayer: { flex: 1, position: 'relative' },
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 10,
    paddingBottom: 120,
  },
  brand: {
    fontSize: theme.typeScale.h1.fontSize,
    fontFamily: theme.typeScale.h1.fontFamily,
    color: theme.colors.text.primary,
  },
  launchHint: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: theme.typeScale.h2.fontSize,
    fontFamily: theme.typeScale.h2.fontFamily,
    color: theme.hybrid.signal,
  },
  historyFootnote: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
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
    borderColor: theme.hybrid.signalSubtleBorder,
    shadowColor: theme.hybrid.signal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  cashOutEntry: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  cashOutEntryText: {
    flex: 1,
    gap: 4,
  },
  cashOutEntryTitle: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
  },
  cashOutEntrySub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.hybrid.panelCoolTextMuted,
  },
  walletBalanceLabel: {
    fontSize: 13,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.semibold,
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 26,
    color: theme.hybrid.panelCoolText,
    fontFamily: FontFamily.extrabold,
    letterSpacing: -0.3,
  },
  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.hybrid.trustChipBg,
    borderWidth: 1,
    borderColor: theme.hybrid.trustChipBorder,
  },
  trustChipLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: theme.hybrid.trustChipText,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hint: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
    color: theme.hybrid.panelCoolTextMuted,
  },
  remittanceBlock: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  remittanceKicker: {
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'center',
  },
  remittanceBtnOuter: {
    borderRadius: theme.radius.lg + 4,
    padding: 3,
    backgroundColor: 'rgba(197, 160, 89, 0.25)',
    shadowColor: theme.colors.primaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 10,
  },
  remittanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 56,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.hybrid.signalStrong,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryBright,
    shadowColor: theme.hybrid.signalStrong,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 22,
    elevation: 14,
  },
  betaBadge: {
    position: 'absolute',
    top: -12,
    right: 10,
    minHeight: 24,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.RouteError,
    borderWidth: 2,
    borderColor: '#FFE082',
    shadowColor: '#FF7043',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 14,
    elevation: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  betaBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.CeolWhite,
    letterSpacing: 0.6,
  },
  remittanceBtnText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: theme.hybrid.onSignal,
  },
  fxTicker: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: theme.colors.primaryBright,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.35)',
    overflow: 'hidden',
  },
  unitPrice: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  virtualStoreSection: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.08)',
  },
  virtualStoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  virtualStoreTitle: {
    marginTop: 0,
    marginBottom: 0,
    flex: 1,
  },
  virtualStoreSub: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  virtualCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: theme.colors.surfaceMuted,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  virtualRowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  virtualIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.hybrid.signalMutedBg,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
  },
  virtualMeta: {
    flex: 1,
    gap: 4,
  },
  virtualItemTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  virtualItemSub: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  virtualRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  virtualPrice: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primary,
  },
  virtualBuyBtn: {
    minWidth: 88,
    minHeight: 40,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  virtualBuyText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.hybrid.onSignal,
  },
  paymentFailureState: {
    marginTop: 10,
    marginBottom: 2,
  },
  card: {
    marginTop: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: theme.hybrid.panelCool,
    padding: theme.spacing.md,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: { fontSize: 20, color: theme.hybrid.panelCoolText, fontFamily: FontFamily.extrabold },
  turns: { fontSize: 13, color: theme.hybrid.panelCoolTextMuted, fontFamily: FontFamily.regular },
  gift: {
    fontSize: 12,
    color: theme.hybrid.signatureGold,
    fontFamily: FontFamily.medium,
    marginBottom: 2,
  },
  price: { fontSize: 16, color: theme.hybrid.panelCoolText, marginTop: 2, fontFamily: FontFamily.semibold },
  buyButton: {
    marginTop: 12,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
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
    color: theme.hybrid.onSignal,
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
  enterpriseCta: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.medium,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 16,
    color: theme.colors.text.primary,
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
    backgroundColor: theme.hybrid.signalMutedBg,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
  },
  segmentText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
  },
  segmentTextActive: {
    color: theme.hybrid.signal,
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
    backgroundColor: theme.hybrid.chipProcessingBg,
  },
  txIconConsume: {
    backgroundColor: theme.hybrid.chipErrorBg,
  },
  txBody: {
    flex: 1,
    paddingRight: 8,
  },
  txDescription: {
    fontSize: 13,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.medium,
    marginBottom: 2,
  },
  txDate: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  txAmount: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  txAmountTopup: {
    color: theme.hybrid.signal,
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
    borderColor: theme.hybrid.signalSubtleBorder,
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
