import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppImage } from '../components/ui/AppImage';
import { AppButton } from '../components/AppButton';
import { AuthPaywallModal } from '../components/AuthPaywallModal';
import { PersonaOnboardingModal } from '../components/PersonaOnboardingModal';
import { ProactiveSuggestions } from '../components/ProactiveSuggestions';
import { CharityWidget } from '../components/ui/CharityWidget';
import {
  VionaFashionHomeCommandBar,
  VionaFashionWorldCard,
} from '../components/viona';
import { VionaCard } from '../components/viona/VionaCard';
import { VionaSectionHeader } from '../components/viona/VionaSectionHeader';
import { VionaSurface } from '../components/viona/VionaSurface';
import { vionaTrust } from '../components/viona/vionaTrustTokens';
import {
  getConfiguredAdminDebugPin,
  isAdminDebugPinConfigured,
  isAdminDebugSurfaceEnabled,
} from '../config/adminDebugGate';
import { getFeatureFlags } from '../core/feature-flags/featureFlags';
import { useMiniAppEntry } from '../hooks/useMiniAppEntry';
import { useHomeCommand } from '../context/HomeCommandContext';
import { getVioPointsLabel } from '../core/monetization/vioDisplayLabels';
import { getPersonaDisplayName } from '../config/aiPrompts';
import { useAuth } from '../context/AuthContext';
import { MVP_B2B_AI_RECEPTIONIST_DEMO_OFF_MSG } from '../navigation/mvpSurfaceGate';
import { isFashionHomeDesktopShell } from '../navigation/fashionHomeDesktopShell';
import { MAIN_TAB, type RootStackParamList } from '../navigation/routes';
import { vionaTokens } from '../design';
import { getRestApiJwt, isRestApiConfigured } from '../services/apiClient';
import { patchUserPersonaOnServer } from '../services/viGlobalUserPersonaApi';
import { fetchBalance } from '../services/viGlobalWalletApi';
import { useWalletState } from '../state/wallet';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';
import { useTranslation } from '../i18n';
import { useUserStore } from '../store/userStore';
import { hasB2BWorkspaceAccess } from '../utils/b2bAccess';
import { DashboardB2CScreen } from './b2c/DashboardB2CScreen';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const IMG_LOGO = require('../../assets/brand/viona/logo-in-app.png');
const ADMIN_UNLOCK_KEY = STORAGE_KEYS.adminUnlock;
/** World Stage — light canvas (aurora gradient applied in hero). */
const SCREEN_BG = vionaTokens.gradients.multiverseHero[0];
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

