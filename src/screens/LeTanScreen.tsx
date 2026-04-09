import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated as RNAnimated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthPaywallModal } from '../components/AuthPaywallModal';
import { InlineStatusBanner } from '../components/feedback/InlineStatusBanner';
import { AppStateView } from '../components/ui/AppStateView';
import { MicroHintBanner } from '../components/MicroHintBanner';
import { getPersonaDisplayName } from '../config/aiPrompts';
import { APP_BRAND } from '../config/appBrand';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList, RootTabParamList } from '../navigation/routes';
import { handleAdultConversationTurn, resolveAdultScenario } from '../services/ai/learningAI';
import {
  detectIntent,
  extractBookingData,
  hasEnoughBookingData,
  isBookingConfirmation,
  type BookingData,
  type IntentType,
} from '../services/ai/intentDetection';
import {
  detectSelectedPlace,
  findNearbyServices,
  type NearbyService,
} from '../services/radar/serviceMatcher';
import {
  consumeLeTanGuidedAiSeed,
  hasSeenMicroHint,
  markMicroHintSeen,
} from '../onboarding/guidedOnboardingStorage';
import { normalizeCountryCodeOrSentinel } from '../config/countryPacks';
import { calculateLeTanBookingPrice } from '../services/PaymentsService';
import { chargeTrustedService, syncWalletFromServer, useWalletState } from '../state/wallet';
import { Colors } from '../theme/colors';
import { gradients } from '../theme/gradients';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';
import { SellCTAButton } from '../components/selling/SellCTAButton';
import { setPendingSellResume } from '../services/selling/sellResumeStorage';
import { maybeGenerateSellCTA } from '../services/selling/sellEngine';
import type { SellCTA } from '../services/selling/sellingTypes';
import { recordAIIdentityAction } from '../services/identity';
import { defaultPatternIdFor, trackNetworkEffectEvent } from '../services/networkEffect';
import { trackGrowthEvent } from '../services/growth';
import { appendUsageHistory } from '../services/history';
import { isFirebaseClientConfigured } from '../config/firebaseApp';
import type { BusinessBooking, BusinessOrder } from '../domain/b2b/models';
import {
  buildBookingHandoffSummary,
  buildOrderHandoffSummary,
  fetchMerchantStaffQueueUnified,
  formatHandoffBlock,
  readB2bDevTenantId,
  type LiveStaffQueueRow,
} from '../services/b2b';
import {
  isB2bStaffQueueHttpsPreferred,
  readB2bTenantIdFromJwt,
} from '../config/b2bMerchantAccess';
import { getWalletIdToken } from '../services/walletFirebaseSession';

function demoStayStaffHandoffText(): string {
  const b: BusinessBooking = {
    id: 'demo-b1',
    tenantId: 't',
    locationId: 'l',
    status: 'pending_confirm',
    customerPhoneE164: '+420700000001',
    customerName: 'Demo Guest',
    serviceIds: [],
    resourceIds: [],
    startsAt: undefined as unknown as BusinessBooking['startsAt'],
    endsAt: undefined as unknown as BusinessBooking['endsAt'],
    idempotencyKey: 'demo',
    b2bVertical: 'hospitality_stay',
    stayCheckInDate: '2026-04-12',
    stayCheckOutDate: '2026-04-14',
    adults: 2,
    children: 0,
    isInquiryOnly: true,
    createdAt: undefined as unknown as BusinessBooking['createdAt'],
    updatedAt: undefined as unknown as BusinessBooking['updatedAt'],
  };
  return formatHandoffBlock(buildBookingHandoffSummary(b));
}

function demoWholesaleStaffHandoffText(): string {
  const o: BusinessOrder = {
    id: 'demo-o1',
    tenantId: 't',
    locationId: 'l',
    status: 'pending_confirm',
    lines: [
      { name: 'Gạo 25kg', quantity: 40, needsClarification: true },
      { name: 'Dầu thùng', quantity: 8 },
    ],
    fulfillment: 'pickup',
    windowStart: undefined as unknown as BusinessOrder['windowStart'],
    windowEnd: undefined as unknown as BusinessOrder['windowEnd'],
    idempotencyKey: 'demo-o',
    b2bVertical: 'grocery_wholesale',
    orderSegment: 'wholesale',
    wholesaleQualification: 'needs_clarification',
    createdAt: undefined as unknown as BusinessOrder['createdAt'],
    updatedAt: undefined as unknown as BusinessOrder['updatedAt'],
  };
  return formatHandoffBlock(buildOrderHandoffSummary(o));
}

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TabRoute = RouteProp<RootTabParamList, 'LeTan'>;
type AppointmentKind =
  | 'nails'
  | 'restaurant'
  | 'grocery_retail'
  | 'grocery_wholesale'
  | 'hospitality_stay';
type AppointmentState = 'today' | 'done';
type Appointment = {
  id: string;
  time: string;
  customer: string;
  service: string;
  kind: AppointmentKind;
  state: AppointmentState;
  /** Same field persisted on `BusinessBooking` / `BusinessOrder` for staff (Phase 3.1). */
  staffHandoffSummary?: string;
};

type CoachMessage = {
  id: string;
  role: 'ai' | 'user';
  text: string;
  score?: number;
  feedbackSummary?: string;
  sellCta?: SellCTA | null;
};

function isEmergencyIntent(input: string): boolean {
  const t = input.toLowerCase();
  return /\b(112|cap cuu|cấp cứu|cuu thuong|cứu thương|canh sat|cảnh sát|chay|cháy|hoa hoan|hỏa hoạn|bao luc|bạo lực|cuop|cướp|emergency|ambulance|police|fire)\b/i.test(
    t
  );
}

