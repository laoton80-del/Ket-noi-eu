/**
 * SOS Plus profile — consent, trusted contacts, local stub entitlement (AF.SOS.2).
 * No Stripe, Twilio, recording, or emergency dispatch.
 */
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SOS_PLUS_PROFILE_UI_ENABLED } from '../../config/sosPlusProduction';
import type { SosConsentSnapshot, SosPlusLocalProfileSnapshot, SosTrustedContact } from '../../domain/sos/sosPlusModels';
import { useTranslation } from '../../i18n';
import type { RootStackParamList } from '../../navigation/routes';
import { loadSosPlusLocalProfile, saveSosPlusLocalProfile } from '../../services/sos/sosPlusLocalStore';
import { useAuth } from '../../context/AuthContext';
import { vionaTokens } from '../../design';
import { FontFamily } from '../../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const COUNTRY_CODES = ['VN', 'DE', 'FR', 'GB', 'CZ', 'US', 'AU', 'NL', 'BE', 'ES', 'IT', 'CA', 'JP', 'KR', 'SG'] as const;

function effectivePlanLabelKey(simulatePlus: boolean): 'free' | 'sos_plus' {
  return simulatePlus ? 'sos_plus' : 'free';
}

export function SosPlusProfileScreen(): ReactElement | null {
  const navigation = useNavigation<Nav>();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<SosPlusLocalProfileSnapshot | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [saveBusy, setSaveBusy] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('sosPlus.screenTitle'),
      headerTintColor: vionaTokens.fashionTech.sosNeon,
      headerStyle: { backgroundColor: '#070b12' },
      headerTitleStyle: { fontFamily: FontFamily.bold, color: vionaTokens.fashionTech.inkOnDark },
    });
  }, [navigation, t]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const next = await loadSosPlusLocalProfile();
      setSnapshot(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const persist = useCallback(async (next: SosPlusLocalProfileSnapshot) => {
    setSaveBusy(true);
    try {
      await saveSosPlusLocalProfile(next);
      setSnapshot(next);
    } finally {
      setSaveBusy(false);
    }
  }, []);

  const countryLabel = useCallback(
    (code: string) => {
      const k = `sosPlus.country_${code}` as const;
      const translated = t(k);
      return translated === k ? code : translated;
    },
    [t]
  );

  const cycleCountry = useCallback(() => {
    if (!snapshot) return;
    const idx = COUNTRY_CODES.indexOf(snapshot.emergencyCountryIso2 as (typeof COUNTRY_CODES)[number]);
    const nextCode = COUNTRY_CODES[(idx >= 0 ? idx + 1 : 0) % COUNTRY_CODES.length];
    void persist({ ...snapshot, emergencyCountryIso2: nextCode });
  }, [persist, snapshot]);

  const setPreferredLang = useCallback(
    (code: 'en' | 'vi') => {
      if (!snapshot) return;
      void persist({ ...snapshot, preferredLanguageCode: code });
      void i18n.changeLanguage(code);
    },
    [i18n, persist, snapshot]
  );

  const patchConsent = useCallback(
    (patch: Partial<SosConsentSnapshot>) => {
      if (!snapshot) return;
      void persist({
        ...snapshot,
        consent: { ...snapshot.consent, ...patch },
      });
    },
    [persist, snapshot]
  );

  const onToggleLegal = useCallback(
    (on: boolean) => {
      patchConsent({
        legalDisclaimerAcceptedAt: on ? new Date().toISOString() : null,
      });
    },
    [patchConsent]
  );

  const onToggleSimulatePlus = useCallback(
    (on: boolean) => {
      if (!snapshot) return;
      void persist({
        ...snapshot,
        entitlement: {
          ...snapshot.entitlement,
          simulatePlusActive: on,
          planId: 'free',
          updatedAtIso: new Date().toISOString(),
        },
      });
    },
    [persist, snapshot]
  );

  const addTrustedContact = useCallback(() => {
    if (!snapshot) return;
    const name = draftName.trim();
    const phone = draftPhone.trim();
    if (!name || !phone || snapshot.trustedContacts.length >= 3) return;
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const row: SosTrustedContact = { id, displayName: name, phoneE164: phone };
    void persist({
      ...snapshot,
      trustedContacts: [...snapshot.trustedContacts, row],
    });
    setDraftName('');
    setDraftPhone('');
  }, [draftName, draftPhone, persist, snapshot]);

  const removeTrusted = useCallback(
    (id: string) => {
      if (!snapshot) return;
      void persist({
        ...snapshot,
        trustedContacts: snapshot.trustedContacts.filter((c) => c.id !== id),
      });
    },
    [persist, snapshot]
  );

  const planKey = useMemo(() => {
    if (!snapshot) return 'free';
    return effectivePlanLabelKey(snapshot.entitlement.simulatePlusActive);
  }, [snapshot]);

  if (!SOS_PLUS_PROFILE_UI_ENABLED) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.disabledText}>{t('sosPlus.profileDisabled')}</Text>
      </SafeAreaView>
    );
  }

  if (loading || !snapshot) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={vionaTokens.fashionTech.sosNeon} />
      </SafeAreaView>
    );
  }

  const consent = snapshot.consent;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.stubBanner}>
          <Ionicons name="shield-outline" size={18} color={vionaTokens.fashionTech.sosNeon} />
          <Text style={styles.stubText}>{t('sosPlus.stubBanner')}</Text>
        </View>

        <Text style={styles.prepares}>{t('sosPlus.preparesCopy')}</Text>
        <Text style={styles.neverReplace}>{t('sos.disclaimerNotReplacement')}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('sosPlus.planSection')}</Text>
          <View style={styles.planRow}>
            <Text style={styles.planName}>
              {planKey === 'sos_plus' ? t('sos.plusName') : t('sosPlus.planFree')}
            </Text>
            {planKey === 'sos_plus' ? (
              <Text style={styles.planPrice}>{t('sos.priceEuroUi')}</Text>
            ) : (
              <Text style={styles.planMuted}>{t('sosPlus.planFreeHint')}</Text>
            )}
          </View>
          <View style={styles.simRow}>
            <View style={styles.simLabels}>
              <Text style={styles.simTitle}>{t('sosPlus.simulatePlusTitle')}</Text>
              <Text style={styles.simSub}>{t('sosPlus.simulatePlusSub')}</Text>
            </View>
            <Switch
              value={snapshot.entitlement.simulatePlusActive}
              onValueChange={onToggleSimulatePlus}
              trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(220,72,85,0.55)' }}
              thumbColor="#f8fafc"
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('sosPlus.trustedContactsTitle')}</Text>
          <Text style={styles.cardHint}>{t('sosPlus.trustedContactsHint')}</Text>
          {snapshot.trustedContacts.map((c) => (
            <View key={c.id} style={styles.contactRow}>
              <View style={styles.contactText}>
                <Text style={styles.contactName}>{c.displayName}</Text>
                <Text style={styles.contactPhone}>{c.phoneE164}</Text>
              </View>
              <Pressable onPress={() => removeTrusted(c.id)} accessibilityLabel={t('sosPlus.removeContact')}>
                <Ionicons name="trash-outline" size={20} color="rgba(248,113,113,0.9)" />
              </Pressable>
            </View>
          ))}
          {snapshot.trustedContacts.length < 3 ? (
            <View style={styles.addBox}>
              <TextInput
                value={draftName}
                onChangeText={setDraftName}
                placeholder={t('sosPlus.contactNamePh')}
                placeholderTextColor="rgba(244,246,250,0.35)"
                style={styles.input}
              />
              <TextInput
                value={draftPhone}
                onChangeText={setDraftPhone}
                placeholder={t('sosPlus.contactPhonePh')}
                placeholderTextColor="rgba(244,246,250,0.35)"
                keyboardType="phone-pad"
                style={styles.input}
              />
              <Pressable
                onPress={() => void addTrustedContact()}
                style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.88 }]}
              >
                <Text style={styles.addBtnText}>{t('sosPlus.addContact')}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('sosPlus.emergencyCountryTitle')}</Text>
          <Pressable onPress={cycleCountry} style={({ pressed }) => [styles.countryBtn, pressed && { opacity: 0.9 }]}>
            <Text style={styles.countryCode}>{snapshot.emergencyCountryIso2}</Text>
            <Text style={styles.countryName}>{countryLabel(snapshot.emergencyCountryIso2)}</Text>
            <Text style={styles.countryTap}>{t('sosPlus.tapToCycle')}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('sosPlus.preferredLanguageTitle')}</Text>
          <View style={styles.langRow}>
            <Pressable
              onPress={() => setPreferredLang('vi')}
              style={[styles.langChip, snapshot.preferredLanguageCode === 'vi' && styles.langChipOn]}
            >
              <Text style={[styles.langChipText, snapshot.preferredLanguageCode === 'vi' && styles.langChipTextOn]}>
                Tiếng Việt
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setPreferredLang('en')}
              style={[styles.langChip, snapshot.preferredLanguageCode === 'en' && styles.langChipOn]}
            >
              <Text style={[styles.langChipText, snapshot.preferredLanguageCode === 'en' && styles.langChipTextOn]}>
                English
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('sosPlus.consentSection')}</Text>
          <ConsentRow
            title={t('sosPlus.consentLocation')}
            subtitle={t('sosPlus.consentLocationSub')}
            value={consent.locationSharing}
            onValueChange={(v) => patchConsent({ locationSharing: v })}
          />
          <ConsentRow
            title={t('sosPlus.consentAudio')}
            subtitle={t('sosPlus.consentAudioSub')}
            value={consent.audioRecording}
            onValueChange={(v) => patchConsent({ audioRecording: v })}
          />
          <ConsentRow
            title={t('sosPlus.consentVideo')}
            subtitle={t('sosPlus.consentVideoSub')}
            value={consent.videoRecording}
            onValueChange={(v) => patchConsent({ videoRecording: v })}
          />
          <ConsentRow
            title={t('sosPlus.consentTrustedAlert')}
            subtitle={t('sosPlus.consentTrustedAlertSub')}
            value={consent.trustedContactAlert}
            onValueChange={(v) => patchConsent({ trustedContactAlert: v })}
          />
          <ConsentRow
            title={t('sosPlus.consentEmergencyCall')}
            subtitle={t('sosPlus.consentEmergencyCallSub')}
            value={consent.emergencyCallAssistance}
            onValueChange={(v) => patchConsent({ emergencyCallAssistance: v })}
          />
          <View style={styles.legalBlock}>
            <Text style={styles.legalTitle}>{t('sosPlus.legalTitle')}</Text>
            <Text style={styles.legalBody}>{t('sosPlus.legalBody')}</Text>
            <ConsentRow
              title={t('sosPlus.legalAck')}
              subtitle={
                consent.legalDisclaimerAcceptedAt
                  ? t('sosPlus.legalAckAt', {
                      when: new Date(consent.legalDisclaimerAcceptedAt).toLocaleString(i18n.language),
                    })
                  : t('sosPlus.legalAckPending')
              }
              value={consent.legalDisclaimerAcceptedAt != null}
              onValueChange={onToggleLegal}
            />
          </View>
        </View>

        {user?.serverUserId ? (
          <Text style={styles.meta}>{t('sosPlus.userIdHint', { id: user.serverUserId.slice(0, 12) })}</Text>
        ) : (
          <Text style={styles.meta}>{t('sosPlus.userIdAnonymous')}</Text>
        )}

        <Text style={styles.footer}>{t('sosPlus.savedLocally')}</Text>
        {saveBusy ? <ActivityIndicator color={vionaTokens.fashionTech.sosNeon} style={{ marginBottom: 16 }} /> : null}

        <Pressable
          onPress={() => void reload()}
          style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.resetText}>{t('sosPlus.reloadProfile')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ConsentRow({
  title,
  subtitle,
  value,
  onValueChange,
}: Readonly<{
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}>): ReactElement {
  return (
    <View style={styles.consentRow}>
      <View style={styles.consentText}>
        <Text style={styles.consentTitle}>{title}</Text>
        <Text style={styles.consentSub}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(220,72,85,0.45)' }}
        thumbColor="#f8fafc"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#070b12' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#070b12', padding: 24 },
  disabledText: { fontFamily: FontFamily.medium, fontSize: 14, color: vionaTokens.fashionTech.mutedOnDark, textAlign: 'center' },
  scroll: { padding: vionaTokens.spacing[16], paddingBottom: vionaTokens.spacing[32], gap: vionaTokens.spacing[12] },
  stubBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: vionaTokens.spacing[8],
    padding: vionaTokens.spacing[12],
    borderRadius: vionaTokens.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(220,72,85,0.35)',
    backgroundColor: 'rgba(36,10,14,0.55)',
  },
  stubText: {
    flex: 1,
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    lineHeight: 17,
    color: vionaTokens.fashionTech.mutedOnDark,
  },
  prepares: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 19,
    color: vionaTokens.fashionTech.inkOnDark,
  },
  neverReplace: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    lineHeight: 17,
    color: vionaTokens.fashionTech.sosNeon,
  },
  card: {
    borderRadius: vionaTokens.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: vionaTokens.spacing[16],
    gap: vionaTokens.spacing[12],
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  cardTitle: {
    fontFamily: FontFamily.extrabold,
    fontSize: 15,
    color: vionaTokens.fashionTech.inkOnDark,
  },
  cardHint: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 17,
    color: vionaTokens.fashionTech.mutedOnDark,
  },
  planRow: { gap: vionaTokens.spacing[6] },
  planName: { fontFamily: FontFamily.bold, fontSize: 18, color: vionaTokens.fashionTech.inkOnDark },
  planPrice: { fontFamily: FontFamily.bold, fontSize: 15, color: vionaTokens.fashionTech.sosNeon },
  planMuted: { fontFamily: FontFamily.medium, fontSize: 13, color: vionaTokens.fashionTech.mutedOnDark },
  simRow: { flexDirection: 'row', alignItems: 'center', gap: vionaTokens.spacing[12], marginTop: vionaTokens.spacing[8] },
  simLabels: { flex: 1, gap: vionaTokens.spacing[4] },
  simTitle: { fontFamily: FontFamily.semibold, fontSize: 13, color: vionaTokens.fashionTech.inkOnDark },
  simSub: { fontFamily: FontFamily.medium, fontSize: 11, lineHeight: 15, color: vionaTokens.fashionTech.mutedOnDark },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vionaTokens.spacing[8],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  contactText: { flex: 1, gap: 2 },
  contactName: { fontFamily: FontFamily.semibold, fontSize: 14, color: vionaTokens.fashionTech.inkOnDark },
  contactPhone: { fontFamily: FontFamily.medium, fontSize: 12, color: vionaTokens.fashionTech.mutedOnDark },
  addBox: { gap: vionaTokens.spacing[8], marginTop: vionaTokens.spacing[8] },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: vionaTokens.radius.md,
    paddingHorizontal: vionaTokens.spacing[12],
    paddingVertical: vionaTokens.spacing[12],
    color: vionaTokens.fashionTech.inkOnDark,
    fontFamily: FontFamily.medium,
  },
  addBtn: {
    alignSelf: 'flex-start',
    paddingVertical: vionaTokens.spacing[8],
    paddingHorizontal: vionaTokens.spacing[16],
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(220,72,85,0.45)',
    backgroundColor: 'rgba(48,12,18,0.45)',
  },
  addBtnText: { fontFamily: FontFamily.bold, fontSize: 13, color: vionaTokens.fashionTech.sosNeon },
  countryBtn: {
    padding: vionaTokens.spacing[16],
    borderRadius: vionaTokens.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(0,0,0,0.25)',
    gap: vionaTokens.spacing[4],
  },
  countryCode: { fontFamily: FontFamily.extrabold, fontSize: 20, color: vionaTokens.fashionTech.sosNeon },
  countryName: { fontFamily: FontFamily.semibold, fontSize: 15, color: vionaTokens.fashionTech.inkOnDark },
  countryTap: { fontFamily: FontFamily.medium, fontSize: 11, color: vionaTokens.fashionTech.mutedOnDark },
  langRow: { flexDirection: 'row', gap: vionaTokens.spacing[8] },
  langChip: {
    paddingVertical: vionaTokens.spacing[8],
    paddingHorizontal: vionaTokens.spacing[16],
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  langChipOn: { borderColor: 'rgba(220,72,85,0.55)', backgroundColor: 'rgba(48,12,18,0.45)' },
  langChipText: { fontFamily: FontFamily.semibold, fontSize: 13, color: vionaTokens.fashionTech.mutedOnDark },
  langChipTextOn: { color: vionaTokens.fashionTech.inkOnDark },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: vionaTokens.spacing[12],
    paddingVertical: vionaTokens.spacing[8],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  consentText: { flex: 1, gap: 4 },
  consentTitle: { fontFamily: FontFamily.semibold, fontSize: 13, color: vionaTokens.fashionTech.inkOnDark },
  consentSub: { fontFamily: FontFamily.medium, fontSize: 11, lineHeight: 15, color: vionaTokens.fashionTech.mutedOnDark },
  legalBlock: {
    marginTop: vionaTokens.spacing[8],
    padding: vionaTokens.spacing[12],
    borderRadius: vionaTokens.radius.md,
    backgroundColor: 'rgba(0,0,0,0.28)',
    gap: vionaTokens.spacing[8],
  },
  legalTitle: { fontFamily: FontFamily.bold, fontSize: 13, color: vionaTokens.fashionTech.inkOnDark },
  legalBody: { fontFamily: FontFamily.medium, fontSize: 11, lineHeight: 16, color: vionaTokens.fashionTech.mutedOnDark },
  meta: { fontFamily: FontFamily.medium, fontSize: 11, color: 'rgba(244,246,250,0.45)' },
  footer: { fontFamily: FontFamily.medium, fontSize: 12, color: vionaTokens.fashionTech.mutedOnDark },
  resetBtn: { alignSelf: 'flex-start', paddingVertical: vionaTokens.spacing[8] },
  resetText: { fontFamily: FontFamily.semibold, fontSize: 13, color: vionaTokens.fashionTech.sosNeon },
});
