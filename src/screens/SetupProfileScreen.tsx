import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getStrings } from '../i18n/strings';
import { useAssistantSettings } from '../state/assistantSettings';
import type { PricingTierId } from '../config/countryPacks';
import { PILOT_LEONA_SERVICES_FALLBACK_PREFILL, resolvePilotAwareRedirectTarget } from '../config/launchPilot';
import { MAIN_TAB, type RootStackParamList } from '../navigation/routes';
import { vionaTokens } from '../design';
import { IdentityGlassTextField } from '../components/setupProfile/IdentityGlassTextField';
import { IdentitySelectorCard } from '../components/setupProfile/IdentitySelectorCard';
import { VionaBrandLockup } from '../components/viona/VionaBrandLockup';
import {
  premiumCrispEdgeStroke,
  premiumFrameEdgeOverlay,
} from '../components/viona/fashionHomeDesktopShell';
import { FontFamily } from '../theme/typography';

const ft = vionaTokens.fashionTech;
const LUM_PANEL_BORDER = 'rgba(148, 172, 198, 0.44)';
const LUM_GOLD_EDGE = `${ft.accentGold}ea`;
const LUM_EMERALD_EDGE = `${ft.accentEmerald}ea`;
const LUM_GLOW_CYAN = 'rgba(128, 210, 255, 0.14)';
const LUM_GLOW_GOLD = 'rgba(238, 206, 128, 0.14)';
const LUM_GLOW_EMERALD = 'rgba(46, 207, 155, 0.14)';
const LUM_INNER_HIGHLIGHT = 'rgba(255, 232, 188, 0.2)';
const IMG_IDENTITY_CONSTELLATION = require('../../assets/UI/viona-identity-global-net-bg-v2.png');
const constellationImageWebFit =
  Platform.OS === 'web'
    ? ({ objectFit: 'cover' as const, objectPosition: '46% 28%' as const } as const)
    : null;

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SetupRoute = RouteProp<RootStackParamList, 'SetupProfile'>;

