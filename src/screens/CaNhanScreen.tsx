import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_BRAND } from '../config/appBrand';
import { useAppMode } from '../context/AppModeContext';
import { useAuth } from '../context/AuthContext';
import { getStrings } from '../i18n/strings';
import type { RootStackParamList } from '../navigation/routes';
import { useAssistantSettings } from '../state/assistantSettings';
import { resetGuidedOnboarding } from '../onboarding/guidedOnboardingStorage';
import { loadUsageHistory, type UsageHistoryItem } from '../services/history';
import { PrecisePanel } from '../components/ui/PrecisePanel';
import { useRegionState } from '../state/region';
import { useWalletState } from '../state/wallet';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { TrustHistoryCard } from '../components/widgets';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const ADMIN_UNLOCK_KEY = STORAGE_KEYS.adminUnlock;

function interpolate(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{${key}}`).join(value);
  }
  return out;
}

export function CaNhanScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { mode, setMode } = useAppMode();
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const { currentCountry, localCurrency } = useRegionState();
  const wallet = useWalletState();
  const settings = [
    {
      key: 'language',
      label: strings.profile.settingLanguage,
      onPress: () => {
        Alert.alert(strings.profile.alertLanguageTitle, strings.profile.alertLanguageBody);
      },
    },
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
    if (user.subscriptionPlan === 'pack') return strings.profile.planPack;
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
        <Text style={styles.contextText}>
          {currentCountry} · {localCurrency}
        </Text>

        <PrecisePanel style={styles.panel}>
          <Pressable
            onPress={() => navigation.navigate('SetupProfile', { mode: 'edit' })}
            style={({ pressed }) => [styles.profileCard, pressed && styles.pressed]}
          >
            <View style={styles.avatarWrap}>
              <Ionicons name="person" size={34} color={theme.colors.SignatureGold} />
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{strings.common.pronounYou}</Text>
              <Text style={styles.profilePlan}>{strings.profile.currentPlan}</Text>
            </View>
          </Pressable>
        </PrecisePanel>

        <PrecisePanel style={styles.panel}>
          <Pressable
            onPress={() => navigation.navigate('Wallet')}
            style={({ pressed }) => [styles.creditsCard, pressed && styles.pressed]}
          >
            <Text style={styles.cardTitle}>{strings.profile.creditsTitle}</Text>
            <Text style={styles.cardBalance}>
              {interpolate(strings.profile.creditsBalanceCurrent, { credits: String(wallet.credits) })}
            </Text>
            <Text style={styles.cardHint}>{strings.profile.creditsHint}</Text>
          </Pressable>
        </PrecisePanel>

        <PrecisePanel style={styles.panel}>
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
            style={({ pressed }) => [styles.editIdentityBtn, pressed && styles.pressed]}
          >
            <Text style={styles.editIdentityText}>{strings.profile.editIdentityCta}</Text>
          </Pressable>
          </View>
        </PrecisePanel>

        <Text style={styles.sectionTitle}>{strings.profile.settingsTitle}</Text>
        <PrecisePanel style={styles.panel}>
          <View style={styles.settingsCard}>
          {settings.map((item) => (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
            >
              <Text style={styles.settingText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
            </Pressable>
          ))}
          </View>
        </PrecisePanel>

        <TrustHistoryCard items={history} />

        <Pressable
          onPress={() => {
            const isCommercialTierAllowed =
              user?.commercialTier === 'pro' || user?.commercialTier === 'power' || user?.commercialTier === 'enterprise';

            if (mode === 'B2B_MODE') {
              setMode('B2C_MODE');
              Alert.alert('Chuyển không gian làm việc', 'Đã quay lại không gian B2C tiêu chuẩn.');
              return;
            }

            if (!isCommercialTierAllowed) {
              setMode('B2C_MODE');
              Alert.alert(
                'Cần nâng cấp gói doanh nghiệp',
                'Không gian B2B chỉ mở cho gói Pro, Power hoặc Enterprise.'
              );
              navigation.navigate('B2BPaywall');
              return;
            }

            setMode('B2B_MODE');
            Alert.alert('Chuyển không gian làm việc', 'Đang chuyển sang không gian Quản lý Doanh nghiệp.');
          }}
          style={({ pressed }) => [styles.switchWorkspaceRow, pressed && styles.pressed]}
        >
          <Text style={styles.settingText}>🔄 Chuyển sang Quản lý Doanh nghiệp</Text>
          <Ionicons name="swap-horizontal" size={18} color={theme.colors.text.secondary} />
        </Pressable>

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
          style={({ pressed }) => [styles.resetOnboardingRow, pressed && styles.pressed]}
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
            style={({ pressed }) => [styles.resetAdminCard, pressed && styles.pressed]}
          >
            <Text style={styles.resetAdminTitle}>{strings.profile.settingsTitle}</Text>
            <Text style={styles.resetAdminText}>{strings.profile.onboardingResetMessage}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.DeepInkNavy,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },
  brand: {
    fontSize: 14,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.regular,
    marginBottom: 4,
  },
  launchHint: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    marginBottom: 8,
    opacity: 0.95,
  },
  title: {
    ...theme.typeScale.h1,
    color: theme.colors.SignatureGold,
    marginBottom: 6,
  },
  subtitle: {
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
  },
  contextText: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  panel: {
    backgroundColor: theme.colors.executive.card,
    marginBottom: 10,
  },
  profileCard: {
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
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
    ...theme.typeScale.h2,
    color: theme.colors.CeolWhite,
    marginBottom: 2,
  },
  profilePlan: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
  },
  creditsCard: {
    padding: 2,
  },
  cardTitle: {
    ...theme.typeScale.h2,
    color: theme.colors.SignatureGold,
    marginBottom: 4,
  },
  cardBalance: {
    ...theme.typeScale.h2,
    color: theme.colors.SignatureGold,
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
  },
  cardHint: {
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
  },
  identityCard: {
    padding: 2,
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
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
  },
  identityValue: {
    flex: 1,
    textAlign: 'right',
    ...theme.typeScale.caption,
    color: theme.colors.CeolWhite,
    fontFamily: FontFamily.semibold,
  },
  editIdentityBtn: {
    marginTop: 8,
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.GraphiteBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIdentityText: {
    ...theme.typeScale.caption,
    color: theme.colors.CeolWhite,
    fontFamily: FontFamily.semibold,
  },
  sectionTitle: {
    ...theme.typeScale.h2,
    color: theme.colors.SignatureGold,
    marginBottom: 8,
  },
  settingsCard: {
    paddingHorizontal: 2,
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
  switchWorkspaceRow: {
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
  },
  settingText: {
    ...theme.typeScale.body,
    color: theme.colors.CeolWhite,
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
    ...theme.typeScale.caption,
    color: theme.colors.SignatureGold,
    fontFamily: FontFamily.semibold,
    marginBottom: 4,
  },
  resetAdminText: {
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
  },
  pressed: {
    opacity: 0.78,
  },
});
