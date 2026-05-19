import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
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
import { EmergencyHubTile } from '../components/emergency/EmergencyHubTile';
import { emergencyContentColumnStyle, emergencyUiTokens } from '../components/emergency/emergencyUiTokens';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import type { RootStackParamList } from '../navigation/routes';
import { resolveCountryPack } from '../config/countryPacks';
import { getEmergencyPhrasePack, type EmergencyType } from '../services/emergency/emergencyPhrasePacks';
import { resolveEmergencyLocation, type EmergencyLocationStatus } from '../services/emergency/emergencyLocation';
import { appendUsageHistory } from '../services/history';
import { generateSpeech } from '../services/OpenAIService';
import { applyWebStyles } from '../utils/applyWebStyles';
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
  const contentColumn = useMemo(() => emergencyContentColumnStyle(), []);

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
    <View style={styles.outerShell} className={applyWebStyles('kn-glass')}>
      <SafeAreaView style={[styles.safe, Platform.OS === 'web' && styles.safeWeb]}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, contentColumn]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.sos}>{t('emergencySos.screenTitle', { number: emergencyNumber })}</Text>
            <Text style={styles.headerSub}>{t('emergencySos.headerSubtitle')}</Text>
            <Text style={styles.numberDisclaimer}>{t('emergencySos.numberDisclaimer')}</Text>
          </View>

          <View style={styles.disclaimerPanel}>
            <Text style={styles.globalDisclaimer}>{t('sos.footerDisclaimer')}</Text>
          </View>

          <View style={styles.emergencyHubGrid}>
            <EmergencyHubTile
              accent="emergency"
              icon="medkit"
              title={t('emergencySos.typeGeneralTitle')}
              subtitle={t('emergencySos.dialCta', { number: emergencyNumber })}
              onPress={confirmAndDial}
              accessibilityLabel={t('emergencySos.hubLocalEmergency', { number: emergencyNumber })}
            />
            <EmergencyHubTile
              accent="consular"
              icon="business"
              title={t('emergencySos.hubEmbassy')}
              subtitle={t('emergencySos.embassyMap')}
              onPress={onOpenEmbassySupport}
              accessibilityLabel={t('emergencySos.hubEmbassy')}
            />
            <EmergencyHubTile
              accent="pilot"
              icon="language"
              title={t('emergencySos.hubTranslationPilot')}
              subtitle={t('emergencySos.ttsPilotDisclaimer')}
              statusLabel={t('emergencySos.pilotBadge')}
              onPress={() => navigation.navigate('LiveInterpreter', { guidedEntry: true, scenario: 'general' })}
              accessibilityLabel={t('emergencySos.hubTranslationPilot')}
            />
            <EmergencyHubTile
              accent="family"
              icon="people"
              title={t('emergencySos.hubFamily')}
              subtitle={t('emergencySos.familyLeona')}
              onPress={onContactFamily}
              accessibilityLabel={t('emergencySos.hubFamily')}
            />
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
            style={({ pressed }) => [styles.callBtn, pressed && styles.callBtnPressed]}
            onPress={confirmAndDial}
            accessibilityRole="button"
            accessibilityLabel={t('emergencySos.dialCta', { number: emergencyNumber })}
          >
            <Text style={styles.callText}>{t('emergencySos.dialCta', { number: emergencyNumber })}</Text>
          </Pressable>

          <View style={styles.locBox}>
            <Text style={styles.locTitle}>{t('emergencySos.locationCurrentTitle')}</Text>
            {locationStatus === 'loading' ? (
              <ActivityIndicator color="#F87171" />
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

          <View style={styles.disclaimerPanel}>
            <Text style={styles.footerDisclaimer}>{t('sos.footerDisclaimer')}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerShell: { flex: 1, backgroundColor: emergencyUiTokens.shellBg },
  safe: { flex: 1, backgroundColor: emergencyUiTokens.shellBg },
  safeWeb: { backgroundColor: 'transparent' },
  container: { flex: 1, backgroundColor: emergencyUiTokens.shellBg },
  content: {
    padding: emergencyUiTokens.contentPadding,
    paddingBottom: 32,
    gap: 14,
    width: '100%',
  },
  header: { marginBottom: 2 },
  sos: {
    color: '#F87171',
    fontSize: 32,
    fontFamily: FontFamily.extrabold,
    letterSpacing: -0.3,
  },
  headerSub: {
    color: 'rgba(252, 165, 165, 0.92)',
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
    fontFamily: FontFamily.medium,
  },
  numberDisclaimer: {
    color: 'rgba(148, 163, 184, 0.95)',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 17,
    fontFamily: FontFamily.medium,
  },
  disclaimerPanel: {
    backgroundColor: emergencyUiTokens.disclaimerPanelBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: emergencyUiTokens.disclaimerPanelBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  globalDisclaimer: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(203, 213, 225, 0.92)',
    fontFamily: FontFamily.medium,
    textAlign: 'center',
  },
  footerDisclaimer: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(148, 163, 184, 0.95)',
    fontFamily: FontFamily.medium,
    textAlign: 'center',
  },
  emergencyHubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: emergencyUiTokens.gridGap,
    justifyContent: 'space-between',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: emergencyUiTokens.gridGap,
    justifyContent: 'space-between',
  },
  callBtn: {
    marginTop: 2,
    backgroundColor: emergencyUiTokens.dialBarBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: emergencyUiTokens.dialBarBorder,
    minHeight: emergencyUiTokens.dialBarMinHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  callBtnPressed: {
    backgroundColor: emergencyUiTokens.dialBarBgPressed,
  },
  callText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    textAlign: 'center',
    lineHeight: 22,
  },
  locBox: {
    backgroundColor: emergencyUiTokens.infoCardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: emergencyUiTokens.infoCardBorder,
    padding: 12,
    minHeight: 70,
    gap: 6,
  },
  locTitle: { color: '#F3F4F6', fontSize: 13, fontFamily: FontFamily.bold },
  locText: { color: '#E5E7EB', fontSize: 14, lineHeight: 20, fontFamily: FontFamily.medium },
  locDisclaimer: {
    color: 'rgba(148, 163, 184, 0.9)',
    fontSize: 11,
    lineHeight: 15,
    fontFamily: FontFamily.medium,
  },
  phraseBox: {
    backgroundColor: emergencyUiTokens.infoCardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: emergencyUiTokens.infoCardBorder,
    padding: 12,
    gap: 6,
  },
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
    backgroundColor: 'rgba(55, 65, 81, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: emergencyUiTokens.infoCardBorder,
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
    borderColor: 'rgba(248, 113, 113, 0.45)',
  },
  cannotSpeakText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: FontFamily.extrabold,
    lineHeight: 34,
    textAlign: 'center',
  },
});
