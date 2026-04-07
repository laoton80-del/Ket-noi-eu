import { Audio } from 'expo-av';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { InterpreterScenario } from '../config/aiPrompts';
import type { RootStackParamList } from '../navigation/routes';
import {
  INTERPRETER_MAX_SESSION_MINUTES,
  INTERPRETER_MAX_SESSION_MS,
  INTERPRETER_SESSION_CREDITS,
  INTERPRETER_SILENCE_AUTO_END_MS,
  buildPostSessionFollowUp,
  runInterpreterTurn,
  type LiveInterpreterSessionSnapshot,
} from '../services/liveInterpreterService';
import { getWalletState, reserveAndCommitCredits, rollbackReservedCredits, syncWalletFromServer } from '../state/wallet';
import type { SellCTA } from '../services/selling/sellingTypes';
import { useAuth } from '../context/AuthContext';
import { defaultPatternIdFor, trackNetworkEffectEvent } from '../services/networkEffect';
import { trackGrowthEvent, trackGrowthEventOnce } from '../services/growth';
import { appendUsageHistory } from '../services/history';

export type InterpreterPhase = 'idle' | 'recording' | 'processing' | 'playing' | 'error';

export type LiveInterpreterTurn = {
  id: string;
  transcript: string;
  translation: string;
  sellCta?: SellCTA | null;
};

export type SessionEndPayload = {
  snapshot: LiveInterpreterSessionSnapshot;
  message: string;
  prefillRequest: string;
  durationLabelSec: number;
};

export type AutoStopReason = 'max_duration' | 'silence';

type UseLiveInterpreterOptions = {
  assistantLanguageCode: string;
};

/**
 * LifeOS / deep-link entry: navigate to Live Interpreter with optional scenario.
 */
export function openLiveInterpreter(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  params?: { scenario?: InterpreterScenario }
) {
  navigation.navigate('LiveInterpreter', params);
}

