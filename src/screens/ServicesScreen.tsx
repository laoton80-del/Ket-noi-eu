import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LAUNCH_PILOT_CONFIG, PILOT_LEONA_SERVICES_FALLBACK_PREFILL } from '../config/launchPilot';
import { APP_BRAND } from '../config/appBrand';
import { getWalletPackagePricesByCountry } from '../config/commercialSpine';
import { normalizeCountryCodeOrSentinel } from '../config/countryPacks';
import { PrecisePanel } from '../components/ui/PrecisePanel';
import { useAuth } from '../context/AuthContext';
import { useMiniAppEntry } from '../hooks/useMiniAppEntry';
import { getStrings } from '../i18n/strings';
import { MAIN_TAB, type RootStackParamList } from '../navigation/routes';
import { useAssistantSettings } from '../state/assistantSettings';
import { useRegionState } from '../state/region';
import { DiscoveryCuratedList } from '../components/DiscoveryCuratedList';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

export function ServicesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { openMiniApp } = useMiniAppEntry();
  const { user } = useAuth();
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const locale = languageCode === 'vi' ? 'vi-VN' : languageCode === 'cs' ? 'cs-CZ' : languageCode === 'de' ? 'de-DE' : 'en-GB';
  const country = normalizeCountryCodeOrSentinel(user?.country);
  const { currentCountry, localCurrency } = useRegionState();
  const walletPackCards = useMemo(() => getWalletPackagePricesByCountry(country, locale), [country, locale]);
  const u = strings.utility;
  const serviceCards = [
    { id: 'job' as const, label: u.serviceJob, icon: 'briefcase-outline' as const },
    { id: 'housing' as const, label: u.serviceHousing, icon: 'home-outline' as const },
    { id: 'legal' as const, label: u.serviceLegal, icon: 'document-text-outline' as const },
    { id: 'exchange' as const, label: u.serviceExchange, icon: 'swap-horizontal-outline' as const },
    { id: 'lifeos' as const, label: u.serviceLifeOS, icon: 'speedometer-outline' as const },
    { id: 'travel' as const, label: u.serviceTravel, icon: 'airplane-outline' as const },
    ...(LAUNCH_PILOT_CONFIG.enableYeuThuongSurface
      ? [{ id: 'yeuthuong' as const, label: u.serviceYeuThuong, icon: 'heart-outline' as const }]
      : []),
    {
      id: 'radar' as const,
      label: LAUNCH_PILOT_CONFIG.enableRadarSurface ? u.serviceRadarDiscovery : u.serviceFindServicesLeona,
      icon: 'radio-outline' as const,
    },
    { id: 'vault' as const, label: u.serviceVault, icon: 'shield-checkmark-outline' as const },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PrecisePanel style={styles.localHeaderPanel}>
          <Text style={styles.localHeaderTitle}>{strings.nav.utilityTab} in {currentCountry}</Text>
          <Text style={styles.localHeaderMeta}>{APP_BRAND.name} · {localCurrency}</Text>
        </PrecisePanel>

        <DiscoveryCuratedList
          sectionTitle={strings.utility.discoverySectionTitle}
          sectionSubtitle={strings.utility.discoverySectionSubtitle}
          categories={strings.utility.discoveryCategories}
        />

        <Text style={styles.sectionTitle}>{strings.utility.servicesTitle}</Text>
        <PrecisePanel style={styles.servicesGridPanel}>
          <View style={styles.grid}>
            {serviceCards.map((item) => (
              <PrecisePanel key={item.id} style={styles.servicePanel}>
                <Pressable
                  onPress={() => {
                    if (item.id === 'vault') {
                      navigation.navigate('Vault');
                      return;
                    }
                    if (item.id === 'radar') {
                      if (LAUNCH_PILOT_CONFIG.enableRadarSurface) {
                        navigation.navigate('RadarDiscovery');
                      } else {
                        openMiniApp('b2cAiCallAssistant', () =>
                          navigation.navigate('LeonaCall', {
                            prefillRequest: PILOT_LEONA_SERVICES_FALLBACK_PREFILL,
                            autoSubmit: false,
                          })
                        );
                      }
                      return;
                    }
                    if (item.id === 'lifeos') {
                      navigation.navigate('LifeOSDashboard');
                      return;
                    }
                    if (item.id === 'travel') {
                      openMiniApp('travel', () =>
                        navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.travel })
                      );
                      return;
                    }
                    if (item.id === 'yeuthuong') {
                      navigation.navigate('KetNoiYeuThuong');
                      return;
                    }
                  }}
                  style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}
                >
                  <View style={styles.iconBubble}>
                    <Ionicons name={item.icon} size={22} color={theme.colors.SignatureGold} />
                  </View>
                  <Text style={styles.serviceLabel}>{item.label}</Text>
                </Pressable>
              </PrecisePanel>
            ))}
          </View>
        </PrecisePanel>

        <Text style={styles.sectionTitle}>{strings.reception.prepaidTitle}</Text>
        {walletPackCards.map((pack) => (
          <PrecisePanel key={pack.id} style={styles.pricingPanel}>
            <Pressable onPress={() => {}} style={({ pressed }) => [styles.pricingCard, pressed && styles.pressed]}>
              <Text style={styles.cardTitle}>{pack.name}</Text>
              <Text style={styles.cardHint}>
                {pack.purchasable
                  ? strings.utility.packTurnsCredits.replace('{turns}', String(pack.turns))
                  : strings.walletTopUp.enterpriseCta}
              </Text>
              <Text style={styles.priceLine}>
                {strings.walletTopUp.packPriceLine.replace('{amount}', `${pack.amountLabel} (${localCurrency})`)}
              </Text>
            </Pressable>
          </PrecisePanel>
        ))}
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 120,
  },
  brand: {
    ...theme.typeScale.caption,
    color: theme.colors.SignatureGold,
    marginBottom: theme.spacing.xs,
  },
  localHeaderPanel: {
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.executive.card,
  },
  localHeaderTitle: {
    ...theme.typeScale.h1,
    color: theme.colors.SignatureGold,
    fontFamily: FontFamily.bold,
  },
  localHeaderMeta: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
  },
  launchHint: {
    fontSize: theme.typeScale.caption.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
    marginBottom: theme.spacing.sm,
    opacity: 0.9,
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
  contextLabel: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    ...theme.typeScale.h2,
    color: theme.colors.SignatureGold,
    letterSpacing: 0.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  servicesGridPanel: {
    backgroundColor: theme.colors.executive.card,
  },
  servicePanel: {
    width: '48%',
    backgroundColor: theme.colors.executive.card,
    padding: 0,
  },
  serviceCard: {
    minHeight: 116,
    backgroundColor: 'transparent',
    borderRadius: theme.radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.GraphiteBlue,
    borderWidth: 1,
    borderColor: theme.colors.SignatureGold,
    marginBottom: 10,
  },
  serviceLabel: {
    textAlign: 'center',
    ...theme.typeScale.body,
    color: theme.colors.CeolWhite,
    fontFamily: FontFamily.semibold,
  },
  pricingPanel: {
    marginTop: 10,
    backgroundColor: theme.colors.executive.card,
    padding: 0,
  },
  pricingCard: {
    width: '100%',
    backgroundColor: 'transparent',
    padding: 14,
  },
  cardTitle: {
    ...theme.typeScale.h2,
    color: theme.colors.SignatureGold,
    marginBottom: 6,
  },
  cardHint: {
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
  },
  priceLine: {
    ...theme.typeScale.body,
    color: theme.colors.SignatureGold,
    marginTop: 2,
    fontFamily: FontFamily.semibold,
  },
  pressed: {
    opacity: 0.78,
  },
});
