import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../../navigation/routes';
import {
  getSosQuickActionScript,
  resolveNearestVietnameseMission,
  synthesizeSosQuickActionDualLanguageAudio,
  type SosQuickActionKind,
} from '../../../services/travel/EmergencySosService';
import { getTravelContext } from '../../../services/context/UserContextService';
import { theme } from '../../../theme/theme';
import { FontFamily } from '../../../theme/typography';
import { applyWebStyles } from '../../../utils/applyWebStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function TravelSosHubScreen() {
  const navigation = useNavigation<Nav>();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [loading, setLoading] = useState(true);
  const [lat, setLat] = useState(50.0755);
  const [lng, setLng] = useState(14.4378);
  const [countryCode, setCountryCode] = useState('CZ');
  const [cityLabel, setCityLabel] = useState('');
  const [ttsKind, setTtsKind] = useState<SosQuickActionKind | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const ctx = await getTravelContext({ skipPersistCity: true });
        if (!cancelled) {
          setLat(ctx.latitude);
          setLng(ctx.longitude);
          setCountryCode(ctx.countryCode);
          setCityLabel(ctx.city);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      const s = soundRef.current;
      soundRef.current = null;
      if (s) void s.unloadAsync();
    };
  }, []);

  const nearest = useMemo(() => resolveNearestVietnameseMission(lat, lng), [lat, lng]);

  const openMapsMission = useCallback(() => {
    const q = encodeURIComponent(nearest.mission.mapsQueryHint);
    void Linking.openURL(`https://www.openstreetmap.org/search?query=${q}`);
  }, [nearest.mission.mapsQueryHint]);

  const playQuickAction = useCallback(
    async (kind: SosQuickActionKind) => {
      setTtsKind(kind);
      try {
        const uri = await synthesizeSosQuickActionDualLanguageAudio(kind, countryCode, 'nova');
        const old = soundRef.current;
        soundRef.current = null;
        if (old) await old.unloadAsync();
        const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, volume: 1 });
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((st) => {
          if (st.isLoaded && st.didJustFinish) {
            sound.setOnPlaybackStatusUpdate(null);
            setTtsKind(null);
          }
        });
      } catch {
        setTtsKind(null);
        Alert.alert('TTS', 'Không phát được âm thanh. Kiểm tra mạng hoặc thử lại.');
      }
    },
    [countryCode]
  );

  const medicalScript = useMemo(() => getSosQuickActionScript('medical', countryCode), [countryCode]);
  const policeScript = useMemo(() => getSosQuickActionScript('police', countryCode), [countryCode]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#1a0508', '#2a0a10', '#0a1628']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="chevron-back" size={24} color="#FFF5F5" />
          </Pressable>
          <Text style={styles.topTitle}>SOS · An toàn Kiều bào</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#FF6B6B" />
              <Text style={styles.loadingText}>Đang định vị GPS an toàn…</Text>
            </View>
          ) : (
            <Text style={styles.gpsLine}>
              📍 {cityLabel.length > 0 ? cityLabel : 'Vị trí'} · Gần nhất tính theo đường chim bay (demo)
            </Text>
          )}

          <Pressable
            onPress={() => navigation.navigate('EmergencySOS')}
            style={({ pressed }) => [styles.call112, pressed && { opacity: 0.92 }]}
            className={applyWebStyles('kn-neon-sos')}
            accessibilityRole="button"
            accessibilityLabel="Mở màn hình gọi khẩn cấp 112"
          >
            <Ionicons name="call" size={22} color="#fff" />
            <Text style={styles.call112Text}>Gọi khẩn cấp địa phương (112 / 911)</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Pressable>

          <View style={styles.card} className={applyWebStyles('kn-glass')}>
            <Text style={styles.cardKicker}>Đại sứ quán / Lãnh sự gần nhất</Text>
            <Text style={styles.cardTitle}>{nearest.mission.nameVi}</Text>
            <Text style={styles.cardMeta}>
              {nearest.mission.cityLabel} · ~{nearest.distanceKm.toFixed(0)} km
            </Text>
            <Text style={styles.phone}>{nearest.mission.phoneDisplay}</Text>
            <View style={styles.rowBtns}>
              <Pressable
                onPress={() => void Linking.openURL(`tel:${nearest.mission.phoneDisplay.replace(/\s/g, '')}`)}
                style={({ pressed }) => [styles.miniBtn, pressed && { opacity: 0.9 }]}
              >
                <Ionicons name="call-outline" size={18} color="#E8D5A3" />
                <Text style={styles.miniBtnText}>Gọi DSQ/LSQ</Text>
              </Pressable>
              <Pressable
                onPress={openMapsMission}
                style={({ pressed }) => [styles.miniBtn, pressed && { opacity: 0.9 }]}
              >
                <Ionicons name="map-outline" size={18} color="#E8D5A3" />
                <Text style={styles.miniBtnText}>Chỉ đường</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.section}>Giọng đọc AI — câu sẵn cho y tế & cảnh sát</Text>
          <Text style={styles.sectionHint}>
            Một clip gồm tiếng địa phương + tiếng Việt (OpenAI TTS). Giữ máy gần tai nhân viên.
          </Text>

          <Pressable
            onPress={() => void playQuickAction('medical')}
            disabled={ttsKind !== null}
            style={({ pressed }) => [
              styles.aiTile,
              styles.aiMedical,
              pressed && { opacity: 0.92 },
              ttsKind !== null && { opacity: 0.55 },
            ]}
            className={applyWebStyles('kn-glass')}
          >
            <Ionicons name="medical" size={26} color="#7CFFB2" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.aiTileTitle}>Medical · Cấp cứu</Text>
              <Text style={styles.aiTileBody} numberOfLines={3}>
                {medicalScript.ttsPrimaryLocalLanguage}
              </Text>
              <Text style={styles.aiVi}>{medicalScript.vietnameseCompanionLine}</Text>
            </View>
            {ttsKind === 'medical' ? <ActivityIndicator color="#7CFFB2" /> : <Ionicons name="volume-high" size={22} color="#7CFFB2" />}
          </Pressable>

          <Pressable
            onPress={() => void playQuickAction('police')}
            disabled={ttsKind !== null}
            style={({ pressed }) => [
              styles.aiTile,
              styles.aiPolice,
              pressed && { opacity: 0.92 },
              ttsKind !== null && { opacity: 0.55 },
            ]}
            className={applyWebStyles('kn-glass')}
          >
            <Ionicons name="shield" size={26} color="#9EC5FF" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.aiTileTitle}>Police · Cảnh sát</Text>
              <Text style={styles.aiTileBody} numberOfLines={3}>
                {policeScript.ttsPrimaryLocalLanguage}
              </Text>
              <Text style={styles.aiVi}>{policeScript.vietnameseCompanionLine}</Text>
            </View>
            {ttsKind === 'police' ? <ActivityIndicator color="#9EC5FF" /> : <Ionicons name="volume-high" size={22} color="#9EC5FF" />}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#140608' },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.extrabold,
    fontSize: 16,
    color: '#FFF0F0',
  },
  scroll: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  loadingText: { color: 'rgba(255,240,240,0.85)', fontFamily: FontFamily.medium },
  gpsLine: {
    fontSize: 13,
    color: 'rgba(255,230,230,0.88)',
    fontFamily: FontFamily.medium,
    marginBottom: theme.spacing.md,
  },
  call112: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: 'rgba(180, 20, 20, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,120,120,0.5)',
  },
  call112Text: {
    flex: 1,
    color: '#fff',
    fontFamily: FontFamily.extrabold,
    fontSize: 15,
  },
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 213, 163, 0.35)',
    backgroundColor: 'rgba(12, 20, 36, 0.45)',
  },
  cardKicker: {
    fontSize: 11,
    letterSpacing: 0.8,
    color: 'rgba(248,244,236,0.65)',
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 17,
    color: '#FAF6EE',
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  cardMeta: { fontSize: 13, color: 'rgba(232, 213, 163, 0.95)', fontFamily: FontFamily.semibold, marginBottom: 8 },
  phone: { fontSize: 15, color: '#7CFFB2', fontFamily: FontFamily.extrabold, marginBottom: 12 },
  rowBtns: { flexDirection: 'row', gap: 10 },
  miniBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(232, 213, 163, 0.35)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  miniBtnText: { color: '#E8D5A3', fontFamily: FontFamily.bold, fontSize: 13 },
  section: {
    fontSize: 14,
    color: '#FFF4E8',
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(248,244,236,0.72)',
    fontFamily: FontFamily.regular,
    marginBottom: theme.spacing.md,
  },
  aiTile: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  aiMedical: { backgroundColor: 'rgba(20, 60, 40, 0.35)' },
  aiPolice: { backgroundColor: 'rgba(30, 50, 90, 0.35)' },
  aiTileTitle: { fontSize: 15, color: '#FFF8E8', fontFamily: FontFamily.extrabold, marginBottom: 6 },
  aiTileBody: { fontSize: 12, lineHeight: 17, color: 'rgba(248,244,236,0.88)', fontFamily: FontFamily.regular },
  aiVi: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255, 200, 160, 0.95)',
    fontFamily: FontFamily.semibold,
  },
});
