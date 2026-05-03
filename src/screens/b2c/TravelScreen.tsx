import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { KN_TRAVEL_HOSPITALITY_MERCHANTS, type KngTravelHospitalityMerchant } from '../../data/kngTravelHospitality';
import type { RootStackParamList } from '../../navigation/routes';
import { hasTravelLocationConsent, setTravelLocationConsent } from '../../services/compliance/sensorConsent';
import { getTravelContext } from '../../services/context/UserContextService';
import { runUltraMasterBookingWithAlerts } from '../../services/ultraMasterBookingFlow';
import { listVietnameseRestaurantsByProximity, type CravingsRadarHit } from '../../services/travel/travelCravingsRadar';
import { V7_PLATINUM } from '../../theme/v7OmniSurfaceThemes';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { AcrylicPlatinumCard } from './travel/AcrylicPlatinumCard';
import { mockExchangeLineVi, weatherLabelVi } from './travel/travelHubTheme';

const SOS_GRADIENT: readonly [string, string] = ['#FF416C', '#FF4B2B'];

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TravelRoute = RouteProp<RootStackParamList, 'TravelHub'>;

type BentoItem = Readonly<{
  id: 'chauffeur' | 'fast_track' | 'tax_refund' | 'esim' | 'secure_vault' | 'telehealth';
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  size: 'large' | 'medium' | 'small';
  onPress: () => void;
}>;

function IconPop({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <View style={styles.iconPopWrap}>
      {children}
    </View>
  );
}

/** Navy bowl + chopsticks — bespoke mark (no raster). */
function BowlChopsticksIcon() {
  return (
    <View style={styles.bowlChopsticksRoot} accessibilityElementsHidden>
      <View style={styles.chopstickLeft} />
      <View style={styles.chopstickRight} />
      <View style={styles.bowlEllipse} />
    </View>
  );
}

