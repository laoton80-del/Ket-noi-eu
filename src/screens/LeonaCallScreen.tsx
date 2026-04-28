import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated as RNAnimated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthPaywallModal } from '../components/AuthPaywallModal';
import { InlineStatusBanner } from '../components/feedback/InlineStatusBanner';
import { MicroHintBanner } from '../components/MicroHintBanner';
import { TrustSurfaceCard } from '../components/TrustSurfaceCard';
import { getPersonaDisplayName } from '../config/aiPrompts';
import { normalizeCountryCodeOrSentinel } from '../config/countryPacks';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/routes';
import { hasSeenMicroHint, markMicroHintSeen } from '../onboarding/guidedOnboardingStorage';
import { calculateCallCreditPrice } from '../services/PaymentsService';
import { appendUsageHistory } from '../services/history';
import { trackGrowthEventOnce } from '../services/growth';
import { chargeTrustedService, syncWalletFromServer, useWalletState } from '../state/wallet';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ScreenRoute = RouteProp<RootStackParamList, 'LeonaCall'>;

const COUNTRY_CODES = ['+420', '+421', '+48', '+49', '+33', '+44', '+41'];

export function LeonaCallScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const { user, setPendingRedirect } = useAuth();
  const wallet = useWalletState();

  const pulse = useRef(new RNAnimated.Value(0)).current;
  const sheetY = useRef(new RNAnimated.Value(320)).current;
  const attention = useRef(new RNAnimated.Value(0)).current;

  const [countryCodeIndex, setCountryCodeIndex] = useState(0);
  const [phone, setPhone] = useState('');
  const [requestText, setRequestText] = useState('');
  const [phase, setPhase] = useState<'idle' | 'calling' | 'done'>('idle');
  const [showLowCredit, setShowLowCredit] = useState(false);
  const [fromReminder, setFromReminder] = useState(false);
  const [showLeonaMicro, setShowLeonaMicro] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);

  const outboundQuote = calculateCallCreditPrice(normalizeCountryCodeOrSentinel(user?.country));
  const outboundCostCzk = outboundQuote.localAmount;
  const outboundCostLabel = `${outboundCostCzk} Credits`;
  const outboundPersonaName = getPersonaDisplayName('leona');
  const autoSubmitRequested = !!route.params?.autoSubmit;

  useEffect(() => {
    if (!user) {
      setPendingRedirect('LeonaCall');
      navigation.navigate('Login');
    }
  }, [navigation, setPendingRedirect, user]);

  useEffect(() => {
    void (async () => {
      if (await hasSeenMicroHint('leona')) return;
      setShowLeonaMicro(true);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    const digits = user.phone.replace(/\D/g, '');
    if (digits.length >= 7 && phone.trim().length === 0) {
      setPhone(digits);
    }
  }, [phone, user]);

  useEffect(() => {
    const prefill = route.params?.prefillRequest;
    if (typeof prefill === 'string' && prefill.trim().length > 0) {
      setRequestText(prefill.trim());
      setFromReminder(true);
      attention.setValue(0);
      RNAnimated.sequence([
        RNAnimated.timing(attention, { toValue: 1, duration: 280, useNativeDriver: true }),
        RNAnimated.timing(attention, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(() => setFromReminder(false), 1800);
      return () => clearTimeout(timer);
    }
  }, [attention, route.params?.prefillRequest]);

  useEffect(() => {
    const loop = RNAnimated.loop(
      RNAnimated.timing(pulse, {
        toValue: 1,
        duration: phase === 'calling' ? 650 : 1700,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [phase, pulse]);

  const canCall = phone.trim().length >= 7 && requestText.trim().length >= 6 && phase !== 'calling';

  const onCall = async () => {
    if (!canCall) return;
    void trackGrowthEventOnce('first_call_attempt');
    setCallError(null);
    await syncWalletFromServer();
    if (wallet.credits < outboundCostCzk) {
      setShowLowCredit(true);
      setCallError('Bạn chưa đủ Credits để thực hiện cuộc gọi. Vui lòng nạp rồi thử lại.');
      void appendUsageHistory({ type: 'leona', status: 'failed', note: 'insufficient_credits' });
      return;
    }
    setPhase('calling');
    const chargeKey = `leona-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const res = await chargeTrustedService({
      amount: outboundCostCzk,
      idempotencyKey: chargeKey,
      serviceKind: 'leona_outbound',
    });
    if (!res.ok) {
      setPhase('idle');
      setShowLowCredit(true);
      setCallError('Không thể xác nhận thanh toán lúc này. Bạn vui lòng thử lại sau ít phút.');
      void appendUsageHistory({ type: 'leona', status: 'failed', note: 'payment_unavailable' });
      return;
    }
    void appendUsageHistory({ type: 'leona', status: 'success', note: 'outbound_request_charged' });
    setPhase('done');
    RNAnimated.timing(sheetY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const onCallRef = useRef(onCall);
  onCallRef.current = onCall;

  useEffect(() => {
    if (!autoSubmitRequested || phase !== 'idle') return;
    if (!canCall) return;
    void onCallRef.current();
  }, [autoSubmitRequested, canCall, phase]);

  if (!user) return null;

  const ringScales = [
    pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }),
    pulse.interpolate({ inputRange: [0, 1], outputRange: [1.1, 1.5] }),
  ];
  const ringOpacity = [
    pulse.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.6, 0.22, 0.02] }),
    pulse.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.42, 0.18, 0.01] }),
  ];
  const attentionScale = attention.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const liveCoreScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <SafeAreaView style={styles.container}>
      <MicroHintBanner
        visible={showLeonaMicro}
        text="Nhập số và mô tả ngắn — bấm gọi để Leona xử lý (trừ Credits theo cuộc)."
        onDismiss={() => {
          setShowLeonaMicro(false);
          void markMicroHintSeen('leona');
        }}
      />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.title}>Gọi hỗ trợ — {outboundPersonaName}</Text>
        <Text style={styles.subtitle}>
          {phase === 'calling'
            ? 'Đang xác nhận thanh toán với máy chủ — vui lòng đợi vài giây…'
            : 'Tổng đài CSKH hỗ trợ gọi đối ngoại'}
        </Text>
        <View style={styles.creditPill}>
          <Ionicons name="wallet" size={12} color={theme.colors.SignatureGold} />
          <Text style={styles.creditPillText}>{wallet.credits} Credits</Text>
        </View>

        <View style={styles.micArea}>
          {ringScales.map((scale, i) => (
            <RNAnimated.View
              key={`r-${i}`}
              style={[
                styles.ring,
                phase === 'calling' ? styles.ringCalling : styles.ringIdle,
                {
                  opacity: ringOpacity[i],
                  transform: [{ scale }],
                  borderWidth: fromReminder ? 1 : 0,
                  borderColor: fromReminder ? theme.colors.primaryBright : 'transparent',
                },
              ]}
            />
          ))}
          <RNAnimated.View
            style={[
              {
                transform: [{ scale: phase === 'calling' ? liveCoreScale : attentionScale }],
              },
            ]}
          >
            <Pressable
              onPress={() => void onCall()}
              disabled={!canCall}
              style={({ pressed }) => [styles.avatarRingButton, !canCall && styles.avatarRingDisabled, pressed && { opacity: 0.8 }]}
            >
              {phase === 'calling' ? (
                <ActivityIndicator color={theme.colors.CeolWhite} />
              ) : (
                <Ionicons name="mic" size={30} color={theme.colors.CeolWhite} />
              )}
            </Pressable>
          </RNAnimated.View>
          {fromReminder ? (
            <View style={styles.reminderBadge}>
              <Ionicons name="notifications" size={12} color={theme.colors.primaryBright} />
              <Text style={styles.reminderBadgeText}>Đã mở từ nhắc hạn</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.inputCard}>
          <View style={styles.phoneRow}>
            <Pressable
              onPress={() => setCountryCodeIndex((v) => (v + 1) % COUNTRY_CODES.length)}
              style={({ pressed }) => [styles.codeBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.codeBtnText}>{COUNTRY_CODES[countryCodeIndex]}</Text>
            </Pressable>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Số điện thoại cần gọi"
              keyboardType="phone-pad"
              style={styles.phoneInput}
              placeholderTextColor={theme.colors.text.secondary}
            />
          </View>

          <View style={styles.requestWrap}>
            <TextInput
              value={requestText}
              onChangeText={setRequestText}
              placeholder="Yêu cầu của bạn (vd: đặt lịch bác sĩ răng lúc 3h chiều)"
              style={styles.requestInput}
              multiline
              placeholderTextColor={theme.colors.text.secondary}
            />
            <Pressable style={({ pressed }) => [styles.inlineMic, pressed && { opacity: 0.82 }]}>
              <Ionicons name="mic" size={16} color={theme.colors.CeolWhite} />
            </Pressable>
          </View>
        </View>

        <TrustSurfaceCard cardTone="dark" watermarkOpacity={0.03} style={styles.statusCard}>
          <Text style={styles.statusText}>
            {phase === 'calling' ? 'Máy chủ đang xác nhận Credits trước khi tiếp tục…' : 'Đang nghe...'}
          </Text>
          <Text style={styles.statusText}>Phí: {outboundCostLabel}/lượt</Text>
        </TrustSurfaceCard>
        {callError ? <InlineStatusBanner tone="error" text={callError} onRetry={() => void onCall()} /> : null}
      </View>

      <RNAnimated.View style={[styles.resultSheet, { transform: [{ translateY: sheetY }] }]}>
        <View style={styles.sheetDrag} />
        <Text style={styles.sheetTitle}>Xác nhận yêu cầu và thanh toán</Text>
        <Text style={styles.sheetResult}>
          ✅ Đã xác nhận thanh toán và trừ Credits; yêu cầu đã được ghi nhận. Kết quả cuộc gọi thực tế do tổng đài/đối tác —
          ứng dụng chỉ xác nhận lượt dịch vụ đã thanh toán.
        </Text>
        <Text style={styles.sheetCharge}>Đã trừ {outboundCostCzk} Credits.</Text>
        <Pressable
          onPress={() => {
            RNAnimated.timing(sheetY, { toValue: 320, duration: 240, useNativeDriver: true }).start(() => {
              setPhase('idle');
            });
          }}
          style={({ pressed }) => [styles.sheetCloseBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.sheetCloseText}>Đóng báo cáo</Text>
        </Pressable>
      </RNAnimated.View>

      <AuthPaywallModal
        visible={showLowCredit}
        title="Hết Credits"
        description={`Bạn đã hết Credits. Nạp thêm để tiếp tục dùng dịch gọi hỗ trợ ${outboundPersonaName}.`}
        onClose={() => setShowLowCredit(false)}
        onContinue={() => {
          setShowLowCredit(false);
          navigation.navigate('Wallet');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.DeepInkNavy },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay.dim,
  },
  content: { paddingHorizontal: 16, paddingTop: 14 },
  avatarRingButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.RouteError,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  avatarRingDisabled: {
    opacity: 0.58,
  },
  title: { ...theme.typeScale.h1, color: theme.colors.CeolWhite, fontFamily: FontFamily.bold, marginBottom: 6 },
  subtitle: { ...theme.typeScale.body, color: theme.colors.text.secondary, fontFamily: FontFamily.regular, marginBottom: 10 },
  creditPill: {
    alignSelf: 'flex-end',
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  creditPillText: {
    color: theme.colors.primaryBright,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
  },
  micArea: { height: 220, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 158,
    height: 158,
    borderRadius: 79,
    borderWidth: 1,
  },
  ringCalling: { borderColor: theme.colors.primaryBright },
  ringIdle: { borderColor: theme.colors.glass.border },
  reminderBadge: {
    position: 'absolute',
    bottom: 12,
    minHeight: 24,
    borderRadius: 12,
    paddingHorizontal: 9,
    backgroundColor: theme.colors.executive.panelMuted,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reminderBadgeText: {
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.medium,
    fontSize: 11,
  },
  inputCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    padding: 12,
    marginBottom: 12,
  },
  phoneRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  codeBtn: {
    minWidth: 74,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBtnText: { color: theme.colors.primaryBright, ...theme.typeScale.body },
  phoneInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    paddingHorizontal: 10,
    color: theme.colors.CeolWhite,
    fontFamily: FontFamily.medium,
  },
  requestWrap: {
    minHeight: 74,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    paddingLeft: 10,
    paddingRight: 38,
    paddingTop: 8,
  },
  requestInput: {
    minHeight: 58,
    color: theme.colors.CeolWhite,
    fontFamily: FontFamily.regular,
    fontSize: 13,
  },
  inlineMic: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.RouteError,
  },
  statusCard: {
    marginTop: 12,
  },
  statusText: {
    color: theme.colors.CeolWhite,
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    marginBottom: 3,
  },
  resultSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.SoftMineralGrey,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 22,
  },
  sheetDrag: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.glass.borderSoft,
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 18,
    color: theme.colors.GraphiteBlue,
    fontFamily: FontFamily.extrabold,
    marginBottom: 8,
  },
  sheetResult: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.GraphiteBlue,
    fontFamily: FontFamily.medium,
    marginBottom: 12,
  },
  sheetCharge: {
    fontSize: 13,
    color: theme.colors.RouteError,
    fontFamily: FontFamily.bold,
    marginBottom: 12,
  },
  sheetCloseBtn: {
    height: 42,
    borderRadius: 10,
    backgroundColor: theme.colors.RouteError,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseText: {
    color: theme.colors.CeolWhite,
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
});

