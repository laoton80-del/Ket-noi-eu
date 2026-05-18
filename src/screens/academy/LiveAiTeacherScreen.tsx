import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrecisePanel } from '../../components/ui/PrecisePanel';
import { StatusChip, type StatusChipState } from '../../components/ui/StatusChip';
import { getVioCreditsLabel } from '../../core/monetization/vioDisplayLabels';
import { useTranslation } from '../../i18n';
import type { RootStackParamList } from '../../navigation/routes';
import { useAiStream } from '../../services/academy/AiStreamClient';
import { getAiTeacherPrompt } from '../../services/academy/TeacherPrompt';
import { useRegionState } from '../../state/region';
import { b2cTheme } from '../../theme/appModeThemes';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

const NARROW_WIDTH = 400;
const CONTROLS_BOTTOM_PAD = 120;

export function LiveAiTeacherScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'LiveAiTeacher'>>();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const scenarioLabel = route.params?.scenarioLabel?.trim();
  const practiceFocus = route.params?.practiceFocus?.trim();
  const stream = useAiStream();
  const { currentCountry, localLanguage } = useRegionState();
  const [whiteboardText, setWhiteboardText] = useState('');
  const [avatarSpeech, setAvatarSpeech] = useState('');
  const [isCharging, setIsCharging] = useState(false);

  const avatarStageMinHeight = width < NARROW_WIDTH ? 240 : 300;
  const whiteboardPanelWidth = width < NARROW_WIDTH ? '92%' : '56%';

  useEffect(() => {
    stream.onMessage((message) => {
      setAvatarSpeech(message.speech);
      setWhiteboardText(message.whiteboard);
    });
  }, [stream]);

  const statusState: StatusChipState = useMemo(() => {
    if (stream.state === 'live') return 'Cleared';
    if (stream.state === 'connecting') return 'Pending';
    if (stream.state === 'error') return 'Error';
    return 'Processing';
  }, [stream.state]);

  const aiTeacherPrompt = useMemo(
    () => getAiTeacherPrompt(localLanguage, currentCountry),
    [localLanguage, currentCountry]
  );

  const handleConnectToggle = async () => {
    if (isCharging) return;
    if (stream.state === 'live' || stream.state === 'connecting') {
      stream.disconnect();
      return;
    }
    setIsCharging(true);
    try {
      await stream.connect(aiTeacherPrompt);
    } catch {
      Alert.alert(t('academyLive.connectErrorTitle'), t('academyLive.connectErrorBody'));
    } finally {
      setIsCharging(false);
    }
  };

  const isConnected = stream.state === 'live' || stream.state === 'connecting';
  const mainActionLabel = isCharging
    ? t('academyLive.processing')
    : isConnected
      ? t('academyLive.disconnectSession')
      : t('academyLive.startDemoSession');

  const handleMicPress = () => {
    if (isCharging || stream.state !== 'live') return;
    stream.sendAudio('sample_base64_audio');
  };

  const idleSpeech =
    stream.state === 'error'
      ? t('academyLive.teacherUnavailableDemo')
      : avatarSpeech || t('academyLive.avatarSpeechIdle');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>{t('academyLive.headerTitle')}</Text>
            <View style={styles.betaBadge}>
              <Text style={styles.betaBadgeText}>{t('academyLive.betaBadge')}</Text>
            </View>
          </View>
          <Text style={styles.contextText}>
            {t('academyLive.contextLabel', { country: currentCountry })}
          </Text>
          <Text style={styles.sessionPreviewLabel}>{t('academyLive.sessionPreview')}</Text>
        </View>
        <StatusChip state={statusState} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: CONTROLS_BOTTOM_PAD }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {scenarioLabel || practiceFocus ? (
          <PrecisePanel style={styles.learnerCuePanel}>
            <Text style={styles.learnerCueTitle}>{t('academyLive.learnerCueTitle')}</Text>
            {scenarioLabel ? (
              <Text style={styles.learnerCueLine}>
                <Text style={styles.learnerCueEmphasis}>{t('academyLive.scenarioLabel')}</Text>
                {scenarioLabel}
              </Text>
            ) : null}
            {practiceFocus ? (
              <Text style={styles.learnerCueLine}>
                <Text style={styles.learnerCueEmphasis}>{t('academyLive.focusLabel')}</Text>
                {practiceFocus}
              </Text>
            ) : null}
            <Text style={styles.learnerCueHint}>{t('academyLive.learnerCueHint')}</Text>
          </PrecisePanel>
        ) : null}

        <View
          style={[
            styles.pilotPanel,
            { backgroundColor: b2cTheme.colors.card, borderColor: b2cTheme.colors.border },
          ]}
        >
          <View style={styles.pilotPanelHeader}>
            <Ionicons name="school" size={18} color={b2cTheme.colors.primary} />
            <Text style={styles.pilotPanelTitle}>{t('academyLive.upgradePanelTitle')}</Text>
          </View>
          <Text style={styles.pilotAccessKicker}>{t('academyLive.pilotAccess')}</Text>
          <Text style={styles.upgradeComingSoon}>{t('academyLive.upgradeComingSoon')}</Text>
          <Text style={styles.pilotPanelBody}>{t('academyLive.upgradePanelBody')}</Text>
          <Text style={styles.pilotPanelNote}>
            {t('academyLive.upgradePreviewNote', { credits: getVioCreditsLabel() })}
          </Text>
          <Text style={styles.upgradeInterestLabel}>{t('academyLive.upgradeInterestLabel')}</Text>
        </View>

        <PrecisePanel style={styles.safetyBanner}>
          <View style={styles.safetyBannerHeader}>
            <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.SignatureGold} />
            <Text style={styles.safetyBannerTitle}>{t('academyLive.safetyBannerTitle')}</Text>
          </View>
          <Text style={styles.safetyLine}>{t('academyLive.demoSessionNotice')}</Text>
          <Text style={styles.safetyLine}>{t('academyLive.notOfficialCertification')}</Text>
          <Text style={styles.safetyLine}>{t('academyLive.availabilityLimited')}</Text>
          <Text style={styles.safetyLine}>{t('academyLive.noHighStakes')}</Text>
        </PrecisePanel>

        <View style={styles.videoStage}>
          <View
            style={[
              styles.avatarPlaceholder,
              { minHeight: avatarStageMinHeight },
              stream.state === 'live' && styles.avatarLiveGlow,
            ]}
          >
            <Ionicons name="videocam" size={40} color={theme.colors.SignatureGold} />
            <Text style={styles.avatarTitle}>{t('academyLive.avatarStageTitle')}</Text>
            <Text style={styles.avatarHint}>{t('academyLive.avatarStageHint')}</Text>
          </View>
          <Text style={styles.avatarSpeech} numberOfLines={4}>
            {idleSpeech}
          </Text>
        </View>

        {whiteboardText.trim() ? (
          <PrecisePanel style={[styles.whiteboardPanel, { width: whiteboardPanelWidth }]}>
            <Text style={styles.whiteboardTitle}>{t('academyLive.whiteboardTitle')}</Text>
            <Text style={styles.whiteboardLine}>{whiteboardText}</Text>
          </PrecisePanel>
        ) : null}
      </ScrollView>

      <View style={styles.controlsWrap}>
        <Pressable
          style={({ pressed }) => [
            styles.mainActionBtn,
            isConnected ? styles.disconnectBtn : styles.connectBtn,
            isCharging && styles.mainActionDisabled,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => {
            void handleConnectToggle();
          }}
          disabled={isCharging}
          accessibilityRole="button"
          accessibilityLabel={mainActionLabel}
        >
          {isCharging ? (
            <View style={styles.processingWrap}>
              <ActivityIndicator size="small" color={theme.colors.CeolWhite} />
              <Text style={styles.mainActionText}>{mainActionLabel}</Text>
            </View>
          ) : (
            <Text style={styles.mainActionText}>{mainActionLabel}</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.controlButton, styles.controlActive, pressed && { opacity: 0.8 }]}
          onPress={handleMicPress}
          disabled={isCharging || stream.state !== 'live'}
          accessibilityRole="button"
          accessibilityLabel={t('academyLive.micA11y')}
        >
          <Ionicons name="mic" size={20} color={theme.colors.onAccent} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.DeepInkNavy,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
    gap: 10,
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: theme.colors.SignatureGold,
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    flexShrink: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  betaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.55)',
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
  },
  betaBadgeText: {
    color: '#DDD6FE',
    fontSize: 10,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  sessionPreviewLabel: {
    marginTop: 2,
    color: theme.colors.text.secondary,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    opacity: 0.88,
  },
  learnerCuePanel: {
    marginHorizontal: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  learnerCueTitle: {
    color: theme.colors.SignatureGold,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.bold,
    marginBottom: 6,
  },
  learnerCueLine: {
    color: theme.colors.text.secondary,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
    marginBottom: 4,
  },
  learnerCueEmphasis: {
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
  },
  learnerCueHint: {
    marginTop: 4,
    color: theme.colors.text.secondary,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    opacity: 0.85,
  },
  contextText: {
    marginTop: 2,
    color: theme.colors.SignatureGold,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    opacity: 0.9,
    textAlign: 'center',
  },
  pilotPanel: {
    marginHorizontal: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  pilotPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pilotPanelTitle: {
    flex: 1,
    color: b2cTheme.colors.text,
    ...theme.typeScale.body,
    fontFamily: FontFamily.extrabold,
  },
  pilotAccessKicker: {
    color: b2cTheme.colors.primary,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  upgradeComingSoon: {
    color: b2cTheme.colors.primary,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.bold,
    lineHeight: 18,
  },
  pilotPanelBody: {
    color: 'rgba(11, 22, 40, 0.78)',
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
  pilotPanelNote: {
    color: 'rgba(11, 22, 40, 0.62)',
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    lineHeight: 18,
  },
  upgradeInterestLabel: {
    marginTop: 2,
    color: 'rgba(11, 22, 40, 0.55)',
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    lineHeight: 17,
  },
  safetyBanner: {
    marginHorizontal: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  safetyBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  safetyBannerTitle: {
    flex: 1,
    color: theme.colors.SignatureGold,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.bold,
  },
  safetyLine: {
    color: theme.colors.text.secondary,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    lineHeight: 17,
  },
  videoStage: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    minHeight: 200,
  },
  avatarPlaceholder: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.overlay.ringCore,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  avatarLiveGlow: {
    borderColor: theme.colors.SignalBlue,
    shadowColor: theme.colors.SignatureGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarTitle: {
    marginTop: 12,
    color: theme.colors.text.primary,
    ...theme.typeScale.h2,
    fontFamily: FontFamily.extrabold,
    textAlign: 'center',
  },
  avatarHint: {
    marginTop: 8,
    color: theme.colors.text.secondary,
    ...theme.typeScale.caption,
    textAlign: 'center',
    fontFamily: FontFamily.medium,
    paddingHorizontal: 8,
  },
  avatarSpeech: {
    marginTop: 12,
    color: theme.colors.text.secondary,
    ...theme.typeScale.caption,
    textAlign: 'center',
  },
  whiteboardPanel: {
    alignSelf: 'center',
    marginHorizontal: 14,
    marginTop: 4,
    backgroundColor: theme.colors.CeolWhite,
  },
  whiteboardTitle: {
    color: theme.colors.SignatureGold,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    marginBottom: 8,
  },
  whiteboardLine: {
    color: theme.colors.GraphiteBlue,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
  },
  controlsWrap: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 24,
    minHeight: 72,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.hybrid.borderOnInk,
    backgroundColor: theme.colors.overlay.ringSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  mainActionBtn: {
    minWidth: 126,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  connectBtn: {
    backgroundColor: theme.hybrid.signal,
    borderColor: theme.colors.SignalBlue,
  },
  disconnectBtn: {
    backgroundColor: theme.colors.RouteError,
    borderColor: theme.colors.RouteError,
  },
  mainActionText: {
    color: theme.colors.CeolWhite,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
  mainActionDisabled: {
    opacity: 0.78,
  },
  processingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    minWidth: 64,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.overlay.ringSoft,
  },
  controlActive: {
    borderWidth: 1,
    borderColor: theme.hybrid.signatureLine,
  },
});
