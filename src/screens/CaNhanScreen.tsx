import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_BRAND } from '../config/appBrand';
import { useAuth } from '../context/AuthContext';
import { getStrings } from '../i18n/strings';
import type { RootStackParamList } from '../navigation/routes';
import { useAssistantSettings } from '../state/assistantSettings';
import { resetGuidedOnboarding } from '../onboarding/guidedOnboardingStorage';
import { loadUsageHistory, type UsageHistoryItem } from '../services/history';
import { useWalletState } from '../state/wallet';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { TrustHistoryCard } from '../components/widgets';
import { Colors } from '../theme/colors';
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
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
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
    if (user.subscriptionPlan === 'combo') return strings.profile.planCombo;
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
            <Ionicons name="person" size={34} color={Colors.primary} />
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
          {settings.map((item) => (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.72 }]}
            >
              <Text style={styles.settingText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSoft} />
            </Pressable>
          ))}
        </View>

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
          <Ionicons name="refresh" size={18} color={Colors.textSoft} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    color: Colors.textSoft,
    marginBottom: 12,
  },
  profileCard: {
    borderRadius: 18,
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
    color: Colors.text,
    fontFamily: FontFamily.bold,
    marginBottom: 2,
  },
  profilePlan: {
    fontSize: 13,
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
  },
  creditsCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.card,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  cardBalance: {
    fontSize: 18,
    color: Colors.primary,
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
  },
  cardHint: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
  },
  identityCard: {
    borderRadius: 18,
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
    color: Colors.textSoft,
    fontFamily: FontFamily.medium,
  },
  identityValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    color: Colors.text,
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
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  sectionTitle: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamily.extrabold,
    marginBottom: 8,
  },
  settingsCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.card,
    paddingHorizontal: 12,
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
  },
  settingText: {
    fontSize: 14,
    color: Colors.text,
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
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
  },
});
