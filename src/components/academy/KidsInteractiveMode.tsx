import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { HomeworkScanner } from '../HomeworkScanner';
import { geminiTeacherService } from '../../services/ai/GeminiTeacherService';
import { generateSpeech, getChatCompletion, transcribeAudio } from '../../services/OpenAIService';
import { toOpenAiTtsVoice } from '../../services/voicePersona';
import { FontFamily } from '../../theme/typography';
import type { TeacherEmotion } from './TeacherAvatar';

type ChatMessage = Readonly<{
  role: 'system' | 'user' | 'assistant';
  content: string;
}>;

type KidsResult = Readonly<{
  vietnameseWord: string;
  pronunciationHint: string;
  sourceLanguageText?: string;
  sourceMode: 'scan' | 'voice';
}>;

export function KidsInteractiveMode({
  nativeLanguageLabel,
  onLessonSuccess,
  onEmotionChange,
}: Readonly<{
  nativeLanguageLabel: string;
  onLessonSuccess: (mode: 'scan' | 'voice') => void;
  onEmotionChange?: (emotion: TeacherEmotion) => void;
}>) {
  const [scanOpen, setScanOpen] = useState(false);
  const [busyMode, setBusyMode] = useState<'scan' | 'voice' | null>(null);
  const [result, setResult] = useState<KidsResult | null>(null);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const ttsVoice = useMemo(() => toOpenAiTtsVoice('shimmer'), []);

  useEffect(() => {
    if (!onEmotionChange) return;
    if (isRecording) {
      onEmotionChange('listening');
      return;
    }
    if (busyMode === 'voice') {
      onEmotionChange('speaking');
      return;
    }
    onEmotionChange('idle');
  }, [busyMode, isRecording, onEmotionChange]);

  const clearSound = async () => {
    if (!soundRef.current) return;
    const s = soundRef.current;
    soundRef.current = null;
    try {
      await s.unloadAsync();
    } catch {
      // no-op
    }
  };

  const playPronunciation = async (text: string) => {
    await clearSound();
    onEmotionChange?.('speaking');
    const uri = await generateSpeech(text, ttsVoice);
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        onEmotionChange?.('idle');
      }
    });
    soundRef.current = sound;
  };

  const parseTeachingReply = (reply: string): Pick<KidsResult, 'vietnameseWord' | 'pronunciationHint'> => {
    const line = reply.trim().split('\n')[0] ?? '';
    const clean = line.replace(/^[-*\d.\s]+/, '').trim();
    const chunks = clean.split(/[:|-]/).map((v) => v.trim()).filter(Boolean);
    const vietnameseWord = ((chunks[0] ?? clean) || 'Đồ vật').slice(0, 32);
    const pronunciationHint = (chunks[1] ?? 'Con đọc theo cô chậm rãi nhé!').slice(0, 100);
    return { vietnameseWord, pronunciationHint };
  };

  const runTutor = async (childInputText: string, mode: 'scan' | 'voice'): Promise<KidsResult> => {
    const prompt: ChatMessage = {
      role: 'user',
      content:
        mode === 'scan'
          ? `Con là bé 6 tuổi. Mô tả đồ vật: "${childInputText}". Hãy trả lời đúng 1 dòng theo format "TỪ_TIẾNG_VIỆT: GỢI_Ý_PHÁT_ÂM" thật ngắn, vui vẻ.`
          : `Con nói bằng ${nativeLanguageLabel}: "${childInputText}". Hãy dạy con nói tiếng Việt, trả lời đúng format "TỪ_TIẾNG_VIỆT: GỢI_Ý_PHÁT_ÂM".`,
    };
    const reply = await getChatCompletion([prompt], 'leona', { serviceContext: 'learning' });
    const parsed = parseTeachingReply(reply);
    return {
      ...parsed,
      sourceLanguageText: mode === 'voice' ? childInputText : undefined,
      sourceMode: mode,
    };
  };

  const onScanCaptured = async (base64Image: string) => {
    setScanOpen(false);
    setPermissionMessage(null);
    setBusyMode('scan');
    try {
      const gemini = await geminiTeacherService.analyzeStudentWhiteboard(base64Image);
      const next = await runTutor(gemini.summary, 'scan');
      setResult(next);
      onLessonSuccess('scan');
    } catch {
      setPermissionMessage('Cô AI chưa nhìn rõ đồ vật. Mình thử chụp lại với ánh sáng tốt hơn nhé.');
    } finally {
      setBusyMode(null);
    }
  };

  const startRecording = async () => {
    setPermissionMessage(null);
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) {
      setPermissionMessage('Để học phát âm, app cần quyền micro. Bố mẹ có thể bật để bé luyện nói cùng Cô AI.');
      return;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();
    recordingRef.current = recording;
    setIsRecording(true);
  };

  const stopRecording = async () => {
    const recording = recordingRef.current;
    recordingRef.current = null;
    if (!recording) return;
    setIsRecording(false);
    setBusyMode('voice');
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) return;
      const spoken = await transcribeAudio(uri);
      const next = await runTutor(spoken, 'voice');
      setResult(next);
      onLessonSuccess('voice');
    } catch {
      setPermissionMessage('Chưa nghe rõ giọng nói của bé. Mình nhấn giữ micro lâu hơn một chút nhé.');
    } finally {
      setBusyMode(null);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [styles.actionCard, styles.scanCard, pressed && { transform: [{ scale: 0.98 }] }]}
          onPress={() => setScanOpen(true)}
          disabled={busyMode !== null}
        >
          <Ionicons name="scan" size={24} color="#2F855A" />
          <Text style={styles.actionTitle}>Quét Đồ Vật</Text>
          <Text style={styles.actionSub}>Gemini Vision nhận diện đồ vật quanh bé</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            styles.voiceCard,
            isRecording && styles.voiceCardRecording,
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
          onPressIn={() => {
            void startRecording();
          }}
          onPressOut={() => {
            void stopRecording();
          }}
          disabled={busyMode === 'scan'}
        >
          <Ionicons name={isRecording ? 'mic' : 'mic-outline'} size={30} color="#A02C8B" />
          <Text style={styles.actionTitle}>{isRecording ? 'Đang nghe bé nói...' : 'Nhấn giữ để nói'}</Text>
          <Text style={styles.actionSub}>Nói bằng {nativeLanguageLabel}, cô dạy phát âm tiếng Việt</Text>
        </Pressable>
      </View>

      {busyMode ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#6B46C1" />
          <Text style={styles.loadingText}>
            {busyMode === 'scan' ? 'Cô AI đang xem đồ vật...' : 'Cô AI đang nghe và dịch cho bé...'}
          </Text>
        </View>
      ) : null}

      {permissionMessage ? <Text style={styles.permissionHelp}>{permissionMessage}</Text> : null}

      {result ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Từ tiếng Việt hôm nay</Text>
          <Text style={styles.word}>{result.vietnameseWord}</Text>
          <Text style={styles.pronounceHint}>{result.pronunciationHint}</Text>
          {result.sourceLanguageText ? (
            <Text style={styles.sourceText}>{`Con đã nói: "${result.sourceLanguageText}"`}</Text>
          ) : null}
          <Pressable
            style={({ pressed }) => [styles.speakBtn, pressed && { opacity: 0.88 }]}
            onPress={() => {
              void playPronunciation(`${result.vietnameseWord}. ${result.pronunciationHint}`);
            }}
          >
            <Ionicons name="volume-high" size={16} color="#FFFFFF" />
            <Text style={styles.speakText}>Nghe cô đọc mẫu</Text>
          </Pressable>
        </View>
      ) : null}

      <HomeworkScanner visible={scanOpen} onClose={() => setScanOpen(false)} onCaptured={onScanCaptured} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  actionsRow: { gap: 10 },
  actionCard: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    alignItems: 'center',
    gap: 6,
  },
  scanCard: { backgroundColor: '#E6FFFA', borderColor: '#9AE6B4' },
  voiceCard: { backgroundColor: '#FAE8FF', borderColor: '#E9D8FD' },
  voiceCardRecording: { backgroundColor: '#FAD5FF', borderColor: '#D53F8C' },
  actionTitle: { color: '#1F2937', fontSize: 16, fontFamily: FontFamily.bold },
  actionSub: { color: '#4B5563', fontSize: 12, textAlign: 'center', fontFamily: FontFamily.medium },
  loadingCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: { color: '#4C1D95', fontSize: 13, fontFamily: FontFamily.medium },
  permissionHelp: {
    color: '#7C2D12',
    backgroundColor: '#FFEDD5',
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.medium,
  },
  resultCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  resultLabel: { color: '#2563EB', fontSize: 12, fontFamily: FontFamily.bold },
  word: { color: '#1D4ED8', fontSize: 34, fontFamily: FontFamily.extrabold },
  pronounceHint: { color: '#374151', fontSize: 14, textAlign: 'center', lineHeight: 20, fontFamily: FontFamily.medium },
  sourceText: { color: '#6B7280', fontSize: 12, textAlign: 'center', fontFamily: FontFamily.regular },
  speakBtn: {
    marginTop: 2,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speakText: { color: '#FFFFFF', fontSize: 13, fontFamily: FontFamily.bold },
});
