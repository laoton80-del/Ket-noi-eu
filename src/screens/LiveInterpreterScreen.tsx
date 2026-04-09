import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPersonaDisplayName } from '../config/aiPrompts';
import type { InterpreterScenario } from '../config/aiPrompts';
import { MicroHintBanner } from '../components/MicroHintBanner';
import { InlineStatusBanner } from '../components/feedback/InlineStatusBanner';
import { SellCTAButton } from '../components/selling/SellCTAButton';
import { useLiveInterpreter } from '../hooks/useLiveInterpreter';
import {
  hasSeenMicroHint,
  markMicroHintSeen,
} from '../onboarding/guidedOnboardingStorage';
import { INTERPRETER_MAX_SESSION_MINUTES, INTERPRETER_SESSION_CREDITS } from '../services/liveInterpreterService';
import { setPendingSellResume } from '../services/selling/sellResumeStorage';
import type { SellCTA } from '../services/selling/sellingTypes';
import type { RootStackParamList } from '../navigation/routes';
import { useAssistantSettings } from '../state/assistantSettings';
import { useWalletState } from '../state/wallet';
import { Colors } from '../theme/colors';
import { FontFamily } from '../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'LiveInterpreter'>;

const SCENARIOS: { id: InterpreterScenario; label: string }[] = [
  { id: 'doctor', label: 'Bác sĩ' },
  { id: 'government', label: 'Nhà nước' },
  { id: 'work', label: 'Công việc' },
  { id: 'travel', label: 'Du lịch' },
  { id: 'general', label: 'Chung' },
];