export function LeTanScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<TabRoute>();
  const { user, setPendingRedirect } = useAuth();
  const wallet = useWalletState();

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

  const pulse = useRef(new RNAnimated.Value(0.58)).current;
  const [autoReceive, setAutoReceive] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showLowCredit, setShowLowCredit] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [coachInput, setCoachInput] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [coachScores, setCoachScores] = useState<number[]>([]);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);
  const [currentIntent, setCurrentIntent] = useState<IntentType>('normal');
  const [bookingData, setBookingData] = useState<BookingData>({
    service: null,
    location: null,
    time: null,
    selectedPlace: null,
  });
  const [placeSuggestions, setPlaceSuggestions] = useState<NearbyService[]>([]);
  const [kindFilter, setKindFilter] = useState<'all' | AppointmentKind>('all');
  const [stateFilter, setStateFilter] = useState<AppointmentState>('today');
  const [guidedWelcome, setGuidedWelcome] = useState<string | null>(null);
  const [showLetanMicro, setShowLetanMicro] = useState(false);
  const [demoAppointments, setDemoAppointments] = useState<Appointment[]>([
    { id: 'a1', time: '10:20', customer: 'Katka', service: 'Smart Gel & Pedicure', kind: 'nails', state: 'today' },
    { id: 'a2', time: '12:05', customer: 'Marta', service: 'Buffet gia đình trưa', kind: 'restaurant', state: 'today' },
    { id: 'a3', time: '14:30', customer: 'Eva', service: 'Giao combo thực phẩm tuần', kind: 'grocery_retail', state: 'today' },
    {
      id: 'a3b',
      time: '15:10',
      customer: 'Hana',
      service: 'Yêu cầu phòng đôi — check-in 12/4 (ghi nhận)',
      kind: 'hospitality_stay',
      state: 'today',
      staffHandoffSummary: demoStayStaffHandoffText(),
    },
    {
      id: 'a3c',
      time: '15:45',
      customer: 'Minh Anh',
      service: 'Đặt sỉ — gạo + dầu (chờ làm rõ số lượng)',
      kind: 'grocery_wholesale',
      state: 'today',
      staffHandoffSummary: demoWholesaleStaffHandoffText(),
    },
    { id: 'a4', time: '16:00', customer: 'Lenka', service: 'Classic Pedicure + Spa', kind: 'nails', state: 'done' },
  ]);

  const devB2bTenantId = readB2bDevTenantId();
  const [liveQueueRows, setLiveQueueRows] = useState<LiveStaffQueueRow[]>([]);
  const [liveQueueLoading, setLiveQueueLoading] = useState(false);
  const [liveQueueError, setLiveQueueError] = useState<string | null>(null);
  const [liveQueuePartialWarn, setLiveQueuePartialWarn] = useState<string | null>(null);
  const [liveQueueRefreshing, setLiveQueueRefreshing] = useState(false);
  const [liveQueueTransport, setLiveQueueTransport] = useState<'functions_https' | 'firestore_client_dev' | null>(null);
  const [liveQueueClaimTenant, setLiveQueueClaimTenant] = useState<string | null>(null);

  const loadLiveB2bQueue = useCallback(async () => {
    if (!isFirebaseClientConfigured()) {
      setLiveQueueRows([]);
      setLiveQueueError(null);
      setLiveQueuePartialWarn(null);
      setLiveQueueTransport(null);
      return;
    }
    setLiveQueueLoading(true);
    setLiveQueueError(null);
    setLiveQueuePartialWarn(null);
    const token = await getWalletIdToken();
    setLiveQueueClaimTenant(readB2bTenantIdFromJwt(token));
    const r = await fetchMerchantStaffQueueUnified(() => getWalletIdToken());
    setLiveQueueRows(r.rows);
    setLiveQueueTransport(r.transport ?? null);
    if (r.error) setLiveQueueError(r.error);
    if (r.partialWarning) setLiveQueuePartialWarn(r.partialWarning);
    setLiveQueueLoading(false);
  }, []);

  useEffect(() => {
    void loadLiveB2bQueue();
  }, [loadLiveB2bQueue]);

  const onLiveQueueRefresh = useCallback(async () => {
    if (!isFirebaseClientConfigured()) return;
    setLiveQueueRefreshing(true);
    await loadLiveB2bQueue();
    setLiveQueueRefreshing(false);
  }, [loadLiveB2bQueue]);

  const txCostQuote = calculateLeTanBookingPrice(normalizeCountryCodeOrSentinel(user?.country));
  const txCost = txCostQuote.localAmount;
  const inboundPersonaName = getPersonaDisplayName('loan');
  const aiMode = route.params?.aiMode;
  const scenario = route.params?.scenario?.trim();
  const initialPrompt = route.params?.initialPrompt?.trim();
  const proactiveQuestion = (initialPrompt || route.params?.proactiveQuestion || '').trim();
  const autoSimulate = route.params?.autoSimulate === true;
  const roleplayScenario = resolveAdultScenario(scenario);

  useEffect(() => {
    if (!user) {
      setPendingRedirect('LeTan');
      navigation.navigate('Login');
    }
  }, [navigation, setPendingRedirect, user]);

  useEffect(() => {
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulse, { toValue: 1, duration: 820, useNativeDriver: true }),
        RNAnimated.timing(pulse, { toValue: 0.58, duration: 820, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const seed = await consumeLeTanGuidedAiSeed();
      if (seed) setGuidedWelcome(seed);
      if (!(await hasSeenMicroHint('letan'))) setShowLetanMicro(true);
    })();
  }, [user]);

  const b2bQueueConfigured = Boolean(devB2bTenantId || isB2bStaffQueueHttpsPreferred());
  const b2bQueueMetricValue = !b2bQueueConfigured ? '—' : liveQueueLoading ? '…' : String(liveQueueRows.length);

  const filteredAppointments = demoAppointments.filter((item) => {
    if (item.state !== stateFilter) return false;
    if (kindFilter === 'all') return true;
    return item.kind === kindFilter;
  });

  const onSimulate = async () => {
    const startedAt = Date.now();
    if (isSimulating) return;
    setBookingError(null);
    await syncWalletFromServer();
    if (wallet.credits < txCost) {
      setShowLowCredit(true);
      setBookingError('Bạn chưa đủ Credits để đặt lịch. Vui lòng nạp thêm rồi thử lại.');
      void appendUsageHistory({ type: 'booking', status: 'failed', note: 'insufficient_credits' });
      void trackNetworkEffectEvent({
        actionType: 'booking',
        success: false,
        durationMs: Date.now() - startedAt,
        language: 'vi',
        scenario: roleplayScenario,
        responsePatternId: defaultPatternIdFor('booking'),
        flowId: 'booking_linear',
      });
      return;
    }

    setIsSimulating(true);
    const chargeKey = `letan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const deducted = await chargeTrustedService({
      amount: txCost,
      idempotencyKey: chargeKey,
      serviceKind: 'letan_booking',
    });
    if (!deducted.ok) {
      setIsSimulating(false);
      setShowLowCredit(true);
      setBookingError('Thanh toán cho lượt đặt lịch chưa hoàn tất. Bạn có thể thử lại ngay.');
      void appendUsageHistory({ type: 'booking', status: 'failed', note: 'deduct_failed' });
      void trackNetworkEffectEvent({
        actionType: 'booking',
        success: false,
        durationMs: Date.now() - startedAt,
        language: 'vi',
        scenario: roleplayScenario,
        responsePatternId: defaultPatternIdFor('booking'),
        flowId: 'booking_linear',
      });
      return;
    }

    await new Promise<void>((resolve) => setTimeout(resolve, 600));

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const customers = ['Aneta', 'Petra', 'Lucie', 'Milu', 'Jana', 'Monika'];
    const services: { label: string; kind: AppointmentKind }[] = [
      { label: 'Smart Gel & Pedicure', kind: 'nails' },
      { label: 'Bàn tối 4 người', kind: 'restaurant' },
      { label: 'Đơn tạp hoá nhanh', kind: 'grocery_retail' },
      { label: 'Nails 4D Art', kind: 'nails' },
      { label: 'Combo ăn trưa văn phòng', kind: 'restaurant' },
      { label: 'Đặt hàng sỉ — pallet demo', kind: 'grocery_wholesale' },
      { label: 'Đặt phòng — yêu cầu ghi nhận (chưa chốt cọc)', kind: 'hospitality_stay' },
    ];
    const pickedService = services[Math.floor(Math.random() * services.length)] ?? {
      label: 'Smart service',
      kind: 'nails' as AppointmentKind,
    };
    const row: Appointment = {
      id: `${Date.now()}`,
      time: `${hh}:${mm}`,
      customer: customers[Math.floor(Math.random() * customers.length)] ?? 'Khach moi',
      service: pickedService.label,
      kind: pickedService.kind,
      state: 'today',
    };
    setDemoAppointments((prev) => [row, ...prev].slice(0, 18));
    setIsSimulating(false);
    void trackNetworkEffectEvent({
      actionType: 'booking',
      success: true,
      durationMs: Date.now() - startedAt,
      language: 'vi',
      scenario: roleplayScenario,
      responsePatternId: defaultPatternIdFor('booking'),
      flowId: 'booking_linear',
    });
    void trackGrowthEvent('successful_booking', {
      traits: { country: user?.country, segment: user?.segment },
      meta: { scenario: roleplayScenario },
    });
    void appendUsageHistory({ type: 'booking', status: 'success', note: roleplayScenario });

    const msg = `Đã trừ ${txCost} Credits cho dịch vụ đặt lịch.`;
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
      return;
    }
    Alert.alert(`CSKH ${inboundPersonaName}`, msg);
  };

  const onSimulateRef = useRef(onSimulate);
  onSimulateRef.current = onSimulate;

  const autoSimulateGateRef = useRef(false);

  useEffect(() => {
    autoSimulateGateRef.current = false;
  }, [user, autoSimulate, proactiveQuestion]);

  useEffect(() => {
    if (!user || !autoSimulate || !proactiveQuestion) return;
    if (isSimulating || autoSimulateGateRef.current) return;
    autoSimulateGateRef.current = true;
    void onSimulateRef.current();
  }, [user, autoSimulate, proactiveQuestion, isSimulating]);

  useEffect(() => {
    if (aiMode !== 'roleplay') {
      setCoachMessages([]);
      setCoachScores([]);
      setCurrentIntent('normal');
      setBookingData({ service: null, location: null, time: null, selectedPlace: null });
      setPlaceSuggestions([]);
      return;
    }
    if (!initialPrompt) {
      setCoachMessages([]);
      setCoachScores([]);
      setCurrentIntent('normal');
      setBookingData({ service: null, location: null, time: null, selectedPlace: null });
      setPlaceSuggestions([]);
      return;
    }
    setCoachMessages([{ id: 'opening', role: 'ai', text: initialPrompt }]);
    setCoachScores([]);
    setCurrentIntent('normal');
    setBookingData({ service: null, location: null, time: null, selectedPlace: null });
    setPlaceSuggestions([]);
  }, [aiMode, initialPrompt]);

  const averageCoachScore = useMemo(() => {
    if (!coachScores.length) return null;
    const total = coachScores.reduce((sum, item) => sum + item, 0);
    return Math.round(total / coachScores.length);
  }, [coachScores]);

  if (!user) return null;

  const onSendCoachTurn = async () => {
    const userInput = coachInput.trim();
    if (!userInput || coachLoading || aiMode !== 'roleplay') return;
    setCoachError(null);
    setLastFailedInput(null);
    setCoachInput('');
    setCoachLoading(true);
    const userId = `u-${Date.now()}`;
    setCoachMessages((prev) => [...prev, { id: userId, role: 'user', text: userInput }]);
    if (user?.phone) {
      void recordAIIdentityAction(user.phone, `letan:${currentIntent}`);
    }
    if (isEmergencyIntent(userInput)) {
      void appendUsageHistory({ type: 'emergency', status: 'success', note: 'letan_emergency_redirect' });
      setCoachMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'ai',
          text: 'Mình chuyển bạn sang màn hình SOS ngay để gọi 112 khẩn cấp.',
          sellCta: null,
        },
      ]);
      setCoachLoading(false);
      navigation.navigate('EmergencySOS');
      return;
    }

    const detected = detectIntent(userInput);
    const isBookingMode = detected === 'booking' || currentIntent === 'booking';
    if (detected !== 'normal') {
      setCurrentIntent(detected);
    }

    if (isBookingMode) {
      let mergedBooking = extractBookingData(userInput, bookingData);
      if (placeSuggestions.length && !mergedBooking.selectedPlace) {
        const picked = detectSelectedPlace(userInput, placeSuggestions);
        if (picked) {
          mergedBooking = { ...mergedBooking, selectedPlace: picked.name };
        }
      }
      setBookingData(mergedBooking);

      if (hasEnoughBookingData(mergedBooking) && mergedBooking.selectedPlace && isBookingConfirmation(userInput)) {
        const prefillRequest =
          `Đặt lịch ${mergedBooking.service} tại ${mergedBooking.selectedPlace} (${mergedBooking.location}) vào ${mergedBooking.time}.`;
        setCoachMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: 'Đã xác nhận. Mình chuyển bạn sang Leona để gọi đặt lịch ngay.',
          },
        ]);
        setCoachLoading(false);
        navigation.navigate('LeonaCall', {
          service: mergedBooking.service ?? undefined,
          location: mergedBooking.location ?? undefined,
          time: mergedBooking.time ?? undefined,
          selectedPlace: mergedBooking.selectedPlace ?? undefined,
          prefillRequest,
        });
        return;
      }

      let bookingReply = '';
      if (!mergedBooking.location) {
        bookingReply = 'Bạn muốn đặt lịch ở đâu?';
      } else if (!mergedBooking.time) {
        bookingReply = 'Bạn muốn hẹn vào thời gian nào?';
      } else if (!mergedBooking.service) {
        bookingReply = 'Bạn cần đặt dịch vụ gì?';
      } else if (!mergedBooking.selectedPlace) {
        if (!placeSuggestions.length) {
          const suggestions = findNearbyServices(mergedBooking.service, mergedBooking.location);
          setPlaceSuggestions(suggestions);
          if (suggestions.length) {
            bookingReply = [
              'Mình tìm được vài nơi gần bạn:',
              ...suggestions.map(
                (item, idx) => `${idx + 1}. ${item.name} (${item.distance}) - ${item.rating.toFixed(1)}★`
              ),
              'Bạn muốn chọn nơi nào?',
            ].join('\n');
          } else {
            const fallbackPlace = mergedBooking.location ?? 'Khu vực bạn yêu cầu';
            const updated = { ...mergedBooking, selectedPlace: fallbackPlace };
            setBookingData(updated);
            bookingReply = 'Hiện chưa có dữ liệu nơi gần bạn, mình tiếp tục bước xác nhận nhé.';
          }
        } else {
          const picked = detectSelectedPlace(userInput, placeSuggestions);
          if (picked) {
            const updated = { ...mergedBooking, selectedPlace: picked.name };
            setBookingData(updated);
            bookingReply = `Đã chọn ${picked.name}. Bạn có muốn mình gọi đặt lịch giúp không?`;
          } else {
            bookingReply = 'Bạn chọn giúp mình bằng số thứ tự (1, 2...) hoặc tên nơi bạn muốn đặt.';
          }
        }
      } else {
        bookingReply = 'Bạn có muốn mình gọi đặt lịch giúp không?';
      }

      const { cta: sellCta } = maybeGenerateSellCTA({
        userInput,
        intent: detected,
        context: {
          userCountry: user?.country,
          segment: user?.segment,
          scenario: roleplayScenario,
        },
      });

      setCoachMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'ai',
          text: bookingReply,
          sellCta,
        },
      ]);
      setCoachLoading(false);
      return;
    }

    try {
      const turn = await handleAdultConversationTurn(userInput, roleplayScenario, user?.phone);
      const aiText = [
        `Sửa câu: ${turn.correctedSentence}`,
        `Gợi ý tốt hơn: ${turn.improvedSentence}`,
        `Giải thích: ${turn.shortExplanation}`,
        `Tiếp tục roleplay: ${turn.nextRoleplayResponse}`,
      ].join('\n');
      if (typeof turn.score === 'number') {
        setCoachScores((prev) => [...prev, turn.score as number]);
      }
      setCoachMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'ai',
          text: aiText,
          score: turn.score ?? undefined,
          feedbackSummary: turn.feedbackSummary || undefined,
          sellCta: maybeGenerateSellCTA({
            userInput,
            intent: currentIntent === 'normal' ? detected : currentIntent,
            context: {
              userCountry: user?.country,
              segment: user?.segment,
              scenario: roleplayScenario,
            },
          }).cta,
        },
      ]);
      void appendUsageHistory({ type: 'call', status: 'success', note: 'letan_ai_turn_success' });
    } catch {
      setLastFailedInput(userInput);
      setCoachError('Hỗ trợ đang bận hoặc mạng chưa ổn định. Bấm "Thử lại" để gửi lại câu vừa nhập.');
      void appendUsageHistory({ type: 'call', status: 'failed', note: 'letan_ai_turn_failed' });
    } finally {
      setCoachLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MicroHintBanner
        visible={showLetanMicro}
        text="Bấm “Giả lập cuộc gọi” bên dưới để xem Minh Khang chốt lịch — hoặc mở phiên dịch nếu cần."
        onDismiss={() => {
          setShowLetanMicro(false);
          void markMicroHintSeen('letan');
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          (devB2bTenantId || isB2bStaffQueueHttpsPreferred()) && isFirebaseClientConfigured() ? (
            <RefreshControl refreshing={liveQueueRefreshing} onRefresh={() => void onLiveQueueRefresh()} />
          ) : undefined
        }
      >
        <Text style={styles.brand}>{APP_BRAND.iconLabel}</Text>
        <Text style={styles.title}>CSKH {inboundPersonaName}</Text>
        {guidedWelcome ? (
          <View style={styles.guidedBanner}>
            <Ionicons name="chatbubble-ellipses" size={16} color={theme.colors.primaryBright} />
            <Text style={styles.guidedBannerText}>{guidedWelcome}</Text>
            <Pressable
              onPress={() => setGuidedWelcome(null)}
              style={({ pressed }) => [styles.guidedDismiss, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.guidedDismissText}>OK</Text>
            </Pressable>
          </View>
        ) : null}
        <Pressable
          onPress={() => navigation.navigate('EmergencySOS')}
          style={({ pressed }) => [styles.sosBtn, pressed && { opacity: 0.88 }]}
        >
          <Ionicons name="warning" size={16} color={theme.colors.primaryBright} />
          <Text style={styles.sosBtnText}>SOS 112 khẩn cấp</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('LiveInterpreter')}
          style={({ pressed }) => [styles.interpreterBtn, pressed && { opacity: 0.88 }]}
        >
          <Ionicons name="language" size={16} color={theme.colors.primaryBright} />
          <Text style={styles.interpreterBtnText}>Phiên dịch trực tiếp</Text>
        </Pressable>
        {proactiveQuestion ? (
          <View style={styles.proactiveBanner}>
            <Ionicons name="sparkles" size={14} color={theme.colors.primaryBright} />
            <Text style={styles.proactiveText}>
              {aiMode === 'roleplay' && scenario
                ? `Roleplay "${scenario}": "${proactiveQuestion}"`
                : `Gợi ý Proactive: "${proactiveQuestion}"`}
            </Text>
          </View>
        ) : null}
        {aiMode === 'roleplay' ? (
          <View style={styles.coachCard}>
            <Text style={styles.coachTitle}>Coach hội thoại ({roleplayScenario})</Text>
            {averageCoachScore !== null ? (
              <Text style={styles.coachAverage}>Trung bình: {averageCoachScore} điểm</Text>
            ) : null}
            <View style={styles.coachMessages}>
              {coachMessages.map((m) => (
                <View
                  key={m.id}
                  style={[styles.coachBubble, m.role === 'user' ? styles.coachBubbleUser : styles.coachBubbleAi]}
                >
                  <Text style={styles.coachBubbleRole}>{m.role === 'user' ? 'Bạn' : inboundPersonaName}</Text>
                  <Text style={styles.coachBubbleText}>{m.text}</Text>
                  {typeof m.score === 'number' ? (
                    <Text style={styles.coachScoreText}>Điểm: {m.score}/100</Text>
                  ) : null}
                  {m.feedbackSummary ? (
                    <Text style={styles.coachFeedbackText}>{m.feedbackSummary}</Text>
                  ) : null}
                  {m.sellCta ? (
                    <SellCTAButton
                      cta={m.sellCta}
                      onPress={() => onPressSellCta(m.sellCta!)}
                      disabled={false}
                    />
                  ) : null}
                </View>
              ))}
            </View>
            <View style={styles.coachComposer}>
              {coachError ? (
                <AppStateView
                  variant="aiUnavailable"
                  layout="embedded"
                  title="AI tạm thời quá tải"
                  message={coachError}
                  retryLabel="Thử lại câu này"
                  onRetry={() => {
                    if (!lastFailedInput || coachLoading) return;
                    setCoachInput(lastFailedInput);
                    setCoachError(null);
                    setTimeout(() => void onSendCoachTurn(), 0);
                  }}
                  style={styles.coachErrorState}
                />
              ) : null}
              <View style={styles.coachComposerRow}>
                <TextInput
                  value={coachInput}
                  onChangeText={setCoachInput}
                  placeholder="Nhập câu bạn muốn luyện..."
                  placeholderTextColor={Colors.textSoft}
                  style={styles.coachInput}
                  editable={!coachLoading}
                  returnKeyType="send"
                  onSubmitEditing={() => {
                    void onSendCoachTurn();
                  }}
                />
                <Pressable
                  onPress={() => {
                    void onSendCoachTurn();
                  }}
                  disabled={coachLoading}
                  style={({ pressed }) => [styles.coachSendBtn, pressed && { opacity: 0.86 }]}
                >
                  {coachLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.primaryBright} />
                  ) : (
                    <Text style={styles.coachSendText}>Gửi</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.bentoWrap}>
          <LinearGradient
            colors={gradients.goldGlassSoft}
            style={styles.mainBorder}
          >
            <View style={styles.mainCard}>
              <View style={styles.heroRow}>
                <RNAnimated.View style={[styles.avatarOrb, { opacity: pulse }]}>
                  <Ionicons name="headset" size={30} color={theme.colors.primaryBright} />
                </RNAnimated.View>
                <View style={styles.heroMeta}>
                  <Text style={styles.heroTitle}>Tổng đài viên {inboundPersonaName}</Text>
                  <Text style={styles.heroSub}>
                    Hỗ trợ tiếp nhận & chuẩn hoá yêu cầu — chốt lịch thuộc merchant / hệ thống merchant; app không tự
                    xác nhận đặt chỗ hoàn tất.
                  </Text>
                </View>
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Credits còn lại</Text>
                  <Text style={styles.metricValue}>{wallet.credits}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Hàng đợi B2B (đã tải)</Text>
                  <Text style={styles.metricValue}>{b2bQueueMetricValue}</Text>
                  <Text style={styles.metricFootnote}>
                    Số mục từ snapshot phía dưới khi đã cấu hình B2B — không phải tổng lịch hẹn hay số booking toàn hệ
                    thống.
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.toggleCard}>
            <Text style={styles.toggleLabel}>{inboundPersonaName} tự động nhận cuộc gọi</Text>
            <Pressable
              onPress={() => setAutoReceive((v) => !v)}
              style={({ pressed }) => [
                styles.switchTrack,
                autoReceive && styles.switchTrackOn,
                pressed && { opacity: 0.86 },
              ]}
            >
              <View style={[styles.switchThumb, autoReceive && styles.switchThumbOn]} />
            </Pressable>
          </View>
        </View>

        {!isFirebaseClientConfigured() ? (
          <View style={styles.liveQueueSectionMuted}>
            <Text style={styles.liveQueueHint}>
              Hàng đợi B2B cần Firebase client (<Text style={styles.liveQueueMono}>EXPO_PUBLIC_FIREBASE_*</Text>).
            </Text>
          </View>
        ) : !devB2bTenantId && !isB2bStaffQueueHttpsPreferred() ? (
          <View style={styles.liveQueueSectionMuted}>
            <Text style={styles.liveQueueHint}>
              Bật một trong hai để tải hàng đợi:{' '}
              <Text style={styles.liveQueueMono}>EXPO_PUBLIC_B2B_STAFF_QUEUE_PREFER_HTTPS=1</Text> (API máy chủ + claim{' '}
              <Text style={styles.liveQueueMono}>b2bTenantId</Text> trên token) hoặc dev{' '}
              <Text style={styles.liveQueueMono}>EXPO_PUBLIC_B2B_DEV_TENANT_ID</Text> (đọc Firestore trực tiếp — không phải
              hướng production). Xem <Text style={styles.liveQueueMono}>docs/B2B_G1_MERCHANT_OPS.md</Text>.
            </Text>
          </View>
        ) : (
          <View style={styles.liveQueueSection}>
            <Text style={styles.sectionTitle}>Hàng đợi B2B (vận hành · máy chủ / dev)</Text>
            <Text style={styles.liveQueueHint}>
              {liveQueueTransport === 'functions_https'
                ? 'Nguồn: b2bStaffQueueSnapshot — tenant chỉ lấy từ custom claim b2bTenantId (đã xác minh trên máy chủ). Không phải đặt lịch hoàn tất trong app.'
                : liveQueueTransport === 'firestore_client_dev'
                  ? 'Nguồn: Firestore SDK trên máy (dev) — phụ thuộc rule; tenant từ EXPO_PUBLIC_B2B_DEV_TENANT_ID. Không thay thế RBAC đầy đủ.'
                  : 'Chưa xác định nguồn — kéo để tải lại.'}
            </Text>
            {liveQueueClaimTenant ? (
              <Text style={styles.liveQueueHint}>
                Token có claim <Text style={styles.liveQueueMono}>b2bTenantId</Text> ={' '}
                <Text style={styles.liveQueueMono}>{liveQueueClaimTenant}</Text>
              </Text>
            ) : isB2bStaffQueueHttpsPreferred() ? (
              <Text style={styles.liveQueueWarn}>
                Chưa thấy claim <Text style={styles.liveQueueMono}>b2bTenantId</Text> trên token — API máy chủ sẽ trả 403
                cho đến khi set claim (Admin SDK). Fallback Firestore sau lỗi HTTPS chỉ khi{' '}
                <Text style={styles.liveQueueMono}>EXPO_PUBLIC_B2B_FIRESTORE_QUEUE_FALLBACK=1</Text> và có{' '}
                <Text style={styles.liveQueueMono}>EXPO_PUBLIC_B2B_DEV_TENANT_ID</Text> (chỉ dev).
              </Text>
            ) : null}
            {liveQueueLoading && liveQueueRows.length === 0 ? (
              <ActivityIndicator style={styles.liveQueueSpinner} color={Colors.primary} />
            ) : null}
            {liveQueueError ? <Text style={styles.liveQueueError}>{liveQueueError}</Text> : null}
            {liveQueuePartialWarn ? <Text style={styles.liveQueueWarn}>{liveQueuePartialWarn}</Text> : null}
            {liveQueueRows.length === 0 && !liveQueueLoading ? (
              <Text style={styles.emptyText}>
                Chưa có bản ghi. Gợi ý: <Text style={styles.liveQueueMono}>npm run b2b:verify-phase32</Text> (thư mục
                functions) với <Text style={styles.liveQueueMono}>--inject-fixture</Text>; hoặc{' '}
                <Text style={styles.liveQueueMono}>npm run b2b:g1-set-claims</Text> + deploy{' '}
                <Text style={styles.liveQueueMono}>b2bStaffQueueSnapshot</Text>.
              </Text>
            ) : null}
            {liveQueueRows.map((row) => (
              <View key={`${row.source}-${row.id}`} style={styles.liveQueueCard}>
                <View style={styles.liveQueueCardTop}>
                  <Text style={styles.liveQueueSource}>
                    {row.source === 'booking' ? 'Booking' : 'Order'} · {row.id.slice(0, 10)}…
                  </Text>
                  <Text style={styles.liveQueueTime}>{row.updatedAtLabel}</Text>
                </View>
                <Text style={styles.liveQueueHeadline}>{row.headline}</Text>
                <Text style={styles.liveQueueCustomer}>{row.customerLabel}</Text>
                {row.source === 'booking' ? (
                  <Text style={styles.lifecycleLine}>
                    Trạng thái booking: {row.bookingStatus ?? '—'}
                    {row.isInquiryOnly ? ' · inquiry (không phải xác nhận cuối)' : ''}
                  </Text>
                ) : (
                  <Text style={styles.lifecycleLine}>
                    Trạng thái đơn: {row.orderStatus ?? '—'}
                    {row.wholesaleQualification
                      ? ` · wholesale: ${row.wholesaleQualification} (tách với retail; debit theo billing event)`
                      : ''}
                  </Text>
                )}
                <View style={styles.operationalPill}>
                  <Text style={styles.operationalPillText}>{row.operationalLine}</Text>
                </View>
                {row.escalationHint ? (
                  <Text style={styles.liveQueueEscalation}>Callback / escalation: {row.escalationHint}</Text>
                ) : null}
                <View style={styles.staffHandoffBoxLive}>
                  <Text style={styles.staffHandoffLabel}>staffHandoffSummary (máy chủ)</Text>
                  <Text style={styles.staffHandoffText}>{row.staffHandoffSummary}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Lịch minh hoạ (Smart Calendar · offline)</Text>
        <Text style={styles.calendarDemoNote}>
          Chỉ dữ liệu ví dụ lưu trong app — không đồng bộ hàng đợi B2B phía trên; không thay thế lịch vận hành thật hay
          xác nhận merchant.
        </Text>
        <View style={styles.filtersWrap}>
          <View style={styles.filterRow}>
            {(
              [
                'all',
                'nails',
                'restaurant',
                'grocery_retail',
                'grocery_wholesale',
                'hospitality_stay',
              ] as const
            ).map((k) => (
              <Pressable
                key={k}
                onPress={() => setKindFilter(k)}
                style={({ pressed }) => [
                  styles.filterChip,
                  kindFilter === k && styles.filterChipActive,
                  pressed && { opacity: 0.84 },
                ]}
              >
                <Text style={[styles.filterText, kindFilter === k && styles.filterTextActive]}>
                  {k === 'all'
                    ? 'Tất cả'
                    : k === 'nails'
                      ? 'Nails'
                      : k === 'restaurant'
                        ? 'Quán ăn'
                        : k === 'grocery_retail'
                          ? 'Tạp hoá'
                          : k === 'grocery_wholesale'
                            ? 'Đặt sỉ'
                            : 'Lưu trú'}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.filterRow}>
            {(['today', 'done'] as const).map((s) => (
              <Pressable
                key={s}
                onPress={() => setStateFilter(s)}
                style={({ pressed }) => [
                  styles.filterChip,
                  stateFilter === s && styles.filterChipActive,
                  pressed && { opacity: 0.84 },
                ]}
              >
                <Text style={[styles.filterText, stateFilter === s && styles.filterTextActive]}>
                  {s === 'today' ? 'Hôm nay' : 'Đã xong'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.listWrap}>
          {filteredAppointments.map((item) => (
            <View key={item.id} style={styles.appCard}>
              <View style={styles.appMeta}>
                <Text style={styles.demoRibbon}>Offline · demo</Text>
                <Text style={styles.appTime}>{item.time}</Text>
                <Text style={styles.appCustomer}>{item.customer}</Text>
                <Text style={styles.appService}>{item.service}</Text>
                <View style={styles.serviceRow}>
                  <Ionicons
                    name={
                      item.kind === 'nails'
                        ? 'cut'
                        : item.kind === 'restaurant'
                          ? 'restaurant'
                          : item.kind === 'hospitality_stay'
                            ? 'bed'
                            : 'basket'
                    }
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={styles.serviceType}>
                    {item.kind === 'nails'
                      ? 'Tiệm Nails'
                      : item.kind === 'restaurant'
                        ? 'Quán ăn'
                        : item.kind === 'grocery_retail'
                          ? 'Tạp hoá · Thực phẩm'
                          : item.kind === 'grocery_wholesale'
                            ? 'Đổ hàng · Đặt sỉ'
                            : 'Lưu trú · Ghi nhận'}
                  </Text>
                  <View
                    style={[
                      styles.kindBadge,
                      item.kind === 'nails'
                        ? styles.kindBadgeNails
                        : item.kind === 'restaurant'
                          ? styles.kindBadgeRestaurant
                          : item.kind === 'hospitality_stay'
                            ? styles.kindBadgeRestaurant
                            : styles.kindBadgeGrocery,
                    ]}
                  >
                    <Text style={styles.kindBadgeText}>
                      {item.kind === 'nails'
                        ? 'Nails'
                        : item.kind === 'restaurant'
                          ? 'Quán ăn'
                          : item.kind === 'grocery_retail'
                            ? 'Tạp hoá'
                            : item.kind === 'grocery_wholesale'
                              ? 'Đặt sỉ'
                              : 'Lưu trú'}
                    </Text>
                  </View>
                </View>
                {item.staffHandoffSummary ? (
                  <View style={styles.staffHandoffBox}>
                    <Text style={styles.staffHandoffLabel}>Handoff mẫu (offline — không phải Firestore)</Text>
                    <Text style={styles.staffHandoffText}>{item.staffHandoffSummary}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.kind === 'hospitality_stay'
                    ? 'Ghi nhận lưu trú (inquiry)'
                    : item.kind === 'grocery_wholesale'
                      ? 'Đặt sỉ · chờ xác nhận'
                      : 'Đã chốt'}
                </Text>
              </View>
            </View>
          ))}
          {filteredAppointments.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có lịch phù hợp bộ lọc.</Text>
          ) : null}
        </View>

        <Pressable
          onPress={onSimulate}
          disabled={isSimulating}
          style={({ pressed }) => [styles.devBtn, pressed && { opacity: 0.84 }]}
        >
          {isSimulating ? (
            <View style={styles.devLoading}>
              <ActivityIndicator size="small" color={theme.colors.primaryBright} />
              <Text style={styles.devText}>
                Đang xác nhận thanh toán với máy chủ…{'\n'}
                <Text style={styles.devSubText}>Vui lòng đợi — Credits chỉ trừ khi máy chủ báo OK.</Text>
              </Text>
            </View>
          ) : (
            <Text style={styles.devText}>[Dev] Giả lập Khách gọi & Chốt đơn</Text>
          )}
        </Pressable>
        {bookingError ? <InlineStatusBanner tone="error" text={bookingError} onRetry={() => void onSimulate()} /> : null}
      </ScrollView>

      <AuthPaywallModal
        visible={showLowCredit}
        title="Hết Credits"
        description={`Bạn đã hết Credits. Vui lòng nạp thêm để tiếp tục sử dụng Tổng đài viên ${inboundPersonaName}.`}
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
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 },
  brand: {
    fontSize: 13,
    color: Colors.textSoft,
    marginBottom: 4,
    fontFamily: FontFamily.regular,
  },
  title: {
    fontSize: 28,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 12,
  },
  interpreterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.panel,
  },
  sosBtn: {
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 14,
    minHeight: 42,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 115, 115, 0.45)',
    backgroundColor: 'rgba(229, 115, 115, 0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sosBtnText: {
    color: theme.colors.text.primary,
    fontSize: 13,
    fontFamily: FontFamily.bold,
  },
  interpreterBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: theme.colors.primaryBright,
  },
  proactiveBanner: {
    marginTop: -4,
    marginBottom: 10,
    minHeight: 32,
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.executive.panel,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proactiveText: {
    flex: 1,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.medium,
    fontSize: 12,
  },
  guidedBanner: {
    marginBottom: 12,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.executive.panelMuted,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guidedBannerText: {
    flex: 1,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  guidedDismiss: { paddingHorizontal: 8, paddingVertical: 4 },
  guidedDismissText: { fontFamily: FontFamily.bold, fontSize: 13, color: theme.colors.primaryBright },
  coachCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  coachTitle: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  coachAverage: {
    marginTop: -2,
    fontSize: 12,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.semibold,
  },
  coachMessages: {
    gap: 6,
  },
  coachBubble: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  coachBubbleAi: {
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.bubbleAi,
  },
  coachBubbleUser: {
    borderColor: 'rgba(197, 160, 89, 0.35)',
    backgroundColor: theme.colors.executive.bubbleUser,
  },
  coachBubbleRole: {
    fontSize: 10,
    color: Colors.textSoft,
    fontFamily: FontFamily.semibold,
    marginBottom: 2,
  },
  coachBubbleText: {
    fontSize: 12,
    color: Colors.text,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
  coachScoreText: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.bold,
  },
  coachFeedbackText: {
    marginTop: 2,
    fontSize: 11,
    color: Colors.textSoft,
    fontFamily: FontFamily.medium,
  },
  coachComposer: {
    gap: 8,
  },
  coachErrorState: {
    marginBottom: 2,
  },
  coachComposerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coachInput: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.chipFill,
    paddingHorizontal: 10,
    color: Colors.text,
    fontFamily: FontFamily.regular,
    fontSize: 13,
  },
  coachSendBtn: {
    minWidth: 58,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.panel,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  coachSendText: {
    fontSize: 12,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.semibold,
  },
  bentoWrap: { gap: 10, marginBottom: 14 },
  mainBorder: { borderRadius: 20, padding: 1 },
  mainCard: {
    borderRadius: 19,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.card,
    padding: 14,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarOrb: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.executive.avatarOrb,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
  },
  heroMeta: { flex: 1 },
  heroTitle: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: FontFamily.extrabold,
    marginBottom: 2,
  },
  heroSub: {
    fontSize: 12,
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
  },
  metricRow: { flexDirection: 'row', gap: 8 },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.metricSurface,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSoft,
    fontFamily: FontFamily.medium,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.extrabold,
  },
  metricFootnote: {
    fontSize: 10,
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
    marginTop: 6,
    lineHeight: 14,
  },
  toggleCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: FontFamily.semibold,
  },
  switchTrack: {
    width: 56,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.chipFill,
    padding: 3,
    justifyContent: 'center',
  },
  switchTrackOn: { backgroundColor: 'rgba(129, 199, 132, 0.35)' },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primaryBright,
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.text.primary,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  filtersWrap: {
    marginBottom: 10,
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.chipFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.22)',
    borderColor: theme.colors.glass.border,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 12,
    color: Colors.textSoft,
    fontFamily: FontFamily.medium,
  },
  filterTextActive: {
    color: Colors.text,
    fontFamily: FontFamily.semibold,
  },
  listWrap: { gap: 10 },
  liveQueueSection: {
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glass.borderSoft,
  },
  liveQueueSectionMuted: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.executive.panelMuted,
  },
  liveQueueHint: {
    fontSize: 11,
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
    marginBottom: 10,
  },
  liveQueueMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    color: Colors.text,
  },
  liveQueueSpinner: { marginVertical: 12 },
  liveQueueError: {
    fontSize: 12,
    color: theme.colors.danger,
    fontFamily: FontFamily.medium,
    marginBottom: 8,
  },
  liveQueueWarn: {
    fontSize: 11,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.medium,
    marginBottom: 8,
  },
  liveQueueCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.executive.liveQueueBorder,
    backgroundColor: theme.colors.executive.liveQueueSurface,
    padding: 10,
    marginBottom: 10,
  },
  liveQueueCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  liveQueueSource: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: theme.colors.primaryBright,
  },
  liveQueueTime: {
    fontSize: 10,
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
  },
  liveQueueHeadline: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  lifecycleLine: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.textSoft,
    marginTop: 6,
    lineHeight: 17,
  },
  liveQueueCustomer: {
    fontSize: 12,
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
    marginBottom: 6,
  },
  operationalPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(197, 160, 89, 0.14)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 6,
  },
  operationalPillText: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.primary,
    lineHeight: 14,
  },
  liveQueueEscalation: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    color: theme.colors.danger,
    marginBottom: 6,
  },
  staffHandoffBoxLive: {
    marginTop: 4,
    padding: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.executive.chipFill,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
  },
  calendarDemoNote: {
    fontSize: 11,
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
    marginBottom: 8,
    marginTop: -4,
  },
  demoRibbon: {
    fontSize: 9,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  appCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.card,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  appMeta: { flex: 1, paddingRight: 10 },
  appTime: {
    fontSize: 16,
    color: theme.colors.danger,
    fontFamily: FontFamily.extrabold,
    marginBottom: 3,
  },
  appCustomer: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamily.bold,
    marginBottom: 2,
  },
  appService: {
    fontSize: 12,
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
  },
  serviceRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceType: {
    fontSize: 12,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.semibold,
  },
  kindBadge: {
    marginLeft: 2,
    minHeight: 20,
    borderRadius: 10,
    paddingHorizontal: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindBadgeNails: {
    backgroundColor: 'rgba(197, 160, 89, 0.16)',
    borderColor: theme.colors.glass.border,
  },
  kindBadgeRestaurant: {
    backgroundColor: theme.colors.executive.panelMuted,
    borderColor: theme.colors.glass.borderSoft,
  },
  kindBadgeGrocery: {
    backgroundColor: 'rgba(129, 199, 132, 0.14)',
    borderColor: 'rgba(129, 199, 132, 0.35)',
  },
  kindBadgeText: {
    fontSize: 10,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.semibold,
  },
  staffHandoffBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.executive.chipFill,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
  },
  staffHandoffLabel: {
    fontSize: 10,
    color: Colors.textSoft,
    fontFamily: FontFamily.semibold,
    marginBottom: 4,
  },
  staffHandoffText: {
    fontSize: 11,
    color: Colors.text,
    fontFamily: FontFamily.regular,
    lineHeight: 15,
  },
  badge: {
    borderRadius: 10,
    backgroundColor: 'rgba(129, 199, 132, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(129, 199, 132, 0.45)',
    paddingHorizontal: 8,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    color: theme.colors.success,
    fontFamily: FontFamily.bold,
  },
  devBtn: {
    marginTop: 16,
    alignSelf: 'flex-end',
    minHeight: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panel,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devLoading: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  devText: {
    fontSize: 11,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.medium,
    flex: 1,
  },
  devSubText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
    paddingTop: 4,
  },
});