function FashionTechHeroVisualSlot(): ReactElement {
  const { t } = useTranslation();
  const dots = useMemo(
    () =>
      [
        { top: '20%', left: '14%', s: 5, o: 0.9 },
        { top: '28%', left: '78%', s: 4, o: 0.45 },
        { top: '52%', left: '22%', s: 3, o: 0.65 },
        { top: '46%', left: '58%', s: 4, o: 0.55 },
        { top: '68%', left: '84%', s: 3, o: 0.5 },
        { top: '72%', left: '38%', s: 4, o: 0.4 },
        { top: '14%', left: '48%', s: 3, o: 0.35 },
      ] as const,
    []
  );

  return (
    <View
      style={styles.ftVisualPanel}
      accessibilityRole="image"
      accessibilityLabel={t('home.fashionTech.heroVisualA11y')}
    >
      <LinearGradient
        colors={[...vionaTokens.fashionTech.visualPanelGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(201, 169, 98, 0.14)', 'transparent', 'rgba(90, 140, 210, 0.07)']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <View style={styles.ftGlowBlob} />
        <View style={styles.ftOrbitLine} />
        <View style={[styles.ftOrbitLine, styles.ftOrbitLineSecond]} />
        {dots.map((d, i) => (
          <View
            key={i}
            style={[
              styles.ftConstellationDot,
              {
                top: d.top,
                left: d.left,
                width: d.s,
                height: d.s,
                opacity: d.o,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.ftVisualCopy}>
        <Text style={styles.ftVisualCaption}>{t('home.fashionTech.visualStoryCaption')}</Text>
      </View>
    </View>
  );
}

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

  const isDesktopWeb = Platform.OS === 'web' && width > 768;
  const currentActiveRole = useUserStore((s) => s.currentActiveRole);
  const switchRole = useUserStore((s) => s.switchRole);
  const fashionHomeDesktopShellActive = useMemo(
    () =>
      isFashionHomeDesktopShell({
        platform: Platform.OS,
        windowWidth: width,
        activeRole: currentActiveRole,
        focusedTabRoute: MAIN_TAB.B2C.home,
      }),
    [currentActiveRole, width]
  );
  const walletChipLabel = useMemo(() => {
    const n = wallet.credits;
    const useCompact = width < 400;
    return useCompact ? t('home.walletChipCompact', { amount: n }) : t('home.walletChipFull', { amount: n });
  }, [t, wallet.credits, width]);

  const layout = useMemo(() => {
    const maxShell = fashionHomeDesktopShellActive
      ? width > 1500
        ? 1240
        : width > 1200
          ? 1100
          : 980
      : width > 1280
        ? 860
        : 760;
    const shellWidth = Math.min(width, maxShell);
    const pad = theme.spacing.lg;
    const inner = shellWidth - pad * 2;
    return { shellWidth, pad, inner };
  }, [fashionHomeDesktopShellActive, width]);

  const insets = useSafeAreaInsets();
  const scrollBottomPad = useMemo(() => {
    if (!isDesktopWeb) return 140;
    if (fashionHomeDesktopShellActive) return Math.max(insets.bottom, 20) + 56;
    return Math.max(insets.bottom, 16) + 48;
  }, [fashionHomeDesktopShellActive, isDesktopWeb, insets.bottom]);

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

  const goUniverseLocal = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openMiniApp('local', () => navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.local }));
  }, [navigation, openMiniApp]);

  const goUniverseTravel = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!featureFlags.travelEnabled) return;
    openMiniApp('travel', () => navigation.navigate('TravelCompanion'));
  }, [featureFlags.travelEnabled, navigation, openMiniApp]);

  const goUniverseAcademy = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openMiniApp('academy', () => navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.ai }));
  }, [navigation, openMiniApp]);

  const goUniverseBusiness = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (hasB2BWorkspaceAccess(user)) {
      switchRole('B2B');
      navigation.navigate('Tabs', { screen: MAIN_TAB.B2B.merchant });
      return;
    }
    navigation.navigate('B2BPaywall');
  }, [navigation, switchRole, user]);

  const homeCommand = useHomeCommand();
  const scrollRef = useRef<InstanceType<typeof ScrollView> | null>(null);
  const charitySectionY = useRef(0);

  const scrollToCareSection = useCallback(() => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, charitySectionY.current - 16),
      animated: true,
    });
  }, []);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const goTravelTab = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.travel });
  }, [navigation]);

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
    <View style={[styles.rootFill, isDesktopWeb && styles.rootFillFashion]}>
      <StatusBar style={isDesktopWeb ? 'light' : 'dark'} />
      {isDesktopWeb && homeCommand ? (
        <View style={[styles.fashionShellOuter, { paddingTop: insets.top }]}>
          <View
            style={[styles.fashionShellInner, { width: '100%', maxWidth: layout.shellWidth, paddingHorizontal: layout.pad }]}
          >
            <VionaFashionHomeCommandBar
              onPressLogo={scrollToTop}
              onPressLocal={goUniverseLocal}
              onPressTravel={goTravelTab}
              onPressAcademy={goUniverseAcademy}
              onPressBusiness={goUniverseBusiness}
              onPressLanguage={() => homeCommand.openLanguageSheet()}
              onPressVio={() => openProtected('Wallet')}
              onPressSafety={() => homeCommand.triggerSafetyAssist()}
              onPressAccount={() => homeCommand.openAccount()}
              onPressRole={homeCommand.showRolePicker ? () => homeCommand.openRolePicker() : undefined}
              showRolePicker={homeCommand.showRolePicker}
            />
          </View>
        </View>
      ) : null}
      <SafeAreaView style={styles.container} edges={isDesktopWeb ? ['left', 'right', 'bottom'] : ['top', 'left', 'right']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: layout.pad,
            paddingBottom: scrollBottomPad,
            paddingTop: isDesktopWeb ? theme.spacing.md : theme.spacing.md,
            width: layout.shellWidth,
            alignSelf: 'center',
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.ftHeroBleed, { marginHorizontal: -layout.pad }]}>
          <LinearGradient
            colors={[...vionaTokens.fashionTech.heroGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ftHero}
          >
            <View
              style={[
                styles.ftHeroMain,
                { flexDirection: width >= 900 ? 'row' : 'column', alignItems: width >= 900 ? 'stretch' : 'flex-start' },
              ]}
            >
              <View style={styles.ftCopyCol}>
                <Text style={styles.ftEyebrow}>{t('home.fashionTech.eyebrow')}</Text>
                <Text style={styles.ftHeadline}>{t('home.fashionTech.headline')}</Text>
                <Text style={styles.ftSubtitle}>{t('home.fashionTech.subtitle')}</Text>
              </View>
              {width >= 720 ? <FashionTechHeroVisualSlot /> : null}
            </View>

            <View
              style={[
                styles.ftCardGrid,
                {
                  flexDirection: width >= 1100 ? 'row' : width >= 560 ? 'row' : 'column',
                  flexWrap: width >= 1100 ? 'nowrap' : 'wrap',
                },
              ]}
            >
              <View style={[styles.ftCardCell, width >= 1100 && styles.ftCardCellQuarter]}>
                <VionaFashionWorldCard
                  accent="local"
                  title={t('home.fashionTech.local.title')}
                  subtitle={t('home.fashionTech.local.subtitle')}
                  icon={<Ionicons name="grid-outline" size={22} color={vionaTokens.fashionTech.champagne} />}
                  status={{ label: t('home.worldStage.local.status'), tone: 'lite' }}
                  onPress={goUniverseLocal}
                />
              </View>
              <View style={[styles.ftCardCell, width >= 1100 && styles.ftCardCellQuarter]}>
                <VionaFashionWorldCard
                  accent="travel"
                  title={t('home.fashionTech.travel.title')}
                  subtitle={t('home.fashionTech.travel.subtitle')}
                  icon={<Ionicons name="airplane-outline" size={22} color={vionaTokens.fashionTech.champagne} />}
                  status={
                    featureFlags.travelEnabled
                      ? { label: t('home.worldStage.travel.status'), tone: 'pilot' }
                      : { label: t('home.worldStage.travel.statusComingSoon'), tone: 'comingSoon' }
                  }
                  onPress={featureFlags.travelEnabled ? goUniverseTravel : undefined}
                  disabled={!featureFlags.travelEnabled}
                />
              </View>
              <View style={[styles.ftCardCell, width >= 1100 && styles.ftCardCellQuarter]}>
                <VionaFashionWorldCard
                  accent="academy"
                  title={t('home.fashionTech.academy.title')}
                  subtitle={t('home.fashionTech.academy.subtitle')}
                  icon={<Ionicons name="sparkles-outline" size={22} color={vionaTokens.fashionTech.champagne} />}
                  status={{ label: t('home.worldStage.academy.status'), tone: 'demo' }}
                  onPress={goUniverseAcademy}
                />
              </View>
              <View style={[styles.ftCardCell, width >= 1100 && styles.ftCardCellQuarter]}>
                <VionaFashionWorldCard
                  accent="business"
                  title={t('home.fashionTech.business.title')}
                  subtitle={t('home.fashionTech.business.subtitle')}
                  icon={<Ionicons name="briefcase-outline" size={22} color={vionaTokens.fashionTech.champagne} />}
                  status={{ label: t('home.worldStage.travel.status'), tone: 'pilot' }}
                  onPress={goUniverseBusiness}
                />
              </View>
            </View>
          </LinearGradient>
        </View>

        <VionaSurface variant="glass" style={[styles.trustStrip, { width: layout.inner }]}>
          <View style={styles.trustStripRow}>
            {!isDesktopWeb ? (
              <View
                style={[
                  styles.creditPill,
                  isTourist && styles.creditPillTourist,
                  { maxWidth: creditPillMax, flexShrink: 0 },
                ]}
              >
                <View style={styles.creditPillRow}>
                  {walletBalanceLoading ? (
                    <ActivityIndicator size="small" color={GOLD_ACCENT} accessibilityLabel={t('home.walletLoadingA11y')} />
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
            ) : null}
            <Text style={[styles.trustStripHint, isDesktopWeb && styles.trustStripHintDesktop]}>{t('home.trustStripHint')}</Text>
          </View>
        </VionaSurface>

        <VionaSurface variant="glass" style={[styles.impactStrip, { width: layout.inner }]}>
          <View style={styles.impactStripRow}>
            <View style={styles.impactStripCopy}>
              <Text style={styles.impactStripKicker}>{t('home.impact.kicker')}</Text>
              <Text style={styles.impactStripTitle}>{t('home.impact.title')}</Text>
              <Text style={styles.impactStripSubtitle}>{t('home.impact.subtitle')}</Text>
            </View>
            <Pressable
              onPress={scrollToCareSection}
              style={({ pressed }) => [styles.impactStripCta, pressed && { opacity: 0.88 }]}
              accessibilityRole="button"
              accessibilityLabel={t('home.impact.title')}
            >
              <Ionicons name="heart-outline" size={14} color={vionaTokens.fashionTech.champagne} />
              <Text style={styles.impactStripCtaText}>{t('home.impact.stripCta')}</Text>
            </Pressable>
          </View>
        </VionaSurface>

        <View
          style={[styles.charityWrap, { width: layout.inner }]}
          onLayout={(e) => {
            charitySectionY.current = e.nativeEvent.layout.y;
          }}
        >
          <CharityWidget layoutVariant="impactSecondary" />
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
                <Text style={styles.utilityChipText}>{t('home.utilityTravelChip')}</Text>
              </Pressable>
            ) : null}
            {featureFlags.b2bAiReceptionistDemoEnabled ? (
              <Pressable
                onPress={() => openProtected('AiEye')}
                style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
              >
                <Ionicons name="scan-outline" size={18} color={theme.hybrid.signalStrong} />
                <Text style={styles.utilityChipText}>{t('home.utilityAiEyeChip')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => openProtected('Wallet')}
              style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="wallet-outline" size={18} color={theme.hybrid.signalStrong} />
              <Text style={styles.utilityChipText}>{t('home.utilityWalletChip')}</Text>
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
  rootFillFashion: {
    backgroundColor: vionaTokens.fashionTech.canvas,
  },
  fashionShellOuter: {
    width: '100%',
    backgroundColor: vionaTokens.fashionTech.commandBarBg,
    borderBottomWidth: 1,
    borderBottomColor: vionaTokens.fashionTech.champagneLine,
  },
  fashionShellInner: {
    width: '100%',
    alignSelf: 'center',
    maxWidth: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {},
  ftHeroBleed: {
    marginBottom: vionaTokens.spacing[20],
  },
  ftHero: {
    borderRadius: vionaTokens.radius.xxl,
    paddingHorizontal: vionaTokens.spacing[24],
    paddingVertical: vionaTokens.spacing[32],
    overflow: 'visible',
    borderWidth: 1,
    borderColor: vionaTokens.fashionTech.champagneLine,
    ...vionaTokens.shadows.hero,
  },
  ftHeroMain: {
    gap: vionaTokens.spacing[20],
  },
  ftCopyCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: vionaTokens.spacing[8],
  },
  ftEyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: vionaTokens.fashionTech.champagne,
    fontFamily: FontFamily.semibold,
    marginBottom: vionaTokens.spacing[12],
  },
  ftHeadline: {
    fontSize: 28,
    lineHeight: 34,
    color: vionaTokens.fashionTech.inkOnDark,
    fontFamily: FontFamily.extrabold,
    marginBottom: vionaTokens.spacing[12],
    maxWidth: 560,
  },
  ftSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: vionaTokens.fashionTech.mutedOnDark,
    fontFamily: FontFamily.medium,
    maxWidth: 520,
  },
  ftVisualPanel: {
    flex: 1,
    minHeight: 200,
    borderRadius: vionaTokens.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.25)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  ftGlowBlob: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(201, 169, 98, 0.07)',
    top: '8%',
    right: '6%',
  },
  ftOrbitLine: {
    position: 'absolute',
    width: '86%',
    height: StyleSheet.hairlineWidth,
    maxHeight: 1,
    backgroundColor: 'rgba(201, 169, 98, 0.28)',
    top: '44%',
    left: '7%',
    transform: [{ rotate: '-17deg' }],
  },
  ftOrbitLineSecond: {
    top: '58%',
    opacity: 0.45,
    transform: [{ rotate: '11deg' }],
    width: '72%',
    left: '14%',
  },
  ftConstellationDot: {
    position: 'absolute',
    borderRadius: 99,
    backgroundColor: 'rgba(244, 246, 250, 0.95)',
    shadowColor: '#c9a962',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
    elevation: 2,
  },
  ftVisualCopy: {
    paddingVertical: vionaTokens.spacing[12],
    paddingHorizontal: vionaTokens.spacing[16],
    backgroundColor: 'rgba(5, 8, 12, 0.38)',
    alignItems: 'center',
  },
  ftVisualCaption: {
    fontSize: 13,
    lineHeight: 20,
    color: vionaTokens.fashionTech.champagneMuted,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
    maxWidth: 280,
  },
  ftCardRailScrollOuter: {
    marginTop: vionaTokens.spacing[32],
    marginHorizontal: -vionaTokens.spacing[4],
    paddingBottom: vionaTokens.spacing[12],
  },
  ftCardRailContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: vionaTokens.spacing[12],
    paddingRight: vionaTokens.spacing[16],
    paddingBottom: vionaTokens.spacing[8],
  },
  ftCardRailCell: {
    width: 276,
    flexShrink: 0,
  },
  ftCardGrid: {
    gap: vionaTokens.spacing[12],
    marginTop: vionaTokens.spacing[32],
    paddingBottom: vionaTokens.spacing[8],
  },
  ftCardCell: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 240,
    maxWidth: '100%',
  },
  ftCardCellQuarter: {
    flexBasis: '23%',
    minWidth: 200,
  },
  trustStripHintDesktop: {
    flex: 1,
    textAlign: 'right',
  },
  trustStrip: {
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
    paddingVertical: vionaTokens.spacing[12],
    paddingHorizontal: vionaTokens.spacing[16],
  },
  impactStrip: {
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
    paddingVertical: vionaTokens.spacing[12],
    paddingHorizontal: vionaTokens.spacing[16],
  },
  impactStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: vionaTokens.spacing[12],
    flexWrap: 'wrap',
  },
  impactStripCopy: {
    flex: 1,
    minWidth: 180,
    gap: 4,
  },
  impactStripKicker: {
    fontSize: 11,
    lineHeight: 16,
    color: vionaTokens.fashionTech.champagneMuted,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  impactStripTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: TEXT_PRIMARY,
    fontFamily: FontFamily.extrabold,
  },
  impactStripSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: TEXT_MUTED,
    fontFamily: FontFamily.medium,
  },
  impactStripCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: vionaTokens.fashionTech.champagneLine,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  impactStripCtaText: {
    fontSize: 12,
    lineHeight: 16,
    color: vionaTokens.fashionTech.inkOnDark,
    fontFamily: FontFamily.semibold,
  },
  trustStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: vionaTokens.spacing[12],
    flexWrap: 'wrap',
  },
  trustStripHint: {
    flex: 1,
    minWidth: 120,
    fontSize: 12,
    lineHeight: 17,
    color: vionaTokens.colors.muted,
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
    marginTop: vionaTokens.spacing[8],
    marginBottom: theme.spacing.md,
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
