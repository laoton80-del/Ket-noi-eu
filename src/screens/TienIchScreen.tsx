import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LAUNCH_PILOT_CONFIG, PILOT_LEONA_SERVICES_FALLBACK_PREFILL } from '../config/launchPilot';
import { APP_BRAND } from '../config/appBrand';
import { getWalletPackagePricesByCountry } from '../config/commercialSpine';
import { normalizeCountryCodeOrSentinel } from '../config/countryPacks';
import { useAuth } from '../context/AuthContext';
import { getStrings } from '../i18n/strings';
import type { RootStackParamList } from '../navigation/routes';
import { useAssistantSettings } from '../state/assistantSettings';
import { DiscoveryCuratedList } from '../components/DiscoveryCuratedList';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

export function TienIchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const locale = languageCode === 'vi' ? 'vi-VN' : languageCode === 'cs' ? 'cs-CZ' : languageCode === 'de' ? 'de-DE' : 'en-GB';
  const country = normalizeCountryCodeOrSentinel(user?.country);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.brand}>{APP_BRAND.name}</Text>
      <Text style={styles.launchHint}>{APP_BRAND.launchSubtitle}</Text>
      <Text style={styles.title}>{strings.utility.screenTitle}</Text>
      <Text style={styles.subtitle}>{strings.utility.subtitle}</Text>

      <DiscoveryCuratedList
        sectionTitle={strings.utility.discoverySectionTitle}
        sectionSubtitle={strings.utility.discoverySectionSubtitle}
        categories={strings.utility.discoveryCategories}
      />

      <Text style={styles.sectionTitle}>{strings.utility.servicesTitle}</Text>
      <View style={styles.grid}>
        {serviceCards.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              if (item.id === 'vault') {
                navigation.navigate('Vault');
                return;
              }
              if (item.id === 'radar') {
                if (LAUNCH_PILOT_CONFIG.enableRadarSurface) {
                  navigation.navigate('RadarDiscovery');
                } else {
                  navigation.navigate('LeonaCall', {
                    prefillRequest: PILOT_LEONA_SERVICES_FALLBACK_PREFILL,
                    autoSubmit: false,
                  });
                }
                return;
              }
              if (item.id === 'lifeos') {
                navigation.navigate('LifeOSDashboard');
                return;
              }
              if (item.id === 'travel') {
                navigation.navigate('TravelCompanion');
                return;
              }
              if (item.id === 'yeuthuong') {
                navigation.navigate('KetNoiYeuThuong');
                return;
              }
            }}
            style={({ pressed }) => [styles.serviceCard, pressed && { opacity: 0.72 }]}
          >
            <View style={styles.iconBubble}>
              <Ionicons name={item.icon} size={22} color={theme.hybrid.signalStrong} />
            </View>
            <Text style={styles.serviceLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>{strings.reception.prepaidTitle}</Text>
      {walletPackCards.map((pack) => (
        <Pressable
          key={pack.id}
          onPress={() => {}}
          style={({ pressed }) => [styles.pricingCard, pressed && { opacity: 0.72 }]}
        >
          <Text style={styles.cardTitle}>{pack.name}</Text>
          <Text style={styles.cardHint}>
            {pack.purchasable
              ? strings.utility.packTurnsCredits.replace('{turns}', String(pack.turns))
              : strings.comboWallet.enterpriseCta}
          </Text>
          <Text style={styles.priceLine}>
            {strings.comboWallet.packPriceLine.replace('{amount}', pack.amountLabel)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
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
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
    marginBottom: theme.spacing.xs,
  },
  launchHint: {
    fontSize: theme.typeScale.caption.fontSize,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
    marginBottom: theme.spacing.sm,
    opacity: 0.9,
  },
  title: {
    fontSize: theme.typeScale.h1.fontSize,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    letterSpacing: 0.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceCard: {
    width: '48%',
    minHeight: 116,
    borderWidth: 1,
    borderColor: theme.hybrid.borderOnInk,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.hybrid.signalMutedBg,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    marginBottom: 10,
  },
  serviceLabel: {
    textAlign: 'center',
    fontSize: 15,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.semibold,
  },
  pricingCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: theme.hybrid.panelCool,
    borderRadius: theme.radius.lg,
    padding: 14,
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.hybrid.panelCoolText,
    marginBottom: 6,
    fontFamily: FontFamily.bold,
  },
  cardHint: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: theme.hybrid.panelCoolTextMuted,
  },
  priceLine: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.hybrid.signalStrong,
    marginTop: 2,
    fontFamily: FontFamily.semibold,
  },
});
