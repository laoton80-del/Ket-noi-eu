import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/routes';
import { Colors } from '../theme/colors';
import { FontFamily } from '../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TripKind = 'oneway' | 'roundtrip';

const COMPARE_CHECKLIST = [
  'Giờ cất cánh / hạ cánh có hợp giờ làm việc hoặc chuyển tuyến của bạn không?',
  'Có nối chuyến không? Thời gian nối có đủ an toàn?',
  'Hành lý xách tay và ký gửi gồm những gì — phụ phí?',
  'Chính sách đổi / hoãn nếu trễ hoặc đổi kế hoạch?',
  'Sân bay nào (mã) — có xa chỗ ở không?',
];

function buildFlightSummary(p: {
  trip: TripKind;
  from: string;
  to: string;
  depart: string;
  ret: string;
  notes: string[];
}): string {
  const lines = [
    'Ngữ cảnh: người dùng đang so sánh chuyến bay (KHÔNG đặt vé trong app, không có vé đã phát hành).',
    `Hành trình: ${p.from.trim() || '…'} → ${p.to.trim() || '…'}`,
    `Loại: ${p.trip === 'roundtrip' ? 'khứ hồi' : 'một chiều'}`,
    `Ngày đi: ${p.depart.trim() || '…'}`,
  ];
  if (p.trip === 'roundtrip') lines.push(`Ngày về: ${p.ret.trim() || '…'}`);
  const shortlist = p.notes.map((n, i) => n.trim() && `Ghi chú lựa chọn ${i + 1}: ${n.trim()}`).filter(Boolean) as string[];
  if (shortlist.length) lines.push(...shortlist);
  lines.push(
    'Hãy giúp họ hiểu tiêu chí so sánh, đặt câu hỏi làm rõ nhu cầu (giá, thời gian, hành lý, linh hoạt).',
    'Không khẳng định đã có chỗ, giá chính xác hay đã thanh toán; nhắc họ xác nhận trên trang chính thức hãng / đại lý / nền tảng họ chọn.'
  );
  return lines.join('\n');
}

