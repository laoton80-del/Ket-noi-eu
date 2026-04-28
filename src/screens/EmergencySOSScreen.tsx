import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmergencyActionCard } from '../components/emergency/EmergencyActionCard';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/routes';
import { getEmergencyPhrasePack, type EmergencyType } from '../services/emergency/emergencyPhrasePacks';
import { resolveEmergencyLocation } from '../services/emergency/emergencyLocation';
import { appendUsageHistory } from '../services/history';
import { generateSpeech } from '../services/OpenAIService';
import { resolveCountryPack } from '../config/countryPacks';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const OPTIONS: { type: EmergencyType; title: string; subtitle: string }[] = [
  { type: 'ambulance', title: 'Ambulance', subtitle: 'Cấp cứu y tế' },
  { type: 'police', title: 'Police', subtitle: 'Cảnh sát' },
  { type: 'fire', title: 'Fire', subtitle: 'Cháy nổ' },
  { type: 'general112', title: '112', subtitle: 'Khẩn cấp chung' },
];

export function EmergencySOSScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [selected, setSelected] = useState<EmergencyType>('general112');
  const [locationLabel, setLocationLabel] = useState('Đang lấy vị trí...');
  const [locationLoading, setLocationLoading] = useState(true);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [showCannotSpeak, setShowCannotSpeak] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const emergencyNumber = resolveCountryPack(user?.country).emergencyConfig.primaryNumber;

  useEffect(() => {
    void appendUsageHistory({ type: 'emergency', status: 'success', note: 'sos_opened' });
    void (async () => {
      const res = await resolveEmergencyLocation();
      setLocationLabel(res.label);
      setLocationLoading(false);
    })();
  }, []);

  useEffect(() => {
    return () => {
      const s = soundRef.current;
      soundRef.current = null;
      if (s) void s.unloadAsync();
    };
  }, []);

  const pack = useMemo(
    () =>
      getEmergencyPhrasePack({
        type: selected,
        country: user?.country,
        locationLabel,
      }),
    [locationLabel, selected, user?.country]
  );

  const callEmergencyNow = async () => {
    try {
      await Linking.openURL(`tel:${emergencyNumber}`);
      void appendUsageHistory({ type: 'emergency', status: 'success', note: `sos_call_${emergencyNumber}_${selected}` });
    } catch {
      void appendUsageHistory({ type: 'emergency', status: 'failed', note: `sos_call_${emergencyNumber}_${selected}` });
      Alert.alert('Không thể gọi tự động', `Hãy quay số ${emergencyNumber} ngay trên điện thoại của bạn.`);
    }
  };

  const onPlayVoice = async () => {
    setTtsLoading(true);
    try {
      const uri = await generateSpeech(pack.localText, 'nova');
      const old = soundRef.current;
      soundRef.current = null;
      if (old) await old.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, volume: 1 });
      soundRef.current = sound;
    } catch {
      Alert.alert('Không phát được giọng đọc', 'Vui lòng đọc trực tiếp câu ở màn hình hoặc bấm gọi 112 ngay.');
    } finally {
      setTtsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.sos}>SOS {emergencyNumber}</Text>
          <Text style={styles.headerSub}>Ưu tiên gọi khẩn cấp ngay — không cần qua tổng đài trong app.</Text>
        </View>

        <View style={styles.grid}>
          {OPTIONS.map((o) => (
            <EmergencyActionCard
              key={o.type}
              type={o.type}
              title={o.title}
              subtitle={o.subtitle}
              active={selected === o.type}
              onPress={setSelected}
            />
          ))}
        </View>

        <Pressable style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.8 }]} onPress={() => void callEmergencyNow()}>
          <Text style={styles.callText}>GỌI {emergencyNumber} NGAY</Text>
        </Pressable>

        <View style={styles.locBox}>
          <Text style={styles.locTitle}>Vị trí hiện tại</Text>
          {locationLoading ? <ActivityIndicator color={theme.colors.RouteError} /> : <Text style={styles.locText}>{locationLabel}</Text>}
        </View>

        <View style={styles.phraseBox}>
          <Text style={styles.localLabel}>Câu khẩn cấp (ngôn ngữ bản địa)</Text>
          <Text style={styles.localText}>{pack.localText}</Text>
          <Text style={styles.vnLabel}>Tiếng Việt</Text>
          <Text style={styles.vnText}>{pack.vietnameseText}</Text>
        </View>

        <View style={styles.row}>
          <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]} onPress={() => void onPlayVoice()}>
            <Text style={styles.secondaryText}>{ttsLoading ? 'Đang phát...' : 'Phát giọng nói'}</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]} onPress={() => setShowCannotSpeak((v) => !v)}>
            <Text style={styles.secondaryText}>{showCannotSpeak ? 'Ẩn chế độ' : 'Tôi không thể nói'}</Text>
          </Pressable>
        </View>

        {showCannotSpeak ? (
          <View style={styles.cannotSpeakBox}>
            <Text style={styles.cannotSpeakText}>{pack.cannotSpeakText}</Text>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.langSupportBtn, pressed && { opacity: 0.8 }]}
          onPress={() => navigation.navigate('LiveInterpreter', { guidedEntry: true, scenario: 'general' })}
        >
          <Text style={styles.langSupportText}>Hỗ trợ ngôn ngữ</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.DeepInkNavy },
  container: { flex: 1, backgroundColor: theme.colors.DeepInkNavy },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
  header: { marginBottom: 4 },
  sos: { color: theme.colors.RouteError, ...theme.typeScale.h1, fontFamily: FontFamily.bold },
  headerSub: { color: theme.colors.text.secondary, ...theme.typeScale.body, fontFamily: FontFamily.regular, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  callBtn: {
    marginTop: 4,
    backgroundColor: theme.colors.RouteError,
    borderRadius: 14,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callText: { color: theme.colors.CeolWhite, ...theme.typeScale.h1, fontFamily: FontFamily.bold },
  locBox: { backgroundColor: theme.colors.GraphiteBlue, borderRadius: 12, padding: 12, minHeight: 70 },
  locTitle: { color: theme.colors.CeolWhite, ...theme.typeScale.caption, fontFamily: FontFamily.semibold, marginBottom: 6 },
  locText: { color: theme.colors.text.secondary, ...theme.typeScale.body, fontFamily: FontFamily.regular },
  phraseBox: { backgroundColor: theme.colors.GraphiteBlue, borderRadius: 12, padding: 12 },
  localLabel: { color: theme.colors.RouteError, ...theme.typeScale.caption, fontFamily: FontFamily.semibold, marginBottom: 6 },
  localText: { color: theme.colors.CeolWhite, ...theme.typeScale.h2, fontFamily: FontFamily.bold },
  vnLabel: { color: theme.colors.SignalBlue, ...theme.typeScale.caption, fontFamily: FontFamily.semibold, marginTop: 12, marginBottom: 6 },
  vnText: { color: theme.colors.text.secondary, ...theme.typeScale.body, fontFamily: FontFamily.regular },
  row: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: theme.colors.executive.panelMuted,
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: theme.colors.CeolWhite, ...theme.typeScale.body, fontFamily: FontFamily.bold },
  cannotSpeakBox: { backgroundColor: theme.colors.glass.shadow, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: theme.colors.RouteError },
  cannotSpeakText: { color: theme.colors.CeolWhite, ...theme.typeScale.h1, fontFamily: FontFamily.bold, textAlign: 'center' },
  langSupportBtn: {
    backgroundColor: theme.colors.SignalBlue,
    borderRadius: 12,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langSupportText: { color: theme.colors.CeolWhite, ...theme.typeScale.body, fontFamily: FontFamily.bold },
});
