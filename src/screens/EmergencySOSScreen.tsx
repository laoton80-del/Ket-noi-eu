import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmergencyActionCard } from '../components/emergency/EmergencyActionCard';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import type { RootStackParamList } from '../navigation/routes';
import { resolveCountryPack } from '../config/countryPacks';
import { getEmergencyPhrasePack, type EmergencyType } from '../services/emergency/emergencyPhrasePacks';
import { resolveEmergencyLocation, type EmergencyLocationStatus } from '../services/emergency/emergencyLocation';
import { appendUsageHistory } from '../services/history';
import { generateSpeech } from '../services/OpenAIService';
import { applyWebStyles } from '../utils/applyWebStyles';
import { webGlassStyle, webNeonPurpleStyle } from '../utils/webStyles';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const EMERGENCY_TYPES: readonly EmergencyType[] = ['ambulance', 'police', 'fire', 'general112'];

const TYPE_TITLE_KEY: Record<EmergencyType, string> = {
  ambulance: 'emergencySos.typeAmbulanceTitle',
  police: 'emergencySos.typePoliceTitle',
  fire: 'emergencySos.typeFireTitle',
  general112: 'emergencySos.typeGeneralTitle',
};

const TYPE_SUB_KEY: Record<EmergencyType, string> = {
  ambulance: 'emergencySos.typeAmbulanceSub',
  police: 'emergencySos.typePoliceSub',
  fire: 'emergencySos.typeFireSub',
  general112: 'emergencySos.typeGeneralSub',
};

