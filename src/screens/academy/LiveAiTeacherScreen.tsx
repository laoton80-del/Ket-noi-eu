import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrecisePanel } from '../../components/ui/PrecisePanel';
import { StatusChip, type StatusChipState } from '../../components/ui/StatusChip';
import { useAiStream } from '../../services/academy/AiStreamClient';
import { getAiTeacherPrompt } from '../../services/academy/TeacherPrompt';
import { useRegionState } from '../../state/region';
import { chargeWalletServer } from '../../state/wallet';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { generateChargeKey } from '../../utils/idempotency';

export function LiveAiTeacherScreen() {
  const stream = useAiStream();
  const { currentCountry, localLanguage } = useRegionState();
  const [whiteboardText, setWhiteboardText] = useState('');
  const [avatarSpeech, setAvatarSpeech] = useState('');
  const [isCharging, setIsCharging] = useState(false);

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
    const key = generateChargeKey('ai_teacher_session');
    const result = await chargeWalletServer('ai_teacher_session', key);
    setIsCharging(false);
    if (!result.ok) {
      if (result.error === 'insufficient_funds') {
        Alert.alert('Not enough credits', 'You do not have enough credits to start this session. Please top up your wallet.');
      } else {
        Alert.alert('Unable to start session', 'Billing could not be completed. Please try again.');
      }
      return;
    }
    await stream.connect(aiTeacherPrompt);
  };

  const isConnected = stream.state === 'live' || stream.state === 'connecting';
  const mainActionLabel = isCharging ? 'Processing...' : isConnected ? 'Disconnect' : 'Start Session';

  const handleMicPress = () => {
    if (isCharging || stream.state !== 'live') return;
    stream.sendAudio('sample_base64_audio');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Live AI Teacher</Text>
          <Text style={styles.contextText}>Context: {currentCountry}</Text>
        </View>
        <StatusChip state={statusState} />
      </View>

      <View style={styles.videoStage}>
        <View style={[styles.avatarPlaceholder, stream.state === 'live' && styles.avatarLiveGlow]}>
          <Ionicons name="videocam" size={40} color={theme.colors.SignatureGold} />
          <Text style={styles.avatarTitle}>AI Avatar Stream</Text>
          <Text style={styles.avatarHint}>WebRTC video avatar se hien thi tai day.</Text>
        </View>
        <Text style={styles.avatarSpeech} numberOfLines={3}>
          {avatarSpeech || 'AI teacher dang san sang hoi thoai thoi gian thuc.'}
        </Text>
      </View>

      {whiteboardText.trim() ? (
        <PrecisePanel style={styles.whiteboardPanel}>
          <Text style={styles.whiteboardTitle}>Whiteboard</Text>
          <Text style={styles.whiteboardLine}>{whiteboardText}</Text>
        </PrecisePanel>
      ) : null}

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
          disabled={isCharging}
        >
          <Ionicons name="mic" size={20} color={theme.colors.onAccent} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.DeepInkNavy,
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
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  contextText: {
    marginTop: 2,
    color: theme.colors.SignatureGold,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    opacity: 0.9,
  },
  videoStage: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.overlay.ringCore,
    minHeight: 320,
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
  },
  avatarHint: {
    marginTop: 8,
    color: theme.colors.text.secondary,
    ...theme.typeScale.caption,
    textAlign: 'center',
    fontFamily: FontFamily.medium,
  },
  avatarSpeech: {
    marginTop: 12,
    color: theme.colors.text.secondary,
    ...theme.typeScale.caption,
    textAlign: 'center',
  },
  whiteboardPanel: {
    position: 'absolute',
    right: 12,
    bottom: 126,
    width: '56%',
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
