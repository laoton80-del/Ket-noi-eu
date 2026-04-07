import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
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
import { MicroHintBanner } from '../components/MicroHintBanner';
import { getPersonaDisplayName } from '../config/aiPrompts';
import { LAUNCH_PILOT_CONFIG, PILOT_LEONA_SERVICES_FALLBACK_PREFILL } from '../config/launchPilot';
import { hasSeenMicroHint, markMicroHintSeen } from '../onboarding/guidedOnboardingStorage';
import type { RootStackParamList } from '../navigation/routes';
import { FontFamily } from '../theme/typography';

type BusinessKind = 'nails' | 'pho' | 'service';
type Business = {
  id: string;
  name: string;
  kind: BusinessKind;
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
      distanceKm: 0.5,
      rating: 4.8,
      phone: '+420777111222',
      isForeign: true,
      lat: lat + 0.0041,
      lon: lon + 0.0014,
      angleDeg: 330,
    },
    {
      id: 'pho-1',
      name: 'Phở Việt Praha',
      kind: 'pho',
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
  return <Animated.View style={[styles.ring, style]} />;
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
      style={[
        styles.pinWrap,
        {
          left: `${50 + Math.cos(pinTheta) * pinRadius * 43}%`,
          top: `${50 + Math.sin(pinTheta) * pinRadius * 43}%`,
        },
        style,
      ]}
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
          setBusinesses(buildMockBusinesses(50.0755, 14.4378));
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setBusinesses(buildMockBusinesses(pos.coords.latitude, pos.coords.longitude));
      } catch {
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

  const openDirection = async () => {
    if (!selected) return;
    try {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lon}`;
      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Radar Discovery', 'Không mở được bản đồ lúc này. Bạn thử lại sau.');
      }
    } catch {
      Alert.alert('Radar Discovery', 'Kết nối bản đồ đang lỗi. Bạn thử lại sau ít phút.');
    }
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
      navigation.navigate('Tabs', {
        screen: 'LeTan',
        params: {
          proactiveQuestion: `Hỗ trợ đặt bàn tại ${selected.name} cho khách Việt tối nay.`,
          autoSimulate: true,
        },
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
      <>
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
        </View>
      ) : null}
      </>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07080B', paddingHorizontal: 16, paddingTop: 8 },
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
});
