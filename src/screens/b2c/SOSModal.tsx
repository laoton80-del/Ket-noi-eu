import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/routes';
import {
  buildSosIncidentPayload,
  fetchPreciseSosCoordinates,
  serializeSosPayload,
  type SosIncidentPayload,
} from '../../services/emergency/sosTelemetry';
import { appendUsageHistory } from '../../services/history';
import { FontFamily } from '../../theme/typography';
import { useTranslation } from '../../utils/i18n';

export type SOSModalProps = Readonly<{
  visible: boolean;
  onRequestClose: () => void;
  /** Root stack — required because this modal mounts under tabs, not the stack. */
  stackNavigation: NativeStackNavigationProp<RootStackParamList>;
  /**
   * When set (epoch ms), PSTN rows (115/113) stay disabled until this instant — **after** AI Minh Khang triage buffer.
   * Typically `Date.now() + 10_000` from the SOS FAB hold path (AI triage buffer).
   */
  emergencyDialGateUntilMs?: number | null;
}>;

type CoordState = Readonly<{
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
}>;

const INITIAL_COORDS: CoordState = {
  latitude: null,
  longitude: null,
  accuracyMeters: null,
};

/**
 * Half-screen emergency sheet: Vietnam inbound numbers + scam escalation to Command Center.
 * Fetches GPS when opened; high-contrast, locale-reactive, stress-tested layout.
 */
