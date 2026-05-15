import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_BRAND } from '../config/appBrand';
import { useAppMode } from '../context/AppModeContext';
import { useAuth } from '../context/AuthContext';
import { isMerchantServerRole } from '../context/authTypes';
import { persistUserLanguage } from '../i18n/persistLanguage';
import { getStrings } from '../i18n/strings';
import type { RootStackParamList } from '../navigation/routes';
import { useAssistantSettings } from '../state/assistantSettings';
import { resetGuidedOnboarding } from '../onboarding/guidedOnboardingStorage';
import type { Auth, Persistence } from 'firebase/auth';
import * as FirebaseAuth from 'firebase/auth';
import { ensureFirebaseAppCheckInitialized } from '../config/appCheckClient';
import { getFirebaseApp, isFirebaseClientConfigured } from '../config/firebaseApp';
import { DiasporaRestrictionModal } from '../components/modals/DiasporaRestrictionModal';
import { evaluateMerchantSurfaceAccess } from '../services/auth/merchantSurfaceEntry';
import { loadUsageHistory, type UsageHistoryItem } from '../services/history';
import { ensureWalletFirebaseAuth, getWalletIdToken } from '../services/walletFirebaseSession';
import { useWalletState } from '../state/wallet';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { GDPRDashboard } from '../components/compliance/GDPRDashboard';
import { TrustHistoryCard } from '../components/widgets';
import {
  VionaActionCard,
  VionaActionGrid,
  vionaActionAccentFromHex,
  type VionaActionAccent,
} from '../components/viona';
import { VionaBrandLockup } from '../components/viona/VionaBrandLockup';
import {
  premiumCrispEdgeStroke,
  premiumFrameEdgeOverlay,
} from '../components/viona/fashionHomeDesktopShell';
import { vionaTokens } from '../design';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';
import { hasB2BWorkspaceAccess } from '../utils/b2bAccess';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const ADMIN_UNLOCK_KEY = STORAGE_KEYS.adminUnlock;

const ft = vionaTokens.fashionTech;
const IMG_ACCOUNT_CONSTELLATION = require('../../assets/UI/viona-account-global-net-bg-v2.png');
const constellationImageWebFit =
  Platform.OS === 'web'
    ? ({ objectFit: 'cover' as const, objectPosition: '52% 20%' as const } as const)
    : null;

function accountAccent(hex: string, borderAlpha = 0.48, strongAlpha = 0.64): VionaActionAccent {
  const base = vionaActionAccentFromHex(hex);
  return {
    ...base,
    border: base.border.replace(/0\.\d+\)$/, `${borderAlpha})`),
    borderStrong: base.borderStrong.replace(/0\.\d+\)$/, `${strongAlpha})`),
    fillHover: base.fillHover.replace(/0\.\d+\)$/, '0.08)'),
    fillPressed: base.fillPressed.replace(/0\.\d+\)$/, '0.1)'),
  };
}

const ACC_ACCOUNT_STORE = accountAccent(ft.accentGold);
const ACC_ACCOUNT_B2B_PRICE = accountAccent(ft.accentCyan);
/** Strong CTA without full-bleed destructive red — accent border on dark tile (SOS-adjacent language). */
const ACC_ACCOUNT_B2B_SWITCH = accountAccent(ft.sosNeonMuted, 0.28, 0.46);
const ACC_ACCOUNT_PARTNER = accountAccent(ft.accentEmerald);
const ACC_ACCOUNT_WORKSPACE = accountAccent(ft.accentViolet, 0.22, 0.34);

const LANGUAGE_OPTIONS: readonly {
  code: 'vi' | 'en' | 'cs' | 'de';
  title: string;
  hint: string;
}[] = [
  { code: 'vi', title: '🇻🇳 Tiếng Việt', hint: 'Default · F1' },
  { code: 'en', title: '🇬🇧 English', hint: 'Global · F2 / F3' },
  { code: 'cs', title: '🇨🇿 Čeština', hint: 'EU expansion' },
  { code: 'de', title: '🇩🇪 Deutsch', hint: 'EU expansion' },
];

function languageSubtitleForCode(code: string): string {
  const row = LANGUAGE_OPTIONS.find((o) => o.code === code);
  return row ? `${row.title} · ${row.hint}` : code;
}

