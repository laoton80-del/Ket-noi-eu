import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
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
import {
  getConfiguredAdminDebugPin,
  isAdminDebugPinConfigured,
  isAdminDebugSurfaceEnabled,
} from '../config/adminDebugGate';
import { brandConfig } from '../core/brand/brandConfig';
import { getFeatureFlags } from '../core/feature-flags/featureFlags';
import { getVioPointsLabel } from '../core/monetization/vioDisplayLabels';
import { getPersonaDisplayName } from '../config/aiPrompts';
import { useAuth } from '../context/AuthContext';
import {
  MVP_ACADEMY_LITE_OFF_MSG,
  MVP_B2B_AI_RECEPTIONIST_DEMO_OFF_MSG,
  MVP_LEONA_LITE_OFF_MSG,
} from '../navigation/mvpSurfaceGate';
import type { RootStackParamList } from '../navigation/routes';
import {
  resolveNearestVietnameseMission,
  synthesizeSosQuickActionDualLanguageAudio,
} from '../services/travel/EmergencySosService';
import { getTravelContext } from '../services/context/UserContextService';
import { getRestApiJwt, isRestApiConfigured } from '../services/apiClient';
import { patchUserPersonaOnServer } from '../services/viGlobalUserPersonaApi';
import { fetchBalance } from '../services/viGlobalWalletApi';
import { useWalletState } from '../state/wallet';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';
import { applyWebStyles } from '../utils/applyWebStyles';
import { useTranslation } from '../i18n';
import { DashboardB2CScreen } from './b2c/DashboardB2CScreen';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const IMG_LOGO = require('../../assets/brand/viona/logo-in-app.png');
const ADMIN_UNLOCK_KEY = STORAGE_KEYS.adminUnlock;
const EMERGENCY_COUNTRY_NUMBERS: Readonly<
  Record<string, Readonly<{ police: string; ambulance: string; fire: string }>>
> = {
  US: { police: '911', ambulance: '911', fire: '911' },
  CA: { police: '911', ambulance: '911', fire: '911' },
  AU: { police: '000', ambulance: '000', fire: '000' },
  JP: { police: '110', ambulance: '119', fire: '119' },
  GB: { police: '999', ambulance: '999', fire: '999' },
  VN: { police: '113', ambulance: '115', fire: '114' },
};

function emergencyNumbersForCountry(countryCode: string): Readonly<{ police: string; ambulance: string; fire: string }> {
  const cc = countryCode.trim().toUpperCase();
  return EMERGENCY_COUNTRY_NUMBERS[cc] ?? { police: '112', ambulance: '112', fire: '112' };
}