export function SOSModal({
  visible,
  onRequestClose,
  stackNavigation,
  emergencyDialGateUntilMs = null,
}: SOSModalProps): ReactElement {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { user } = useAuth();
  const [coords, setCoords] = useState<CoordState>(INITIAL_COORDS);
  const [locLoading, setLocLoading] = useState(false);
  const [locFailed, setLocFailed] = useState(false);
  const [dialGateTick, setDialGateTick] = useState(0);

  useEffect(() => {
    if (!visible || emergencyDialGateUntilMs == null) return;
    const id = setInterval(() => setDialGateTick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [visible, emergencyDialGateUntilMs]);

  const pstnDialLocked =
    emergencyDialGateUntilMs != null && Date.now() < emergencyDialGateUntilMs;
  const pstnSecondsRemaining = pstnDialLocked
    ? Math.max(0, Math.ceil((emergencyDialGateUntilMs - Date.now()) / 1000))
    : 0;

  useEffect(() => {
    if (!visible) {
      setCoords(INITIAL_COORDS);
      setLocFailed(false);
      setLocLoading(false);
      return;
    }
    setLocLoading(true);
    setLocFailed(false);
    void (async () => {
      const c = await fetchPreciseSosCoordinates();
      if (c) {
        setCoords({
          latitude: c.latitude,
          longitude: c.longitude,
          accuracyMeters: c.accuracyMeters,
        });
      } else {
        setLocFailed(true);
      }
      setLocLoading(false);
    })();
  }, [visible]);

  const logAndQueuePayload = useCallback(
    (kind: SosIncidentPayload['kind'], extraNote?: string) => {
      const payload = buildSosIncidentPayload(kind, coords);
      const serialized = serializeSosPayload(payload);
      if (__DEV__) {
        console.info('[ViGlobal SOS] incident payload', serialized);
      }
      void appendUsageHistory({
        type: 'emergency',
        status: 'success',
        note: `${kind}:${extraNote ?? 'sos_sheet'}:${serialized.slice(0, 280)}`,
      });
      return payload;
    },
    [coords]
  );

  const onMedical = useCallback(() => {
    const until = emergencyDialGateUntilMs;
    if (until != null && Date.now() < until) {
      const sec = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      Alert.alert(t('sos.triageBufferTitle'), t('sos.triageBufferBody', { seconds: sec }));
      return;
    }
    logAndQueuePayload('medical', 'tel_115');
    onRequestClose();
    void Linking.openURL('tel:115').catch(() => {
      Alert.alert(t('sos.callFailedTitle'), t('sos.callFailedBody', { number: '115' }));
    });
  }, [emergencyDialGateUntilMs, logAndQueuePayload, onRequestClose, t]);

  const onPolice = useCallback(() => {
    const until = emergencyDialGateUntilMs;
    if (until != null && Date.now() < until) {
      const sec = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      Alert.alert(t('sos.triageBufferTitle'), t('sos.triageBufferBody', { seconds: sec }));
      return;
    }
    logAndQueuePayload('police', 'tel_113');
    onRequestClose();
    void Linking.openURL('tel:113').catch(() => {
      Alert.alert(t('sos.callFailedTitle'), t('sos.callFailedBody', { number: '113' }));
    });
  }, [emergencyDialGateUntilMs, logAndQueuePayload, onRequestClose, t]);

  const onScam = useCallback(() => {
    const payload = logAndQueuePayload('scam_report', 'command_center');
    onRequestClose();
    Alert.alert(t('sos.reportQueuedTitle'), t('sos.reportQueuedBody'), [{ text: t('sos.close') }]);
    if (__DEV__) {
      console.info('[ViGlobal SOS] Command Center queue', serializeSosPayload(payload), user?.serverUserId);
    }
  }, [logAndQueuePayload, onRequestClose, t, user?.serverUserId]);

  const sheetMax = Math.min(height * 0.58, 520);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onRequestClose} accessibilityLabel={t('sos.close')} />
        <View
          key={`sos-sheet-${i18n.language}`}
          style={[
            styles.sheet,
            {
              maxHeight: sheetMax,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
          ]}
        >
          <View style={styles.handle} accessibilityElementsHidden />
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.titleBlock}>
              <Ionicons name="shield-checkmark" size={40} color="#F87171" accessibilityIgnoresInvertColors />
              <Text
                style={styles.kickerAi}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
                maxFontSizeMultiplier={1.2}
              >
                {t('ai_voice.aiShieldActive')}
              </Text>
              <Text
                style={styles.title}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.62}
                maxFontSizeMultiplier={1.35}
              >
                {t('sos.emergencyAssistance')}
              </Text>
              <Text
                style={styles.subtitle}
                numberOfLines={3}
                adjustsFontSizeToFit
                minimumFontScale={0.68}
                maxFontSizeMultiplier={1.25}
              >
                {t('sos.subtitle')}
              </Text>
            </View>

            <View style={styles.gpsBanner}>
              <Ionicons name="location" size={22} color="#FBBF24" style={styles.gpsIcon} />
              <View style={styles.gpsTextCol}>
                <Text
                  style={styles.gpsHeadline}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.65}
                  maxFontSizeMultiplier={1.2}
                >
                  {t('sos.gpsLocationShared')}
                </Text>
                <Text
                  style={styles.gpsDetail}
                  numberOfLines={6}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                  maxFontSizeMultiplier={1.15}
                >
                  {t('sos.gpsShareDetail')}
                </Text>
              </View>
            </View>

            {locLoading ? (
              <View style={styles.locCol}>
                <View style={styles.locRow}>
                  <ActivityIndicator color="#93C5FD" size="small" />
                  <Text
                    style={styles.locLoadingText}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {t('sos.gpsLoading')}
                  </Text>
                </View>
                <Text
                  style={styles.locAiHint}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {t('ai_voice.listening')}
                </Text>
              </View>
            ) : locFailed ? (
              <Text
                style={styles.locFailText}
                numberOfLines={4}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {t('sos.gpsUnavailable')}
              </Text>
            ) : coords.latitude != null && coords.longitude != null ? (
              <Text
                style={styles.coordFinePrint}
                numberOfLines={2}
                accessibilityLabel={t('sos.coordsA11y')}
              >
                {t('sos.coordsLocked', {
                  lat: coords.latitude.toFixed(5),
                  lng: coords.longitude.toFixed(5),
                })}
              </Text>
            ) : null}

            {pstnDialLocked ? (
              <View
                key={`triage-tick-${dialGateTick}`}
                style={styles.triageBanner}
                accessibilityLiveRegion="polite"
              >
                <Text style={styles.triageBannerTitle} numberOfLines={2}>
                  {t('sos.triageBannerTitle')}
                </Text>
                <Text style={styles.triageBannerSub} numberOfLines={2}>
                  {t('sos.triageBannerCountdown', { seconds: pstnSecondsRemaining })}
                </Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              <SosActionRow
                icon="medkit"
                iconColor="#FCA5A5"
                title={t('sos.medicalAmbulance')}
                subtitle={t('sos.medicalSub')}
                onPress={onMedical}
                testHint="medical"
                disabled={pstnDialLocked}
              />
              <SosActionRow
                icon="shield"
                iconColor="#93C5FD"
                title={t('sos.policeTitle')}
                subtitle={t('sos.policeSub')}
                onPress={onPolice}
                testHint="police"
                disabled={pstnDialLocked}
              />
              <SosActionRow
                icon="warning"
                iconColor="#FBBF24"
                title={t('sos.reportScam')}
                subtitle={t('sos.reportScamSub')}
                onPress={onScam}
                testHint="scam"
              />
            </View>

            <View style={styles.voiceHints}>
              <Text
                style={styles.voiceHintText}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
              >
                {t('ai_voice.tapToSpeak')}
              </Text>
              <Text
                style={styles.voiceHintSub}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.68}
              >
                {t('ai_voice.translating')}
              </Text>
            </View>

            <Pressable
              onPress={onRequestClose}
              style={({ pressed }) => [styles.dismissBtn, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel={t('sos.close')}
            >
              <Text
                style={styles.dismissLabel}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {t('sos.close')}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SosActionRow({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  testHint,
  disabled = false,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  testHint: string;
  disabled?: boolean;
}>): ReactElement {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        pressed && !disabled && styles.rowPressed,
        disabled && styles.rowDisabled,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={`${title}. ${subtitle}`}
      testID={`sos-row-${testHint}`}
    >
      <View style={[styles.rowIcon, { borderColor: iconColor }]}>
        <Ionicons name={icon} size={32} color={iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text
          style={styles.rowTitle}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          maxFontSizeMultiplier={1.28}
        >
          {title}
        </Text>
        <Text
          style={styles.rowSub}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          maxFontSizeMultiplier={1.22}
        >
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.45)" style={styles.rowChevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#0B1220',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    paddingHorizontal: 18,
    paddingTop: 10,
    maxWidth: '100%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 12,
  },
  scrollContent: { paddingBottom: 8, gap: 14, maxWidth: '100%' },
  titleBlock: { gap: 6, alignItems: 'center', maxWidth: '100%' },
  kickerAi: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    fontWeight: '800',
    color: '#FBBF24',
    textAlign: 'center',
    letterSpacing: 0.6,
    maxWidth: '100%',
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: 0.3,
    maxWidth: '100%',
  },
  subtitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(226, 232, 240, 0.78)',
    textAlign: 'center',
    maxWidth: '100%',
  },
  gpsBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 58, 138, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.45)',
    maxWidth: '100%',
  },
  gpsIcon: { flexShrink: 0, marginTop: 2 },
  gpsTextCol: { flex: 1, minWidth: 0, gap: 6, maxWidth: '100%' },
  gpsHeadline: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    fontWeight: '800',
    color: '#FEF3C7',
    lineHeight: 21,
  },
  gpsDetail: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    fontWeight: '600',
    color: '#E0E7FF',
    lineHeight: 21,
  },
  locCol: {
    gap: 8,
    alignItems: 'center',
    maxWidth: '100%',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    maxWidth: '100%',
  },
  locLoadingText: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: 'rgba(191, 219, 254, 0.9)',
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  locAiHint: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: 'rgba(251, 191, 36, 0.95)',
    flexShrink: 1,
  },
  locFailText: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: 'rgba(252, 165, 165, 0.95)',
    textAlign: 'center',
    maxWidth: '100%',
  },
  coordFinePrint: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 12,
    color: 'rgba(148, 163, 184, 0.95)',
    textAlign: 'center',
    maxWidth: '100%',
  },
  actions: { gap: 12, maxWidth: '100%' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 80,
    maxWidth: '100%',
  },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.1)' },
  rowDisabled: { opacity: 0.42 },
  triageBanner: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(127, 29, 29, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.55)',
    gap: 6,
    maxWidth: '100%',
  },
  triageBannerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    fontWeight: '800',
    color: '#FECACA',
    textAlign: 'center',
    maxWidth: '100%',
  },
  triageBannerSub: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    fontWeight: '600',
    color: '#FEF08A',
    textAlign: 'center',
    maxWidth: '100%',
  },
  rowIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    flexShrink: 0,
    marginTop: 2,
  },
  rowText: { flex: 1, minWidth: 0, gap: 4, maxWidth: '100%', flexShrink: 1 },
  rowChevron: { flexShrink: 0, marginTop: 16 },
  rowTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    flexShrink: 1,
    maxWidth: '100%',
  },
  rowSub: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(226, 232, 240, 0.72)',
    flexShrink: 1,
    maxWidth: '100%',
  },
  voiceHints: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 4,
    alignItems: 'center',
    maxWidth: '100%',
  },
  voiceHintText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(253, 224, 71, 0.95)',
    textAlign: 'center',
    maxWidth: '100%',
  },
  voiceHintSub: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: 'rgba(186, 230, 253, 0.88)',
    textAlign: 'center',
    maxWidth: '100%',
  },
  dismissBtn: {
    marginTop: 4,
    alignItems: 'center',
    paddingVertical: 14,
    maxWidth: '100%',
  },
  dismissLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(248, 250, 252, 0.96)',
    maxWidth: '100%',
    textAlign: 'center',
  },
});
