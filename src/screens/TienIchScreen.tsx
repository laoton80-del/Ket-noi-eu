import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LAUNCH_PILOT_CONFIG, PILOT_LEONA_SERVICES_FALLBACK_PREFILL } from '../config/launchPilot';
import { APP_BRAND } from '../config/appBrand';
import { getComboPricesByCountry } from '../config/Pricing';
import { normalizeCountryCodeOrSentinel } from '../config/countryPacks';
import { useAuth } from '../context/AuthContext';
import { getStrings } from '../i18n/strings';
import type { RootStackParamList } from '../navigation/routes';
import { useAssistantSettings } from '../state/assistantSettings';
import { Colors } from '../theme/colors';
import { FontFamily } from '../theme/typography';

export function TienIchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const locale = languageCode === 'vi' ? 'vi-VN' : languageCode === 'cs' ? 'cs-CZ' : languageCode === 'de' ? 'de-DE' : 'en-GB';
  const country = normalizeCountryCodeOrSentinel(user?.country);
  const comboCards = useMemo(() => getComboPricesByCountry(country, locale), [country, locale]);
  const serviceCards = [
    { id: 'job', label: strings.utility.serviceJob, icon: 'briefcase-outline' as const },
    { id: 'housing', label: strings.utility.serviceHousing, icon: 'home-outline' as const },
    { id: 'legal', label: strings.utility.serviceLegal, icon: 'document-text-outline' as const },
    { id: 'exchange', label: strings.utility.serviceExchange, icon: 'swap-horizontal-outline' as const },
    { id: 'lifeos', label: 'LifeOS Dashboard', icon: 'speedometer-outline' as const },
    { id: 'travel', label: 'Đồng hành du lịch', icon: 'airplane-outline' as const },
    ...(LAUNCH_PILOT_CONFIG.enableYeuThuongSurface
      ? [{ id: 'yeuthuong' as const, label: 'Kết Nối Yêu Thương', icon: 'heart-outline' as const }]
      : []),
    {
      id: 'radar',
      label: LAUNCH_PILOT_CONFIG.enableRadarSurface ? 'Radar Discovery' : 'Tìm dịch vụ (Leona)',
      icon: 'radio-outline' as const,
    },
    { id: 'vault', label: 'Két Sắt Giấy Tờ', icon: 'shield-checkmark-outline' as const },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.brand}>{APP_BRAND.name}</Text>
      <Text style={styles.launchHint}>{APP_BRAND.launchSubtitle}</Text>
      <Text style={styles.title}>{strings.utility.screenTitle}</Text>
      <Text style={styles.subtitle}>{strings.utility.subtitle}</Text>

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
              <Ionicons name={item.icon} size={22} color={Colors.primary} />
            </View>
            <Text style={styles.serviceLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>{strings.reception.prepaidTitle}</Text>
      {comboCards.map((combo) => (
        <Pressable
          key={combo.id}
          onPress={() => {}}
          style={({ pressed }) => [styles.pricingCard, pressed && { opacity: 0.72 }]}
        >
          <Text style={styles.cardTitle}>{combo.name}</Text>
          <Text style={styles.cardHint}>
            {combo.purchasable ? `${combo.turns} Credits` : strings.comboWallet.enterpriseCta}
          </Text>
          <Text style={styles.priceLine}>
            {strings.comboWallet.packPriceLine.replace('{amount}', combo.amountLabel)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
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
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
    marginBottom: 4,
  },
  launchHint: {
    fontSize: 12,
    color: Colors.textSoft,
    fontFamily: FontFamily.medium,
    marginBottom: 8,
    opacity: 0.9,
  },
  title: {
    fontSize: 30,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FontFamily.regular,
    color: Colors.textSoft,
    marginBottom: 12,
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
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
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glass,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8D6D31',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 2,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 251, 242, 0.85)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginBottom: 10,
  },
  serviceLabel: {
    textAlign: 'center',
    fontSize: 15,
    color: Colors.text,
    fontFamily: FontFamily.semibold,
  },
  pricingCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glass,
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    fontFamily: FontFamily.bold,
  },
  cardHint: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: Colors.textSoft,
  },
  priceLine: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
    fontFamily: FontFamily.semibold,
  },
});