export function useLiveInterpreter({ assistantLanguageCode }: UseLiveInterpreterOptions) {
  const { user } = useAuth();
  const [scenario, setScenario] = useState<InterpreterScenario>('general');
  const [direction, setDirection] = useState<'vi_to_local' | 'local_to_vi'>('vi_to_local');
  const [phase, setPhase] = useState<InterpreterPhase>('idle');
  const [turns, setTurns] = useState<LiveInterpreterTurn[]>([]);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  /** Set when max duration or silence stops the session (screen shows one Alert). */
  const [autoStopPayload, setAutoStopPayload] = useState<{
    reason: AutoStopReason;
    data: SessionEndPayload;
  } | null>(null);

  const sessionStartedAtRef = useRef<number | null>(null);
  const lastActivityAtRef = useRef<number | null>(null);
  const turnCountRef = useRef(0);
  const sessionDebitTxIdRef = useRef<string | null>(null);
  const scenarioRef = useRef(scenario);
  scenarioRef.current = scenario;

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    turnCountRef.current = turns.length;
  }, [turns.length]);

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

  const getSessionDurationMs = useCallback(() => {
    const start = sessionStartedAtRef.current;
    if (!start) return 0;
    return Date.now() - start;
  }, []);

  const buildEndPayload = useCallback(
    (endedByUser: boolean): SessionEndPayload => {
      const durationMs = getSessionDurationMs();
      const snap: LiveInterpreterSessionSnapshot = {
        scenario: scenarioRef.current,
        durationMs,
        turns: turnCountRef.current,
        endedByUser,
      };
      const follow = buildPostSessionFollowUp(scenarioRef.current);
      return {
        snapshot: snap,
        message: follow.message,
        prefillRequest: follow.prefillRequest,
        durationLabelSec: Math.max(0, Math.round(durationMs / 1000)),
      };
    },
    [getSessionDurationMs]
  );

  const finalizeSession = useCallback(
    (endedByUser: boolean): SessionEndPayload | null => {
      if (!sessionStartedAtRef.current) return null;
      void unloadSound();
      const payload = buildEndPayload(endedByUser);
      sessionStartedAtRef.current = null;
      lastActivityAtRef.current = null;
      setSessionActive(false);
      setPhase('idle');
      return payload;
    },
    [buildEndPayload, unloadSound]
  );

  /**
   * Deduct flat session credits once. Returns false if insufficient credits or deduct failed.
   */
  const beginSessionAfterPayment = useCallback(async (): Promise<boolean> => {
    await syncWalletFromServer();
    if (getWalletState().credits < INTERPRETER_SESSION_CREDITS) {
      return false;
    }
    const holdKey = `interp-${Date.now()}`;
    const res = await reserveAndCommitCredits(INTERPRETER_SESSION_CREDITS, holdKey);
    if (!res.ok) {
      return false;
    }
    sessionDebitTxIdRef.current = holdKey;
    const now = Date.now();
    sessionStartedAtRef.current = now;
    lastActivityAtRef.current = now;
    setTurns([]);
    setErrorKey(null);
    setSessionActive(true);
    void trackGrowthEvent('interpreter_used', {
      traits: { country: user?.country, segment: user?.segment },
      meta: { scenario },
    });
    void trackGrowthEventOnce('first_interpreter', {
      traits: { country: user?.country, segment: user?.segment },
      meta: { scenario },
    });
    return true;
  }, [scenario, user?.country, user?.segment]);

  const clearAutoStopPayload = useCallback(() => {
    setAutoStopPayload(null);
  }, []);

  /** Max duration monitor */
  useEffect(() => {
    if (!sessionActive) return;
    const id = setInterval(() => {
      const start = sessionStartedAtRef.current;
      if (!start) return;
      if (Date.now() - start >= INTERPRETER_MAX_SESSION_MS) {
        const data = finalizeSession(false);
        if (data) setAutoStopPayload({ reason: 'max_duration', data });
      }
    }, 2000);
    return () => clearInterval(id);
  }, [sessionActive, finalizeSession]);

  /** Silence after last completed turn */
  useEffect(() => {
    if (!sessionActive) return;
    const id = setInterval(() => {
      if (turnCountRef.current === 0) return;
      const last = lastActivityAtRef.current;
      if (!last) return;
      if (Date.now() - last >= INTERPRETER_SILENCE_AUTO_END_MS) {
        const data = finalizeSession(false);
        if (data) setAutoStopPayload({ reason: 'silence', data });
      }
    }, 5000);
    return () => clearInterval(id);
  }, [sessionActive, finalizeSession]);

  const playAudio = useCallback(
    async (uri: string) => {
      await unloadSound();
      await preparePlaybackMode();
      setPhase('playing');
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri },
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
    if (!sessionActive) return;
    if (getSessionDurationMs() >= INTERPRETER_MAX_SESSION_MS) {
      setErrorKey('session_max');
      return;
    }
    setErrorKey(null);
    await unloadSound();
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setErrorKey('microphone_denied');
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
      setErrorKey('record_failed');
      setPhase('error');
    }
  }, [getSessionDurationMs, prepareRecordingMode, sessionActive, unloadSound]);

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
    if (!sessionActive) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {
        /* ignore */
      }
      setPhase('idle');
      return;
    }
    if (getSessionDurationMs() >= INTERPRETER_MAX_SESSION_MS) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {
        /* ignore */
      }
      const data = finalizeSession(false);
      if (data) setAutoStopPayload({ reason: 'max_duration', data });
      return;
    }
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) {
        setPhase('idle');
        return;
      }
      setPhase('processing');
      const result = await runInterpreterTurn(uri, {
        scenario,
        direction,
        assistantLanguageCode,
        userId: user?.phone,
        countryCode: user?.country,
      });
      lastActivityAtRef.current = Date.now();
      setTurns((prev) => [
        ...prev,
        {
          id: `t-${Date.now()}`,
          transcript: result.transcript,
          translation: result.translationForDisplay ?? result.translation,
          sellCta: result.sellCta ?? null,
        },
      ]);
      if (result.spokenUri) {
        await playAudio(result.spokenUri);
      } else {
        setPhase('idle');
      }
      void appendUsageHistory({ type: 'interpreter', status: 'success', note: scenario });
    } catch {
      if (turnCountRef.current === 0 && sessionDebitTxIdRef.current) {
        void rollbackReservedCredits(sessionDebitTxIdRef.current);
        sessionDebitTxIdRef.current = null;
      }
      void trackNetworkEffectEvent({
        actionType: 'interpreter',
        success: false,
        durationMs: Date.now() - startedAtRef.current,
        language: assistantLanguageCode,
        scenario,
        responsePatternId: defaultPatternIdFor('interpreter'),
        flowId: 'interpreter_loop',
      });
      void appendUsageHistory({ type: 'interpreter', status: 'failed', note: scenario });
      setErrorKey('interpreter_failed');
      setPhase('error');
    }
  }, [assistantLanguageCode, direction, finalizeSession, getSessionDurationMs, playAudio, scenario, sessionActive, user?.phone]);

  const endSession = useCallback(
    (endedByUser: boolean): SessionEndPayload | null => {
      return finalizeSession(endedByUser);
    },
    [finalizeSession]
  );

  const isBusy = phase === 'processing' || phase === 'playing';
  const isRecording = phase === 'recording';
  const elapsedMs = getSessionDurationMs();
  const remainingMs = sessionActive ? Math.max(0, INTERPRETER_MAX_SESSION_MS - elapsedMs) : 0;

  return {
    scenario,
    setScenario,
    direction,
    setDirection,
    phase,
    isRecording,
    isBusy,
    turns,
    errorKey,
    sessionActive,
    sessionDurationMs: elapsedMs,
    remainingSessionMs: remainingMs,
    sessionCreditsFlat: INTERPRETER_SESSION_CREDITS,
    maxSessionMinutes: INTERPRETER_MAX_SESSION_MINUTES,
    beginSessionAfterPayment,
    getSessionDurationMs,
    onMicPressIn,
    onMicPressOut,
    endSession,
    autoStopPayload,
    clearAutoStopPayload,
    openLiveInterpreter,
  };
}
