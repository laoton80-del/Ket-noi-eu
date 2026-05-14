import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BlurView } from 'expo-blur';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppMap, type AppMapMarker } from '../components/Map/AppMap';
import { MicroHintBanner } from '../components/MicroHintBanner';
import { getPersonaDisplayName } from '../config/aiPrompts';
import { B2C_GLOBAL_VIP_MONTHLY_USD, PRICING_BASELINE_CURRENCY } from '../config/pricingConfig';
import { LAUNCH_PILOT_CONFIG, PILOT_LEONA_SERVICES_FALLBACK_PREFILL } from '../config/launchPilot';
import { hasSeenMicroHint, markMicroHintSeen } from '../onboarding/guidedOnboardingStorage';
import type { RootStackParamList } from '../navigation/routes';
import { FontFamily } from '../theme/typography';
import { applyWebStyles } from '../utils/applyWebStyles';
import { formatCurrency } from '../utils/currencyFormatter';
import { openDirectionsExternally } from '../utils/mapExternalLinks';

type BusinessKind = 'nails' | 'pho' | 'service';
type Business = {
  id: string;
  name: string;
  kind: BusinessKind;
  /** Map marker category for Mapbox PointAnnotation. */
  mapPlaceKind: AppMapMarker['kind'];
  distanceKm: number;
  rating: number;
  phone: string;
  isForeign: boolean;
  lat: number;
  lon: number;
  angleDeg: number;
};

const RADAR_RANGE_KM = 2.2;
const RING_OFFSETS = [0, 0.33, 0.66];

const kindIcon: Record<BusinessKind, keyof typeof Ionicons.glyphMap> = {
  nails: 'cut',
  pho: 'restaurant',
  service: 'briefcase',
};

function buildMockBusinesses(lat: number, lon: number): Business[] {
  return [
    {
      id: 'nails-1',
      name: 'Hanoi Beauty Nails',
      kind: 'nails',
      mapPlaceKind: 'business',
      distanceKm: 0.5,
      rating: 4.8,
      phone: '+420777111222',
      isForeign: true,
      lat: lat + 0.0041,
      lon: lon + 0.0014,
      angleDeg: 330,
    },
    {
      id: 'homestay-1',
      name: 'Old Quarter Homestay',
      kind: 'service',
      mapPlaceKind: 'homestay',
      distanceKm: 0.9,
      rating: 4.7,
      phone: '+420777888999',
      isForeign: true,
      lat: lat - 0.0035,
      lon: lon + 0.0051,
      angleDeg: 60,
    },
    {
      id: 'tour-1',
      name: 'Praha Walking Tour · Việt',
      kind: 'service',
      mapPlaceKind: 'tour',
      distanceKm: 1.4,
      rating: 4.9,
      phone: '+420777000111',
      isForeign: true,
      lat: lat + 0.008,
      lon: lon - 0.0042,
      angleDeg: 180,
    },
    {
      id: 'pho-1',
      name: 'Phở Việt Praha',
      kind: 'pho',
      mapPlaceKind: 'business',
      distanceKm: 1.2,
      rating: 4.9,
      phone: '+420777333444',
      isForeign: true,
      lat: lat - 0.0062,
      lon: lon + 0.0084,
      angleDeg: 40,
    },
    {
      id: 'service-1',
      name: 'Kế toán Minh Anh',
      kind: 'service',
      mapPlaceKind: 'business',
      distanceKm: 2.0,
      rating: 5.0,
      phone: '+420777555666',
      isForeign: true,
      lat: lat + 0.0142,
      lon: lon - 0.0068,
      angleDeg: 210,
    },
  ];
}

function Ring({ progress, offset }: { progress: SharedValue<number>; offset: number }) {
  const style = useAnimatedStyle(() => {
    const ring = (progress.value + offset) % 1;
    return {
      opacity: interpolate(ring, [0, 0.7, 1], [0.5, 0.22, 0]),
      transform: [{ scale: interpolate(ring, [0, 1], [0.2, 1.02]) }],
    };
  });
  return <Animated.View style={StyleSheet.flatten([styles.ring, style])} />;
}

