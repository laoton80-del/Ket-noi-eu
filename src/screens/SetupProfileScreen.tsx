import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import type { ResidencyStatus } from '../context/AuthContext';
import type { UserSegment } from '../context/AuthContext';
import type { PricingTierId } from '../config/countryPacks';
import { PILOT_LEONA_SERVICES_FALLBACK_PREFILL, resolvePilotAwareRedirectTarget } from '../config/launchPilot';
import type { RootStackParamList } from '../navigation/routes';
import { Colors } from '../theme/colors';
import { FontFamily } from '../theme/typography';

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

const RESIDENCY_COUNTRIES: Array<{ code: string; tier: PricingTierId; label: string }> = [
  { code: 'CZ', tier: 'T1', label: 'Czechia (T1)' },
  { code: 'SK', tier: 'T1', label: 'Slovakia (T1)' },
  { code: 'PL', tier: 'T1', label: 'Poland (T1)' },
  { code: 'DE', tier: 'T2', label: 'Germany (T2)' },
  { code: 'FR', tier: 'T2', label: 'France (T2)' },
  { code: 'UK', tier: 'T2', label: 'United Kingdom (T2)' },
  { code: 'GB', tier: 'T2', label: 'United Kingdom — GB (T2)' },
];

const RESIDENCY_OPTIONS: Array<{ value: ResidencyStatus; label: string }> = [
  { value: 'du_hoc', label: 'Du học' },
  { value: 'lao_dong', label: 'Lao động' },
  { value: 'dinh_cu', label: 'Định cư' },
  { value: 'ti_nan', label: 'Tị nạn' },
];

const SEGMENT_OPTIONS: Array<{ value: UserSegment; label: string }> = [
  { value: 'adult', label: 'Người lớn (học tiếng bản địa)' },
  { value: 'child', label: 'Trẻ em (học tiếng Việt)' },
];

export function SetupProfileScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<SetupRoute>();
  const { user, completeProfile, updateProfile, pendingRedirect, setPendingRedirect } = useAuth();
  const isEditMode = route.params?.mode === 'edit';
  const [name, setName] = useState('');
  const [countryIndex, setCountryIndex] = useState(0);
  const [residencyIndex, setResidencyIndex] = useState(1);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [visaType, setVisaType] = useState('');
  const [visaExpiryDate, setVisaExpiryDate] = useState('');
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
      <View style={styles.card}>
        <Text style={styles.title}>{isEditMode ? 'Cập nhật hồ sơ Identity' : 'Thiết lập hồ sơ'}</Text>
        <Text style={styles.sub}>Chọn quốc gia cư trú và bổ sung hồ sơ để tư vấn và công cụ khớp ngữ cảnh hơn.</Text>

        <Pressable
          onPress={() => setCountryIndex((i) => (i + 1) % RESIDENCY_COUNTRIES.length)}
          style={({ pressed }) => [styles.countryBtn, pressed && { opacity: 0.82 }]}
        >
          <Text style={styles.countryLabel}>{selectedCountry.label}</Text>
        </Pressable>

        <Pressable
          onPress={() => setResidencyIndex((i) => (i + 1) % RESIDENCY_OPTIONS.length)}
          style={({ pressed }) => [styles.countryBtn, pressed && { opacity: 0.82 }]}
        >
          <Text style={styles.countryLabel}>Diện cư trú: {selectedResidency.label}</Text>
        </Pressable>

        <Pressable
          onPress={() => setSegmentIndex((i) => (i + 1) % SEGMENT_OPTIONS.length)}
          style={({ pressed }) => [styles.countryBtn, pressed && { opacity: 0.82 }]}
        >
          <Text style={styles.countryLabel}>Segment học tập: {selectedSegment.label}</Text>
        </Pressable>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Tên / Tên tiệm"
          style={styles.input}
          placeholderTextColor="rgba(31,26,20,0.45)"
        />
        <TextInput
          value={visaType}
          onChangeText={setVisaType}
          placeholder="Loại Visa/Thẻ cư trú (vd: Blue Card)"
          style={[styles.input, styles.inputSpacer]}
          placeholderTextColor="rgba(31,26,20,0.45)"
        />
        <TextInput
          value={visaExpiryDate}
          onChangeText={setVisaExpiryDate}
          placeholder="Ngày hết hạn Visa (YYYY-MM-DD)"
          style={[styles.input, styles.inputSpacer]}
          placeholderTextColor="rgba(31,26,20,0.45)"
        />
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
              navigation.navigate('Tabs', { screen: 'LeTan' });
              return;
            }
            if (redirectTo === 'HocTap') {
              setPendingRedirect(null);
              navigation.navigate('Tabs', { screen: 'HocTap' });
              return;
            }
            setPendingRedirect(null);
            navigation.navigate('Tabs');
          }}
          style={({ pressed }) => [styles.cta, !canContinue && styles.ctaDisabled, pressed && { opacity: 0.82 }]}
        >
          <Text style={styles.ctaText}>Hoàn tất</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F6F0', justifyContent: 'center', paddingHorizontal: 18 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 16,
    shadowColor: '#8B7355',
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  title: { fontSize: 27, color: Colors.text, fontFamily: FontFamily.extrabold, marginBottom: 6 },
  sub: { fontSize: 13, lineHeight: 20, color: Colors.textSoft, fontFamily: FontFamily.regular, marginBottom: 12 },
  countryBtn: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  countryLabel: { color: Colors.text, fontFamily: FontFamily.semibold, fontSize: 14 },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    backgroundColor: 'rgba(255,255,255,0.86)',
    paddingHorizontal: 12,
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  inputSpacer: {
    marginTop: 10,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#B3261E',
    fontFamily: FontFamily.medium,
  },
  cta: {
    height: 46,
    borderRadius: 12,
    marginTop: 14,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: '#FFE9D2', fontFamily: FontFamily.bold, fontSize: 15 },
});
