import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, type ResidencyStatus, type UserSegment } from '../context/AuthContext';
import type { PricingTierId } from '../config/countryPacks';
import { PILOT_LEONA_SERVICES_FALLBACK_PREFILL, resolvePilotAwareRedirectTarget } from '../config/launchPilot';
import type { RootStackParamList } from '../navigation/routes';
import { vionaTokens } from '../design';
import { VionaBrandLockup } from '../components/viona/VionaBrandLockup';
import {
  premiumCrispEdgeStroke,
  premiumFrameEdgeOverlay,
} from '../components/viona/fashionHomeDesktopShell';
import { FontFamily } from '../theme/typography';

const ft = vionaTokens.fashionTech;
const LUM_PANEL_BORDER = 'rgba(148, 172, 198, 0.44)';
const LUM_CYAN_EDGE = `${ft.accentCyan}ea`;
const LUM_GOLD_EDGE = `${ft.accentGold}ea`;
const LUM_EMERALD_EDGE = `${ft.accentEmerald}ea`;
const LUM_VIOLET_EDGE = `${ft.accentViolet}ea`;
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

const RESIDENCY_COUNTRIES: { code: string; tier: PricingTierId; label: string }[] = [
  { code: 'CZ', tier: 'T1', label: 'Czechia (T1)' },
  { code: 'SK', tier: 'T1', label: 'Slovakia (T1)' },
  { code: 'PL', tier: 'T1', label: 'Poland (T1)' },
  { code: 'DE', tier: 'T2', label: 'Germany (T2)' },
  { code: 'FR', tier: 'T2', label: 'France (T2)' },
  { code: 'UK', tier: 'T2', label: 'United Kingdom (T2)' },
  { code: 'GB', tier: 'T2', label: 'United Kingdom — GB (T2)' },
];

const RESIDENCY_OPTIONS: { value: ResidencyStatus; label: string }[] = [
  { value: 'du_hoc', label: 'Du học' },
  { value: 'lao_dong', label: 'Lao động' },
  { value: 'dinh_cu', label: 'Định cư' },
  { value: 'ti_nan', label: 'Tị nạn' },
];

const SEGMENT_OPTIONS: { value: UserSegment; label: string }[] = [
  { value: 'adult', label: 'Người lớn (học tiếng bản địa)' },
  { value: 'child', label: 'Trẻ em (học tiếng Việt)' },
];