export function TravelScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<TravelRoute>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [destinationQuery, setDestinationQuery] = useState(route.params?.destinationQuery?.trim() ?? '');
  const [gpsCity, setGpsCity] = useState<string>('');
  const [weatherCode, setWeatherCode] = useState<number>(0);
  const [lat, setLat] = useState<number>(50.0755);
  const [lng, setLng] = useState<number>(14.4378);
  const [loadingCtx, setLoadingCtx] = useState(true);
  const [cravingsModalOpen, setCravingsModalOpen] = useState(false);
  const [cravingsHits, setCravingsHits] = useState<readonly CravingsRadarHit[]>([]);
  type LocationGate = 'loading' | 'prompt' | 'ready';
  const [locationGate, setLocationGate] = useState<LocationGate>('loading');
  /** When true, {@link getTravelContext} runs; when false, Travel UI uses default coordinates only. */
  const [gpsOptIn, setGpsOptIn] = useState(false);

  useEffect(() => {
    void hasTravelLocationConsent().then((ok) => {
      setGpsOptIn(ok);
      setLocationGate(ok ? 'ready' : 'prompt');
    });
  }, []);

  const sosPulse = useSharedValue(1);
  useEffect(() => {
    sosPulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [sosPulse]);

  const sosAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sosPulse.value }],
  }));

  useEffect(() => {
    const q = route.params?.destinationQuery?.trim();
    if (q) setDestinationQuery(q);
  }, [route.params?.destinationQuery]);

  useEffect(() => {
    if (locationGate !== 'ready' || !gpsOptIn) return;
    let cancelled = false;
    void (async () => {
      setLoadingCtx(true);
      try {
        const ctx = await getTravelContext({ skipPersistCity: true });
        if (!cancelled) {
          setGpsCity(ctx.city);
          setWeatherCode(ctx.weatherCode);
          setLat(ctx.latitude);
          setLng(ctx.longitude);
          setCravingsHits(
            listVietnameseRestaurantsByProximity({ latitude: ctx.latitude, longitude: ctx.longitude })
          );
        }
      } finally {
        if (!cancelled) setLoadingCtx(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locationGate, gpsOptIn]);

  useEffect(() => {
    if (locationGate !== 'ready' || gpsOptIn) return;
    setLoadingCtx(false);
  }, [locationGate, gpsOptIn]);

  const displayCity = useMemo(() => {
    const q = destinationQuery.trim();
    if (q.length >= 2) return q;
    return gpsCity.length > 0 ? gpsCity : '…';
  }, [destinationQuery, gpsCity]);

  const weatherLine = useMemo(() => weatherLabelVi(weatherCode), [weatherCode]);
  const fxLine = useMemo(() => mockExchangeLineVi(user?.country), [user?.country]);

  const onChauffeurUltraPress = useCallback(() => {
    void runUltraMasterBookingWithAlerts('Chauffeur & Ride');
  }, []);

  const bentoItems = useMemo((): readonly BentoItem[] => {
    return [
      {
        id: 'chauffeur',
        title: 'Chauffeur & Ride',
        subtitle: 'Private executive rides',
        icon: 'car-sport-outline',
        size: 'large',
        onPress: onChauffeurUltraPress,
      },
      {
        id: 'fast_track',
        title: 'Airport Fast-Track',
        subtitle: 'Priority lane concierge',
        icon: 'star-outline',
        size: 'medium',
        onPress: () =>
          Alert.alert('Airport Fast-Track', 'Mở quyền ưu tiên check-in và fast-lane tại sân bay đối tác.'),
      },
      {
        id: 'tax_refund',
        title: 'Tax Refund',
        subtitle: 'Receipt auto-assist',
        icon: 'receipt-outline',
        size: 'medium',
        onPress: () =>
          Alert.alert('Tax Refund', 'Tải hóa đơn và theo dõi hoàn thuế mua sắm xuyên biên giới.'),
      },
      {
        id: 'secure_vault',
        title: 'Secure Vault',
        subtitle: 'Passport & docs',
        icon: 'shield-checkmark-outline',
        size: 'small',
        onPress: () =>
          Alert.alert('Secure Vault', 'Lưu trữ an toàn hộ chiếu và tài liệu du lịch trong hồ sơ mã hóa.'),
      },
      {
        id: 'telehealth',
        title: 'Telehealth',
        subtitle: '24/7 doctor support',
        icon: 'medkit-outline',
        size: 'small',
        onPress: () =>
          Alert.alert(
            'Telehealth',
            'Kết nối bác sĩ từ xa khi bạn cần tư vấn y tế trong lúc du lịch.'
          ),
      },
      {
        id: 'esim',
        title: 'Global eSIM',
        subtitle: 'Data packs worldwide',
        icon: 'hardware-chip-outline',
        size: 'small',
        onPress: () =>
          Alert.alert(
            'Global eSIM',
            'Kênh eSIM quốc tế đang mở Beta. Bạn sẽ kích hoạt gói dữ liệu theo điểm đến.'
          ),
      },
    ];
  }, [onChauffeurUltraPress]);

  const onOpenMerchant = useCallback(
    (m: KngTravelHospitalityMerchant) => {
      navigation.navigate('MerchantDetail', {
        merchantId: m.id,
        merchantName: m.name,
        industry: m.industryType,
      });
    },
    [navigation]
  );

  const onOpenCravingMerchant = useCallback(
    (hit: CravingsRadarHit) => {
      setCravingsModalOpen(false);
      navigation.navigate('MerchantDetail', {
        merchantId: hit.id,
        merchantName: hit.name,
        industry: 'Restaurant',
      });
    },
    [navigation]
  );

  if (locationGate === 'loading') {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <LinearGradient
          colors={[V7_PLATINUM.gradientA, V7_PLATINUM.gradientB, V7_PLATINUM.gradientC]}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]} edges={['top', 'left', 'right']}>
          <ActivityIndicator size="large" color={V7_PLATINUM.ink} />
        </SafeAreaView>
      </View>
    );
  }

  if (locationGate === 'prompt') {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <LinearGradient
          colors={[V7_PLATINUM.gradientA, V7_PLATINUM.gradientB, V7_PLATINUM.gradientC]}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
          <ScrollView contentContainerStyle={styles.consentScroll} keyboardShouldPersistTaps="handled">
            <Ionicons name="location-outline" size={48} color={V7_PLATINUM.ink} style={{ marginBottom: 8 }} />
            <Text style={styles.consentHeadline}>Vị trí &amp; du lịch (GDPR)</Text>
            <Text style={styles.consentCopy}>
              Để hiển thị thời tiết, thổ địa và gợi ý nhà hàng gần bạn, ứng dụng cần quyền truy cập vị trí. Bạn có thể từ chối
              và dùng giao diện hạn chế (tọa độ mặc định).
            </Text>
            <Pressable
              onPress={() => {
                void (async () => {
                  await setTravelLocationConsent(true);
                  setGpsOptIn(true);
                  setLocationGate('ready');
                })();
              }}
              style={({ pressed }) => [styles.consentPrimaryBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.consentPrimaryLabel}>Đồng ý — dùng vị trí cho Travel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void (async () => {
                  await setTravelLocationConsent(false);
                  setGpsOptIn(false);
                  setLocationGate('ready');
                })();
              }}
              style={({ pressed }) => [styles.consentSecondaryBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.consentSecondaryLabel}>Không chia sẻ — tiếp tục hạn chế</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[V7_PLATINUM.gradientA, V7_PLATINUM.gradientB, V7_PLATINUM.gradientC]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            ViGlobal Travel
          </Text>
        </View>

        <Reanimated.View
          style={[styles.sosFabWrap, { top: insets.top + 6 }, sosAnimatedStyle]}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={() => navigation.navigate('TravelSosHub')}
            style={({ pressed }) => [styles.sosFabPressable, pressed && { opacity: 0.92 }]}
            accessibilityRole="button"
            accessibilityLabel="SOS khẩn cấp"
          >
            <LinearGradient colors={SOS_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sosFab}>
              <Ionicons name="shield" size={22} color="#FFFFFF" style={styles.sosIconShadow} />
              <Text style={styles.sosFabLabel}>SOS</Text>
            </LinearGradient>
          </Pressable>
        </Reanimated.View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AcrylicPlatinumCard style={styles.heroCard}>
            <Text style={styles.cardKicker}>Bản đồ · Thổ địa</Text>
            <View style={styles.mapShell}>
              <LinearGradient
                colors={['#E4EBF2', '#D0DAE4', '#C5D0DC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.mapGrid} pointerEvents="none" />
              <View style={styles.mapPin}>
                <Ionicons name="location" size={28} color={V7_PLATINUM.ink} />
              </View>
              <View style={styles.mapBadge}>
                <Text style={styles.mapBadgeText}>Local Fixers</Text>
                <Text style={styles.mapBadgeSub}>
                  {displayCity} · {lat.toFixed(2)}°, {lng.toFixed(2)}°
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => navigation.navigate('LocalFixer')}
              style={({ pressed }) => [styles.heroCta, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel="Mở Thổ địa địa phương"
            >
              <Text style={styles.heroCtaText}>Khám phá Thổ địa</Text>
              <Ionicons name="arrow-forward" size={18} color={V7_PLATINUM.ink} />
            </Pressable>
          </AcrylicPlatinumCard>

          <AcrylicPlatinumCard style={styles.flightCard}>
            <Pressable
              onPress={() => navigation.navigate('TravelFlightSearch')}
              style={({ pressed }) => [styles.flightRow, pressed && { opacity: 0.92 }]}
              accessibilityRole="button"
              accessibilityLabel="Đặt vé máy bay"
            >
              <IconPop>
                <Ionicons name="airplane" size={26} color={V7_PLATINUM.ink} />
              </IconPop>
              <View style={styles.flightBody}>
                <Text style={styles.flightTitle}>Đặt vé máy bay</Text>
                <Text style={styles.flightSub}>So sánh · Duffel / Skyscanner (tích hợp sắp tới)</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="rgba(5, 11, 20, 0.45)" />
            </Pressable>
          </AcrylicPlatinumCard>

          <View style={styles.bottomRow}>
            <AcrylicPlatinumCard style={styles.halfTile} contentStyle={styles.halfTileInner}>
              <Pressable
                onPress={() => setCravingsModalOpen(true)}
                style={({ pressed }) => [styles.tilePress, pressed && { opacity: 0.9 }]}
                accessibilityRole="button"
                accessibilityLabel="Cravings Radar"
              >
                <IconPop>
                  <BowlChopsticksIcon />
                </IconPop>
                <Text style={styles.tileTitle}>Cravings Radar</Text>
                <Text style={styles.tileSub}>Quán ăn Việt</Text>
              </Pressable>
            </AcrylicPlatinumCard>
            <AcrylicPlatinumCard style={styles.halfTile} contentStyle={styles.halfTileInner}>
              <Pressable
                onPress={() =>
                  navigation.navigate('LiveInterpreter', { scenario: 'travel', guidedEntry: true })
                }
                style={({ pressed }) => [styles.tilePress, pressed && { opacity: 0.9 }]}
                accessibilityRole="button"
                accessibilityLabel="AI Translator"
              >
                <IconPop>
                  <Ionicons name="language" size={28} color={V7_PLATINUM.ink} />
                </IconPop>
                <Text style={styles.tileTitle}>AI Translator</Text>
                <Text style={styles.tileSub}>Voice & Vision</Text>
              </Pressable>
            </AcrylicPlatinumCard>
          </View>

          <View style={styles.bentoSection}>
            <Text style={styles.bentoTitle}>Ultra Master Features</Text>
            <View style={styles.bentoGrid}>
              {bentoItems.map((item) => (
                <AcrylicPlatinumCard
                  key={item.id}
                  style={[
                    styles.bentoCardShell,
                    item.size === 'large'
                      ? styles.bentoLarge
                      : item.size === 'medium'
                        ? styles.bentoMedium
                        : styles.bentoSmall,
                  ]}
                  contentStyle={styles.bentoCardInner}
                >
                  <TouchableOpacity
                    onPress={item.onPress}
                    activeOpacity={0.88}
                    style={styles.bentoPress}
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                  >
                    <IconPop>
                      <Ionicons name={item.icon} size={item.size === 'large' ? 26 : 22} color={V7_PLATINUM.ink} />
                    </IconPop>
                    <Text style={styles.bentoCardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.bentoCardSub} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  </TouchableOpacity>
                </AcrylicPlatinumCard>
              ))}
            </View>
          </View>

          <AcrylicPlatinumCard style={styles.metaCard}>
            <Text style={styles.metaLabel}>Điểm đến</Text>
            <TextInput
              value={destinationQuery}
              onChangeText={setDestinationQuery}
              placeholder="Paris, Praha, Berlin…"
              placeholderTextColor="rgba(5, 11, 20, 0.35)"
              style={styles.metaInput}
            />
            {loadingCtx ? (
              <View style={styles.metaLoading}>
                <ActivityIndicator color={V7_PLATINUM.ink} />
                <Text style={styles.metaLoadingText}>Đang đồng bộ vị trí…</Text>
              </View>
            ) : (
              <Text style={styles.metaText}>
                {displayCity} · {weatherLine} · {fxLine}
              </Text>
            )}
          </AcrylicPlatinumCard>

          <Text style={styles.sectionHeading}>Chỗ nghỉ cộng đồng</Text>
          {KN_TRAVEL_HOSPITALITY_MERCHANTS.map((m) => (
            <AcrylicPlatinumCard key={m.id} style={styles.listCard}>
              <Pressable
                onPress={() => onOpenMerchant(m)}
                style={({ pressed }) => [styles.listPress, pressed && { opacity: 0.92 }]}
              >
                <View style={styles.listTop}>
                  <Text style={styles.listName}>{m.name}</Text>
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={14} color="rgba(212, 175, 55, 0.95)" />
                    <Text style={styles.ratingText}>{m.rating.toFixed(2)}</Text>
                  </View>
                </View>
                <Text style={styles.listCity}>{m.cityLabel}</Text>
                <Text style={styles.listTagline}>{m.tagline}</Text>
                <View style={styles.industryPill}>
                  <Text style={styles.industryPillText}>{m.industryType}</Text>
                </View>
              </Pressable>
            </AcrylicPlatinumCard>
          ))}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={cravingsModalOpen} transparent animationType="fade" onRequestClose={() => setCravingsModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCravingsModalOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Cravings Radar</Text>
            <Text style={styles.modalSub}>Quán Việt gần bạn</Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {cravingsHits.length === 0 ? (
                <Text style={styles.modalEmpty}>Chưa có dữ liệu quán trong bán kính.</Text>
              ) : (
                cravingsHits.map((hit) => (
                  <Pressable
                    key={hit.id}
                    onPress={() => onOpenCravingMerchant(hit)}
                    style={({ pressed }) => [styles.cravingRow, pressed && { opacity: 0.88 }]}
                  >
                    <Text style={styles.cravingName}>{hit.name}</Text>
                    <Text style={styles.cravingMeta}>{hit.distanceKm.toFixed(1)} km</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
            <Pressable onPress={() => setCravingsModalOpen(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Đóng</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: V7_PLATINUM.gradientA },
  safe: { flex: 1 },
  headerRow: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingRight: 88,
    paddingTop: 4,
    paddingBottom: 8,
    minHeight: 48,
  },
  headerTitle: {
    textAlign: 'left',
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: V7_PLATINUM.ink,
    letterSpacing: -0.3,
  },
  sosFabWrap: {
    position: 'absolute',
    right: theme.spacing.md,
    zIndex: 20,
  },
  sosFabPressable: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#FF416C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
  },
  sosFab: {
    minWidth: 72,
    minHeight: 72,
    borderRadius: 22,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  sosIconShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      default: {},
    }),
  },
  sosFabLabel: {
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  scroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 8,
    paddingBottom: theme.spacing.xxl * 1.5,
  },
  heroCard: { marginBottom: theme.spacing.md },
  cardKicker: {
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(5, 11, 20, 0.55)',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  mapShell: {
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: V7_PLATINUM.ink,
  },
  mapPin: {
    position: 'absolute',
    top: '38%',
    left: '46%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      default: { elevation: 4 },
    }),
  },
  mapBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  mapBadgeText: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: V7_PLATINUM.ink,
  },
  mapBadgeSub: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: 'rgba(5, 11, 20, 0.55)',
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  heroCtaText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: V7_PLATINUM.ink,
  },
  flightCard: { marginBottom: theme.spacing.md },
  flightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flightBody: { flex: 1, minWidth: 0 },
  flightTitle: {
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: V7_PLATINUM.ink,
    marginBottom: 4,
  },
  flightSub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: 'rgba(5, 11, 20, 0.5)',
    lineHeight: 17,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  bentoSection: {
    marginBottom: theme.spacing.lg,
  },
  bentoTitle: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 1.1,
    color: 'rgba(5, 11, 20, 0.72)',
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
    marginLeft: 2,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  bentoCardShell: {
    marginBottom: 0,
  },
  bentoLarge: {
    width: '100%',
  },
  bentoMedium: {
    width: '48%',
  },
  bentoSmall: {
    width: '30%',
  },
  bentoCardInner: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    minHeight: 118,
  },
  bentoPress: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: 8,
    minHeight: 86,
  },
  bentoCardTitle: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    color: V7_PLATINUM.ink,
    lineHeight: 17,
  },
  bentoCardSub: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: 'rgba(5, 11, 20, 0.55)',
    lineHeight: 15,
  },
  halfTile: {
    flex: 1,
    minWidth: 0,
  },
  halfTileInner: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    minHeight: 132,
  },
  tilePress: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tileTitle: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: V7_PLATINUM.ink,
    textAlign: 'center',
  },
  tileSub: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: 'rgba(5, 11, 20, 0.48)',
    textAlign: 'center',
  },
  bowlChopsticksRoot: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bowlEllipse: {
    width: 32,
    height: 18,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: V7_PLATINUM.ink,
    backgroundColor: 'rgba(5, 11, 20, 0.04)',
    marginTop: 6,
  },
  chopstickLeft: {
    position: 'absolute',
    top: 4,
    left: 12,
    width: 3,
    height: 26,
    borderRadius: 1.5,
    backgroundColor: V7_PLATINUM.ink,
    transform: [{ rotate: '-28deg' }],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 2,
      },
      default: { elevation: 2 },
    }),
  },
  chopstickRight: {
    position: 'absolute',
    top: 2,
    right: 11,
    width: 3,
    height: 28,
    borderRadius: 1.5,
    backgroundColor: V7_PLATINUM.ink,
    transform: [{ rotate: '22deg' }],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 2,
      },
      default: { elevation: 2 },
    }),
  },
  iconPopWrap: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      default: {
        elevation: 3,
      },
    }),
  },
  metaCard: { marginBottom: theme.spacing.lg },
  metaLabel: {
    fontSize: 12,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(5, 11, 20, 0.5)',
    marginBottom: 8,
  },
  metaInput: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(5, 11, 20, 0.08)',
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: V7_PLATINUM.ink,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 10,
  },
  metaLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaLoadingText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: 'rgba(5, 11, 20, 0.6)',
  },
  metaText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.medium,
    color: 'rgba(5, 11, 20, 0.72)',
  },
  sectionHeading: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: V7_PLATINUM.ink,
    marginBottom: theme.spacing.sm,
  },
  listCard: { marginBottom: theme.spacing.sm },
  listPress: { gap: 6 },
  listTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  listName: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: V7_PLATINUM.ink,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  ratingText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: V7_PLATINUM.ink,
  },
  listCity: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: 'rgba(212, 175, 55, 0.95)',
  },
  listTagline: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FontFamily.regular,
    color: 'rgba(5, 11, 20, 0.62)',
  },
  industryPill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  industryPillText: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    color: 'rgba(5, 11, 20, 0.75)',
    letterSpacing: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 20, 0.35)',
    justifyContent: 'flex-end',
    padding: theme.spacing.lg,
  },
  modalCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    padding: theme.spacing.md,
    maxHeight: '72%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: V7_PLATINUM.ink,
  },
  modalSub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: 'rgba(5, 11, 20, 0.5)',
    marginBottom: 10,
  },
  modalScroll: { maxHeight: 360 },
  modalEmpty: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: 'rgba(5, 11, 20, 0.55)',
    paddingVertical: 12,
  },
  cravingRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(5, 11, 20, 0.08)',
  },
  cravingName: { fontSize: 15, fontFamily: FontFamily.bold, color: V7_PLATINUM.ink },
  cravingMeta: { fontSize: 12, fontFamily: FontFamily.semibold, color: 'rgba(5, 11, 20, 0.45)', marginTop: 4 },
  modalClose: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 14,
    backgroundColor: V7_PLATINUM.ink,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
  consentScroll: { padding: 24, gap: 12, paddingBottom: 48 },
  consentHeadline: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: V7_PLATINUM.ink,
    marginBottom: 4,
  },
  consentCopy: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: 'rgba(5,11,20,0.72)',
    lineHeight: 22,
    marginBottom: 8,
  },
  consentPrimaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: V7_PLATINUM.ink,
    alignItems: 'center',
    marginTop: 8,
  },
  consentPrimaryLabel: { color: '#FFFFFF', fontFamily: FontFamily.bold, fontSize: 15 },
  consentSecondaryBtn: { paddingVertical: 14, alignItems: 'center' },
  consentSecondaryLabel: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: V7_PLATINUM.ink,
    textDecorationLine: 'underline',
  },
});
