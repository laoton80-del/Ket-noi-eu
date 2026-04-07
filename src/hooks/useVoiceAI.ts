import { Audio } from 'expo-av';
import { Alert, Platform, ToastAndroid } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { VoicePersona } from '../api/voiceClient';
import { processVoiceUtterance } from '../api/voicePipeline';
import { useAuth } from '../context/AuthContext';
import { getWalletState, reserveAndCommitCredits, syncWalletFromServer } from '../state/wallet';
import { defaultPatternIdFor, trackNetworkEffectEvent } from '../services/networkEffect';
import { trackGrowthEvent } from '../services/growth';
import { appendUsageHistory } from '../services/history';

export type VoicePhase =
  | 'idle'
  | 'recording'
  | 'analyzing'
  | 'thinking'
  | 'sending'
  | 'playing'
  | 'error';

export type VoiceStatusCopy = {
  holdMic: string;
  listening: string;
  sending: string;
  speaking: string;
  analyzingSpeech: string;
  aiThinking: string;
};

export function voiceStatusLabel(phase: VoicePhase, t: VoiceStatusCopy): string {
  switch (phase) {
    case 'recording':
      return t.listening;
    case 'analyzing':
      return t.analyzingSpeech;
    case 'thinking':
      return t.aiThinking;
    case 'sending':
      return t.sending;
    case 'playing':
      return t.speaking;
    default:
      return t.holdMic;
  }
}

function localeFromLanguageCode(languageCode: string): string {
  if (languageCode === 'vi') return 'vi-VN';
  if (languageCode === 'cs') return 'cs-CZ';
  if (languageCode === 'de') return 'de-DE';
  return 'en-GB';
}

export type UseVoiceAIOptions = {
  persona: VoicePersona;
  languageCode: string;
};

export function useVoiceAI({
  persona,
  languageCode,
}: UseVoiceAIOptions) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [lastReplyText, setLastReplyText] = useState('');
  const [simulatedUserText, setSimulatedUserText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const startedAtRef = useRef<number>(0);

  const unloadSound = useCallback(async () => {
    const s = soundRef.current;
    soundRef.current = null;
    if (s) {
      try {
        await s.unloadAsync();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const preparePlaybackMode = useCallback(async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  const prepareRecordingMode = useCallback(async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  useEffect(() => {
    return () => {
      void (async () => {
        const r = recordingRef.current;
        if (r) {
          try {
            await r.stopAndUnloadAsync();
          } catch {
            /* ignore */
          }
          recordingRef.current = null;
        }
        await unloadSound();
      })();
    };
  }, [unloadSound]);

  const playReply = useCallback(
    async (audioUrl: string) => {
      await unloadSound();
      await preparePlaybackMode();
      setPhase('playing');
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, volume: 1 },
          (status) => {
            if (!status.isLoaded) {
              if (status.error) {
                void unloadSound();
                setPhase('idle');
              }
              return;
            }
            if (status.didJustFinish) {
              void unloadSound();
              setPhase('idle');
            }
          }
        );
        soundRef.current = sound;
      } catch {
        setPhase('idle');
      }
    },
    [preparePlaybackMode, unloadSound]
  );

  const onMicPressIn = useCallback(async () => {
    setErrorMessage(null);
    setSimulatedUserText('');
    await unloadSound();

    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setErrorMessage('microphone_denied');
        setPhase('error');
        return;
      }

      await prepareRecordingMode();

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      startedAtRef.current = Date.now();
      setPhase('recording');
    } catch {
      setErrorMessage('record_failed');
      setPhase('error');
    }
  }, [prepareRecordingMode, unloadSound]);

  const onMicPressOut = useCallback(async () => {
    const recording = recordingRef.current;
    recordingRef.current = null;

    if (!recording) {
      setPhase('idle');
      return;
    }

    const duration = Date.now() - startedAtRef.current;
    if (duration < 320) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {
        /* ignore */
      }
      setPhase('idle');
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) {
        setPhase('idle');
        return;
      }

      await syncWalletFromServer();
      if (getWalletState().credits <= 0) {
        setErrorMessage('outOfCredits');
        setPhase('error');
        return;
      }

      setPhase('sending');
      const { replyText, audioUri } = await processVoiceUtterance(uri, persona, languageCode, user?.phone);
      const deducted = await reserveAndCommitCredits(1, `call-${uri}`);
      if (!deducted.ok) {
        setErrorMessage('outOfCredits');
        setPhase('error');
        return;
      }
      void trackGrowthEvent('call_used', {
        traits: { country: user?.country, segment: user?.segment },
        meta: { language: languageCode, persona },
      });
      setLastReplyText(replyText);
      void appendUsageHistory({ type: 'call', status: 'success', note: `${persona}:${languageCode}` });
      if (audioUri) {
        await playReply(audioUri);
      } else {
        setPhase('idle');
      }
    } catch {
      void trackNetworkEffectEvent({
        actionType: 'call',
        success: false,
        durationMs: Date.now() - startedAtRef.current,
        language: languageCode,
        scenario: persona,
        responsePatternId: defaultPatternIdFor('call'),
        flowId: 'call_triage',
      });
      void appendUsageHistory({ type: 'call', status: 'failed', note: `${persona}:${languageCode}` });
      setSimulatedUserText('Hỗ trợ giọng nói đang bận. Thử lại hoặc dùng gợi ý từ LifeOS.');
      setErrorMessage('ai_busy');
      setPhase('error');
      const msg = 'Đường truyền tạm bận, vui lòng thử lại sau';
      if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.SHORT);
      } else {
        Alert.alert('Thông báo', msg);
      }
    }
  }, [languageCode, persona, playReply, user?.country, user?.phone, user?.segment]);

  const isRecording = phase === 'recording';
  const isBusy =
    phase === 'analyzing' ||
    phase === 'thinking' ||
    phase === 'sending' ||
    phase === 'playing';

  return {
    phase,
    isRecording,
    isBusy,
    showListeningFx: isRecording,
    lastReplyText,
    simulatedUserText,
    errorKey: errorMessage,
    onMicPressIn,
    onMicPressOut,
  };
}




