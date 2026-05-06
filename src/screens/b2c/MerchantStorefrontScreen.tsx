import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SmartLanguageSwitcher } from '../../components/ui/SmartLanguageSwitcher';
import type { RootStackParamList } from '../../navigation/routes';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { coerceLanguageSelection, getLocalLanguageConfig, sanitizeLocalLanguageOptions, type LocalLanguageCode } from '../../utils/languageMapper';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type MerchantStorefrontRoute = RouteProp<RootStackParamList, 'MerchantStorefront'>;

type SupportedStorefrontLanguage = 'vi' | 'en' | 'cs' | 'de';
type UiCopy = Readonly<{
  header: string;
  subtitle: string;
  bookNow: string;
  bookFast: string;
  serviceNail: string;
  serviceCombo: string;
  serviceDeluxe: string;
}>;

const STORE_COPY: Readonly<Record<SupportedStorefrontLanguage, UiCopy>> = {
  vi: {
    header: 'Đặt lịch tại cửa hàng',
    subtitle: 'Chọn dịch vụ phù hợp và xác nhận trong 1 chạm.',
    bookNow: 'Đặt ngay',
    bookFast: 'Đặt nhanh với Lễ tân AI',
    serviceNail: 'Sơn gel tiêu chuẩn',
    serviceCombo: 'Combo cắt da + sơn',
    serviceDeluxe: 'Gói deluxe chăm sóc toàn diện',
  },
  en: {
    header: 'Book Your Service',
    subtitle: 'Pick your service and confirm in one tap.',
    bookNow: 'Book Now',
    bookFast: 'Quick Book via AI Reception',
    serviceNail: 'Standard gel manicure',
    serviceCombo: 'Cuticle + polish combo',
    serviceDeluxe: 'Deluxe full-care package',
  },
  cs: {
    header: 'Rezervace služby',
    subtitle: 'Vyberte službu a potvrďte jedním kliknutím.',
    bookNow: 'Rezervovat',
    bookFast: 'Rychlá rezervace přes AI recepci',
    serviceNail: 'Standardní gelová manikúra',
    serviceCombo: 'Kombinace péče + lak',
    serviceDeluxe: 'Deluxe kompletní péče',
  },
  de: {
    header: 'Service buchen',
    subtitle: 'Service wählen und mit einem Klick bestätigen.',
    bookNow: 'Jetzt buchen',
    bookFast: 'Schnellbuchung über AI-Rezeption',
    serviceNail: 'Standard Gel-Maniküre',
    serviceCombo: 'Kombi Nagelhaut + Lack',
    serviceDeluxe: 'Deluxe Komplettpflege',
  },
};

function toSupportedLanguage(code: LocalLanguageCode): SupportedStorefrontLanguage {
  if (code === 'vi' || code === 'en' || code === 'cs' || code === 'de') return code;
  return 'en';
}

function resolveCopy(primaryCode: LocalLanguageCode): UiCopy {
  const primary = STORE_COPY[toSupportedLanguage(primaryCode)];
  if (primary) return primary;
  return STORE_COPY.vi ?? STORE_COPY.en;
}

export function MerchantStorefrontScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<MerchantStorefrontRoute>();
  const merchantName = route.params?.merchantName ?? 'Merchant';
  const merchantCountryCode = route.params?.merchantCountryCode?.trim() || 'US';
  const languageOptions = useMemo(
    () => sanitizeLocalLanguageOptions(getLocalLanguageConfig(merchantCountryCode)),
    [merchantCountryCode]
  );
  const [selectedLanguage, setSelectedLanguage] = useState<LocalLanguageCode>('vi');
  const effectiveLanguage = useMemo(
    () => coerceLanguageSelection(selectedLanguage, languageOptions),
    [languageOptions, selectedLanguage]
  );
  const copy = resolveCopy(effectiveLanguage);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.82 }]}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>{merchantName}</Text>
        <SmartLanguageSwitcher
          options={languageOptions}
          selectedCode={effectiveLanguage}
          onSelect={setSelectedLanguage}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>{copy.header}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>

        {[copy.serviceNail, copy.serviceCombo, copy.serviceDeluxe].map((service) => (
          <View key={service} style={styles.serviceCard} className={applyWebStyles('kn-glass')}>
            <Text style={styles.serviceName}>{service}</Text>
            <Pressable
              style={({ pressed }) => [styles.bookBtn, pressed && { opacity: 0.9 }]}
              className={applyWebStyles('kn-neon-b2b')}
              accessibilityRole="button"
              accessibilityLabel={copy.bookNow}
            >
              <Text style={styles.bookBtnText}>{copy.bookNow}</Text>
            </Pressable>
          </View>
        ))}

        <Pressable
          onPress={() =>
            navigation.navigate('LeonaCall', {
              prefillRequest: `${copy.bookFast}: ${merchantName}`,
              autoSubmit: false,
            })
          }
          style={({ pressed }) => [styles.fastBtn, pressed && { opacity: 0.9 }]}
          className={applyWebStyles('kn-glass kn-neon-b2b')}
        >
          <Ionicons name="call" size={18} color={theme.hybrid.signalStrong} />
          <Text style={styles.fastBtnText}>{copy.bookFast}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  backBtn: { padding: 8 },
  topTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  scroll: { padding: 16, paddingBottom: 30, gap: 10 },
  header: { fontSize: 24, fontFamily: FontFamily.extrabold, color: theme.colors.text.primary },
  subtitle: { fontSize: 13, lineHeight: 19, fontFamily: FontFamily.regular, color: theme.colors.text.secondary, marginBottom: 4 },
  serviceCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.35)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    gap: 10,
  },
  serviceName: { fontSize: 15, fontFamily: FontFamily.bold, color: theme.colors.text.primary },
  bookBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    backgroundColor: theme.hybrid.signalStrong,
  },
  bookBtnText: { fontSize: 13, fontFamily: FontFamily.extrabold, color: theme.hybrid.onSignal },
  fastBtn: {
    marginTop: 6,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.45)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fastBtnText: { fontSize: 14, fontFamily: FontFamily.bold, color: theme.colors.primaryBright },
});
