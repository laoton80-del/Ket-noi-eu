import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppImage } from '../components/ui/AppImage';
import { AppButton } from '../components/AppButton';
import { AuthPaywallModal } from '../components/AuthPaywallModal';
import { PersonaOnboardingModal } from '../components/PersonaOnboardingModal';
import { ProactiveSuggestions } from '../components/ProactiveSuggestions';
import { CharityWidget } from '../components/ui/CharityWidget';
import { VionaCard } from '../components/viona/VionaCard';
import { VionaSectionHeader } from '../components/viona/VionaSectionHeader';
import { vionaTrust } from '../components/viona/vionaTrustTokens';
import {
  getConfiguredAdminDebugPin,
  isAdminDebugPinConfigured,
  isAdminDebugSurfaceEnabled,
} from '../config/adminDebugGate';
import { brandConfig } from '../core/brand/brandConfig';
import { getFeatureFlags } from '../core/feature-flags/featureFlags';
import { useMiniAppEntry } from '../hooks/useMiniAppEntry';
import { getVioPointsLabel } from '../core/monetization/vioDisplayLabels';
import { getPersonaDisplayName } from '../config/aiPrompts';
import { useAuth } from '../context/AuthContext';
import { MVP_B2B_AI_RECEPTIONIST_DEMO_OFF_MSG } from '../navigation/mvpSurfaceGate';
import type { RootStackParamList } from '../navigation/routes';
import { getRestApiJwt, isRestApiConfigured } from '../services/apiClient';
import { patchUserPersonaOnServer } from '../services/viGlobalUserPersonaApi';
import { fetchBalance } from '../services/viGlobalWalletApi';
import { useWalletState } from '../state/wallet';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';
import { useTranslation } from '../i18n';
import { DashboardB2CScreen } from './b2c/DashboardB2CScreen';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const IMG_LOGO = require('../../assets/brand/viona/logo-in-app.png');
const ADMIN_UNLOCK_KEY = STORAGE_KEYS.adminUnlock;
/** Clean Tech Trust — light canvas, ink text, gold accent. */
const SCREEN_BG = vionaTrust.canvas;
const CARD_BG = vionaTrust.surface;
const GOLD_ACCENT = vionaTrust.accentGold;
const GOLD_BORDER = vionaTrust.accentGoldLine;
const TEXT_PRIMARY = vionaTrust.ink;
const TEXT_MUTED = vionaTrust.inkMuted;

type BriefingCard = Readonly<{
  id: string;
  headline: string;
  sub: string;
}>;
type UniverseCard = Readonly<{
  id: 'local' | 'travel' | 'academy';
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}>;