function isValidIsoDate(input: string): boolean {
  const value = input.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map((v) => Number(v));
  if (!y || !m || !d) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

const SETUP_CONTENT_MAX_WIDTH = 560;

const RESIDENCY_COUNTRY_DEFS: readonly { code: string; tier: PricingTierId }[] = [
  { code: 'CZ', tier: 'T1' },
  { code: 'SK', tier: 'T1' },
  { code: 'PL', tier: 'T1' },
  { code: 'DE', tier: 'T2' },
  { code: 'FR', tier: 'T2' },
  { code: 'UK', tier: 'T2' },
  { code: 'GB', tier: 'T2' },
];

export function SetupProfileScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<SetupRoute>();
  const { user, completeProfile, updateProfile, pendingRedirect, setPendingRedirect } = useAuth();
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const { width: windowWidth } = useWindowDimensions();
  const contentColumn = useMemo(
    () => ({
      width: '100%' as const,
      maxWidth: SETUP_CONTENT_MAX_WIDTH,
      alignSelf: 'center' as const,
    }),
    []
  );
  const countries = useMemo(
    () =>
      RESIDENCY_COUNTRY_DEFS.map((c) => ({
        ...c,
        label: strings.setupProfile.countryLabelByCode[c.code] ?? c.code,
      })),
    [strings.setupProfile.countryLabelByCode]
  );
  const residencyOptions = useMemo(
    () => [
      { value: 'du_hoc' as const, label: strings.profile.residencyStatusDuHoc },
      { value: 'lao_dong' as const, label: strings.profile.residencyStatusLaoDong },
      { value: 'dinh_cu' as const, label: strings.profile.residencyStatusDinhCu },
      { value: 'ti_nan' as const, label: strings.profile.residencyStatusTiNan },
    ],
    [strings.profile]
  );
  const segmentOptions = useMemo(
    () => [
      { value: 'adult' as const, label: strings.setupProfile.segmentAdult },
      { value: 'child' as const, label: strings.setupProfile.segmentChild },
    ],
    [strings.setupProfile.segmentAdult, strings.setupProfile.segmentChild]
  );
  const constellationImageSize = useMemo(
    () => ({
      maxWidth: Math.min(windowWidth, 1672),
    }),
    [windowWidth],
  );
  const isEditMode = route.params?.mode === 'edit';
  const [name, setName] = useState('');
  const [countryIndex, setCountryIndex] = useState(0);
  const [residencyIndex, setResidencyIndex] = useState(1);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [visaType, setVisaType] = useState('');
  const [visaExpiryDate, setVisaExpiryDate] = useState('');
  const [focusedField, setFocusedField] = useState<'name' | 'visaType' | 'visaExpiry' | null>(null);
  const selectedCountry = countries[countryIndex] ?? countries[0];
  const selectedResidency = residencyOptions[residencyIndex] ?? residencyOptions[0];
  const selectedSegment = segmentOptions[segmentIndex] ?? segmentOptions[0];
  const visaExpiryRaw = visaExpiryDate.trim();
  const visaExpiryValid = isValidIsoDate(visaExpiryRaw);
  const showVisaExpiryError = visaExpiryRaw.length > 0 && !visaExpiryValid;
  const canContinue = useMemo(
    () => name.trim().length >= 2 && visaExpiryValid,
    [name, visaExpiryValid]
  );

  useEffect(() => {
    if (!isEditMode || !user) return;
    setName(user.name ?? '');
    const cIdx = countries.findIndex((c) => c.code === user.country);
    if (cIdx >= 0) setCountryIndex(cIdx);
    const rIdx = residencyOptions.findIndex((r) => r.value === user.residencyStatus);
    if (rIdx >= 0) setResidencyIndex(rIdx);
    const sIdx = segmentOptions.findIndex((s) => s.value === (user.segment ?? 'adult'));
    if (sIdx >= 0) setSegmentIndex(sIdx);
    setVisaType(user.visaType ?? '');
    setVisaExpiryDate(user.visaExpiryDate ?? '');
  }, [countries, isEditMode, residencyOptions, segmentOptions, user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backdrop} pointerEvents="none">
        <View style={styles.constellationFrame}>
          <Image
            source={IMG_IDENTITY_CONSTELLATION}
            style={[styles.constellationImage, constellationImageSize, constellationImageWebFit]}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </View>
        <View style={styles.constellationOverlay} />
      </View>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollBody, contentColumn]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardWrap}>
        <View style={styles.card}>
          <VionaBrandLockup variant="header" showAccentUnderline style={styles.brandLockup} />
          <View style={styles.titleRow}>
            <View style={styles.identityGlyph}>
              <Ionicons name="person-outline" size={15} color={ft.accentEmerald} />
            </View>
            <Text style={styles.title}>
              {isEditMode ? strings.setupProfile.titleEdit : strings.setupProfile.titleSetup}
            </Text>
          </View>
          <Text style={styles.sub}>{strings.setupProfile.subtitle}</Text>

          <View style={styles.selectorStack}>
            <IdentitySelectorCard
              kicker={strings.setupProfile.kickerCountry}
              valueLine={selectedCountry.label}
              accent="cyan"
              onPress={() => setCountryIndex((i) => (i + 1) % countries.length)}
              accessibilityLabel={strings.setupProfile.a11yCountry}
              testID="setup-profile-country"
            />
            <IdentitySelectorCard
              kicker={strings.setupProfile.kickerResidency}
              valueLine={selectedResidency.label}
              accent="emerald"
              onPress={() => setResidencyIndex((i) => (i + 1) % residencyOptions.length)}
              accessibilityLabel={strings.setupProfile.a11yResidency}
              testID="setup-profile-residency"
            />
            <IdentitySelectorCard
              kicker={strings.setupProfile.kickerSegment}
              valueLine={selectedSegment.label}
              accent="violet"
              onPress={() => setSegmentIndex((i) => (i + 1) % segmentOptions.length)}
              accessibilityLabel={strings.setupProfile.a11ySegment}
              testID="setup-profile-segment"
            />
          </View>

          <View style={styles.fieldStack}>
            <IdentityGlassTextField
              value={name}
              onChangeText={setName}
              placeholder={strings.setupProfile.placeholderName}
              focused={focusedField === 'name'}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField((prev) => (prev === 'name' ? null : prev))}
              accessibilityLabel={strings.setupProfile.a11yName}
              testID="setup-profile-name"
            />
            <IdentityGlassTextField
              value={visaType}
              onChangeText={setVisaType}
              placeholder={strings.setupProfile.placeholderVisaType}
              focused={focusedField === 'visaType'}
              onFocus={() => setFocusedField('visaType')}
              onBlur={() => setFocusedField((prev) => (prev === 'visaType' ? null : prev))}
              accessibilityLabel={strings.setupProfile.a11yVisaType}
              testID="setup-profile-visa-type"
            />
            <IdentityGlassTextField
              value={visaExpiryDate}
              onChangeText={setVisaExpiryDate}
              placeholder={strings.setupProfile.placeholderVisaExpiry}
              focused={focusedField === 'visaExpiry'}
              onFocus={() => setFocusedField('visaExpiry')}
              onBlur={() => setFocusedField((prev) => (prev === 'visaExpiry' ? null : prev))}
              accessibilityLabel={strings.setupProfile.a11yVisaExpiry}
              testID="setup-profile-visa-expiry"
            />
          </View>
          {showVisaExpiryError ? (
            <Text style={styles.errorText}>{strings.setupProfile.errorVisaExpiryInvalid}</Text>
          ) : null}

          <Text style={styles.disclaimer}>{strings.setupProfile.selfDeclaredDisclaimer}</Text>

          <Pressable
          disabled={!canContinue}
          onPress={() => {
            if (isEditMode) {
              updateProfile({
                name: name.trim(),
                country: selectedCountry.code,
                countryTier: selectedCountry.tier,
                residencyStatus: selectedResidency.value,
                segment: selectedSegment.value,
                visaType: visaType.trim(),
              visaExpiryDate: visaExpiryRaw,
              });
              navigation.goBack();
              return;
            }
            completeProfile({
              name: name.trim(),
              country: selectedCountry.code,
              countryTier: selectedCountry.tier,
              residencyStatus: selectedResidency.value,
              segment: selectedSegment.value,
              visaType: visaType.trim(),
              visaExpiryDate: visaExpiryRaw,
              subscriptionPlan: 'free',
            });
            const redirectTo = pendingRedirect;
            if (redirectTo === 'Wallet') {
              setPendingRedirect(null);
              navigation.navigate('Wallet');
              return;
            }
            if (redirectTo === 'AiEye') {
              setPendingRedirect(null);
              navigation.navigate('AiEye');
              return;
            }
            if (redirectTo === 'LeonaCall') {
              setPendingRedirect(null);
              navigation.navigate('LeonaCall');
              return;
            }
            if (redirectTo === 'Vault') {
              setPendingRedirect(null);
              navigation.navigate('Vault');
              return;
            }
            if (redirectTo === 'LiveInterpreter') {
              setPendingRedirect(null);
              navigation.navigate('LiveInterpreter', { guidedEntry: true, scenario: 'general' });
              return;
            }
            if (redirectTo === 'RadarDiscovery') {
              setPendingRedirect(null);
              const next = resolvePilotAwareRedirectTarget('RadarDiscovery');
              if (next === 'LeonaCall') {
                navigation.navigate('LeonaCall', {
                  prefillRequest: PILOT_LEONA_SERVICES_FALLBACK_PREFILL,
                  autoSubmit: false,
                });
              } else {
                navigation.navigate('RadarDiscovery');
              }
              return;
            }
            if (redirectTo === 'LeTan') {
              setPendingRedirect(null);
              navigation.navigate('AiReceptionistDemoSimulator');
              return;
            }
            if (redirectTo === 'Academy') {
              setPendingRedirect(null);
              navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.ai });
              return;
            }
            if (redirectTo === 'HocTap') {
              setPendingRedirect(null);
              navigation.navigate('Tabs', { screen: 'TabHome' });
              return;
            }
            setPendingRedirect(null);
            navigation.navigate('Tabs');
          }}
          style={({ pressed }) => [
            styles.cta,
            canContinue && styles.ctaEnabled,
            !canContinue && styles.ctaDisabled,
            pressed && { opacity: 0.82 },
          ]}
        >
          <Text
            style={[styles.ctaText, canContinue && styles.ctaTextEnabled, !canContinue && styles.ctaTextDisabled]}
          >
            {strings.setupProfile.ctaSave}
          </Text>
        </Pressable>
        </View>
        <View
          pointerEvents="none"
          style={[styles.cardEdgeOverlay, premiumFrameEdgeOverlay(22), premiumCrispEdgeStroke(LUM_PANEL_BORDER)]}
        />
        <View pointerEvents="none" style={styles.cardTopHighlight} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ft.canvas,
    overflow: 'hidden',
  },
  keyboardAvoid: {
    flex: 1,
    zIndex: 1,
  },
  scrollBody: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    width: '100%',
  },
  backdrop: {
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
    opacity: 0.54,
  },
  constellationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 9, 14, 0.28)',
  },
  cardWrap: {
    position: 'relative',
    zIndex: 1,
    borderRadius: 22,
    shadowColor: LUM_GLOW_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    borderRadius: 22,
    backgroundColor: 'rgba(12, 18, 28, 0.96)',
    padding: 16,
    paddingTop: 18,
    overflow: 'hidden',
  },
  brandLockup: {
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  cardEdgeOverlay: {
    pointerEvents: 'none',
  },
  cardTopHighlight: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 0,
    height: 1,
    backgroundColor: LUM_INNER_HIGHLIGHT,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  identityGlyph: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LUM_EMERALD_EDGE,
    backgroundColor: 'rgba(12, 18, 28, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: LUM_GLOW_EMERALD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  title: { flex: 1, fontSize: 27, color: ft.textPrimary, fontFamily: FontFamily.extrabold },
  sub: { fontSize: 13, lineHeight: 20, color: ft.textSecondary, fontFamily: FontFamily.regular, marginBottom: 12 },
  selectorStack: {
    gap: 10,
    marginBottom: 10,
  },
  fieldStack: {
    gap: 10,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: ft.sosNeonMuted,
    fontFamily: FontFamily.medium,
  },
  disclaimer: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 16,
    color: ft.textSecondary,
    fontFamily: FontFamily.regular,
    opacity: 0.92,
  },
  cta: {
    height: 46,
    borderRadius: 12,
    marginTop: 14,
    backgroundColor: 'rgba(12, 18, 28, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(244, 214, 144, 0.46)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaEnabled: {
    backgroundColor: '#e8c97a',
    borderColor: LUM_GOLD_EDGE,
    borderWidth: 1,
    shadowColor: LUM_GLOW_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  ctaDisabled: {
    backgroundColor: 'rgba(12, 18, 28, 0.96)',
    borderColor: 'rgba(244, 214, 144, 0.34)',
  },
  ctaText: { fontFamily: FontFamily.bold, fontSize: 15 },
  ctaTextEnabled: { color: ft.canvas },
  ctaTextDisabled: { color: '#c9a962' },
});
