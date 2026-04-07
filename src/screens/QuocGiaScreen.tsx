import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getStrings } from '../i18n/strings';
import type { SupportedLanguage } from '../i18n/strings';
import { COUNTRY_PACKS } from '../config/countryPacks';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/routes';
import {
  getAssistantSettings,
  setAssistantSettings,
  type AssistantMode,
  type LoanAssistantVoiceGender,
} from '../state/assistantSettings';
import { APP_BRAND } from '../config/appBrand';
import { GLOBAL_WALLET_PACKAGES } from '../config/globalWalletPackages';
import { Colors } from '../theme/colors';
import { FontFamily } from '../theme/typography';

const FLAG_BY_COUNTRY: Record<string, string> = {
  CZ: '🇨🇿',
  SK: '🇸🇰',
  PL: '🇵🇱',
  DE: '🇩🇪',
  FR: '🇫🇷',
  UK: '🇬🇧',
  GB: '🇬🇧',
  CH: '🇨🇭',
  VN: '🇻🇳',
};

const COMBO_PREVIEW_TONES = ['#E9C5AA', '#D7DCE1', '#EAD88B', '#E0D5C6', '#D5E5E1', '#F0E0C4'];
const LANGUAGE_CODES: SupportedLanguage[] = ['vi', 'en', 'cs', 'de'];

function countryCodesForPricingTier(tier: 'T1' | 'T2'): string[] {
  return Object.keys(COUNTRY_PACKS)
    .filter((code) => COUNTRY_PACKS[code]?.pricingTier === tier)
    .sort();
}

