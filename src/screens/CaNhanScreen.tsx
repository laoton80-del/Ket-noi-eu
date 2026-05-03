import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { b2cTheme } from '../theme/appModeThemes';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';
import { hasB2BWorkspaceAccess } from '../utils/b2bAccess';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const ADMIN_UNLOCK_KEY = STORAGE_KEYS.adminUnlock;

const LANGUAGE_OPTIONS: ReadonlyArray<{
  code: 'vi' | 'en' | 'cs' | 'de';
  title: string;
  hint: string;
}> = [
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
  const { user, updateProfile } = useAuth();
  const { mode, setMode } = useAppMode();
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const wallet = useWalletState();
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
          Alert.alert('Kết Nối Global', access.message);
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
        Alert.alert('Kết Nối Global', access.message);
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
      onPress: () => {
        Alert.alert(strings.profile.alertNotificationsTitle, strings.profile.alertNotificationsBody);
      },
    },
    {
      key: 'privacy',
      label: strings.profile.settingPrivacy,
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>{APP_BRAND.name}</Text>
        <Text style={styles.launchHint}>{APP_BRAND.launchSubtitle}</Text>
        <Text style={styles.title}>{strings.profile.screenTitle}</Text>
        <Text style={styles.subtitle}>{strings.profile.subtitle}</Text>

        <Pressable
          onPress={() => navigation.navigate('SetupProfile', { mode: 'edit' })}
          style={({ pressed }) => [styles.profileCard, pressed && { opacity: 0.72 }]}
        >
          <View style={styles.avatarWrap}>
            <Ionicons name="person" size={34} color={theme.colors.primary} />
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{strings.common.pronounYou}</Text>
            <Text style={styles.profilePlan}>{strings.profile.currentPlan}</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Wallet')}
          style={({ pressed }) => [styles.creditsCard, pressed && { opacity: 0.72 }]}
        >
          <Text style={styles.cardTitle}>{strings.profile.creditsTitle}</Text>
          <Text style={styles.cardBalance}>
            {interpolate(strings.profile.creditsBalanceCurrent, { credits: String(wallet.credits) })}
          </Text>
          <Text style={styles.cardHint}>{strings.profile.creditsHint}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Wallet')}
          style={({ pressed }) => [styles.virtualStoreShortcut, pressed && { opacity: 0.78 }]}
          accessibilityRole="button"
          accessibilityLabel="Cửa hàng Vật phẩm — Khung avatar và huy hiệu VIP"
        >
          <View style={styles.virtualStoreShortcutIcon}>
            <Ionicons name="storefront-outline" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.virtualStoreShortcutMeta}>
            <Text style={styles.virtualStoreShortcutTitle}>Cửa hàng Vật phẩm</Text>
            <Text style={styles.virtualStoreShortcutHint}>Khung Avatar Trống Đồng · Huy hiệu Xác minh Hộ chiếu — thanh toán Xu.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
        </Pressable>

        <Pressable
          onPress={() => openMerchantRoute('B2BPaywall')}
          style={({ pressed }) => [styles.b2bPricingCard, pressed && { opacity: 0.72 }]}
        >
          <Ionicons name="pricetags-outline" size={22} color={theme.hybrid.signalStrong} />
          <View style={styles.b2bPricingMeta}>
            <Text style={styles.b2bPricingTitle}>Bảng giá doanh nghiệp (B2B)</Text>
            <Text style={styles.b2bPricingHint}>Gói Cơ bản, Pro, Power — thanh toán theo lịch hoặc theo tháng.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
        </Pressable>

        <Pressable
          onPress={openB2BWorkspaceSwitch}
          style={({ pressed }) => [styles.b2bSwitchCard, pressed && { opacity: 0.78 }]}
          accessibilityRole="button"
          accessibilityLabel="Chuyển sang Quản lý Doanh nghiệp"
        >
          <Ionicons name="swap-horizontal" size={20} color={theme.colors.CeolWhite} />
          <View style={styles.b2bSwitchMeta}>
            <Text style={styles.b2bSwitchTitle}>🔄 Chuyển sang Quản lý Doanh nghiệp</Text>
            <Text style={styles.b2bSwitchHint}>
              Workspace hiện tại: {mode === 'B2B_MODE' ? 'B2B_MODE' : 'B2C_MODE'}.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.CeolWhite} />
        </Pressable>

        {user && (user.serverRole === 'BROKER' || isMerchantServerRole(user.serverRole)) ? (
          <Pressable
            onPress={() => {
              if (user.workspaceUiOverride === 'consumer') {
                updateProfile({ workspaceUiOverride: null });
              } else {
                updateProfile({ workspaceUiOverride: 'consumer' });
              }
            }}
            style={({ pressed }) => [styles.workspaceHatCard, pressed && { opacity: 0.82 }]}
            accessibilityRole="button"
            accessibilityLabel="Switch default between workspace and consumer home"
          >
            <Ionicons name="people-circle-outline" size={22} color={theme.colors.primary} />
            <View style={styles.b2bSwitchMeta}>
              <Text style={styles.workspaceHatTitle}>
                {user.workspaceUiOverride === 'consumer'
                  ? `Use ${user.serverRole === 'BROKER' ? 'broker' : 'merchant'} dashboard as default home`
                  : 'Switch default home to ViGlobal consumer app'}
              </Text>
              <Text style={styles.workspaceHatHint}>
                One tap — saved on this device. Open wallet & tabs stay the same.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => openMerchantRoute('PartnerOnboarding')}
          style={({ pressed }) => [
            styles.partnerEnterpriseRow,
            {
              backgroundColor: b2cTheme.colors.card,
              borderColor: theme.colors.primary,
            },
            pressed && { opacity: 0.78 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Dành cho Doanh nghiệp: Trở thành đối tác"
        >
          <View style={[styles.partnerEnterpriseIcon, { borderColor: theme.colors.primary, backgroundColor: 'rgba(197, 160, 89, 0.12)' }]}>
            <Ionicons name="shield-checkmark" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.partnerEnterpriseMeta}>
            <Text style={[styles.partnerEnterpriseTitle, { color: b2cTheme.colors.text }]}>Dành cho Doanh nghiệp: Trở thành đối tác</Text>
            <Text style={[styles.partnerEnterpriseHint, { color: 'rgba(11, 22, 40, 0.62)' }]}>
              Chương trình Đối tác chứng nhận — chia sẻ doanh thu, liên hệ trong 24h.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={b2cTheme.colors.text} />
        </Pressable>

        <View style={styles.identityCard}>
          <Text style={styles.cardTitle}>{strings.profile.identityTitle}</Text>
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
        </View>

        <Text style={styles.sectionTitle}>{strings.profile.settingsTitle}</Text>
        <View style={styles.settingsCard}>
          <Pressable
            onPress={() => setLanguageModalOpen(true)}
            style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.72 }]}
            accessibilityRole="button"
            accessibilityLabel="Language Ngôn ngữ"
          >
            <View style={styles.languageRowText}>
              <Text style={styles.settingText}>🌐 Language / Ngôn ngữ</Text>
              <Text style={styles.languageRowSub} numberOfLines={1}>
                {languageSubtitleForCode(languageCode)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
          </Pressable>
          {settings.map((item) => (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.72 }]}
            >
              <Text style={styles.settingText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
            </Pressable>
          ))}
        </View>

        <GDPRDashboard />

        {__DEV__ ? (
          <View style={styles.devTokenCard}>
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
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 120,
  },
  brand: {
    fontSize: 14,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.regular,
    marginBottom: 4,
  },
  launchHint: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
    marginBottom: 8,
    opacity: 0.95,
  },
  title: {
    fontSize: 30,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  profileCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.card,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.executive.chipFill,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
  },
  profileMeta: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
    marginBottom: 2,
  },
  profilePlan: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  creditsCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.card,
    padding: 14,
    marginBottom: 12,
  },
  b2bPricingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.hybrid.signalMutedBg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  b2bPricingMeta: {
    flex: 1,
    gap: 4,
  },
  b2bPricingTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  b2bPricingHint: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  b2bSwitchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.6)',
    backgroundColor: '#E53935',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  b2bSwitchMeta: {
    flex: 1,
    gap: 4,
  },
  b2bSwitchTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.colors.CeolWhite,
  },
  b2bSwitchHint: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.9)',
  },
  workspaceHatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: b2cTheme.colors.card,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  workspaceHatTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: b2cTheme.colors.text,
  },
  workspaceHatHint: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  virtualStoreShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: b2cTheme.colors.card,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  virtualStoreShortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
  },
  virtualStoreShortcutMeta: {
    flex: 1,
    gap: 4,
  },
  virtualStoreShortcutTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: b2cTheme.colors.text,
  },
  virtualStoreShortcutHint: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
    color: 'rgba(11, 22, 40, 0.62)',
  },
  partnerEnterpriseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  partnerEnterpriseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  partnerEnterpriseMeta: {
    flex: 1,
    gap: 4,
  },
  partnerEnterpriseTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  partnerEnterpriseHint: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  cardTitle: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  cardBalance: {
    fontSize: 18,
    color: theme.colors.primary,
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
  },
  cardHint: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  identityCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.card,
    padding: 14,
    marginBottom: 12,
    gap: 8,
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
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
  },
  identityValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  editIdentityBtn: {
    marginTop: 8,
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.panelMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIdentityText: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  sectionTitle: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.extrabold,
    marginBottom: 8,
  },
  settingsCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.card,
    paddingHorizontal: 12,
  },
  languageRowText: {
    flex: 1,
    marginRight: 8,
  },
  languageRowSub: {
    fontSize: 11,
    marginTop: 2,
    color: theme.colors.text.secondary,
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
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.surfaceElevated,
    padding: 18,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  langModalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  langModalCaption: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    marginBottom: 14,
  },
  langOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: 'rgba(244, 241, 234, 0.04)',
  },
  langOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.14)',
  },
  langOptionTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
  },
  langOptionTitleActive: {
    color: theme.colors.primaryBright,
  },
  langOptionHint: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.tertiary,
  },
  langOptionHintActive: {
    color: theme.colors.text.secondary,
  },
  langModalClose: {
    marginTop: 6,
    alignItems: 'center',
    paddingVertical: 10,
  },
  langModalCloseText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
  resetOnboardingRow: {
    marginTop: 10,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  settingRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glass.borderSoft,
    paddingVertical: 4,
  },
  devTokenCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.card,
    padding: 14,
    marginBottom: 14,
  },
  devTokenLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  devTokenHint: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    marginBottom: 8,
    opacity: 0.9,
  },
  devTokenButton: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  devTokenButtonText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: theme.colors.onAccent,
  },
  devTokenPreview: {
    marginTop: 10,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  settingText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.medium,
  },
  resetAdminCard: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.panel,
    padding: 12,
  },
  resetAdminTitle: {
    fontSize: 12,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  resetAdminText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
});