/** TEMP DEV-only — gỡ trước release: log UID + token cho trust:live / verify:receipt (Metro console). */
function devLogFirebaseIdTokenAudit(firebaseUid: string, token: string): void {
  if (!__DEV__) return;
  console.log('[dev-fid-token]', 'FIREBASE_UID=', firebaseUid);
  console.log('[dev-fid-token]', 'TOKEN_SEGMENTS=', token.split('.').length);
  console.log('[dev-fid-token]', 'TOKEN_LENGTH=', token.length);
  console.log('[dev-fid-token]', 'FIREBASE_ID_TOKEN=', token);
}

/** DEV-only: surface FirebaseError / Error text for the token-copy diagnostic path. */
function formatDevFirebaseAuthError(e: unknown): string {
  if (e && typeof e === 'object' && 'code' in e) {
    const code = String((e as { code?: string }).code ?? '');
    const message = String((e as { message?: string }).message ?? '');
    return [code, message].filter(Boolean).join(code && message ? ': ' : '');
  }
  if (e instanceof Error) return e.message;
  return String(e);
}

/**
 * DEV-only fallback when `ensureWalletFirebaseAuth()` returns null (helper swallows inner errors).
 * Mirrors `walletFirebaseSession` getOrInitAuth + anonymous sign-in without touching that module.
 */
async function devTryDirectWalletFirebaseAuth(): Promise<{ auth: Auth | null; error: string | null }> {
  if (!__DEV__) return { auth: null, error: 'not dev' };
  if (!isFirebaseClientConfigured()) {
    return {
      auth: null,
      error:
        'isFirebaseClientConfigured() is false — set EXPO_PUBLIC_FIREBASE_API_KEY and EXPO_PUBLIC_FIREBASE_PROJECT_ID, restart Metro with a clean cache if needed.',
    };
  }
  const app = getFirebaseApp();
  if (!app) {
    return { auth: null, error: 'getFirebaseApp() returned null.' };
  }
  try {
    void ensureFirebaseAppCheckInitialized();
  } catch (e) {
    return { auth: null, error: `ensureFirebaseAppCheckInitialized: ${formatDevFirebaseAuthError(e)}` };
  }

  const { getAuth, initializeAuth, signInAnonymously: signInAnon } = FirebaseAuth;
  const getReactNativePersistence = (
    FirebaseAuth as unknown as {
      getReactNativePersistence?: (storage: typeof AsyncStorage) => Persistence;
    }
  ).getReactNativePersistence;

  let auth: Auth;
  try {
    auth = getAuth(app);
  } catch {
    try {
      if (typeof getReactNativePersistence === 'function') {
        auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
      } else {
        auth = initializeAuth(app);
      }
    } catch (e) {
      return { auth: null, error: `initializeAuth: ${formatDevFirebaseAuthError(e)}` };
    }
  }

  if (!auth.currentUser) {
    try {
      await signInAnon(auth);
    } catch (e) {
      return { auth, error: `signInAnonymously: ${formatDevFirebaseAuthError(e)}` };
    }
  }

  if (!auth.currentUser) {
    return { auth, error: 'signInAnonymously finished but auth.currentUser is still null.' };
  }
  return { auth, error: null };
}