function RadarPin({
  business,
  progress,
  onPress,
  onPing,
}: {
  business: Business;
  progress: SharedValue<number>;
  onPress: () => void;
  onPing: (id: string) => void;
}) {
  const pinRadius = Math.min(business.distanceKm / RADAR_RANGE_KM, 1);
  const pinTheta = (business.angleDeg * Math.PI) / 180;

  useAnimatedReaction(
    () => progress.value,
    (cur) => {
      const isHit = RING_OFFSETS.some((offset) => {
        const ring = (cur + offset) % 1;
        return Math.abs(ring - pinRadius) < 0.012;
      });
      if (isHit) {
        runOnJS(onPing)(business.id);
      }
    },
    [business.id, onPing, pinRadius]
  );

  const style = useAnimatedStyle(() => {
    const hit = RING_OFFSETS.some((offset) => {
      const ring = (progress.value + offset) % 1;
      return Math.abs(ring - pinRadius) < 0.04;
    });
    return {
      opacity: hit ? 1 : 0.78,
      transform: [{ scale: hit ? 1.12 : 1 }],
    };
  });

  return (
    <Animated.View
      style={StyleSheet.flatten([
        styles.pinWrap,
        {
          left: `${50 + Math.cos(pinTheta) * pinRadius * 43}%`,
          top: `${50 + Math.sin(pinTheta) * pinRadius * 43}%`,
        },
        style,
      ])}
    >
      <Pressable onPress={onPress} style={({ pressed }) => [styles.pin, pressed && { opacity: 0.84 }]}>
        <Ionicons name={kindIcon[business.kind]} size={16} color="#FFE8BE" />
      </Pressable>
    </Animated.View>
  );
}