export function FlightSearchAssistantScreen() {
  const navigation = useNavigation<Nav>();
  const [trip, setTrip] = useState<TripKind>('oneway');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [depart, setDepart] = useState('');
  const [ret, setRet] = useState('');
  const [shortA, setShortA] = useState('');
  const [shortB, setShortB] = useState('');
  const [shortC, setShortC] = useState('');

  const notes = useMemo(() => [shortA, shortB, shortC], [shortA, shortB, shortC]);

  const openMinhKhang = useCallback(() => {
    const d = depart.trim();
    const f = from.trim();
    const t = to.trim();
    if (!f || !t || !d) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập điểm đi, điểm đến và ngày đi (có thể ghi dạng 2026-04-15).');
      return;
    }
    if (trip === 'roundtrip' && !ret.trim()) {
      Alert.alert('Thiếu ngày về', 'Chuyến khứ hồi cần ngày về hoặc đổi sang một chiều.');
      return;
    }
    navigation.navigate('Tabs', {
      screen: 'LeTan',
      params: {
        aiMode: 'roleplay',
        scenario: 'So sánh chuyến bay (không đặt vé trong app)',
        initialPrompt: buildFlightSummary({ trip, from: f, to: t, depart: d, ret: ret.trim(), notes }),
      },
    });
  }, [depart, from, navigation, notes, ret, to, trip]);

  const openLeona = useCallback(() => {
    const f = from.trim();
    const t = to.trim();
    const d = depart.trim();
    const r = trip === 'roundtrip' ? ret.trim() : '';
    const prefill = [
      'Hỗ trợ gọi điện để xác minh chi tiết chuyến bay (giờ, hành lý, đổi vé) với hãng hoặc đại lý.',
      f && t ? `Tuyến: ${f} → ${t}.` : '',
      d ? `Ngày đi: ${d}.` : '',
      r ? `Ngày về: ${r}.` : '',
      'Lưu ý: app không đặt vé tự động và không xác nhận đã có vé — chỉ hỗ trợ gọi / hỏi giúp.',
    ]
      .filter(Boolean)
      .join(' ');
    navigation.navigate('LeonaCall', { prefillRequest: prefill, autoSubmit: false });
  }, [depart, from, navigation, ret, to, trip]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
            <Text style={styles.backText}>Quay lại</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>So sánh & chuẩn bị chuyến bay</Text>
        <Text style={styles.subtitle}>
          Ghi lại hành trình và ghi chú từ trang đặt vé bên ngoài, tự đối chiếu theo gợi ý bên dưới, hoặc nhờ Minh Khang / Leona hỗ trợ diễn đạt và gọi xác minh — không tìm vé hay giữ chỗ trong app.
        </Text>

        <View style={styles.trustBox}>
          <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
          <Text style={styles.trustText}>
            Đây không phải đặt vé hay thanh toán trong app. Không có vé đã phát hành, không cam kết giữ chỗ. Bạn cần hoàn tất trên trang
            chính thức của hãng bay, đại lý hoặc nền tảng bạn chọn.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Loại chuyến</Text>
        <View style={styles.segmentRow}>
          <Pressable
            style={({ pressed }) => [styles.segment, trip === 'oneway' && styles.segmentOn, pressed && { opacity: 0.85 }]}
            onPress={() => setTrip('oneway')}
          >
            <Text style={[styles.segmentText, trip === 'oneway' && styles.segmentTextOn]}>Một chiều</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.segment, trip === 'roundtrip' && styles.segmentOn, pressed && { opacity: 0.85 }]}
            onPress={() => setTrip('roundtrip')}
          >
            <Text style={[styles.segmentText, trip === 'roundtrip' && styles.segmentTextOn]}>Khứ hồi</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Hành trình & ngày</Text>
        <LabeledInput label="Điểm đi (thành phố / mã sân bay)" value={from} onChangeText={setFrom} placeholder="VD: PRG hoặc Praha" />
        <LabeledInput label="Điểm đến" value={to} onChangeText={setTo} placeholder="VD: SGN hoặc TP.HCM" />
        <LabeledInput label="Ngày đi" value={depart} onChangeText={setDepart} placeholder="VD: 2026-06-10" />
        {trip === 'roundtrip' ? (
          <LabeledInput label="Ngày về" value={ret} onChangeText={setRet} placeholder="VD: 2026-06-24" />
        ) : null}

        <Text style={styles.sectionTitle}>Danh sách rút gọn (ghi chú của bạn)</Text>
        <Text style={styles.hint}>Dán hoặc gõ tóm tắt từ trang tìm vé bên ngoài — chỉ để bạn so sánh, không phải xác nhận đặt chỗ.</Text>
        <LabeledInput label="Lựa chọn 1" value={shortA} onChangeText={setShortA} placeholder="VD: Hãng X, sáng, 1 điểm dừng…" multiline />
        <LabeledInput label="Lựa chọn 2" value={shortB} onChangeText={setShortB} placeholder="VD: Hãng Y, chiều, bay thẳng…" multiline />
        <LabeledInput label="Lựa chọn 3 (tuỳ chọn)" value={shortC} onChangeText={setShortC} placeholder="Ghi thêm nếu cần" multiline />

        <Text style={styles.sectionTitle}>Gợi ý để tự hỏi “cái nào hợp hơn?”</Text>
        <View style={styles.checklist}>
          {COMPARE_CHECKLIST.map((line) => (
            <View key={line} style={styles.checkRow}>
              <Ionicons name="ellipse-outline" size={14} color={Colors.primary} style={{ marginTop: 3 }} />
              <Text style={styles.checkText}>{line}</Text>
            </View>
          ))}
        </View>

        <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]} onPress={openMinhKhang}>
          <Ionicons name="chatbubbles-outline" size={20} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Hỏi Minh Khang: lựa chọn nào phù hợp hơn?</Text>
        </Pressable>

        <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]} onPress={openLeona}>
          <Ionicons name="call-outline" size={20} color={Colors.primary} />
          <Text style={styles.secondaryBtnText}>Nhờ Leona gọi / xác minh với hãng hoặc đại lý</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.75 }]}
          onPress={() => navigation.navigate('TravelCompanion')}
        >
          <Text style={styles.linkText}>Quay về Đồng hành du lịch</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function LabeledInput(props: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={Colors.textSoft}
        style={[styles.input, props.multiline && styles.inputMulti]}
        multiline={props.multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 48 },
  topBar: { marginBottom: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 8 },
  backText: { fontSize: 16, color: Colors.text, fontFamily: FontFamily.medium },
  title: { fontSize: 24, fontFamily: FontFamily.bold, color: Colors.text, marginTop: 4 },
  subtitle: { fontSize: 14, fontFamily: FontFamily.regular, color: Colors.textSoft, marginTop: 8, lineHeight: 20 },
  trustBox: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  trustText: { flex: 1, fontSize: 13, fontFamily: FontFamily.regular, color: Colors.text, lineHeight: 19 },
  sectionTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: Colors.text, marginTop: 20, marginBottom: 8 },
  hint: { fontSize: 12, fontFamily: FontFamily.regular, color: Colors.textSoft, marginBottom: 8, lineHeight: 17 },
  segmentRow: { flexDirection: 'row', gap: 10 },
  segment: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
  },
  segmentOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  segmentText: { fontSize: 14, fontFamily: FontFamily.semibold, color: Colors.text },
  segmentTextOn: { color: '#FFFFFF' },
  fieldWrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontFamily: FontFamily.medium, color: Colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: Colors.text,
    backgroundColor: '#FFFFFF',
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  checklist: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 10,
  },
  checkRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkText: { flex: 1, fontSize: 13, fontFamily: FontFamily.regular, color: Colors.text, lineHeight: 19 },
  primaryBtn: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  primaryBtnText: { fontSize: 15, fontFamily: FontFamily.bold, color: '#FFFFFF', flexShrink: 1 },
  secondaryBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryBtnText: { fontSize: 14, fontFamily: FontFamily.semibold, color: Colors.primary, flexShrink: 1 },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
  linkText: { fontSize: 14, fontFamily: FontFamily.semibold, color: Colors.primary },
});