export function SetupProfileScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<SetupRoute>();
  const { user, completeProfile, updateProfile, pendingRedirect, setPendingRedirect } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
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
  const selectedCountry = RESIDENCY_COUNTRIES[countryIndex];
  const selectedResidency = RESIDENCY_OPTIONS[residencyIndex];
  const selectedSegment = SEGMENT_OPTIONS[segmentIndex];
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
    const cIdx = RESIDENCY_COUNTRIES.findIndex((c) => c.code === user.country);
    if (cIdx >= 0) setCountryIndex(cIdx);
    const rIdx = RESIDENCY_OPTIONS.findIndex((r) => r.value === user.residencyStatus);
    if (rIdx >= 0) setResidencyIndex(rIdx);
    const sIdx = SEGMENT_OPTIONS.findIndex((s) => s.value === (user.segment ?? 'adult'));
    if (sIdx >= 0) setSegmentIndex(sIdx);
    setVisaType(user.visaType ?? '');
    setVisaExpiryDate(user.visaExpiryDate ?? '');
  }, [isEditMode, user]);

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
      <View style={styles.cardWrap}>
        <View style={styles.card}>
          <VionaBrandLockup variant="header" showAccentUnderline style={styles.brandLockup} />
          <View style={styles.titleRow}>
          <View style={styles.identityGlyph}>
            <Ionicons name="shield-checkmark" size={15} color={ft.accentEmerald} />
          </View>
          <Text style={styles.title}>{isEditMode ? 'Cập nhật hồ sơ Identity' : 'Thiết lập hồ sơ'}</Text>
        </View>
        <Text style={styles.sub}>Chọn quốc gia cư trú và bổ sung hồ sơ để tư vấn và công cụ khớp ngữ cảnh hơn.</Text>

        <Pressable
          onPress={() => setCountryIndex((i) => (i + 1) % RESIDENCY_COUNTRIES.length)}
          style={({ pressed }) => [styles.countryBtn, styles.countryBtnCyan, pressed && { opacity: 0.82 }]}
        >
          <View style={styles.rowBadgeCyan} />
          <Text style={styles.countryLabel}>{selectedCountry.label}</Text>
        </Pressable>

        <Pressable
          onPress={() => setResidencyIndex((i) => (i + 1) % RESIDENCY_OPTIONS.length)}
          style={({ pressed }) => [styles.countryBtn, styles.countryBtnTeal, pressed && { opacity: 0.82 }]}
        >
          <View style={styles.rowBadgeTeal} />
          <Text style={styles.countryLabel}>Diện cư trú: {selectedResidency.label}</Text>
        </Pressable>

        <Pressable
          onPress={() => setSegmentIndex((i) => (i + 1) % SEGMENT_OPTIONS.length)}
          style={({ pressed }) => [styles.countryBtn, styles.countryBtnSegment, pressed && { opacity: 0.82 }]}
        >
          <View style={styles.rowBadgeSegment} />
          <Text style={styles.countryLabel}>Segment học tập: {selectedSegment.label}</Text>
        </Pressable>

        <View style={styles.inputField}>
          {focusedField === 'name' ? <View style={styles.inputMarker} /> : null}
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tên / Tên tiệm"
            style={[styles.input, focusedField === 'name' && styles.inputFocused]}
            placeholderTextColor="rgba(244, 246, 250, 0.72)"
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField((prev) => (prev === 'name' ? null : prev))}
          />
        </View>
        <View style={[styles.inputField, styles.inputSpacer]}>
          {focusedField === 'visaType' ? <View style={styles.inputMarker} /> : null}
          <TextInput
            value={visaType}
            onChangeText={setVisaType}
            placeholder="Loại Visa/Thẻ cư trú (vd: Blue Card)"
            style={[styles.input, focusedField === 'visaType' && styles.inputFocused]}
            placeholderTextColor="rgba(244, 246, 250, 0.72)"
            onFocus={() => setFocusedField('visaType')}
            onBlur={() => setFocusedField((prev) => (prev === 'visaType' ? null : prev))}
          />
        </View>
        <View style={[styles.inputField, styles.inputSpacer]}>
          {focusedField === 'visaExpiry' ? <View style={styles.inputMarker} /> : null}
          <TextInput
            value={visaExpiryDate}
            onChangeText={setVisaExpiryDate}
            placeholder="Ngày hết hạn Visa (YYYY-MM-DD)"
            style={[styles.input, focusedField === 'visaExpiry' && styles.inputFocused]}
            placeholderTextColor="rgba(244, 246, 250, 0.72)"
            onFocus={() => setFocusedField('visaExpiry')}
            onBlur={() => setFocusedField((prev) => (prev === 'visaExpiry' ? null : prev))}
          />
        </View>
        {showVisaExpiryError ? (
          <Text style={styles.errorText}>Ngày hết hạn chưa đúng định dạng YYYY-MM-DD hoặc không hợp lệ.</Text>
        ) : null}

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
              navigation.navigate('Tabs', { screen: 'TabAi' });
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
            Hoàn tất
          </Text>
        </Pressable>
        </View>
        <View
          pointerEvents="none"
          style={[styles.cardEdgeOverlay, premiumFrameEdgeOverlay(22), premiumCrispEdgeStroke(LUM_PANEL_BORDER)]}
        />
        <View pointerEvents="none" style={styles.cardTopHighlight} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ft.canvas,
    justifyContent: 'center',
    paddingHorizontal: 18,
    overflow: 'hidden',
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
  countryBtn: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(136, 218, 255, 0.4)',
    backgroundColor: 'rgba(14, 20, 30, 0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  countryBtnCyan: {
    borderColor: LUM_CYAN_EDGE,
    backgroundColor: 'rgba(12, 18, 28, 0.96)',
  },
  countryBtnTeal: {
    borderColor: LUM_EMERALD_EDGE,
    backgroundColor: 'rgba(12, 18, 28, 0.96)',
  },
  countryBtnSegment: {
    borderColor: LUM_VIOLET_EDGE,
    backgroundColor: 'rgba(12, 18, 28, 0.96)',
  },
  rowBadgeCyan: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ft.accentCyan,
    opacity: 1,
    shadowColor: ft.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 3,
    elevation: 1,
  },
  rowBadgeTeal: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ft.accentEmerald,
    opacity: 1,
    shadowColor: ft.accentEmerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 3,
    elevation: 1,
  },
  rowBadgeSegment: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ft.accentViolet,
    opacity: 1,
    shadowColor: ft.accentViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 3,
    elevation: 1,
  },
  countryLabel: {
    color: ft.textPrimary,
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    flex: 1,
    flexShrink: 1,
  },
  inputField: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputMarker: {
    position: 'absolute',
    left: 11,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ft.accentCyan,
    opacity: 0.88,
    zIndex: 1,
  },
  input: {
    minHeight: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(136, 218, 255, 0.4)',
    backgroundColor: 'rgba(10, 14, 22, 0.96)',
    paddingLeft: 14,
    paddingRight: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 20,
    color: ft.textPrimary,
    fontFamily: FontFamily.medium,
  },
  inputFocused: {
    borderColor: LUM_CYAN_EDGE,
    backgroundColor: 'rgba(10, 14, 22, 1)',
    paddingLeft: 26,
    shadowColor: LUM_GLOW_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  inputSpacer: {
    marginTop: 10,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: ft.sosNeonMuted,
    fontFamily: FontFamily.medium,
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
