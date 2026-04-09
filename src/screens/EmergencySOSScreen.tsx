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

        <Pressable style={styles.callBtn} onPress={() => void callEmergencyNow()}>
          <Text style={styles.callText}>GỌI {emergencyNumber} NGAY</Text>
        </Pressable>

        <View style={styles.locBox}>
          <Text style={styles.locTitle}>Vị trí hiện tại</Text>
          {locationLoading ? <ActivityIndicator color="#EF4444" /> : <Text style={styles.locText}>{locationLabel}</Text>}
        </View>

        <View style={styles.phraseBox}>
          <Text style={styles.localLabel}>Câu khẩn cấp (ngôn ngữ bản địa)</Text>
          <Text style={styles.localText}>{pack.localText}</Text>
          <Text style={styles.vnLabel}>Tiếng Việt</Text>
          <Text style={styles.vnText}>{pack.vietnameseText}</Text>
        </View>

        <View style={styles.row}>
          <Pressable style={styles.secondaryBtn} onPress={() => void onPlayVoice()}>
            <Text style={styles.secondaryText}>{ttsLoading ? 'Đang phát...' : 'Phát giọng nói'}</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => setShowCannotSpeak((v) => !v)}>
            <Text style={styles.secondaryText}>{showCannotSpeak ? 'Ẩn chế độ' : 'Tôi không thể nói'}</Text>
          </Pressable>
        </View>

        {showCannotSpeak ? (
          <View style={styles.cannotSpeakBox}>
            <Text style={styles.cannotSpeakText}>{pack.cannotSpeakText}</Text>
          </View>
        ) : null}

        <Pressable
          style={styles.langSupportBtn}
          onPress={() => navigation.navigate('LiveInterpreter', { guidedEntry: true, scenario: 'general' })}
        >
          <Text style={styles.langSupportText}>Hỗ trợ ngôn ngữ</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#09090B' },
  container: { flex: 1, backgroundColor: '#09090B' },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
  header: { marginBottom: 4 },
  sos: { color: '#F87171', fontSize: 34, fontWeight: '900' },
  headerSub: { color: '#FCA5A5', fontSize: 14, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  callBtn: {
    marginTop: 4,
    backgroundColor: '#DC2626',
    borderRadius: 14,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callText: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  locBox: { backgroundColor: '#1F2937', borderRadius: 12, padding: 12, minHeight: 70 },
  locTitle: { color: '#F3F4F6', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  locText: { color: '#E5E7EB', fontSize: 14, lineHeight: 20 },
  phraseBox: { backgroundColor: '#111827', borderRadius: 12, padding: 12 },
  localLabel: { color: '#FCA5A5', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  localText: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', lineHeight: 26 },
  vnLabel: { color: '#93C5FD', fontSize: 12, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  vnText: { color: '#E5E7EB', fontSize: 16, lineHeight: 24 },
  row: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  cannotSpeakBox: { backgroundColor: '#000000', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#EF4444' },
  cannotSpeakText: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', lineHeight: 34, textAlign: 'center' },
  langSupportBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langSupportText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