export function EmergencySOSScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selected, setSelected] = useState<EmergencyType>('general112');
  const [locationStatus, setLocationStatus] = useState<EmergencyLocationStatus | 'loading'>('loading');
  const [locationPlaceLabel, setLocationPlaceLabel] = useState('');
  const [ttsLoading, setTtsLoading] = useState(false);
  const [showCannotSpeak, setShowCannotSpeak] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const emergencyNumber = resolveCountryPack(user?.country).emergencyConfig.primaryNumber;

  useEffect(() => {
    void appendUsageHistory({ type: 'emergency', status: 'success', note: 'sos_opened' });
    void (async () => {
      const res = await resolveEmergencyLocation();
      setLocationStatus(res.status);
      if (res.status === 'ok' && res.placeLabel) {
        setLocationPlaceLabel(res.placeLabel);
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      const s = soundRef.current;
      soundRef.current = null;
      if (s) void s.unloadAsync();
    };
  }, []);

  const locationLabel = useMemo(() => {
    if (locationStatus === 'loading') return t('emergencySos.locationLoading');
    if (locationStatus === 'permission_denied') return t('emergencySos.locationPermissionDenied');
    if (locationStatus === 'unavailable') return t('emergencySos.locationUnavailable');
    return locationPlaceLabel;
  }, [locationPlaceLabel, locationStatus, t]);

  const pack = useMemo(
    () =>
      getEmergencyPhrasePack({
        type: selected,
        country: user?.country,
        locationLabel: locationStatus === 'ok' ? locationPlaceLabel : '',
      }),
    [locationPlaceLabel, locationStatus, selected, user?.country]
  );

  const callEmergencyNow = useCallback(async () => {
    try {
      await Linking.openURL(`tel:${emergencyNumber}`);
      void appendUsageHistory({
        type: 'emergency',
        status: 'success',
        note: `sos_call_${emergencyNumber}_${selected}`,
      });
    } catch {
      void appendUsageHistory({
        type: 'emergency',
        status: 'failed',
        note: `sos_call_${emergencyNumber}_${selected}`,
      });
      Alert.alert(t('emergencySos.dialFailedTitle'), t('emergencySos.dialFailedBody', { number: emergencyNumber }));
    }
  }, [emergencyNumber, selected, t]);

  const confirmAndDial = useCallback(() => {
    Alert.alert(
      t('emergencySos.dialConfirmTitle'),
      t('emergencySos.dialConfirmBody', { number: emergencyNumber }),
      [
        { text: t('emergencySos.dialCancel'), style: 'cancel' },
        { text: t('emergencySos.dialConfirmCta'), onPress: () => void callEmergencyNow() },
      ]
    );
  }, [callEmergencyNow, emergencyNumber, t]);

  const onPlayVoice = async () => {
    setTtsLoading(true);
    try {
      const uri = await generateSpeech(pack.localText, 'nova');
      const old = soundRef.current;
      soundRef.current = null;
      if (old) await old.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, volume: 1 });
      soundRef.current = sound;
    } catch {
      Alert.alert(
        t('emergencySos.ttsFailedTitle'),
        t('emergencySos.ttsFailedBody', { number: emergencyNumber })
      );
    } finally {
      setTtsLoading(false);
    }
  };

  const onOpenEmbassySupport = useCallback(() => {
    Alert.alert(t('emergencySos.embassyAlertTitle'), t('emergencySos.embassyAlertBody'), [
      { text: t('emergencySos.embassyLater'), style: 'cancel' },
      {
        text: t('emergencySos.embassyMap'),
        onPress: () => {
          void Linking.openURL(
            'https://www.openstreetmap.org/search?query=' + encodeURIComponent('Vietnamese Embassy')
          );
        },
      },
    ]);
  }, [t]);

  const onContactFamily = useCallback(() => {
    Alert.alert(t('emergencySos.familyAlertTitle'), t('emergencySos.familyAlertBody'), [
      { text: t('emergencySos.familyClose'), style: 'cancel' },
      {
        text: t('emergencySos.familyLeona'),
        onPress: () => {
          navigation.navigate('LeonaCall', {
            prefillRequest: t('emergencySos.familyPrefill'),
            autoSubmit: false,
          });
        },
      },
    ]);
  }, [navigation, t]);

  return (
    <View style={styles.outerShell} className={applyWebStyles('kn-glass kn-neon-sos')}>
      <SafeAreaView style={[styles.safe, Platform.OS === 'web' && styles.safeWeb]}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.sos}>{t('emergencySos.screenTitle', { number: emergencyNumber })}</Text>
            <Text style={styles.headerSub}>{t('emergencySos.headerSubtitle')}</Text>
          </View>

          <Text style={styles.globalDisclaimer}>{t('sos.footerDisclaimer')}</Text>

          <View style={styles.emergencyHubGrid}>
            <Pressable
              onPress={confirmAndDial}
              style={({ pressed }) => [styles.hubBtn, styles.hubBtnRed, pressed && { opacity: 0.9 }]}
              className={applyWebStyles('kn-neon-sos')}
              accessibilityRole="button"
              accessibilityLabel={t('emergencySos.hubLocalEmergency', { number: emergencyNumber })}
            >
              <Ionicons name="medkit" size={24} color="#FFFFFF" />
              <Text style={styles.hubBtnTitle}>
                {t('emergencySos.hubLocalEmergency', { number: emergencyNumber })}
              </Text>
            </Pressable>

            <Pressable
              onPress={onOpenEmbassySupport}
              style={({ pressed }) => [styles.hubBtn, styles.hubBtnBlue, pressed && { opacity: 0.9 }, webGlassStyle]}
              accessibilityRole="button"
              accessibilityLabel={t('emergencySos.hubEmbassy')}
            >
              <Ionicons name="business" size={24} color="#FFFFFF" />
              <Text style={styles.hubBtnTitle}>{t('emergencySos.hubEmbassy')}</Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('LiveInterpreter', { guidedEntry: true, scenario: 'general' })}
              style={({ pressed }) => [
                styles.hubBtn,
                styles.hubBtnPurple,
                pressed && { opacity: 0.9 },
                webNeonPurpleStyle,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('emergencySos.hubTranslationPilot')}
            >
              <View style={styles.pilotPill}>
                <Text style={styles.pilotPillText}>{t('emergencySos.pilotBadge')}</Text>
              </View>
              <Ionicons name="language" size={24} color="#FFFFFF" />
              <Text style={styles.hubBtnTitle}>{t('emergencySos.hubTranslationPilot')}</Text>
            </Pressable>

            <Pressable
              onPress={onContactFamily}
              style={({ pressed }) => [styles.hubBtn, styles.hubBtnGreen, pressed && { opacity: 0.9 }]}
              className={applyWebStyles('kn-neon-b2b')}
              accessibilityRole="button"
              accessibilityLabel={t('emergencySos.hubFamily')}
            >
              <Ionicons name="call" size={24} color="#FFFFFF" />
              <Text style={styles.hubBtnTitle}>{t('emergencySos.hubFamily')}</Text>
            </Pressable>
          </View>

          <View style={styles.grid}>
            {EMERGENCY_TYPES.map((type) => (
              <EmergencyActionCard
                key={type}
                type={type}
                title={t(TYPE_TITLE_KEY[type])}
                subtitle={t(TYPE_SUB_KEY[type])}
                active={selected === type}
                onPress={setSelected}
              />
            ))}
          </View>

          <Pressable
            style={styles.callBtn}
            className={applyWebStyles('kn-neon-sos')}
            onPress={confirmAndDial}
            accessibilityRole="button"
            accessibilityLabel={t('emergencySos.dialCta', { number: emergencyNumber })}
          >
            <Text style={styles.callText}>{t('emergencySos.dialCta', { number: emergencyNumber })}</Text>
          </Pressable>

          <View style={styles.locBox}>
            <Text style={styles.locTitle}>{t('emergencySos.locationCurrentTitle')}</Text>
            {locationStatus === 'loading' ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <Text style={styles.locText}>{locationLabel}</Text>
            )}
            <Text style={styles.locDisclaimer}>{t('emergencySos.locationReferenceDisclaimer')}</Text>
          </View>

          <View style={styles.phraseBox}>
            <Text style={styles.ttsPilotNote}>{t('emergencySos.ttsPilotDisclaimer')}</Text>
            <Text style={styles.localLabel}>{t('emergencySos.phraseLocalLabel')}</Text>
            <Text style={styles.localText}>{pack.localText}</Text>
            <Text style={styles.vnLabel}>{t('emergencySos.phraseVnLabel')}</Text>
            <Text style={styles.vnText}>{pack.vietnameseText}</Text>
          </View>

          <View style={styles.row}>
            <Pressable style={styles.secondaryBtn} onPress={() => void onPlayVoice()}>
              <Text style={styles.secondaryText}>
                {ttsLoading ? t('emergencySos.playVoiceLoading') : t('emergencySos.playVoice')}
              </Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => setShowCannotSpeak((v) => !v)}>
              <Text style={styles.secondaryText}>
                {showCannotSpeak ? t('emergencySos.cannotSpeakHide') : t('emergencySos.cannotSpeakShow')}
              </Text>
            </Pressable>
          </View>

          {showCannotSpeak ? (
            <View style={styles.cannotSpeakBox}>
              <Text style={styles.cannotSpeakText}>{pack.cannotSpeakText}</Text>
            </View>
          ) : null}

          <Text style={styles.footerDisclaimer}>{t('sos.footerDisclaimer')}</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerShell: { flex: 1, backgroundColor: '#09090B' },
  safe: { flex: 1, backgroundColor: '#09090B' },
  safeWeb: { backgroundColor: 'transparent' },
  container: { flex: 1, backgroundColor: '#09090B' },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
  header: { marginBottom: 4 },
  sos: {
    color: '#F87171',
    fontSize: 34,
    fontFamily: FontFamily.extrabold,
  },
  headerSub: {
    color: '#FCA5A5',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
    fontFamily: FontFamily.medium,
  },
  globalDisclaimer: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(203, 213, 225, 0.92)',
    fontFamily: FontFamily.medium,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  footerDisclaimer: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(148, 163, 184, 0.95)',
    fontFamily: FontFamily.medium,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  emergencyHubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  hubBtn: {
    width: '48%',
    minHeight: 120,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  hubBtnRed: {
    backgroundColor: '#B91C1C',
    borderColor: '#F87171',
  },
  hubBtnBlue: {
    backgroundColor: '#1E3A8A',
    borderColor: '#60A5FA',
  },
  hubBtnPurple: {
    backgroundColor: '#581C87',
    borderColor: '#D8B4FE',
  },
  hubBtnGreen: {
    backgroundColor: '#166534',
    borderColor: '#86EFAC',
  },
  hubBtnTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: FontFamily.bold,
  },
  pilotPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(216, 180, 254, 0.5)',
  },
  pilotPillText: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    color: '#E9D5FF',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  callBtn: {
    marginTop: 4,
    backgroundColor: '#DC2626',
    borderRadius: 14,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  callText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    textAlign: 'center',
    lineHeight: 22,
  },
  locBox: { backgroundColor: '#1F2937', borderRadius: 12, padding: 12, minHeight: 70, gap: 6 },
  locTitle: { color: '#F3F4F6', fontSize: 13, fontFamily: FontFamily.bold },
  locText: { color: '#E5E7EB', fontSize: 14, lineHeight: 20, fontFamily: FontFamily.medium },
  locDisclaimer: {
    color: 'rgba(148, 163, 184, 0.9)',
    fontSize: 11,
    lineHeight: 15,
    fontFamily: FontFamily.medium,
  },
  phraseBox: { backgroundColor: '#111827', borderRadius: 12, padding: 12, gap: 6 },
  ttsPilotNote: {
    color: 'rgba(252, 211, 77, 0.95)',
    fontSize: 11,
    lineHeight: 15,
    fontFamily: FontFamily.semibold,
    marginBottom: 4,
  },
  localLabel: { color: '#FCA5A5', fontSize: 12, fontFamily: FontFamily.bold },
  localText: { color: '#FFFFFF', fontSize: 19, fontFamily: FontFamily.extrabold, lineHeight: 26 },
  vnLabel: { color: '#93C5FD', fontSize: 12, fontFamily: FontFamily.bold, marginTop: 8 },
  vnText: { color: '#E5E7EB', fontSize: 16, lineHeight: 24, fontFamily: FontFamily.medium },
  row: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  secondaryText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontSize: 13,
    textAlign: 'center',
  },
  cannotSpeakBox: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cannotSpeakText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: FontFamily.extrabold,
    lineHeight: 34,
    textAlign: 'center',
  },
});