export function QuocGiaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, setPendingRedirect } = useAuth();
  const tier1Codes = useMemo(() => countryCodesForPricingTier('T1'), []);
  const tier2Codes = useMemo(() => countryCodesForPricingTier('T2'), []);

  const [assistantMode, setAssistantMode] = useState<AssistantMode>('leona');
  const [languageIndex, setLanguageIndex] = useState(0);
  const [humanSimulation, setHumanSimulation] = useState(true);
  const [delegatedCall, setDelegatedCall] = useState(false);
  const [loanAssistantVoiceGender, setLoanAssistantVoiceGender] = useState<LoanAssistantVoiceGender>(
    () => getAssistantSettings().loanAssistantVoiceGender
  );
  const prevAssistant = useRef<AssistantMode>('leona');

  useEffect(() => {
    if (assistantMode === 'loan') {
      setHumanSimulation(false);
    } else if (prevAssistant.current === 'loan' && assistantMode === 'leona') {
      setHumanSimulation(true);
    }
    prevAssistant.current = assistantMode;
  }, [assistantMode]);

  const languageCode = LANGUAGE_CODES[languageIndex % LANGUAGE_CODES.length];
  const strings = getStrings(languageCode);
  const languageOptions = strings.country.languageOptions;
  const language = languageOptions[languageIndex % languageOptions.length];
  const comboPreview = GLOBAL_WALLET_PACKAGES.map((pkg, idx) => ({
    id: pkg.id,
    tone: COMBO_PREVIEW_TONES[idx % COMBO_PREVIEW_TONES.length],
    title: pkg.nameVi,
    turns: pkg.credits != null ? `${pkg.credits} Credits` : 'Theo hợp đồng',
  }));

  const cycleLanguage = () => {
    setLanguageIndex((i) => (i + 1) % LANGUAGE_CODES.length);
  };

  useEffect(() => {
    setAssistantSettings({
      assistantMode,
      languageCode: language.code,
      humanSimulation,
      loanAssistantVoiceGender,
    });
  }, [assistantMode, language.code, humanSimulation, loanAssistantVoiceGender]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.headerBlock}>
          <Text style={styles.brand}>{APP_BRAND.name}</Text>
          <Text style={styles.launchLine}>{APP_BRAND.launchSubtitle}</Text>
          <Text style={styles.title}>{strings.country.screenTitle}</Text>
          <Text style={styles.subtitle}>{strings.country.subtitle}</Text>
        </View>

        <View style={styles.tierBox}>
          <View style={styles.countryRow}>
            {tier1Codes.map((code) => (
              <View style={styles.countryChip} key={`t1-${code}`}>
                <Text style={styles.flag}>{FLAG_BY_COUNTRY[code] ?? '🏳️'}</Text>
                <Text style={styles.countryName}>{strings.country.countryNameByCode[code] ?? code}</Text>
              </View>
            ))}
          </View>
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeIcon}>🏅</Text>
            <Text style={styles.tierTitle}>T1</Text>
            <Text style={styles.tierSub}>({tier1Codes.join('/')})</Text>
          </View>
        </View>

        <View style={styles.tierBox}>
          <View style={styles.countryRow}>
            {tier2Codes.map((code) => (
              <View style={styles.countryChip} key={`t2-${code}`}>
                <Text style={styles.flag}>{FLAG_BY_COUNTRY[code] ?? '🏳️'}</Text>
                <Text style={styles.countryName}>{strings.country.countryNameByCode[code] ?? code}</Text>
              </View>
            ))}
          </View>
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeIcon}>🏅</Text>
            <Text style={styles.tierTitle}>T2</Text>
            <Text style={styles.tierSub}>({tier2Codes.join('/')})</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{strings.reception.prepaidTitle}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.comboRow}>
          {comboPreview.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {}}
              style={({ pressed }) => [
                styles.comboCard,
                { backgroundColor: item.tone },
                pressed && { opacity: 0.72 },
              ]}
            >
              <Text style={styles.comboTitle}>{item.title}</Text>
              <Text style={styles.comboTurns}>({item.turns})</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>{strings.country.aiSection}</Text>
        <View style={styles.glassPanel}>
          <View style={styles.toggleRow}>
            <Pressable
              style={({ pressed }) => [
                styles.toggleSegment,
                assistantMode === 'leona' && styles.toggleSegmentActive,
                pressed && { opacity: 0.72 },
              ]}
              onPress={() => {
                if (!user) {
                  setPendingRedirect('LeTan');
                  navigation.navigate('Login');
                  return;
                }
                setAssistantMode('leona');
              }}
            >
              <Text style={[styles.toggleText, assistantMode === 'leona' && styles.toggleTextActive]}>
                {strings.country.aiExternal}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.toggleSegment,
                assistantMode === 'loan' && styles.toggleSegmentActive,
                pressed && { opacity: 0.72 },
              ]}
              onPress={() => setAssistantMode('loan')}
            >
              <Text style={[styles.toggleText, assistantMode === 'loan' && styles.toggleTextActive]}>
                {strings.country.aiInternal}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.assistantHint}>
            {assistantMode === 'leona'
              ? strings.country.aiExternalHint
              : strings.country.aiInternalHint}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>{strings.country.callSettings}</Text>
        <View style={styles.glassPanel}>
          <Pressable
            style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.72 }]}
            onPress={cycleLanguage}
          >
            <View style={styles.settingLabelBlock}>
              <Text style={styles.settingLabel}>{strings.country.language}</Text>
              <Text style={styles.settingSub}>{strings.country.languageHint}</Text>
            </View>
            <View style={styles.settingValueRow}>
              <Text style={styles.settingValue}>{language.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSoft} />
            </View>
          </Pressable>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLabelBlock}>
              <Text style={styles.settingLabel}>{strings.country.humanSimulation}</Text>
              <Text style={[styles.settingSub, assistantMode === 'loan' && styles.settingSubMuted]}>
                {strings.country.humanSimulationHint}
              </Text>
            </View>
            <Switch
              value={humanSimulation}
              onValueChange={setHumanSimulation}
              disabled={assistantMode === 'loan'}
              trackColor={{ false: '#D6C9B4', true: '#C49A3C' }}
              thumbColor="#FFFDF7"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.voiceGenderBlock}>
            <Text style={styles.settingLabel}>{strings.country.loanAssistantVoiceTitle}</Text>
            <Text style={styles.voiceGenderSub}>{strings.country.loanAssistantVoiceSubtitle}</Text>
            <View style={styles.voiceChipRow}>
              <Pressable
                onPress={() => setLoanAssistantVoiceGender('female')}
                style={({ pressed }) => [
                  styles.voiceChip,
                  loanAssistantVoiceGender === 'female' && styles.voiceChipActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text
                  style={[
                    styles.voiceChipText,
                    loanAssistantVoiceGender === 'female' && styles.voiceChipTextActive,
                  ]}
                >
                  {strings.country.loanAssistantVoiceFemale}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setLoanAssistantVoiceGender('male')}
                style={({ pressed }) => [
                  styles.voiceChip,
                  loanAssistantVoiceGender === 'male' && styles.voiceChipActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text
                  style={[
                    styles.voiceChipText,
                    loanAssistantVoiceGender === 'male' && styles.voiceChipTextActive,
                  ]}
                >
                  {strings.country.loanAssistantVoiceMale}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLabelBlock}>
              <Text style={styles.settingLabel}>{strings.country.delegatedCall}</Text>
              <Text style={styles.settingSub}>{strings.country.delegatedCallHint}</Text>
            </View>
            <Switch
              value={delegatedCall}
              onValueChange={setDelegatedCall}
              trackColor={{ false: '#D6C9B4', true: '#651A17' }}
              thumbColor="#FFFDF7"
            />
          </View>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  headerBlock: {
    marginBottom: 14,
  },
  brand: {
    fontSize: 36,
    fontWeight: '800',
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  launchLine: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: Colors.textSoft,
    marginBottom: 10,
    opacity: 0.9,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FontFamily.regular,
    color: Colors.text,
    opacity: 0.86,
  },
  tierBox: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,251,243,0.88)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    flex: 1,
  },
  countryChip: {
    alignItems: 'center',
    minWidth: 62,
  },
  flag: {
    fontSize: 22,
  },
  countryName: {
    marginTop: 4,
    fontSize: 11,
    color: Colors.text,
    fontFamily: FontFamily.medium,
  },
  tierBadge: {
    marginLeft: 8,
    minWidth: 100,
    borderRadius: 16,
    backgroundColor: '#651A17',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tierBadgeIcon: {
    fontSize: 15,
    marginBottom: 1,
  },
  tierTitle: {
    color: '#F9EBC3',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    lineHeight: 20,
  },
  tierSub: {
    marginTop: 2,
    color: '#F2DBB0',
    fontSize: 11,
    fontFamily: FontFamily.regular,
  },
  sectionTitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    fontFamily: FontFamily.extrabold,
  },
  sectionSpacing: {
    marginTop: 18,
  },
  comboRow: {
    marginTop: 10,
    paddingBottom: 8,
    gap: 10,
  },
  comboCard: {
    width: 122,
    height: 84,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
  },
  comboTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A251E',
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
  },
  comboTurns: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#2A251E',
  },
  glassPanel: {
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 14,
    shadowColor: '#7D602A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,245,227,0.85)',
  },
  toggleSegment: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleSegmentActive: {
    backgroundColor: '#651A17',
  },
  toggleText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: Colors.textSoft,
    textAlign: 'center',
  },
  toggleTextActive: {
    color: '#F9EBC3',
  },
  assistantHint: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
    color: Colors.textSoft,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: 12,
  },
  settingLabelBlock: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: Colors.text,
  },
  settingSub: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textSoft,
  },
  settingSubMuted: {
    opacity: 0.55,
  },
  settingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValue: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
    maxWidth: 160,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(182,133,45,0.18)',
    marginVertical: 10,
  },
  voiceGenderBlock: {
    paddingVertical: 4,
  },
  voiceGenderSub: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textSoft,
    lineHeight: 18,
  },
  voiceChipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  voiceChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(182,133,45,0.35)',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  voiceChipActive: {
    borderColor: '#651A17',
    backgroundColor: 'rgba(101,26,23,0.12)',
  },
  voiceChipText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: Colors.textSoft,
  },
  voiceChipTextActive: {
    color: '#651A17',
  },
});