function sanitizeDial(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/** Universe 1 — Deep Navy + 3D gold accents (V6.2 Apex). */
const SCREEN_BG = '#050B14';
const CARD_BG = 'rgba(20, 32, 52, 0.78)';
const GOLD_ACCENT = 'rgba(197, 160, 89, 0.95)';
const GOLD_BORDER = 'rgba(212, 175, 55, 0.5)';
const TEXT_PRIMARY = 'rgba(248, 250, 252, 0.96)';
const TEXT_MUTED = 'rgba(226, 232, 240, 0.7)';

type BriefingCard = Readonly<{
  id: string;
  headline: string;
  sub: string;
}>;

export function HomeScreen() {
  const { t } = useTranslation();
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
  const [sosVisible, setSosVisible] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosCountryCode, setSosCountryCode] = useState('VN');
  const [sosCity, setSosCity] = useState('');
  const [sosCoords, setSosCoords] = useState<Readonly<{ lat: number; lng: number }>>({
    lat: 10.8231,
    lng: 106.6297,
  });
  const [sosTtsBusy, setSosTtsBusy] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
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

  const walletChipLabel = useMemo(() => {
    const n = wallet.credits;
    const useCompact = width < 400;
    return useCompact ? t('home.walletChipCompact', { amount: n }) : t('home.walletChipFull', { amount: n });
  }, [t, wallet.credits, width]);

  const layout = useMemo(() => {
    const maxShell = 720;
    const shellWidth = Math.min(width, maxShell);
    const pad = theme.spacing.lg;
    const inner = shellWidth - pad * 2;
    return { shellWidth, pad, inner };
  }, [width]);

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
      if (target === 'LeonaCall' && !featureFlags.leonaAssistantEnabled) {
        Alert.alert('Leona Assistant Lite', MVP_LEONA_LITE_OFF_MSG);
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
      featureFlags.leonaAssistantEnabled,
      navigation,
      setPendingRedirect,
      user,
    ]
  );

  const openInterpreter = useCallback(() => {
    if (!featureFlags.leonaAssistantEnabled) {
      Alert.alert('Live Interpreter', MVP_LEONA_LITE_OFF_MSG);
      return;
    }
    if (!user) {
      setPendingRedirect('LiveInterpreter');
      setShowPaywall(true);
      return;
    }
    navigation.navigate('LiveInterpreter', { guidedEntry: true, scenario: 'general' });
  }, [featureFlags.leonaAssistantEnabled, navigation, setPendingRedirect, user]);

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
      if (persona === 'loan' && !featureFlags.academyLiteEnabled) {
        Alert.alert('Academy Lite', MVP_ACADEMY_LITE_OFF_MSG);
        return;
      }
      if (persona === 'leona' && !featureFlags.leonaAssistantEnabled) {
        Alert.alert('Leona Assistant Lite', MVP_LEONA_LITE_OFF_MSG);
        return;
      }
      if (!user) {
        setPendingRedirect(persona === 'loan' ? 'LeTan' : 'LeonaCall');
        setShowPaywall(true);
        return;
      }
      if (persona === 'loan') {
        navigation.navigate('Tabs', {
          screen: 'TabAi',
          params: { proactiveQuestion: question, autoSimulate: true },
        });
        return;
      }
      navigation.navigate('LeonaCall', { prefillRequest: question, autoSubmit: true });
    },
    [
      featureFlags.academyLiteEnabled,
      featureFlags.leonaAssistantEnabled,
      navigation,
      setPendingRedirect,
      user,
    ]
  );

  const openSosPanel = useCallback(() => {
    setSosVisible(true);
    setSosLoading(true);
    void (async () => {
      try {
        const ctx = await getTravelContext({ skipPersistCity: true });
        setSosCountryCode(ctx.countryCode);
        setSosCity(ctx.city);
        setSosCoords({ lat: ctx.latitude, lng: ctx.longitude });
      } finally {
        setSosLoading(false);
      }
    })();
  }, []);

  const closeSosPanel = useCallback(() => {
    setSosVisible(false);
  }, []);

  const dialNumber = useCallback(async (phone: string) => {
    const clean = sanitizeDial(phone);
    if (clean.length === 0) {
      Alert.alert('Không thể gọi', 'Số điện thoại không hợp lệ.');
      return;
    }
    const url = `tel:${clean}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Không hỗ trợ gọi', `Thiết bị không mở được quay số cho ${clean}.`);
      return;
    }
    await Linking.openURL(url);
  }, []);

  const embassyMission = useMemo(
    () => resolveNearestVietnameseMission(sosCoords.lat, sosCoords.lng).mission,
    [sosCoords.lat, sosCoords.lng]
  );

  const emergencyNumbers = useMemo(
    () => emergencyNumbersForCountry(sosCountryCode),
    [sosCountryCode]
  );

  const playAiMayday = useCallback(async () => {
    if (sosTtsBusy) return;
    setSosTtsBusy(true);
    try {
      const uri = await synthesizeSosQuickActionDualLanguageAudio('medical', sosCountryCode, 'nova');
      const old = soundRef.current;
      soundRef.current = null;
      if (old) await old.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, volume: 1 });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.setOnPlaybackStatusUpdate(null);
          setSosTtsBusy(false);
        }
      });
    } catch {
      setSosTtsBusy(false);
      Alert.alert('AI Voice Mayday', 'Không thể phát câu khẩn cấp lúc này.');
    }
  }, [sosCountryCode, sosTtsBusy]);

  const pingRescue = useCallback(async () => {
    const coordsLine = `${sosCoords.lat.toFixed(5)}, ${sosCoords.lng.toFixed(5)}`;
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Global Lifeline SOS',
          body: `SOS ping sent · ${sosCity} · ${coordsLine}`,
          sound: true,
        },
        trigger: null,
      });
    } catch {
      // non-blocking
    }
    Alert.alert(
      'Ping Rescue',
      `Đã gửi SOS ping với tọa độ ${coordsLine} tới cộng đồng VIONA lân cận (blueprint local/home tier).`
    );
  }, [sosCity, sosCoords.lat, sosCoords.lng]);

  return (
    <View style={styles.rootFill}>
      <StatusBar style="light" />
      <LinearGradient colors={['#050B14', '#0c1828']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={[styles.creditPill, isTourist && styles.creditPillTourist]}>
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

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: layout.pad,
            paddingBottom: 120,
            width: layout.shellWidth,
            alignSelf: 'center',
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingRight: Math.max(112, Math.min(width * 0.36, 172)) }]}>
          <Text style={styles.heroEyebrow}>{brandConfig.displayName}</Text>
          <Text style={styles.heading}>
            {isTourist ? t('home.headingTourist') : t('home.headingExpat')}
          </Text>
          <Text style={styles.heroSub}>
            {isTourist ? t('home.heroSubTourist') : t('home.heroSubExpat')}
          </Text>
        </View>

        {isTourist ? <DashboardB2CScreen contentWidth={layout.inner} /> : null}

        {isTourist && featureFlags.leonaAssistantEnabled ? (
          <View style={[styles.survivalStrip, { width: layout.inner }]} className={applyWebStyles('kn-glass')}>
            <Text style={styles.survivalTitle}>AI translation & survival</Text>
            <Text style={styles.survivalSub}>Tap for instant help in Vietnam — highlighted for travel mode.</Text>
            <View style={styles.survivalRow}>
              <Pressable
                onPress={openInterpreter}
                style={({ pressed }) => [styles.survivalChip, styles.survivalChipPrimary, pressed && { opacity: 0.9 }]}
                accessibilityRole="button"
                accessibilityLabel="Live interpreter"
              >
                <Ionicons name="mic" size={20} color={GOLD_ACCENT} />
                <Text style={styles.survivalChipText}>Live interpreter</Text>
              </Pressable>
              <Pressable
                onPress={() => openProtected('LeonaCall')}
                style={({ pressed }) => [styles.survivalChip, styles.survivalChipPrimary, pressed && { opacity: 0.9 }]}
                accessibilityRole="button"
                accessibilityLabel="AI voice line"
              >
                <Ionicons name="call" size={20} color={GOLD_ACCENT} />
                <Text style={styles.survivalChipText}>AI voice line</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={[styles.charityWrap, { width: layout.inner }]}>
          <CharityWidget />
        </View>

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

        <View style={[styles.featureCard, { width: layout.inner }]} className={applyWebStyles('kn-glass')}>
          <View style={styles.featureRow}>
            <Pressable
              onPress={isAdminDebugSurfaceEnabled() ? onSecretTap : undefined}
              style={({ pressed }) => [styles.logoWrap, pressed && { opacity: 0.92 }]}
              className={applyWebStyles('kn-neon-b2b')}
            >
              <AppImage source={IMG_LOGO} style={styles.logoImage} accessibilityLabel="Logo" />
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
                  <Text style={styles.adminBadgeText}>Admin unlocked</Text>
                </View>
              ) : null}
              {isAdminDebugSurfaceEnabled() ? (
                <Text style={styles.debugHint}>Gợi ý: chạm nhanh logo 5 lần để mở khu vực quản trị (dev).</Text>
              ) : null}
            </View>
          </View>
        </View>

        {!isTourist ? <DashboardB2CScreen contentWidth={layout.inner} /> : null}

        <View style={[styles.utilityStrip, { width: layout.inner }]} className={applyWebStyles('kn-glass')}>
          <Text style={styles.utilityStripTitle}>Lối tắt hệ thống</Text>
          <View style={styles.utilityRow}>
            <Pressable
              onPress={() => openProtected('Vault')}
              style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={GOLD_ACCENT} />
              <Text style={styles.utilityChipText}>Vault</Text>
            </Pressable>
            {featureFlags.travelEnabled ? (
              <Pressable
                onPress={() => navigation.navigate('TravelCompanion')}
                style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
              >
                <Ionicons name="airplane-outline" size={18} color={GOLD_ACCENT} />
                <Text style={styles.utilityChipText}>Đồng hành</Text>
              </Pressable>
            ) : null}
            {featureFlags.b2bAiReceptionistDemoEnabled ? (
              <Pressable
                onPress={() => openProtected('AiEye')}
                style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
              >
                <Ionicons name="scan-outline" size={18} color={GOLD_ACCENT} />
                <Text style={styles.utilityChipText}>Mắt Thần</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => openProtected('Wallet')}
              style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="wallet-outline" size={18} color={GOLD_ACCENT} />
              <Text style={styles.utilityChipText}>Ví</Text>
            </Pressable>
            {featureFlags.leonaAssistantEnabled ? (
              <Pressable
                onPress={() => openProtected('LeonaCall')}
                style={({ pressed }) => [styles.utilityChip, pressed && { opacity: 0.88 }]}
              >
                <Ionicons name="call-outline" size={18} color={GOLD_ACCENT} />
                <Text style={styles.utilityChipText}>{outboundPersonaName}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <PersonaOnboardingModal
        visible={personaModalVisible}
        onPickExpat={() => applyPersonaChoice('EXPAT')}
        onPickTourist={() => applyPersonaChoice('TOURIST')}
      />

      <AuthPaywallModal
        visible={showPaywall}
        title="Đăng nhập để tiếp tục"
        description="Ví, quét bài, gọi hỗ trợ và các tính năng chính cần xác thực số điện thoại."
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

      <Pressable
        onPress={openSosPanel}
        style={({ pressed }) => [styles.sosFab, pressed && { opacity: 0.92 }]}
        className={applyWebStyles('kn-glass')}
        accessibilityRole="button"
        accessibilityLabel={t('home.sosFabA11y')}
      >
        <Ionicons name="warning" size={17} color="#FFFFFF" />
        <Text style={styles.sosFabText} numberOfLines={1}>
          {t('home.sosFabLabel')}
        </Text>
      </Pressable>

      <Modal
        visible={sosVisible}
        transparent
        animationType="slide"
        onRequestClose={closeSosPanel}
      >
        <View style={styles.sosOverlay}>
          <View style={styles.sosSheet} className={applyWebStyles('kn-glass')}>
            <View style={styles.sosHeader}>
              <Text style={styles.sosTitle}>{t('home.sosModalTitle')}</Text>
              <Pressable onPress={closeSosPanel} style={styles.sosCloseBtn}>
                <Ionicons name="close" size={18} color={theme.colors.text.primary} />
              </Pressable>
            </View>
            {sosLoading ? (
              <View style={styles.sosLoadingRow}>
                <ActivityIndicator color="#FF6B6B" />
                <Text style={styles.sosBody}>Đang định vị để bản địa hóa cứu hộ...</Text>
              </View>
            ) : (
              <Text style={styles.sosBody}>
                {sosCity.trim().length > 0
                  ? t('home.sosAreaLine', { city: sosCity, code: sosCountryCode })
                  : t('home.sosAreaPending')}
              </Text>
            )}

            <View style={styles.sosCard}>
              <Text style={styles.sosCardTitle}>🚑 Local Emergency Services</Text>
              <View style={styles.sosNumberRow}>
                <Pressable style={styles.sosDialBtn} onPress={() => void dialNumber(emergencyNumbers.police)}>
                  <Text style={styles.sosDialText}>Police · {emergencyNumbers.police}</Text>
                </Pressable>
                <Pressable style={styles.sosDialBtn} onPress={() => void dialNumber(emergencyNumbers.ambulance)}>
                  <Text style={styles.sosDialText}>Ambulance · {emergencyNumbers.ambulance}</Text>
                </Pressable>
                <Pressable style={styles.sosDialBtn} onPress={() => void dialNumber(emergencyNumbers.fire)}>
                  <Text style={styles.sosDialText}>Fire · {emergencyNumbers.fire}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.sosCard}>
              <Text style={styles.sosCardTitle}>🏛️ Local Vietnamese Embassy</Text>
              <Text style={styles.sosEmbassyText}>{embassyMission.nameVi}</Text>
              <Pressable style={styles.sosDialBtn} onPress={() => void dialNumber(embassyMission.phoneDisplay)}>
                <Text style={styles.sosDialText}>Hotline · {embassyMission.phoneDisplay}</Text>
              </Pressable>
            </View>

            <View style={styles.sosCard}>
              <Text style={styles.sosCardTitle}>🗣️ AI Voice Mayday</Text>
              <Pressable
                style={[styles.sosActionBtn, sosTtsBusy && { opacity: 0.7 }]}
                onPress={() => void playAiMayday()}
                disabled={sosTtsBusy}
              >
                {sosTtsBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.sosActionText}>Phát câu cứu hộ bản địa</Text>}
              </Pressable>
            </View>

            <View style={styles.sosCard}>
              <Text style={styles.sosCardTitle}>📍 Ping Rescue</Text>
              <Pressable style={styles.sosActionBtn} onPress={() => void pingRescue()}>
                <Text style={styles.sosActionText}>Gửi SOS + GPS tới cộng đồng VIONA nearby</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: theme.spacing.sm,
  },
  hero: {
    marginBottom: theme.spacing.lg,
  },
  heroEyebrow: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: GOLD_ACCENT,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  heading: {
    fontSize: 28,
    lineHeight: 34,
    color: TEXT_PRIMARY,
    fontFamily: FontFamily.extrabold,
    marginBottom: theme.spacing.xs,
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 21,
    color: TEXT_MUTED,
    fontFamily: FontFamily.regular,
  },
  creditPill: {
    position: 'absolute',
    top: 8,
    right: theme.spacing.lg,
    zIndex: 10,
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    backgroundColor: CARD_BG,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
    maxWidth: '78%',
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
  },
  creditPillText: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    fontFamily: FontFamily.semibold,
    flexShrink: 0,
  },
  creditPillSub: {
    fontSize: 10,
    lineHeight: 13,
    color: GOLD_ACCENT,
    fontFamily: FontFamily.semibold,
    textAlign: 'right',
    maxWidth: 168,
  },
  survivalStrip: {
    alignSelf: 'center',
    borderRadius: 16,
    borderTopWidth: 1,
    borderTopColor: GOLD_BORDER,
    borderLeftWidth: 1,
    borderLeftColor: GOLD_BORDER,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: CARD_BG,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  survivalTitle: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.6,
    color: GOLD_ACCENT,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  survivalSub: {
    fontSize: 12,
    lineHeight: 17,
    color: TEXT_MUTED,
    fontFamily: FontFamily.regular,
    marginBottom: 12,
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
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(0,0,0,0.22)',
    flexGrow: 1,
    minWidth: 140,
  },
  survivalChipPrimary: {
    borderColor: GOLD_BORDER,
    backgroundColor: 'rgba(197, 160, 89, 0.14)',
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
    borderTopWidth: 1,
    borderTopColor: GOLD_BORDER,
    borderLeftWidth: 1,
    borderLeftColor: GOLD_BORDER,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
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
    letterSpacing: 0.8,
    color: GOLD_ACCENT,
    marginBottom: 10,
    textTransform: 'uppercase',
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
    borderTopWidth: 1,
    borderTopColor: GOLD_BORDER,
    borderLeftWidth: 1,
    borderLeftColor: GOLD_BORDER,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
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
  featureCard: {
    alignSelf: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: GOLD_BORDER,
    borderLeftWidth: 1,
    borderLeftColor: GOLD_BORDER,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
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
    borderColor: GOLD_BORDER,
    width: 128,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
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
  utilityStrip: {
    alignSelf: 'center',
    borderRadius: 16,
    borderTopWidth: 1,
    borderTopColor: GOLD_BORDER,
    borderLeftWidth: 1,
    borderLeftColor: GOLD_BORDER,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: CARD_BG,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  charityWrap: {
    marginTop: 2,
    marginBottom: 2,
  },
  utilityStripTitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontFamily: FontFamily.semibold,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(0,0,0,0.22)',
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
    borderColor: GOLD_BORDER,
    backgroundColor: CARD_BG,
    padding: theme.spacing.lg,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
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
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(0,0,0,0.35)',
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
  sosFab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    minHeight: 48,
    maxWidth: '56%',
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(185, 28, 28, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(252, 165, 165, 0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#7F1D1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  sosFabText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FontFamily.extrabold,
    flexShrink: 1,
  },
  sosOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 16, 28, 0.56)',
    justifyContent: 'flex-end',
  },
  sosSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: 'rgba(12,18,30,0.96)',
    padding: 14,
    gap: 10,
  },
  sosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sosTitle: {
    color: '#FFEAEA',
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
  },
  sosCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  sosLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sosBody: { color: 'rgba(255,240,240,0.85)', fontSize: 12, fontFamily: FontFamily.medium },
  sosCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,160,160,0.25)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 10,
    gap: 8,
  },
  sosCardTitle: { color: '#FFF2E8', fontSize: 13, fontFamily: FontFamily.bold },
  sosNumberRow: { gap: 6 },
  sosDialBtn: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,130,130,0.34)',
    backgroundColor: 'rgba(152, 33, 33, 0.2)',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  sosDialText: { color: '#FFE8E8', fontSize: 12, fontFamily: FontFamily.semibold },
  sosEmbassyText: { color: '#CBD5E1', fontSize: 12, fontFamily: FontFamily.medium },
  sosActionBtn: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  sosActionText: { color: '#FFFFFF', fontSize: 12, fontFamily: FontFamily.bold },
});