function interpolate(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{${key}}`).join(value);
  }
  return out;
}

export function CaNhanScreen() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const { user, updateProfile } = useAuth();
  const { mode, setMode } = useAppMode();
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const wallet = useWalletState();
  const accountActionGridWidth = useMemo(
    () => Math.max(0, width - theme.spacing.lg * 2),
    [width]
  );
  const constellationImageSize = useMemo(
    () => ({
      maxWidth: Math.min(width, 1672),
    }),
    [width],
  );
  const accountBackdropOpacity = Platform.OS === 'web' && width > 768 ? 0.68 : 0.46;
  const showWorkspaceShortcut = Boolean(
    user && (user.serverRole === 'BROKER' || isMerchantServerRole(user.serverRole))
  );
  const accountShortcutCount = showWorkspaceShortcut ? 5 : 4;
  const [diasporaRestrictionOpen, setDiasporaRestrictionOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);

  const openMerchantRoute = useCallback(
    (route: 'B2BPaywall' | 'PartnerOnboarding') => {
      void (async () => {
        const access = await evaluateMerchantSurfaceAccess(user?.phone);
        if (access.denied && access.kind === 'vn_dial') {
          setDiasporaRestrictionOpen(true);
          return;
        }
        if (access.denied && access.kind === 'gps_vn') {
          Alert.alert('VIONA', access.message);
          return;
        }
        navigation.navigate(route);
      })();
    },
    [navigation, user?.phone]
  );

  const openB2BWorkspaceSwitch = useCallback(() => {
    void (async () => {
      const access = await evaluateMerchantSurfaceAccess(user?.phone);
      if (access.denied && access.kind === 'vn_dial') {
        setDiasporaRestrictionOpen(true);
        return;
      }
      if (access.denied && access.kind === 'gps_vn') {
        Alert.alert('VIONA', access.message);
        return;
      }
      setMode('B2B_MODE');
      navigation.navigate(hasB2BWorkspaceAccess(user) ? 'MerchantDashboard' : 'B2BPaywall');
    })();
  }, [navigation, setMode, user]);

  const settings = [
    {
      key: 'notifications',
      label: strings.profile.settingNotifications,
      icon: 'notifications-outline' as const,
      accent: ft.accentCyan,
      onPress: () => {
        Alert.alert(strings.profile.alertNotificationsTitle, strings.profile.alertNotificationsBody);
      },
    },
    {
      key: 'privacy',
      label: strings.profile.settingPrivacy,
      icon: 'lock-closed-outline' as const,
      accent: ft.accentViolet,
      onPress: () => {
        Alert.alert(
          strings.profile.alertPrivacyTitle,
          interpolate(strings.profile.alertPrivacyBody, {
            privacyUrl: APP_BRAND.legal.privacyUrl,
            termsUrl: APP_BRAND.legal.termsUrl,
          })
        );
      },
    },
    {
      key: 'support',
      label: strings.profile.settingSupport,
      icon: 'help-buoy-outline' as const,
      accent: ft.accentEmerald,
      onPress: () => {
        Alert.alert(
          strings.profile.alertSupportTitle,
          interpolate(strings.profile.alertSupportBody, {
            email: APP_BRAND.supportEmail,
            product: APP_BRAND.name,
            launch: APP_BRAND.launchSubtitle,
          })
        );
      },
    },
  ];
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [history, setHistory] = useState<UsageHistoryItem[]>([]);
  const [devIdTokenPreview, setDevIdTokenPreview] = useState<string | null>(null);

  const copyDevFirebaseIdToken = async () => {
    if (!__DEV__) return;
    let auth = await ensureWalletFirebaseAuth();
    if (!auth) {
      const direct = await devTryDirectWalletFirebaseAuth();
      if (!direct.auth?.currentUser) {
        console.log('[dev-fid-token]', 'NO_CURRENT_USER');
        Alert.alert(
          'No Firebase user',
          [
            'ensureWalletFirebaseAuth() returned null (errors are swallowed inside that helper).',
            direct.error ? `Direct auth fallback: ${direct.error}` : 'Direct auth fallback: unknown error.',
          ].join('\n\n')
        );
        return;
      }
      auth = direct.auth;
    }

    if (!auth.currentUser) {
      try {
        await FirebaseAuth.signInAnonymously(auth);
      } catch (e) {
        console.log('[dev-fid-token]', 'NO_CURRENT_USER');
        Alert.alert('Anonymous sign-in failed', formatDevFirebaseAuthError(e));
        return;
      }
    }

    const user = auth.currentUser;
    if (!user) {
      console.log('[dev-fid-token]', 'NO_CURRENT_USER');
      Alert.alert(
        'No Firebase user',
        'No signed-in user after ensureWalletFirebaseAuth / signInAnonymously. Re-read auth.currentUser is still null.'
      );
      return;
    }

    let token = await getWalletIdToken(true);
    if (!token) {
      try {
        token = await FirebaseAuth.getIdToken(user, true);
      } catch (e) {
        console.warn('[dev-fid-token]', 'TOKEN_FETCH_FAILED', formatDevFirebaseAuthError(e));
        Alert.alert('Token unavailable', formatDevFirebaseAuthError(e));
        return;
      }
    }
    if (!token) {
      console.warn('[dev-fid-token]', 'TOKEN_EMPTY_AFTER_REFRESH');
      Alert.alert('Token unavailable', 'getWalletIdToken(true) returned null and getIdToken did not return a string.');
      return;
    }

    devLogFirebaseIdTokenAudit(user.uid, token);
    try {
      await Clipboard.setStringAsync(token);
    } catch {
      Alert.alert('Copy failed', 'Could not copy to the clipboard.');
      return;
    }
    const preview =
      token.length <= 24 ? `${token.slice(0, 6)}…${token.slice(-6)}` : `${token.slice(0, 12)}…${token.slice(-8)}`;
    setDevIdTokenPreview(preview);
    Alert.alert('Copied', 'Firebase ID token copied to clipboard.');
  };

  const residencyLabel = (() => {
    if (!user?.residencyStatus) return '-';
    if (user.residencyStatus === 'du_hoc') return strings.profile.residencyStatusDuHoc;
    if (user.residencyStatus === 'lao_dong') return strings.profile.residencyStatusLaoDong;
    if (user.residencyStatus === 'dinh_cu') return strings.profile.residencyStatusDinhCu;
    return strings.profile.residencyStatusTiNan;
  })();

  const planLabel = (() => {
    if (!user?.subscriptionPlan) return strings.profile.planFree;
    if (user.subscriptionPlan === 'premium') return strings.profile.planPremium;
    if (user.subscriptionPlan === 'combo') return strings.profile.planBundle;
    return strings.profile.planFree;
  })();

  useEffect(() => {
    void (async () => {
      const raw = await AsyncStorage.getItem(ADMIN_UNLOCK_KEY);
      setAdminUnlocked(raw === '1');
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      const h = await loadUsageHistory(12);
      setHistory(h);
    })();
  }, [wallet.credits]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenBackdrop} pointerEvents="none">
        <View style={styles.constellationFrame}>
          <Image
            source={IMG_ACCOUNT_CONSTELLATION}
            style={[
              styles.constellationImage,
              constellationImageSize,
              { opacity: accountBackdropOpacity },
              constellationImageWebFit,
            ]}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </View>
        <View style={styles.constellationOverlay} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <VionaBrandLockup variant="header" showAccentUnderline style={styles.brandLockup} />
        <Text style={styles.launchHint}>{APP_BRAND.launchSubtitle}</Text>
        <Text style={styles.title}>{strings.profile.screenTitle}</Text>
        <Text style={styles.subtitle}>{strings.profile.subtitle}</Text>
        <View style={styles.subtitleAmbientLine} />

        <View style={styles.flagshipSection}>
          <Pressable
            onPress={() => navigation.navigate('SetupProfile', { mode: 'edit' })}
            style={({ pressed }) => [styles.profileCard, pressed && { opacity: 0.72 }]}
          >
            <View style={styles.cardSatinHighlight} pointerEvents="none" />
            <View style={styles.avatarOuterRing}>
              <View style={styles.avatarWrap}>
                <Ionicons name="person" size={34} color={ft.champagne} />
              </View>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{strings.common.pronounYou}</Text>
              <Text style={styles.profilePlan}>{strings.profile.currentPlan}</Text>
            </View>
            <View
              pointerEvents="none"
              style={[
                styles.premiumCardEdge,
                premiumFrameEdgeOverlay(theme.radius.lg),
                premiumCrispEdgeStroke(`${ft.accentGold}ea`),
              ]}
            />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Wallet')}
            style={({ pressed }) => [styles.creditsCard, pressed && { opacity: 0.72 }]}
          >
            <View style={styles.cardSatinHighlight} pointerEvents="none" />
            <View style={styles.creditsHeaderRow}>
              <Ionicons name="wallet-outline" size={18} color={ft.champagne} />
              <Text style={styles.cardTitle}>{strings.profile.creditsTitle}</Text>
            </View>
            <Text style={styles.cardBalance}>
              {interpolate(strings.profile.creditsBalanceCurrent, { credits: String(wallet.credits) })}
            </Text>
            <Text style={styles.cardHint}>{strings.profile.creditsHint}</Text>
            <View
              pointerEvents="none"
              style={[
                styles.premiumCardEdge,
                premiumFrameEdgeOverlay(theme.radius.lg),
                premiumCrispEdgeStroke(`${ft.accentGold}ea`),
              ]}
            />
          </Pressable>
        </View>

        <View style={styles.actionGridSection}>
          <VionaActionGrid
            widthHint={accountActionGridWidth}
            gap={theme.spacing.lg}
            testID="account-shortcuts-grid"
            preferTwoColumnQuartet
            visibleCardCount={accountShortcutCount}
          >
            <VionaActionCard
              iconName="storefront-outline"
              title="Cửa hàng Vật phẩm"
              subtitle="Khung Avatar Trống Đồng · Huy hiệu Xác minh Hộ chiếu — thanh toán Xu."
              accent={ACC_ACCOUNT_STORE}
              onPress={() => navigation.navigate('Wallet')}
              accessibilityHint="Cửa hàng Vật phẩm — Khung avatar và huy hiệu VIP"
              testID="account-action-virtual-store"
            />
            <VionaActionCard
              iconName="pricetags-outline"
              title="Bảng giá doanh nghiệp (B2B)"
              subtitle="Gói Cơ bản, Pro, Power — thanh toán theo lịch hoặc theo tháng."
              accent={ACC_ACCOUNT_B2B_PRICE}
              onPress={() => openMerchantRoute('B2BPaywall')}
              testID="account-action-b2b-pricing"
            />
            <VionaActionCard
              iconName="swap-horizontal"
              title="🔄 Chuyển sang Quản lý Doanh nghiệp"
              subtitle={`Workspace hiện tại: ${mode === 'B2B_MODE' ? 'B2B_MODE' : 'B2C_MODE'}.`}
              accent={ACC_ACCOUNT_B2B_SWITCH}
              onPress={openB2BWorkspaceSwitch}
              accessibilityHint="Chuyển sang Quản lý Doanh nghiệp"
              testID="account-action-b2b-switch"
            />
            {showWorkspaceShortcut && user ? (
              <VionaActionCard
                iconName="people-circle-outline"
                title={
                  user.workspaceUiOverride === 'consumer'
                    ? `Use ${user.serverRole === 'BROKER' ? 'broker' : 'merchant'} dashboard as default home`
                    : 'Switch default home to VIONA consumer app'
                }
                subtitle="One tap — saved on this device. Open wallet & tabs stay the same."
                accent={ACC_ACCOUNT_WORKSPACE}
                onPress={() => {
                  if (user.workspaceUiOverride === 'consumer') {
                    updateProfile({ workspaceUiOverride: null });
                  } else {
                    updateProfile({ workspaceUiOverride: 'consumer' });
                  }
                }}
                accessibilityHint="Switch default between workspace and consumer home"
                testID="account-action-workspace-hat"
              />
            ) : null}
            <VionaActionCard
              iconName="shield-checkmark"
              title="Dành cho Doanh nghiệp: Trở thành đối tác"
              subtitle="Chương trình Đối tác chứng nhận — chia sẻ doanh thu, liên hệ trong 24h."
              accent={ACC_ACCOUNT_PARTNER}
              onPress={() => openMerchantRoute('PartnerOnboarding')}
              accessibilityHint="Dành cho Doanh nghiệp: Trở thành đối tác"
              testID="account-action-partner"
            />
          </VionaActionGrid>
        </View>

        <View style={styles.identityCard}>
          <View style={styles.identityTitleRow}>
            <View style={styles.identityBadge}>
              <Ionicons name="shield-checkmark" size={14} color={ft.accentEmerald} />
            </View>
            <Text style={styles.cardTitle}>{strings.profile.identityTitle}</Text>
          </View>
          <View style={styles.identityRow}>
            <Text style={styles.identityKey}>{strings.profile.residencyStatusLabel}</Text>
            <Text style={styles.identityValue}>{residencyLabel}</Text>
          </View>
          <View style={styles.identityRow}>
            <Text style={styles.identityKey}>{strings.profile.visaTypeLabel}</Text>
            <Text style={styles.identityValue}>{user?.visaType?.trim() || '-'}</Text>
          </View>
          <View style={styles.identityRow}>
            <Text style={styles.identityKey}>{strings.profile.visaExpiryLabel}</Text>
            <Text style={styles.identityValue}>{user?.visaExpiryDate?.trim() || '-'}</Text>
          </View>
          <View style={styles.identityRow}>
            <Text style={styles.identityKey}>{strings.profile.subscriptionPlanLabel}</Text>
            <Text style={styles.identityValue}>{planLabel}</Text>
          </View>
          <View style={styles.identityRow}>
            <Text style={styles.identityKey}>{strings.profile.aiCreditsLabel}</Text>
            <Text style={styles.identityValue}>{user?.aiCallCredits ?? wallet.credits}</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('SetupProfile', { mode: 'edit' })}
            style={({ pressed }) => [styles.editIdentityBtn, pressed && { opacity: 0.82 }]}
          >
            <Text style={styles.editIdentityText}>{strings.profile.editIdentityCta}</Text>
          </Pressable>
          <View
            pointerEvents="none"
            style={[
              styles.premiumCardEdge,
              premiumFrameEdgeOverlay(theme.radius.lg),
              premiumCrispEdgeStroke(`${ft.accentEmerald}ea`),
            ]}
          />
        </View>

        <Text style={styles.sectionTitle}>{strings.profile.settingsTitle}</Text>
        <View style={styles.settingsCard}>
          <Pressable
            onPress={() => setLanguageModalOpen(true)}
            style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.72 }]}
            accessibilityRole="button"
            accessibilityLabel="Language Ngôn ngữ"
          >
            <View style={[styles.settingIconWrap, styles.settingIconCyan]}>
              <Ionicons name="language-outline" size={18} color={ft.accentCyan} />
            </View>
            <View style={styles.languageRowText}>
              <Text style={styles.settingText}>Language / Ngôn ngữ</Text>
              <Text style={styles.languageRowSub} numberOfLines={1}>
                {languageSubtitleForCode(languageCode)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={ft.mutedOnDark} />
          </Pressable>
          {settings.map((item) => (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.72 }]}
            >
              <View style={[styles.settingIconWrap, { borderColor: `${item.accent}66` }]}>
                <Ionicons name={item.icon} size={18} color={item.accent} />
              </View>
              <Text style={styles.settingText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={ft.mutedOnDark} />
            </Pressable>
          ))}
        </View>

        <GDPRDashboard />

        {__DEV__ ? (
          <View style={[styles.devTokenCard, styles.devTokenCardDevMarker]}>
            <Text style={styles.devTokenLabel}>Dev only — TEMP (gỡ trước ship)</Text>
            <Text style={styles.devTokenHint}>
              Metro log: FIREBASE_UID, TOKEN_SEGMENTS, TOKEN_LENGTH, FIREBASE_ID_TOKEN
            </Text>
            <Pressable
              onPress={() => void copyDevFirebaseIdToken()}
              style={({ pressed }) => [styles.devTokenButton, pressed && { opacity: 0.82 }]}
            >
              <Text style={styles.devTokenButtonText}>Copy Firebase ID Token</Text>
            </Pressable>
            {devIdTokenPreview ? (
              <Text style={styles.devTokenPreview} selectable>
                {devIdTokenPreview}
              </Text>
            ) : null}
          </View>
        ) : null}

        <TrustHistoryCard items={history} />

        <Pressable
          onPress={() => {
            Alert.alert(strings.profile.onboardingResetTitle, strings.profile.onboardingResetMessage, [
              { text: strings.profile.onboardingResetCancel, style: 'cancel' },
              {
                text: strings.profile.onboardingResetConfirm,
                onPress: () => {
                  void resetGuidedOnboarding();
                  Alert.alert(
                    strings.profile.onboardingResetDoneTitle,
                    strings.profile.onboardingResetDoneMessage
                  );
                },
              },
            ]);
          }}
          style={({ pressed }) => [styles.resetOnboardingRow, pressed && { opacity: 0.72 }]}
        >
          <Text style={styles.settingText}>{strings.profile.onboardingResetRowLabel}</Text>
          <Ionicons name="refresh" size={18} color={theme.colors.text.secondary} />
        </Pressable>

        {adminUnlocked ? (
          <Pressable
            onLongPress={() => {
              void AsyncStorage.removeItem(ADMIN_UNLOCK_KEY);
              setAdminUnlocked(false);
            }}
            delayLongPress={1200}
            style={({ pressed }) => [styles.resetAdminCard, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.resetAdminTitle}>Nội bộ QA</Text>
            <Text style={styles.resetAdminText}>Nhấn giữ 1.2s để Reset Admin Unlock (yêu cầu nhập lại PIN 8888)</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <Modal
        visible={languageModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setLanguageModalOpen(false)}
      >
        <View style={styles.langModalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setLanguageModalOpen(false)} />
          <View style={styles.langModalCard}>
            <Text style={styles.langModalTitle}>🌐 Language / Ngôn ngữ</Text>
            <Text style={styles.langModalCaption}>Intergenerational bridge — choose your preferred language.</Text>
            {LANGUAGE_OPTIONS.map((opt) => {
              const active = languageCode === opt.code;
              return (
                <Pressable
                  key={opt.code}
                  onPress={() => {
                    void (async () => {
                      await persistUserLanguage(opt.code);
                      setLanguageModalOpen(false);
                    })();
                  }}
                  style={({ pressed }) => [
                    styles.langOption,
                    active && styles.langOptionActive,
                    pressed && { opacity: 0.88 },
                  ]}
                >
                  <Text style={[styles.langOptionTitle, active && styles.langOptionTitleActive]}>{opt.title}</Text>
                  <Text style={[styles.langOptionHint, active && styles.langOptionHintActive]}>{opt.hint}</Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setLanguageModalOpen(false)}
              style={({ pressed }) => [styles.langModalClose, pressed && { opacity: 0.82 }]}
            >
              <Text style={styles.langModalCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <DiasporaRestrictionModal
        visible={diasporaRestrictionOpen}
        onClose={() => setDiasporaRestrictionOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ft.canvas,
    overflow: 'hidden',
  },
  screenBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    backgroundColor: ft.canvas,
    overflow: 'hidden',
  },
  constellationFrame: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  constellationImage: {
    width: '100%',
    height: '100%',
  },
  constellationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 9, 14, 0.2)',
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 120,
    zIndex: 1,
  },
  brandLockup: {
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  launchHint: {
    fontSize: 12,
    color: ft.textSecondary,
    fontFamily: FontFamily.medium,
    marginBottom: 8,
    opacity: 0.95,
  },
  title: {
    fontSize: 30,
    fontFamily: FontFamily.extrabold,
    color: ft.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FontFamily.regular,
    color: ft.textSecondary,
    marginBottom: 8,
  },
  subtitleAmbientLine: {
    alignSelf: 'flex-start',
    width: 40,
    height: 1,
    borderRadius: 1,
    backgroundColor: ft.accentCyan,
    opacity: 0.28,
    marginBottom: 12,
  },
  flagshipSection: {
    position: 'relative',
    marginBottom: 4,
  },
  cardSatinHighlight: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionGridSection: {
    width: '100%',
    alignSelf: 'stretch',
    marginBottom: theme.spacing.md,
  },
  profileCard: {
    position: 'relative',
    borderRadius: theme.radius.lg,
    backgroundColor: ft.surfaceElevated,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: 'rgba(238, 206, 128, 0.14)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  avatarOuterRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${ft.accentGold}ea`,
  },
  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12, 18, 28, 0.92)',
    borderWidth: 1,
    borderColor: ft.borderSubtle,
  },
  profileMeta: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    color: ft.textPrimary,
    fontFamily: FontFamily.bold,
    marginBottom: 2,
  },
  profilePlan: {
    fontSize: 13,
    color: ft.textSecondary,
    fontFamily: FontFamily.regular,
  },
  creditsCard: {
    position: 'relative',
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(12, 18, 28, 0.96)',
    padding: 14,
    marginBottom: 12,
    shadowColor: 'rgba(238, 206, 128, 0.14)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  creditsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    color: ft.textPrimary,
    fontFamily: FontFamily.bold,
  },
  cardBalance: {
    fontSize: 18,
    color: ft.champagne,
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
    textShadowColor: 'rgba(233, 199, 120, 0.22)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  cardHint: {
    fontSize: 13,
    lineHeight: 20,
    color: ft.textSecondary,
    fontFamily: FontFamily.regular,
  },
  identityCard: {
    position: 'relative',
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(12, 18, 28, 0.94)',
    padding: 14,
    marginBottom: 12,
    gap: 8,
    shadowColor: 'rgba(46, 207, 155, 0.14)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  premiumCardEdge: {
    pointerEvents: 'none',
  },
  identityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  identityBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46, 207, 155, 0.12)',
    borderWidth: 1,
    borderColor: `${ft.accentEmerald}ea`,
  },
  identityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  identityKey: {
    flex: 1,
    fontSize: 13,
    color: ft.mutedOnDark,
    fontFamily: FontFamily.medium,
  },
  identityValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    color: ft.textPrimary,
    fontFamily: FontFamily.bold,
  },
  editIdentityBtn: {
    marginTop: 8,
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${ft.accentGold}ea`,
    backgroundColor: 'rgba(12, 18, 28, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIdentityText: {
    fontSize: 12,
    color: ft.champagne,
    fontFamily: FontFamily.bold,
  },
  sectionTitle: {
    fontSize: 14,
    color: ft.textPrimary,
    fontFamily: FontFamily.extrabold,
    marginBottom: 8,
  },
  settingsCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: `${ft.accentCyan}ea`,
    backgroundColor: 'rgba(12, 18, 28, 0.9)',
    paddingHorizontal: 12,
    shadowColor: 'rgba(128, 210, 255, 0.14)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  languageRowText: {
    flex: 1,
    marginRight: 8,
  },
  languageRowSub: {
    fontSize: 11,
    marginTop: 2,
    color: ft.textSecondary,
    fontFamily: FontFamily.regular,
  },
  langModalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay.dim,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  langModalCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: ft.borderGold,
    backgroundColor: ft.surfaceElevated,
    padding: 18,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  langModalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: ft.textPrimary,
    marginBottom: 4,
  },
  langModalCaption: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
    color: ft.textSecondary,
    marginBottom: 14,
  },
  langOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: ft.borderSubtle,
    backgroundColor: 'rgba(10, 14, 22, 0.65)',
  },
  langOptionActive: {
    borderColor: ft.champagne,
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
  },
  langOptionTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: ft.textSecondary,
  },
  langOptionTitleActive: {
    color: ft.champagne,
  },
  langOptionHint: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: FontFamily.regular,
    color: ft.mutedOnDark,
  },
  langOptionHintActive: {
    color: ft.textSecondary,
  },
  langModalClose: {
    marginTop: 6,
    alignItems: 'center',
    paddingVertical: 10,
  },
  langModalCloseText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: ft.textSecondary,
  },
  resetOnboardingRow: {
    marginTop: 10,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ft.borderSubtle,
    backgroundColor: ft.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  settingRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: ft.borderSubtle,
    paddingVertical: 4,
    gap: 10,
  },
  settingIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(12, 18, 28, 0.82)',
  },
  settingIconCyan: {
    borderColor: ft.borderSubtle,
  },
  devTokenCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 172, 198, 0.34)',
    backgroundColor: 'rgba(10, 14, 22, 0.75)',
    padding: 14,
    marginBottom: 14,
  },
  /** Visually distinct from premium account cards — engineering strip, dev builds only. */
  devTokenCardDevMarker: {
    borderWidth: 1,
    borderColor: 'rgba(148, 172, 198, 0.3)',
    backgroundColor: 'rgba(10, 14, 22, 0.82)',
  },
  devTokenLabel: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    color: 'rgba(201, 169, 98, 0.72)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  devTokenHint: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: ft.textSecondary,
    marginBottom: 8,
    opacity: 0.95,
  },
  devTokenButton: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(148, 172, 198, 0.32)',
    backgroundColor: 'rgba(197, 160, 89, 0.14)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  devTokenButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: ft.champagne,
  },
  devTokenPreview: {
    marginTop: 10,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: ft.mutedOnDark,
  },
  settingText: {
    flex: 1,
    fontSize: 14,
    color: ft.textPrimary,
    fontFamily: FontFamily.medium,
  },
  resetAdminCard: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ft.borderGold,
    backgroundColor: ft.surfaceElevated,
    padding: 12,
  },
  resetAdminTitle: {
    fontSize: 12,
    color: ft.champagne,
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  resetAdminText: {
    fontSize: 13,
    color: ft.textSecondary,
    fontFamily: FontFamily.regular,
  },
});