export function HomeScreen() {
  const { t } = useTranslation();
  const { openMiniApp } = useMiniAppEntry();
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const { user, setPendingRedirect, updateProfile } = useAuth();
  const isTourist = user?.persona === 'TOURIST';
  const featureFlags = useMemo(() => getFeatureFlags(), []);
  const [personaModalVisible, setPersonaModalVisible] = useState(false);
  const wallet = useWalletState();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const tapsRef = useRef<number[]>([]);
  const inboundPersonaName = getPersonaDisplayName('loan');
  const outboundPersonaName = getPersonaDisplayName('leona');
  const [clockTick, setClockTick] = useState(() => new Date());
  const [walletBalanceLoading, setWalletBalanceLoading] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setClockTick(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) setPersonaModalVisible(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        if (!isRestApiConfigured()) return;
        const jwt = await getRestApiJwt();
        if (!jwt?.trim()) return;
        setWalletBalanceLoading(true);
        try {
          const r = await fetchBalance();
          if (!cancelled && !r.ok && __DEV__) {
            console.warn('[HomeScreen] REST wallet balance:', r.error);
          }
        } finally {
          if (!cancelled) setWalletBalanceLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (user?.needsPersonaOnboarding === true) setPersonaModalVisible(true);
    }, [user?.needsPersonaOnboarding])
  );

  const applyPersonaChoice = useCallback(
    (persona: 'EXPAT' | 'TOURIST') => {
      void patchUserPersonaOnServer(persona);
      updateProfile({ persona, needsPersonaOnboarding: false });
      setPersonaModalVisible(false);
    },
    [updateProfile]
  );

  const localClock = useMemo(
    () => clockTick.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    [clockTick]
  );
  const vnClock = useMemo(
    () =>
      clockTick.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh',
      }),
    [clockTick]
  );

  const briefingCards = useMemo((): readonly BriefingCard[] => {
    const all: readonly BriefingCard[] = [
      {
        id: 'b1',
        headline: t('home.briefingB1h'),
        sub: t('home.briefingB1s'),
      },
      {
        id: 'b2',
        headline: t('home.briefingB2h'),
        sub: t('home.briefingB2s'),
      },
      {
        id: 'b3',
        headline: t('home.briefingB3h'),
        sub: t('home.briefingB3s'),
      },
      {
        id: 'b4',
        headline: t('home.briefingB4h'),
        sub: t('home.briefingB4s'),
      },
    ];
    if (isTourist) return all.filter((c) => c.id !== 'b1' && c.id !== 'b4');
    return all;
  }, [isTourist, t]);
  const universeCards = useMemo(
    (): readonly UniverseCard[] => [
      {
        id: 'local',
        title: t('home.universe.localTitle'),
        subtitle: t('home.universe.localSub'),
        icon: 'grid-outline',
      },
      {
        id: 'travel',
        title: t('home.universe.travelTitle'),
        subtitle: t('home.universe.travelSub'),
        icon: 'airplane-outline',
      },
      {
        id: 'academy',
        title: t('home.universe.academyTitle'),
        subtitle: t('home.universe.academySub'),
        icon: 'sparkles-outline',
      },
    ],
    [t]
  );

  const walletChipLabel = useMemo(() => {
    const n = wallet.credits;
    const useCompact = width < 400;
    return useCompact ? t('home.walletChipCompact', { amount: n }) : t('home.walletChipFull', { amount: n });
  }, [t, wallet.credits, width]);

  const layout = useMemo(() => {
    const isDesktopWeb = width > 1024;
    const maxShell = isDesktopWeb ? 1360 : 760;
    const shellWidth = isDesktopWeb ? Math.min(width - 28, maxShell) : Math.min(width, maxShell);
    const pad = theme.spacing.lg;
    const inner = shellWidth - pad * 2;
    return { shellWidth, pad, inner, isDesktopWeb };
  }, [width]);

  const creditPillMax = useMemo(() => Math.min(width * 0.9, 300), [width]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        if (!isAdminDebugSurfaceEnabled()) {
          await AsyncStorage.removeItem(ADMIN_UNLOCK_KEY);
          setAdminUnlocked(false);
          return;
        }
        const raw = await AsyncStorage.getItem(ADMIN_UNLOCK_KEY);
        setAdminUnlocked(raw === '1');
      })();
    }, [])
  );

  const openProtected = useCallback(
    (target: 'Wallet' | 'AiEye' | 'LeonaCall' | 'Vault') => {
      if (target === 'AiEye' && !featureFlags.b2bAiReceptionistDemoEnabled) {
        Alert.alert('B2B AI Receptionist (demo)', MVP_B2B_AI_RECEPTIONIST_DEMO_OFF_MSG);
        return;
      }
      if (target === 'LeonaCall') {
        if (!user) {
          setPendingRedirect('LeonaCall');
          setShowPaywall(true);
          return;
        }
        openMiniApp('b2cAiCallAssistant', () => navigation.navigate('LeonaCall'));
        return;
      }
      if (!user) {
        setPendingRedirect(target);
        setShowPaywall(true);
        return;
      }
      navigation.navigate(target);
    },
    [
      featureFlags.b2bAiReceptionistDemoEnabled,
      navigation,
      openMiniApp,
      setPendingRedirect,
      user,
    ]
  );

  const openInterpreter = useCallback(() => {
    if (!user) {
      setPendingRedirect('LiveInterpreter');
      setShowPaywall(true);
      return;
    }
    openMiniApp('minhKhangTranslator', () =>
      navigation.navigate('LiveInterpreter', { guidedEntry: true, scenario: 'general' })
    );
  }, [navigation, openMiniApp, setPendingRedirect, user]);

  const onSecretTap = useCallback(() => {
    if (!isAdminDebugSurfaceEnabled()) return;
    const now = Date.now();
    const recent = [...tapsRef.current, now].filter((t) => now - t <= 3000);
    tapsRef.current = recent;
    if (recent.length >= 5) {
      tapsRef.current = [];
      if (adminUnlocked) {
        navigation.navigate('AdminDashboard');
        return;
      }
      setPinInput('');
      setPinError('');
      setShowPin(true);
    }
  }, [adminUnlocked, navigation]);

  const onSelectProactive = useCallback(
    (question: string, persona: 'leona' | 'loan') => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (!user) {
        setPendingRedirect(persona === 'loan' ? 'LeTan' : 'LeonaCall');
        setShowPaywall(true);
        return;
      }
      if (persona === 'loan') {
        openMiniApp('academy', () =>
          navigation.navigate('Tabs', {
            screen: 'TabAi',
            params: { proactiveQuestion: question, autoSimulate: true },
          })
        );
        return;
      }
      openMiniApp('b2cAiCallAssistant', () =>
        navigation.navigate('LeonaCall', { prefillRequest: question, autoSubmit: true })
      );
    },
    [navigation, openMiniApp, setPendingRedirect, user]
  );

  return (
    <View style={styles.rootFill}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: layout.pad,
            paddingBottom: 120,
            width: layout.shellWidth,
            alignSelf: layout.isDesktopWeb ? 'flex-start' : 'center',
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroCopyCol}>
              <Text style={styles.heroEyebrow}>{t('home.universe.eyebrow')}</Text>
              <Text style={styles.heading}>{t('home.universe.title')}</Text>
              <Text style={styles.heroSub}>{t('home.universe.subtitle')}</Text>
            </View>
            <View style={[styles.creditPill, isTourist && styles.creditPillTourist, { maxWidth: creditPillMax }]}>
              <View style={styles.creditPillRow}>
                {walletBalanceLoading ? (
                  <ActivityIndicator size="small" color={GOLD_ACCENT} accessibilityLabel="Đang tải số dư" />
                ) : (
                  <Ionicons name="wallet-outline" size={14} color={GOLD_ACCENT} />
                )}
                <Text
                  style={styles.creditPillText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                  maxFontSizeMultiplier={1.15}
                >
                  {walletChipLabel}
                </Text>
              </View>
              {isTourist && !walletBalanceLoading ? (
                <Text style={styles.creditPillSub} numberOfLines={2}>
                  {t('home.touristCreditsHint')}
                </Text>
              ) : null}
            </View>
          </View>
          <VionaCard style={styles.multiverseHeroCard} padded>
            <View style={styles.multiverseGlow} pointerEvents="none" />
            <Text style={styles.multiverseEyebrow}>{brandConfig.displayName}</Text>
            <Text style={styles.multiverseHeadline}>{t('home.universe.eyebrow')}</Text>
            <Text style={styles.multiverseSubheadline}>{t('home.universe.subheadline')}</Text>
            <View style={styles.multiverseGrid}>
              {universeCards.map((card) => (
                <View key={card.id} style={styles.universeCard}>
                  <View style={styles.universeIconWrap}>
                    <Ionicons name={card.icon} size={18} color={GOLD_ACCENT} />
                  </View>
                  <Text style={styles.universeTitle}>{card.title}</Text>
                  <Text style={styles.universeSubtitle}>{card.subtitle}</Text>
                </View>
              ))}
            </View>
          </VionaCard>
        </View>

        <View style={[styles.charityWrap, { width: layout.inner }]}>
          <CharityWidget />
        </View>

        {isTourist ? <DashboardB2CScreen contentWidth={layout.inner} /> : null}

        {isTourist && featureFlags.leonaAssistantEnabled ? (
          <VionaCard style={{ width: layout.inner, marginBottom: theme.spacing.lg }} padded>
            <VionaSectionHeader title={t('home.survivalTitle')} subtitle={t('home.survivalSub')} />
            <View style={styles.survivalRow}>
              <Pressable
                onPress={openInterpreter}
                style={({ pressed }) => [styles.survivalChip, styles.survivalChipPrimary, pressed && { opacity: 0.9 }]}
                accessibilityRole="button"
                accessibilityLabel={t('home.liveInterpreter')}
              >
                <Ionicons name="mic" size={20} color={theme.hybrid.signalStrong} />
                <Text style={styles.survivalChipText}>{t('home.liveInterpreter')}</Text>
              </Pressable>
              <Pressable
                onPress={() => openProtected('LeonaCall')}
                style={({ pressed }) => [styles.survivalChip, styles.survivalChipPrimary, pressed && { opacity: 0.9 }]}
                accessibilityRole="button"
                accessibilityLabel={t('home.aiVoiceLine')}
              >
                <Ionicons name="call" size={20} color={theme.hybrid.signalStrong} />
                <Text style={styles.survivalChipText}>{t('home.aiVoiceLine')}</Text>
              </Pressable>
            </View>
          </VionaCard>
        ) : null}

        <View style={[styles.actionCenter, { width: layout.inner }]}>
          <Pressable
            onPress={() => openProtected('Wallet')}
            style={({ pressed }) => [styles.actionWidget, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityLabel={t('home.qrPayA11y')}
          >
            <Ionicons name="qr-code" size={22} color={GOLD_ACCENT} />
            <Text style={styles.actionWidgetTitle}>{t('home.qrPayTitle')}</Text>
            <Text style={styles.actionWidgetSub}>{t('home.qrPaySub')}</Text>
          </Pressable>
          <View style={styles.actionWidget}>
            <Ionicons name="time-outline" size={22} color={GOLD_ACCENT} />
            <Text style={styles.actionWidgetTitle}>{t('home.dualClockTitle')}</Text>
            <Text style={styles.actionWidgetSub}>
              {t('home.dualClockLocalLabel')} {localClock}
            </Text>
            <Text style={styles.actionWidgetSub}>
              {t('home.dualClockVnLabel')} {vnClock}
            </Text>
          </View>
          {featureFlags.vigTokenEconomyEnabled ? (
            <Pressable
              onPress={() => navigation.navigate('LoyaltyRewards')}
              style={({ pressed }) => [styles.actionWidget, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel={`${getVioPointsLabel()} index`}
            >
              <Ionicons name="trending-up" size={22} color={GOLD_ACCENT} />
              <Text style={styles.actionWidgetTitle}>
                {t('home.vioIndexTitle', { label: getVioPointsLabel() })}
              </Text>
              <Text style={styles.actionWidgetSub}>{t('home.vioIndexSub')}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.briefingBlock, { width: layout.inner }]}>
          <Text style={styles.briefingTitle}>{t('home.briefingTitle')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.briefingRail}>
            {briefingCards.map((card) => (
              <Pressable
                key={card.id}
                onPress={() =>
                  Alert.alert(card.headline, `${card.sub}\n\n${t('home.briefingAlertDemo')}`)
                }
                style={({ pressed }) => [styles.briefingCard, pressed && { opacity: 0.9 }]}
                accessibilityRole="button"
                accessibilityLabel={card.headline}
              >
                <Text style={styles.briefingHeadline} numberOfLines={2}>
                  {card.headline}
                </Text>
                <Text style={styles.briefingSub} numberOfLines={2}>
                  {card.sub}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {featureFlags.academyLiteEnabled || featureFlags.leonaAssistantEnabled ? (
          <ProactiveSuggestions onSelect={onSelectProactive} />
        ) : null}

        <VionaCard style={{ width: layout.inner, marginBottom: theme.spacing.lg }} padded>
          <View style={styles.featureRow}>
            <Pressable
              onPress={isAdminDebugSurfaceEnabled() ? onSecretTap : undefined}
              style={({ pressed }) => [styles.logoWrap, pressed && { opacity: 0.92 }]}
            >
              <AppImage source={IMG_LOGO} style={styles.logoImage} accessibilityLabel="Logo VIONA" />
            </Pressable>
            <View style={styles.featureCopy}>
              <Text style={styles.featureTitle}>Tổng đài viên {inboundPersonaName}</Text>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Sẵn sàng hỗ trợ</Text>
              </View>
              {isAdminDebugSurfaceEnabled() && adminUnlocked ? (
                <View style={styles.adminBadge}>
                  <Ionicons name="shield-checkmark" size={14} color={theme.hybrid.signalStrong} />
                  <Text style={styles.adminBadgeText}>{t('home.adminUnlockedBadge')}</Text>
                </View>
              ) : null}
              {isAdminDebugSurfaceEnabled() ? (
                <Text style={styles.debugHint}>Gợi ý: chạm nhanh logo 5 lần để mở khu vực quản trị (dev).</Text>
              ) : null}
            </View>
          </View>
        </VionaCard>

        {!isTourist ? <DashboardB2CScreen contentWidth={layout.inner} /> : null}

        <VionaCard style={{ width: layout.inner, marginBottom: theme.spacing.lg }} padded>
          <Text style={styles.utilityStripTitle}>{t('home.utilityShortcutsTitle')}</Text>
          <View style={styles.utilityRow}>
            <Pressable
              onPress={() => openProtected('Vault')}
              style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.hybrid.signalStrong} />
              <Text style={styles.utilityChipText}>{t('home.vaultChipLabel')}</Text>
            </Pressable>
            {featureFlags.travelEnabled ? (
              <Pressable
                onPress={() =>
                  openMiniApp('travel', () => navigation.navigate('TravelCompanion'))
                }
                style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
              >
                <Ionicons name="airplane-outline" size={18} color={theme.hybrid.signalStrong} />
                <Text style={styles.utilityChipText}>Đồng hành</Text>
              </Pressable>
            ) : null}
            {featureFlags.b2bAiReceptionistDemoEnabled ? (
              <Pressable
                onPress={() => openProtected('AiEye')}
                style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
              >
                <Ionicons name="scan-outline" size={18} color={theme.hybrid.signalStrong} />
                <Text style={styles.utilityChipText}>Mắt Thần</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => openProtected('Wallet')}
              style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="wallet-outline" size={18} color={theme.hybrid.signalStrong} />
              <Text style={styles.utilityChipText}>Ví</Text>
            </Pressable>
            {featureFlags.leonaAssistantEnabled ? (
              <Pressable
                onPress={() => openProtected('LeonaCall')}
                style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
              >
                <Ionicons name="call-outline" size={18} color={theme.hybrid.signalStrong} />
                <Text style={styles.utilityChipText}>{outboundPersonaName}</Text>
              </Pressable>
            ) : null}
          </View>
        </VionaCard>
      </ScrollView>

      <PersonaOnboardingModal
        visible={personaModalVisible}
        onPickExpat={() => applyPersonaChoice('EXPAT')}
        onPickTourist={() => applyPersonaChoice('TOURIST')}
      />

      <AuthPaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onContinue={() => {
          setShowPaywall(false);
          navigation.navigate('Login');
        }}
      />

      {isAdminDebugSurfaceEnabled() && showPin ? (
        <View style={styles.pinOverlay}>
          <View style={[styles.pinCard, { maxWidth: Math.min(width - 48, 400) }]}>
            <Text style={styles.pinTitle}>Super Admin</Text>
            <Text style={styles.pinHint}>
              Nhập mã PIN cấu hình qua biến môi trường build (không dùng mặc định trong mã nguồn).
            </Text>
            <TextInput
              value={pinInput}
              onChangeText={setPinInput}
              placeholder="PIN"
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={64}
              secureTextEntry
              style={styles.pinInput}
              placeholderTextColor={theme.hybrid.panelCoolTextMuted}
            />
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <AppButton
              label="Mở Dashboard"
              variant="danger"
              onPress={() => {
                if (!isAdminDebugPinConfigured()) {
                  setPinError(
                    'Admin PIN chỉ hỗ trợ trong build dev và yêu cầu EXPO_PUBLIC_ADMIN_PIN >= 12 ký tự.'
                  );
                  return;
                }
                const expected = getConfiguredAdminDebugPin();
                if (pinInput === expected) {
                  setShowPin(false);
                  setAdminUnlocked(true);
                  void AsyncStorage.setItem(ADMIN_UNLOCK_KEY, '1');
                  navigation.navigate('AdminDashboard');
                  return;
                }
                setPinError('Sai PIN');
              }}
            />
            <AppButton label="Hủy" variant="ghost" onPress={() => setShowPin(false)} />
          </View>
        </View>
      ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootFill: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingTop: theme.spacing.md,
  },
  hero: {
    marginBottom: theme.spacing.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroCopyCol: {
    flex: 1,
    minWidth: 0,
  },
  heroEyebrow: {
    fontSize: 11,
    letterSpacing: 0.8,
    color: GOLD_ACCENT,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  heading: {
    fontSize: 34,
    lineHeight: 40,
    color: TEXT_PRIMARY,
    fontFamily: FontFamily.extrabold,
    marginBottom: theme.spacing.xs,
  },
  heroSub: {
    fontSize: 15,
    lineHeight: 22,
    color: TEXT_MUTED,
    fontFamily: FontFamily.regular,
  },
  multiverseHeroCard: {
    marginTop: 12,
    borderRadius: 24,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'rgba(255,252,246,0.97)',
    overflow: 'hidden',
    shadowColor: '#9C7D2F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  multiverseGlow: {
    position: 'absolute',
    top: -70,
    right: -40,
    width: 220,
    height: 170,
    borderRadius: 110,
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
  },
  multiverseEyebrow: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(130, 92, 20, 0.9)',
    fontFamily: FontFamily.semibold,
    marginBottom: 6,
  },
  multiverseHeadline: {
    fontSize: 29,
    lineHeight: 35,
    color: TEXT_PRIMARY,
    fontFamily: FontFamily.extrabold,
  },
  multiverseSubheadline: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_MUTED,
    fontFamily: FontFamily.medium,
  },
  multiverseGrid: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  universeCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(128, 94, 28, 0.2)',
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 12,
    paddingVertical: 13,
    minHeight: 122,
  },
  universeIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    marginBottom: 8,
  },
  universeTitle: {
    fontSize: 14,
    lineHeight: 19,
    color: TEXT_PRIMARY,
    fontFamily: FontFamily.bold,
  },
  universeSubtitle: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: TEXT_MUTED,
    fontFamily: FontFamily.medium,
  },
  creditPill: {
    minWidth: 170,
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    backgroundColor: CARD_BG,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  creditPillTourist: {
    borderColor: 'rgba(212, 175, 55, 0.85)',
    shadowOpacity: 0.12,
  },
  creditPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  creditPillText: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    fontFamily: FontFamily.semibold,
    flexShrink: 1,
    minWidth: 0,
  },
  creditPillSub: {
    fontSize: 10,
    lineHeight: 13,
    color: GOLD_ACCENT,
    fontFamily: FontFamily.semibold,
    textAlign: 'left',
    maxWidth: 168,
  },
  survivalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  survivalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: vionaTrust.border,
    backgroundColor: vionaTrust.surfaceMuted,
    flexGrow: 1,
    minWidth: 140,
  },
  survivalChipPrimary: {
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.hybrid.signalMutedBg,
  },
  survivalChipText: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    fontFamily: FontFamily.bold,
    flexShrink: 1,
  },
  actionCenter: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 12,
    marginBottom: theme.spacing.lg,
  },
  actionWidget: {
    flex: 1,
    minHeight: 104,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: vionaTrust.border,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  actionWidgetTitle: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    color: TEXT_PRIMARY,
  },
  actionWidgetSub: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  briefingBlock: {
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  briefingTitle: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.6,
    color: TEXT_PRIMARY,
    marginBottom: 10,
  },
  briefingRail: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 4,
    paddingBottom: 4,
  },
  briefingCard: {
    width: 220,
    minHeight: 92,
    borderRadius: 16,
    padding: 14,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: vionaTrust.border,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  briefingHeadline: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: TEXT_PRIMARY,
    marginBottom: 6,
    lineHeight: 18,
  },
  briefingSub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: TEXT_MUTED,
    lineHeight: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  logoWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: vionaTrust.border,
    width: 128,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: vionaTrust.surfaceMuted,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    backgroundColor: 'transparent',
  },
  featureCopy: {
    flex: 1,
    minWidth: 0,
  },
  featureTitle: {
    fontSize: 16,
    color: TEXT_PRIMARY,
    fontFamily: FontFamily.bold,
    marginBottom: 6,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  onlineText: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontFamily: FontFamily.medium,
  },
  adminBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.hybrid.signalMutedBg,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    marginBottom: 6,
  },
  adminBadgeText: {
    fontSize: 12,
    color: theme.hybrid.signalStrong,
    fontFamily: FontFamily.semibold,
  },
  debugHint: {
    fontSize: 11,
    lineHeight: 16,
    color: TEXT_MUTED,
    fontFamily: FontFamily.regular,
  },
  charityWrap: {
    marginTop: 0,
    marginBottom: 8,
    alignSelf: 'center',
    maxWidth: 680,
    opacity: 0.95,
  },
  utilityStripTitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontFamily: FontFamily.semibold,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  utilityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  utilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: vionaTrust.border,
    backgroundColor: vionaTrust.surfaceMuted,
  },
  utilityChipText: {
    fontSize: 12,
    color: TEXT_PRIMARY,
    fontFamily: FontFamily.semibold,
  },
  pinOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 22, 40, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pinCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: vionaTrust.border,
    backgroundColor: CARD_BG,
    padding: theme.spacing.lg,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  pinTitle: {
    fontSize: 20,
    color: TEXT_PRIMARY,
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
  },
  pinHint: {
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_MUTED,
    fontFamily: FontFamily.regular,
    marginBottom: 10,
  },
  pinInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: vionaTrust.border,
    backgroundColor: vionaTrust.surfaceMuted,
    paddingHorizontal: 12,
    color: TEXT_PRIMARY,
    fontFamily: FontFamily.bold,
    marginBottom: 8,
  },
  pinError: {
    fontSize: 12,
    color: theme.colors.danger,
    fontFamily: FontFamily.regular,
    marginBottom: 8,
  },
});