function formatMmSs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function LiveInterpreterScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { languageCode } = useAssistantSettings();
  const wallet = useWalletState();
  const loanName = getPersonaDisplayName('loan');

  const onPressSellCta = (cta: SellCTA) => {
    if (wallet.credits < cta.creditsCost) {
      void setPendingSellResume(cta.resume);
      navigation.navigate('Wallet');
      return;
    }

    if (cta.resume.route === 'LeonaCall') {
      navigation.navigate('LeonaCall', cta.resume.params);
      return;
    }
    if (cta.resume.route === 'LiveInterpreter') {
      navigation.navigate('LiveInterpreter', cta.resume.params);
      return;
    }
    navigation.navigate('Tabs', cta.resume.params);
  };

  const {
    scenario,
    setScenario,
    direction,
    setDirection,
    isRecording,
    isBusy,
    turns,
    errorKey,
    sessionActive,
    sessionDurationMs,
    remainingSessionMs,
    sessionCreditsFlat,
    maxSessionMinutes,
    beginSessionAfterPayment,
    onMicPressIn,
    onMicPressOut,
    endSession,
    autoStopPayload,
    clearAutoStopPayload,
  } = useLiveInterpreter({ assistantLanguageCode: languageCode });

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const consentShownRef = useRef(false);
  const [showMicroHint, setShowMicroHint] = useState(false);

  useEffect(() => {
    const s = route.params?.scenario;
    if (s) setScenario(s);
  }, [route.params?.scenario, setScenario]);

  useEffect(() => {
    void (async () => {
      if (await hasSeenMicroHint('interpreter')) return;
      setShowMicroHint(true);
    })();
  }, []);

  useEffect(() => {
    if (consentShownRef.current) return;
    consentShownRef.current = true;
    const guided = route.params?.guidedEntry === true;
    if (guided) {
      const t = setTimeout(() => {
        void (async () => {
          const ok = await beginSessionAfterPayment();
          if (!ok) {
            Alert.alert('Không đủ Credits', 'Vui lòng nạp thêm Credits để mở phiên phiên dịch.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          }
        })();
      }, 380);
      return () => clearTimeout(t);
    }
    Alert.alert(
      'Xác nhận phiên phiên dịch',
      `Phiên dịch này sẽ tốn khoảng ${INTERPRETER_SESSION_CREDITS} Credits. Bạn muốn bắt đầu không?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
          onPress: () => navigation.goBack(),
        },
        {
          text: 'Bắt đầu',
          onPress: () => {
            void (async () => {
              const ok = await beginSessionAfterPayment();
              if (!ok) {
                Alert.alert('Không đủ Credits', 'Vui lòng nạp thêm Credits để mở phiên phiên dịch.', [
                  { text: 'OK', onPress: () => navigation.goBack() },
                ]);
              }
            })();
          },
        },
      ]
    );
  }, [beginSessionAfterPayment, navigation, route.params?.guidedEntry]);

  useEffect(() => {
    if (!autoStopPayload) return;
    const { reason, data } = autoStopPayload;
    const extra =
      reason === 'max_duration'
        ? `Đã đạt thời lượng tối đa (${INTERPRETER_MAX_SESSION_MINUTES} phút).`
        : 'Tạm dừng do không có tương tác sau câu cuối.';
    Alert.alert('Phiên kết thúc', `${extra}\n\n${data.message}`, [
      {
        text: 'Đóng',
        onPress: () => {
          clearAutoStopPayload();
          navigation.goBack();
        },
      },
      {
        text: 'Gọi Leona',
        onPress: () => {
          clearAutoStopPayload();
          navigation.navigate('LeonaCall', {
            prefillRequest: `${data.prefillRequest} Thời lượng phiên phiên dịch ~${data.durationLabelSec}s.`,
          });
        },
      },
    ]);
  }, [autoStopPayload, clearAutoStopPayload, navigation]);

  const onEndSession = () => {
    const ended = endSession(true);
    if (!ended) return;
    const { message, prefillRequest, durationLabelSec } = ended;
    Alert.alert('Kết thúc phiên', `${message}\n\nThời lượng ~${durationLabelSec}s`, [
      { text: 'Để sau', style: 'cancel', onPress: () => navigation.goBack() },
      {
        text: 'Gọi Leona',
        onPress: () =>
          navigation.navigate('LeonaCall', {
            prefillRequest: `${prefillRequest} Thời lượng phiên phiên dịch ~${durationLabelSec}s.`,
          }),
      },
    ]);
  };

  const timerLine = sessionActive
    ? `${formatMmSs(sessionDurationMs)} · còn ${formatMmSs(remainingSessionMs)} · tối đa ${maxSessionMinutes} phút`
    : 'Chưa bắt đầu phiên';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MicroHintBanner
        visible={showMicroHint}
        text="Giữ nút mic để nói — thả tay để dịch. Một phiên trừ Credits một lần."
        onDismiss={() => {
          setShowMicroHint(false);
          void markMicroHintSeen('interpreter');
        }}
      />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.back, pressed && { opacity: 0.8 }]}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Phiên dịch trực tiếp</Text>
          <Text style={styles.sub}>
            {loanName} · {timerLine}
          </Text>
        </View>
        <View style={styles.creditPill}>
          <Text style={styles.creditText}>{wallet.credits} Cr</Text>
        </View>
      </View>

      <Text style={styles.hint}>
        {sessionActive
          ? `Phiên: ${sessionCreditsFlat} Credits · Giữ mic · ${direction === 'vi_to_local' ? 'Việt → bản địa' : 'Bản địa → Việt'}`
          : `Mỗi phiên: ${sessionCreditsFlat} Credits (trừ khi bấm Bắt đầu)`}
      </Text>

      <View style={styles.row}>
        {SCENARIOS.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => setScenario(s.id)}
            disabled={sessionActive}
            style={({ pressed }) => [
              styles.chip,
              scenario === s.id && styles.chipOn,
              pressed && { opacity: 0.85 },
              sessionActive && { opacity: 0.55 },
            ]}
          >
            <Text style={[styles.chipText, scenario === s.id && styles.chipTextOn]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.dirRow}>
        <Pressable
          onPress={() => setDirection('vi_to_local')}
          disabled={sessionActive}
          style={[styles.dirBtn, direction === 'vi_to_local' && styles.dirBtnOn, sessionActive && { opacity: 0.55 }]}
        >
          <Text style={styles.dirText}>Vi → Local</Text>
        </Pressable>
        <Pressable
          onPress={() => setDirection('local_to_vi')}
          disabled={sessionActive}
          style={[styles.dirBtn, direction === 'local_to_vi' && styles.dirBtnOn, sessionActive && { opacity: 0.55 }]}
        >
          <Text style={styles.dirText}>Local → Vi</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.log} contentContainerStyle={styles.logContent}>
        {!sessionActive ? (
          <Text style={styles.empty}>
            {route.params?.guidedEntry ? 'Đang khởi động phiên…' : 'Xác nhận Credits ở hộp thoại để bắt đầu phiên.'}
          </Text>
        ) : turns.length === 0 ? (
          <Text style={styles.empty}>Giữ mic để nói. Không trừ thêm Credits theo từng câu.</Text>
        ) : (
          turns.map((t) => (
            <View key={t.id} style={styles.turn}>
              <Text style={styles.turnOrig}>{t.transcript}</Text>
              <Text style={styles.turnTrans}>{t.translation}</Text>
              {t.sellCta ? (
                <SellCTAButton cta={t.sellCta} onPress={() => onPressSellCta(t.sellCta!)} disabled={!sessionActive} />
              ) : null}
            </View>
          ))
        )}
        {errorKey ? (
          <InlineStatusBanner
            tone="error"
            text="Phiên dịch đang gián đoạn do mạng hoặc dịch vụ. Giữ nút mic để thử lại."
            retryLabel={sessionActive ? 'Thử lại mic' : 'Bắt đầu lại phiên'}
            onRetry={() => {
              if (!sessionActive) {
                void beginSessionAfterPayment();
              }
            }}
          />
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPressIn={onMicPressIn}
          onPressOut={onMicPressOut}
          disabled={!sessionActive || isBusy}
          style={({ pressed }) => [
            styles.mic,
            pressed && { opacity: 0.88 },
            (!sessionActive || isBusy) && { opacity: 0.45 },
          ]}
        >
          {isBusy && !isRecording ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Ionicons name={isRecording ? 'mic' : 'mic-outline'} size={32} color="#FFF" />
          )}
        </Pressable>
        <Pressable
          onPress={onEndSession}
          disabled={!sessionActive}
          style={({ pressed }) => [styles.endBtn, pressed && { opacity: 0.86 }, !sessionActive && { opacity: 0.45 }]}
        >
          <Text style={styles.endText}>Kết thúc phiên</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 8,
  },
  back: { padding: 6 },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontFamily: FontFamily.extrabold, color: Colors.text },
  sub: { fontSize: 12, fontFamily: FontFamily.regular, color: Colors.textSoft, marginTop: 2 },
  creditPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    backgroundColor: 'rgba(255,251,242,0.6)',
  },
  creditText: { fontSize: 12, fontFamily: FontFamily.semibold, color: '#7A5A1C' },
  hint: {
    paddingHorizontal: 16,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textSoft,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    backgroundColor: 'rgba(255,251,242,0.5)',
  },
  chipOn: {
    borderColor: 'rgba(212,175,55,0.55)',
    backgroundColor: 'rgba(212,175,55,0.2)',
  },
  chipText: { fontSize: 12, fontFamily: FontFamily.medium, color: Colors.textSoft },
  chipTextOn: { color: Colors.text, fontFamily: FontFamily.semibold },
  dirRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  dirBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.28)',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dirBtnOn: {
    borderColor: 'rgba(182,133,45,0.65)',
    backgroundColor: 'rgba(255,235,200,0.45)',
  },
  dirText: { fontSize: 12, fontFamily: FontFamily.semibold, color: Colors.text },
  log: { flex: 1 },
  logContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  empty: { fontSize: 13, fontFamily: FontFamily.regular, color: Colors.textSoft, lineHeight: 20 },
  turn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.28)',
    padding: 10,
    backgroundColor: 'rgba(255,251,242,0.55)',
  },
  turnOrig: { fontSize: 12, fontFamily: FontFamily.regular, color: Colors.textSoft, marginBottom: 4 },
  turnTrans: { fontSize: 14, fontFamily: FontFamily.semibold, color: Colors.text },
  err: { fontSize: 12, color: '#A93535', fontFamily: FontFamily.medium },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    alignItems: 'center',
    gap: 12,
  },
  mic: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#8B4513',
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    backgroundColor: 'rgba(58,45,30,0.78)',
  },
  endText: { fontSize: 13, fontFamily: FontFamily.semibold, color: '#FFE8C7' },
});