export function RadarDiscoveryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const radarOn = LAUNCH_PILOT_CONFIG.enableRadarSurface;
  const inboundPersonaName = getPersonaDisplayName('loan');

  useLayoutEffect(() => {
    if (radarOn) return;
    navigation.replace('LeonaCall', {
      prefillRequest: PILOT_LEONA_SERVICES_FALLBACK_PREFILL,
      autoSubmit: false,
    });
  }, [navigation, radarOn]);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [mapAnchor, setMapAnchor] = useState({ lat: 50.0755, lon: 14.4378 });
  const [selected, setSelected] = useState<Business | null>(null);
  const [showRadarMicro, setShowRadarMicro] = useState(false);
  const progress = useSharedValue(0);
  const pingRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!radarOn) return;
    void (async () => {
      if (await hasSeenMicroHint('radar')) return;
      setShowRadarMicro(true);
    })();
  }, [radarOn]);

  useEffect(() => {
    if (!radarOn) return;
    progress.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.linear }), -1, false);
  }, [progress, radarOn]);

  useEffect(() => {
    if (!radarOn) {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setMapAnchor({ lat: 50.0755, lon: 14.4378 });
          setBusinesses(buildMockBusinesses(50.0755, 14.4378));
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const la = pos.coords.latitude;
        const lo = pos.coords.longitude;
        setMapAnchor({ lat: la, lon: lo });
        setBusinesses(buildMockBusinesses(la, lo));
      } catch {
        setMapAnchor({ lat: 50.0755, lon: 14.4378 });
        setBusinesses(buildMockBusinesses(50.0755, 14.4378));
      } finally {
        setLoading(false);
      }
    })();
  }, [radarOn]);

  const onPing = (id: string) => {
    const now = Date.now();
    if (now - (pingRef.current[id] ?? 0) < 900) return;
    pingRef.current[id] = now;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const distanceLabel = useMemo(
    () =>
      selected
        ? selected.distanceKm < 1
          ? `${Math.round(selected.distanceKm * 1000)}m`
          : `${selected.distanceKm.toFixed(1)}km`
        : '',
    [selected]
  );

  const mapMarkers = useMemo(
    (): AppMapMarker[] =>
      businesses.map((b) => ({
        id: b.id,
        latitude: b.lat,
        longitude: b.lon,
        kind: b.mapPlaceKind,
        title: b.name,
      })),
    [businesses]
  );

  const openDirection = async () => {
    if (!selected) return;
    await openDirectionsExternally(selected.lat, selected.lon, selected.name);
  };

  const callNow = async () => {
    if (!selected) return;
    try {
      await Linking.openURL(`tel:${selected.phone}`);
    } catch {
      Alert.alert('Radar Discovery', 'Không thể mở cuộc gọi. Vui lòng kiểm tra tín hiệu và thử lại.');
    }
  };

  const openAssistedCall = () => {
    if (!selected) return;
    if (selected.kind === 'pho') {
      navigation.navigate('LeonaCall', {
        prefillRequest: `Hỗ trợ đặt bàn tại ${selected.name} cho khách Việt tối nay.`,
        autoSubmit: false,
      });
      return;
    }
    const prefill =
      selected.kind === 'nails'
        ? `Gọi hỗ trợ đặt lịch nails với ${selected.name}, ưu tiên giờ trống gần nhất.`
        : `Gọi hỗ trợ tư vấn dịch vụ với ${selected.name} và xác nhận lịch hẹn.`;
    navigation.navigate('LeonaCall', {
      prefillRequest: prefill,
      autoSubmit: true,
    });
  };

  if (!radarOn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pilotHoldWrap}>
          <ActivityIndicator color="#FFE3B0" />
          <Text style={styles.subtitle}>Đang chuyển sang Leona…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <MicroHintBanner
        visible={showRadarMicro}
        text="Chấm vào chấm trên radar để xem chi tiết — có thể gọi hoặc nhờ Lễ tân / Leona đặt hộ."
        onDismiss={() => {
          setShowRadarMicro(false);
          void markMicroHintSeen('radar');
        }}
      />
      <Text style={styles.title}>Radar Discovery</Text>
      <Text style={styles.subtitle}>Quét tiện ích Việt quanh bạn theo thời gian thực.</Text>
      <Text style={styles.preview}>Dữ liệu đang ở chế độ xem trước để thử trải nghiệm.</Text>

      <View style={styles.mapBlock}>
        <AppMap
          latitude={mapAnchor.lat}
          longitude={mapAnchor.lon}
          zoomLevel={13}
          markers={mapMarkers}
          style={styles.mapBox}
        />
      </View>

      <View style={styles.radarWrap}>
        <View style={styles.crosshair} />
        <View style={[styles.crosshair, styles.crosshairV]} />
        {RING_OFFSETS.map((offset) => (
          <Ring key={offset} progress={progress} offset={offset} />
        ))}
        <View style={styles.centerDot}>
          <Ionicons name="locate" size={16} color="#C8FFCF" />
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color="#FFE3B0" />
          </View>
        ) : (
          businesses.map((biz) => (
            <RadarPin
              key={biz.id}
              business={biz}
              progress={progress}
              onPress={() => setSelected(biz)}
              onPing={onPing}
            />
          ))
        )}
      </View>

      {selected ? (
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetName}>{selected.name}</Text>
          <Text style={styles.sheetMeta}>
            {distanceLabel} • ⭐ {selected.rating.toFixed(1)}
          </Text>
          <View style={styles.btnRow}>
            <Pressable onPress={() => void openDirection()} style={({ pressed }) => [styles.sheetBtn, pressed && { opacity: 0.84 }]}>
              <Text style={styles.sheetBtnText}>Chỉ đường</Text>
            </Pressable>
            <Pressable onPress={() => void callNow()} style={({ pressed }) => [styles.sheetBtn, pressed && { opacity: 0.84 }]}>
              <Text style={styles.sheetBtnText}>Gọi ngay</Text>
            </Pressable>
          </View>
          {selected.isForeign ? (
            <Pressable
              onPress={openAssistedCall}
              style={({ pressed }) => [styles.aiBtn, pressed && { opacity: 0.84 }]}
            >
              <Text style={styles.aiBtnText}>Gọi qua {inboundPersonaName}</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() =>
              navigation.navigate('MerchantDetail', {
                merchantId: selected.id,
                merchantName: selected.name,
                industry: selected.kind,
              })
            }
            style={({ pressed }) => [styles.merchantDetailBtn, pressed && { opacity: 0.86 }]}
            className={applyWebStyles('kn-neon-b2b')}
            accessibilityRole="button"
            accessibilityLabel="Mở trang cửa hàng và Lễ tân AI"
          >
            <Text style={styles.merchantDetailBtnText}>Lễ tân AI — đặt lịch / đặt hàng</Text>
            <Ionicons name="chevron-forward" size={18} color="#0B1628" />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.socialHeaderRow}>
        <Text style={styles.socialSectionTitle}>Ai đã xem bạn</Text>
        <Ionicons name="lock-closed" size={18} color="rgba(251, 211, 141, 0.95)" accessibilityLabel="Đã khóa" />
      </View>
      <Text style={styles.socialSectionSub}>Radar xã hội — chỉ dành cho thành viên VIP.</Text>
      <View style={styles.whoViewedOuter} className={applyWebStyles('kn-glass')}>
        <View style={styles.whoViewedShell}>
          <View style={styles.whoViewedFake} pointerEvents="none">
            <View style={styles.fakeRow}>
              <View style={[styles.fakeAvatar, { backgroundColor: 'rgba(200,160,255,0.35)' }]} />
              <View style={styles.fakeBarCol}>
                <View style={styles.fakeBarWide} />
                <View style={styles.fakeBarNarrow} />
              </View>
            </View>
            <View style={styles.fakeRow}>
              <View style={[styles.fakeAvatar, { backgroundColor: 'rgba(120,200,255,0.35)' }]} />
              <View style={styles.fakeBarCol}>
                <View style={styles.fakeBarWide} />
                <View style={styles.fakeBarNarrow} />
              </View>
            </View>
            <View style={styles.fakeRow}>
              <View style={[styles.fakeAvatar, { backgroundColor: 'rgba(255,200,140,0.4)' }]} />
              <View style={styles.fakeBarCol}>
                <View style={styles.fakeBarWide} />
                <View style={styles.fakeBarNarrow} />
              </View>
            </View>
          </View>
          {Platform.OS === 'web' ? (
            <View style={[styles.glassBlur, styles.glassBlurWeb]} />
          ) : (
            <BlurView intensity={72} tint="dark" style={styles.glassBlur} />
          )}
          <View style={styles.glassFrostLayer} pointerEvents="none" />
          <View style={styles.whoViewedLockLayer} pointerEvents="box-none">
            <View style={styles.lockIconRing}>
              <Ionicons name="lock-closed" size={28} color="#FBD38D" />
            </View>
            <Text style={styles.vipPitch}>
              Nâng cấp Global VIP ({formatCurrency(B2C_GLOBAL_VIP_MONTHLY_USD, PRICING_BASELINE_CURRENCY)}/tháng) để xem ai đang quan tâm bạn và nhắn tin không giới hạn.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('Wallet')}
              style={({ pressed }) => [styles.vipCta, pressed && { opacity: 0.88 }]}
              accessibilityRole="button"
              accessibilityLabel="Nâng cấp Global VIP"
            >
              <Ionicons name="sparkles" size={18} color="#0A1628" />
              <Text style={styles.vipCtaText}>Nâng cấp Global VIP</Text>
            </Pressable>
          </View>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07080B', paddingHorizontal: 16, paddingTop: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  pilotHoldWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  title: { fontSize: 28, color: '#F7E6BF', fontFamily: FontFamily.extrabold },
  subtitle: {
    marginTop: 4,
    marginBottom: 10,
    color: 'rgba(235,220,188,0.78)',
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  preview: {
    marginTop: -2,
    marginBottom: 10,
    color: '#FBD38D',
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  mapBlock: {
    width: '100%',
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.28)',
  },
  mapBox: {
    width: '100%',
    height: 220,
  },
  radarWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: 'rgba(212,175,55,0.42)',
    overflow: 'hidden',
    alignSelf: 'center',
    backgroundColor: 'rgba(7,18,24,0.82)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  ring: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(100,255,170,0.66)',
  },
  crosshair: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: 'rgba(160,220,190,0.2)',
  },
  crosshairV: {
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    right: undefined,
    height: undefined,
  },
  centerDot: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -14,
    marginTop: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(87,230,135,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(120,255,178,0.74)',
  },
  pinWrap: {
    position: 'absolute',
    marginLeft: -18,
    marginTop: -18,
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(149,45,45,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,211,156,0.8)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  loaderWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.42)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 14,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,235,188,0.4)',
    marginBottom: 10,
  },
  sheetName: { color: '#FFF0CF', fontSize: 20, fontFamily: FontFamily.extrabold },
  sheetMeta: { marginTop: 4, color: '#F6DCAB', fontSize: 13, fontFamily: FontFamily.medium },
  btnRow: { marginTop: 12, flexDirection: 'row', gap: 8 },
  sheetBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40,30,22,0.72)',
  },
  sheetBtnText: { color: '#FFECC8', fontFamily: FontFamily.bold },
  aiBtn: {
    marginTop: 10,
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A63737',
    borderWidth: 1,
    borderColor: 'rgba(255,218,172,0.6)',
  },
  aiBtnText: { color: '#FFEBD2', fontFamily: FontFamily.bold },
  merchantDetailBtn: {
    marginTop: 10,
    minHeight: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    backgroundColor: '#D4AF37',
    borderWidth: 1.5,
    borderColor: 'rgba(11, 22, 40, 0.35)',
    shadowColor: '#FFD700',
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  merchantDetailBtnText: { color: '#0B1628', fontFamily: FontFamily.extrabold, fontSize: 14 },
  socialHeaderRow: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  socialSectionTitle: {
    fontSize: 18,
    color: '#F7E6BF',
    fontFamily: FontFamily.extrabold,
    flex: 1,
  },
  socialSectionSub: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 12,
    color: 'rgba(235,220,188,0.65)',
    fontFamily: FontFamily.regular,
  },
  whoViewedOuter: {
    borderRadius: 22,
    padding: 1.5,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 89, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  whoViewedShell: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.28)',
    minHeight: 200,
  },
  whoViewedFake: {
    padding: 14,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  fakeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fakeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  fakeBarCol: {
    flex: 1,
    gap: 8,
  },
  fakeBarWide: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    width: '72%',
  },
  fakeBarNarrow: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    width: '40%',
  },
  glassBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  glassBlurWeb: {
    backgroundColor: 'rgba(12, 14, 22, 0.78)',
  },
  glassFrostLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  whoViewedLockLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  lockIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(251,211,141,0.45)',
  },
  vipPitch: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    color: '#FFF5E4',
    fontFamily: FontFamily.semibold,
  },
  vipCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FBD38D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  vipCtaText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#0A1628',
  },
});
