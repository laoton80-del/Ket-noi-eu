import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmergencyHubTile } from '../../../components/emergency/EmergencyHubTile';
import {
  emergencyContentColumnStyle,
  emergencyUiTokens,
} from '../../../components/emergency/emergencyUiTokens';
import { useTranslation } from '../../../i18n';
import type { RootStackParamList } from '../../../navigation/routes';
import {
  getSosQuickActionScript,
  resolveNearestVietnameseMission,
  synthesizeSosQuickActionDualLanguageAudio,
  type SosQuickActionKind,
} from '../../../services/travel/EmergencySosService';
import { getTravelContext } from '../../../services/context/UserContextService';
import { theme } from '../../../theme/theme';
import { FontFamily } from '../../../theme/typography';
import { applyWebStyles } from '../../../utils/applyWebStyles';
import { webGlassStyle } from '../../../utils/webStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function TravelSosHubScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [loading, setLoading] = useState(true);
  const [lat, setLat] = useState(50.0755);
  const [lng, setLng] = useState(14.4378);
  const [countryCode, setCountryCode] = useState('CZ');
  const [cityLabel, setCityLabel] = useState('');
  const [ttsKind, setTtsKind] = useState<SosQuickActionKind | null>(null);
  const contentColumn = useMemo(() => emergencyContentColumnStyle(), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const ctx = await getTravelContext({ skipPersistCity: true });
        if (!cancelled) {
          setLat(ctx.latitude);
          setLng(ctx.longitude);
          setCountryCode(ctx.countryCode);
          setCityLabel(ctx.city);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      const s = soundRef.current;
      soundRef.current = null;
      if (s) void s.unloadAsync();
    };
  }, []);

  const nearest = useMemo(() => resolveNearestVietnameseMission(lat, lng), [lat, lng]);

  const openMapsMission = useCallback(() => {
    const q = encodeURIComponent(nearest.mission.mapsQueryHint);
    void Linking.openURL(`https://www.openstreetmap.org/search?query=${q}`);
  }, [nearest.mission.mapsQueryHint]);

  const dialMissionPhone = useCallback(() => {
    const tel = nearest.mission.phoneDisplay.replace(/\s/g, '');
    void Linking.openURL(`tel:${tel}`);
  }, [nearest.mission.phoneDisplay]);

  const confirmDialMission = useCallback(() => {
    Alert.alert(t('travelSosHub.embassyCallConfirmTitle'), t('travelSosHub.embassyCallConfirmBody'), [
      { text: t('travelSosHub.embassyCallCancel'), style: 'cancel' },
      { text: t('travelSosHub.embassyCallConfirmCta'), onPress: dialMissionPhone },
    ]);
  }, [dialMissionPhone, t]);

  const playQuickAction = useCallback(
    async (kind: SosQuickActionKind) => {
      setTtsKind(kind);
      try {
        const uri = await synthesizeSosQuickActionDualLanguageAudio(kind, countryCode, 'nova');
        const old = soundRef.current;
        soundRef.current = null;
        if (old) await old.unloadAsync();
        const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, volume: 1 });
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((st) => {
          if (st.isLoaded && st.didJustFinish) {
            sound.setOnPlaybackStatusUpdate(null);
            setTtsKind(null);
          }
        });
      } catch {
        setTtsKind(null);
        Alert.alert(t('travelSosHub.ttsFailedTitle'), t('travelSosHub.ttsFailed'));
      }
    },
    [countryCode, t]
  );

  const medicalScript = useMemo(() => getSosQuickActionScript('medical', countryCode), [countryCode]);
  const policeScript = useMemo(() => getSosQuickActionScript('police', countryCode), [countryCode]);

  const gpsDisplayLocation = cityLabel.length > 0 ? cityLabel : t('travelSosHub.locationFallback');

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#12151c', '#151a24', '#12151c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={[styles.topBar, contentColumn]}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel={t('travelSosHub.backA11y')}
          >
            <Ionicons name="chevron-back" size={24} color="#E2E8F0" />
          </Pressable>
          <Text style={styles.topTitle}>{t('travelSosHub.screenTitle')}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, contentColumn]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.disclaimerPanel}>
            <Text style={styles.globalDisclaimer}>{t('sos.footerDisclaimer')}</Text>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#F87171" />
              <Text style={styles.loadingText}>{t('travelSosHub.gpsLoading')}</Text>
            </View>
          ) : (
            <Text style={styles.gpsLine}>
              {t('travelSosHub.gpsLineDemo', {
                location: cityLabel.length > 0 ? cityLabel : gpsDisplayLocation,
              })}
            </Text>
          )}

          <EmergencyHubTile
            layout="full"
            accent="emergency"
            icon="navigate"
            title={t('travelSosHub.openEmergencyGuidance')}
            subtitle={t('emergencySos.typeGeneralSub')}
            onPress={() => navigation.navigate('EmergencySOS')}
            accessibilityLabel={t('travelSosHub.openEmergencyA11y')}
          />

          <View style={[styles.card, webGlassStyle]} className={applyWebStyles('kn-glass')}>
            <View style={styles.cardKickerRow}>
              <Text style={styles.cardKicker}>{t('travelSosHub.embassyKicker')}</Text>
              <Text style={styles.demoBadge}>{t('travelSosHub.demoBadge')}</Text>
            </View>
            <Text style={styles.cardTitle}>{nearest.mission.nameVi}</Text>
            <Text style={styles.cardMeta}>
              {nearest.mission.cityLabel} · ~{nearest.distanceKm.toFixed(0)} km
            </Text>
            <Text style={styles.phone}>{nearest.mission.phoneDisplay}</Text>
            <View style={styles.rowBtns}>
              <Pressable
                onPress={confirmDialMission}
                style={({ pressed }) => [styles.miniBtn, pressed && { opacity: 0.9 }]}
                accessibilityRole="button"
                accessibilityLabel={t('travelSosHub.callMission')}
              >
                <Ionicons name="call-outline" size={18} color="#E2E8F0" />
                <Text style={styles.miniBtnText}>{t('travelSosHub.callMission')}</Text>
              </Pressable>
              <Pressable
                onPress={openMapsMission}
                style={({ pressed }) => [styles.miniBtn, pressed && { opacity: 0.9 }]}
                accessibilityRole="button"
                accessibilityLabel={t('travelSosHub.directions')}
              >
                <Ionicons name="map-outline" size={18} color="#E2E8F0" />
                <Text style={styles.miniBtnText}>{t('travelSosHub.directions')}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionRow}>
            <Text style={styles.section}>{t('travelSosHub.ttsSection')}</Text>
            <Text style={styles.demoBadge}>{t('travelSosHub.ttsPilotDisclaimer')}</Text>
          </View>
          <Text style={styles.sectionHint}>{t('travelSosHub.ttsHint')}</Text>

          <Pressable
            onPress={() => void playQuickAction('medical')}
            disabled={ttsKind !== null}
            style={({ pressed }) => [
              styles.scriptCard,
              styles.aiMedical,
              pressed && { opacity: 0.92 },
              ttsKind !== null && { opacity: 0.55 },
              webGlassStyle,
            ]}
            className={applyWebStyles('kn-glass')}
          >
            <View style={styles.scriptIconCapsule}>
              <Ionicons name="medical" size={22} color="#7CFFB2" />
            </View>
            <View style={styles.scriptTextCol}>
              <Text style={styles.aiTileTitle}>{t('travelSosHub.medicalTile')}</Text>
              <Text style={styles.aiTileBody} numberOfLines={3}>
                {medicalScript.ttsPrimaryLocalLanguage}
              </Text>
              <Text style={styles.aiVi}>{medicalScript.vietnameseCompanionLine}</Text>
            </View>
            {ttsKind === 'medical' ? (
              <ActivityIndicator color="#7CFFB2" />
            ) : (
              <Ionicons name="volume-high" size={22} color="#7CFFB2" />
            )}
          </Pressable>

          <Pressable
            onPress={() => void playQuickAction('police')}
            disabled={ttsKind !== null}
            style={({ pressed }) => [
              styles.scriptCard,
              styles.aiPolice,
              pressed && { opacity: 0.92 },
              ttsKind !== null && { opacity: 0.55 },
              webGlassStyle,
            ]}
            className={applyWebStyles('kn-glass')}
          >
            <View style={[styles.scriptIconCapsule, styles.scriptIconPolice]}>
              <Ionicons name="shield" size={22} color="#9EC5FF" />
            </View>
            <View style={styles.scriptTextCol}>
              <Text style={styles.aiTileTitle}>{t('travelSosHub.policeTile')}</Text>
              <Text style={styles.aiTileBody} numberOfLines={3}>
                {policeScript.ttsPrimaryLocalLanguage}
              </Text>
              <Text style={styles.aiVi}>{policeScript.vietnameseCompanionLine}</Text>
            </View>
            {ttsKind === 'police' ? (
              <ActivityIndicator color="#9EC5FF" />
            ) : (
              <Ionicons name="volume-high" size={22} color="#9EC5FF" />
            )}
          </Pressable>

          <View style={styles.disclaimerPanel}>
            <Text style={styles.footerDisclaimer}>{t('sos.footerDisclaimer')}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: emergencyUiTokens.shellBgTravel },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    width: '100%',
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.extrabold,
    fontSize: 16,
    color: '#E2E8F0',
  },
  scroll: {
    paddingHorizontal: emergencyUiTokens.contentPadding,
    paddingBottom: theme.spacing.xxl,
    gap: 12,
    width: '100%',
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
    color: 'rgba(226, 232, 240, 0.9)',
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
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { color: 'rgba(226, 232, 240, 0.85)', fontFamily: FontFamily.medium },
  gpsLine: {
    fontSize: 13,
    color: 'rgba(203, 213, 225, 0.88)',
    fontFamily: FontFamily.medium,
    lineHeight: 18,
  },
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: emergencyUiTokens.infoCardBorder,
    backgroundColor: emergencyUiTokens.infoCardBg,
  },
  cardKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  cardKicker: {
    flex: 1,
    fontSize: 11,
    letterSpacing: 0.8,
    color: 'rgba(203, 213, 225, 0.72)',
    fontFamily: FontFamily.extrabold,
  },
  demoBadge: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#FCD34D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 77, 0.45)',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  cardTitle: {
    fontSize: 17,
    color: '#F8FAFC',
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 13,
    color: 'rgba(203, 213, 225, 0.88)',
    fontFamily: FontFamily.semibold,
    marginBottom: 8,
  },
  phone: { fontSize: 15, color: '#86EFAC', fontFamily: FontFamily.extrabold, marginBottom: 12 },
  rowBtns: { flexDirection: 'row', gap: 10 },
  miniBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: emergencyUiTokens.infoCardBorder,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    minHeight: 44,
  },
  miniBtnText: { color: '#E2E8F0', fontFamily: FontFamily.bold, fontSize: 13 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  section: {
    flex: 1,
    fontSize: 14,
    color: '#E2E8F0',
    fontFamily: FontFamily.extrabold,
  },
  sectionHint: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(203, 213, 225, 0.78)',
    fontFamily: FontFamily.regular,
    marginBottom: 4,
  },
  scriptCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: emergencyUiTokens.infoCardBorder,
    minHeight: 44,
  },
  aiMedical: { backgroundColor: 'rgba(20, 45, 35, 0.45)' },
  aiPolice: { backgroundColor: 'rgba(25, 40, 65, 0.45)' },
  scriptIconCapsule: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124, 255, 178, 0.35)',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    flexShrink: 0,
  },
  scriptIconPolice: {
    borderColor: 'rgba(158, 197, 255, 0.35)',
  },
  scriptTextCol: { flex: 1, minWidth: 0 },
  aiTileTitle: { fontSize: 15, color: '#F8FAFC', fontFamily: FontFamily.extrabold, marginBottom: 6 },
  aiTileBody: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(226, 232, 240, 0.88)',
    fontFamily: FontFamily.regular,
  },
  aiVi: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(252, 211, 181, 0.92)',
    fontFamily: FontFamily.semibold,
  },
});
