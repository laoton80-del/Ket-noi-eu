import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { InterpreterScenario } from '../config/aiPrompts';
import { resolveCountryPack } from '../config/countryPacks';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/routes';
import { Colors } from '../theme/colors';
import { FontFamily } from '../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Le Tân chỉ seed `initialPrompt` khi `aiMode === 'roleplay'` (xem LeTanScreen). */
const LETAN_TRAVEL_SCENARIO = 'Du lịch & giao tiếp nơi công cộng';

type TravelScenarioRow = {
  id: string;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  interpreterScenario: InterpreterScenario;
  leonaPrefill: string;
  letanSeed: string;
};

const TRAVEL_SCENARIOS: TravelScenarioRow[] = [
  {
    id: 'airport',
    label: 'Sân bay',
    subtitle: 'Check-in, cửa khởi hành, an ninh, hành lý',
    icon: 'airplane-outline',
    interpreterScenario: 'travel',
    leonaPrefill:
      'Hỗ trợ gọi hoặc xác minh thông tin tại sân bay (cổng, giờ bay, hành lý) cho khách Việt. Không đặt vé qua app.',
    letanSeed: 'Mình đang ở sân bay cần nói gọn với nhân viên về check-in và hành lý.',
  },
  {
    id: 'hotel',
    label: 'Khách sạn / lưu trú',
    subtitle: 'Nhận phòng, tiện ích, thanh toán tại chỗ',
    icon: 'bed-outline',
    interpreterScenario: 'travel',
    leonaPrefill:
      'Hỗ trợ gọi khách sạn / chỗ ở để xác nhận đặt phòng hoặc yêu cầu dịch vụ. Không thanh toán thay trong app.',
    letanSeed: 'Mình cần hướng dẫn nói chuyện lễ tân khách sạn khi nhận phòng.',
  },
  {
    id: 'taxi',
    label: 'Taxi / xe',
    subtitle: 'Điểm đến, giá ước lượng, an toàn',
    icon: 'car-outline',
    interpreterScenario: 'travel',
    leonaPrefill: 'Hỗ trợ gọi hoặc xác nhận chuyến xe (taxi, xe công nghệ) và địa chỉ đón — không đặt vé máy bay.',
    letanSeed: 'Mình cần câu ngắn để nói với tài xế về địa chỉ và cách trả tiền.',
  },
  {
    id: 'restaurant',
    label: 'Nhà hàng / quán',
    subtitle: 'Đặt bàn, dị ứng, thanh toán',
    icon: 'restaurant-outline',
    interpreterScenario: 'travel',
    leonaPrefill: 'Hỗ trợ gọi nhà hàng đặt bàn hoặc hỏi món phù hợp. Không cam kết có bàn nếu chưa xác nhận với quán.',
    letanSeed: 'Mình cần nói với nhà hàng về dị ứng và gọi món đơn giản.',
  },
  {
    id: 'transit',
    label: 'Ga tàu / phương tiện công cộng',
    subtitle: 'Vé, lộ trình, chuyển tuyến',
    icon: 'train-outline',
    interpreterScenario: 'travel',
    leonaPrefill:
      'Hỗ trợ gọi hoặc hỏi ga / phương tiện công cộng về vé và lộ trình. Không mua vé hộ trong app.',
    letanSeed: 'Mình cần hỏi nhân viên ga về vé và đúng tuyến để đến địa chỉ của mình.',
  },
  {
    id: 'shopping',
    label: 'Mua sắm',
    subtitle: 'Đổi trả, kích cỡ, hóa đơn',
    icon: 'bag-handle-outline',
    interpreterScenario: 'travel',
    leonaPrefill: 'Hỗ trợ gọi cửa hàng về đổi trả hoặc hàng đặt — không thanh toán thay trong app.',
    letanSeed: 'Mình cần nói với cửa hàng về đổi size và hóa đơn VAT.',
  },
  {
    id: 'hospital',
    label: 'Bệnh viện / thuốc',
    subtitle: 'Triệu chứng ngắn, lịch hẹn, nhà thuốc',
    icon: 'medkit-outline',
    interpreterScenario: 'doctor',
    leonaPrefill: 'Hỗ trợ gọi phòng khám / nhà thuốc để hỏi lịch hoặc thuốc. Không thay thế cấp cứu — nếu nguy hiểm hãy dùng SOS.',
    letanSeed: 'Mình cần mô tả triệu chứng ngắn gọn khi đến phòng khám (không thay thế bác sĩ).',
  },
  {
    id: 'emergency',
    label: 'Khẩn cấp & cảnh sát',
    subtitle: 'An toàn cá nhân, trình báo',
    icon: 'shield-outline',
    interpreterScenario: 'travel',
    leonaPrefill:
      'Hỗ trợ gọi cơ quan / dịch vụ địa phương khi cần trình báo (ưu tiên số khẩn cấp đúng nước). App không thay thế 112/911.',
    letanSeed: 'Mình cần nói với cảnh sát hoặc nhân viên an ninh một cách bình tĩnh và rõ ràng.',
  },
];

const TRUST_NOTE =
  'Kết Nối hỗ trợ bạn giao tiếp và định hướng — không tự động mua vé, không xác nhận đã có vé hay đã thanh toán xong thay bạn.';

export function TravelCompanionScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const pack = resolveCountryPack(user?.country);
  const localeLine =
    pack.countryCode === 'ZZ'
      ? 'Chưa chọn quốc gia trong hồ sơ — dùng mặc định toàn cầu (EUR / tier T2) cho gợi ý; hãy cập nhật Quốc gia để khớp nơi bạn đang ở.'
      : `Gói quốc gia: ${pack.countryCode} · ngôn ngữ thường gặp: ${pack.defaultLanguage.toUpperCase()}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
            <Text style={styles.backText}>Quay lại</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Đồng hành du lịch</Text>
        <Text style={styles.subtitle}>
          Chọn tình huống — phiên dịch & gọi hỗ trợ; không phải OTA hay kênh đặt chỗ/thanh toán thay bạn.
        </Text>
        <Text style={styles.localeHint}>{localeLine}</Text>

        <View style={styles.trustBox}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.trustText}>{TRUST_NOTE}</Text>
        </View>

        <Text style={styles.sectionTitle}>Hỗ trợ nhanh</Text>
        <View style={styles.quickRow}>
          <Pressable
            style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.75 }]}
            onPress={() => navigation.navigate('LiveInterpreter', { scenario: 'travel' })}
          >
            <Ionicons name="mic-outline" size={18} color={Colors.primary} />
            <Text style={styles.quickChipText}>Phiên dịch trực tiếp</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.75 }]}
            onPress={() =>
              navigation.navigate('LeonaCall', {
                prefillRequest:
                  'Hỗ trợ gọi điện xác minh hoặc đặt chỗ bên ngoài cho khách Việt đang đi du lịch. Không đặt vé máy bay tự động trong app.',
                autoSubmit: false,
              })
            }
          >
            <Ionicons name="call-outline" size={18} color={Colors.primary} />
            <Text style={styles.quickChipText}>Gọi điện hỏi giúp</Text>
          </Pressable>
        </View>
        <View style={styles.quickRow}>
          <Pressable
            style={({ pressed }) => [styles.quickChip, styles.quickChipDanger, pressed && { opacity: 0.75 }]}
            onPress={() => navigation.navigate('EmergencySOS')}
          >
            <Ionicons name="warning-outline" size={18} color="#FFFFFF" />
            <Text style={[styles.quickChipText, styles.quickChipTextOnDanger]}>Hỗ trợ khẩn cấp</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.75 }]}
            onPress={() =>
              navigation.navigate('Tabs', {
                screen: 'LeTan',
                params: {
                  aiMode: 'roleplay',
                  scenario: LETAN_TRAVEL_SCENARIO,
                  initialPrompt:
                    'Mình đang đi du lịch và cần Minh Khang gợi ý cách nói chuyện lịch sự, ngắn gọn với người địa phương (không hứa đặt dịch vụ thay mình).',
                },
              })
            }
          >
            <Ionicons name="chatbubbles-outline" size={18} color={Colors.primary} />
            <Text style={styles.quickChipText}>Minh Khang</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.flightEntry, pressed && { opacity: 0.8 }]}
          onPress={() => navigation.navigate('FlightSearchAssistant')}
        >
          <View style={styles.flightEntryLeft}>
            <Ionicons name="search-outline" size={22} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.flightEntryTitle}>So sánh & chuẩn bị chuyến bay</Text>
              <Text style={styles.flightEntryHint}>Ghi chú hành trình và gợi ý so sánh — tìm vé trên trang hãng/đại lý; không đặt vé trong app</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSoft} />
        </Pressable>

        <Text style={styles.sectionTitle}>Theo tình huống</Text>
        {TRAVEL_SCENARIOS.map((row) => (
          <View key={row.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBubble}>
                <Ionicons name={row.icon} size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{row.label}</Text>
                <Text style={styles.cardSubtitle}>{row.subtitle}</Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <Pressable
                style={({ pressed }) => [styles.actionPill, pressed && { opacity: 0.75 }]}
                onPress={() => navigation.navigate('LiveInterpreter', { scenario: row.interpreterScenario })}
              >
                <Text style={styles.actionPillText}>Phiên dịch</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.actionPill, pressed && { opacity: 0.75 }]}
                onPress={() =>
                  navigation.navigate('LeonaCall', {
                    prefillRequest: row.leonaPrefill,
                    autoSubmit: false,
                  })
                }
              >
                <Text style={styles.actionPillText}>Leona</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.actionPill, styles.actionPillOutline, pressed && { opacity: 0.75 }]}
                onPress={() =>
                  navigation.navigate('Tabs', {
                    screen: 'LeTan',
                    params: {
                      aiMode: 'roleplay',
                      scenario: LETAN_TRAVEL_SCENARIO,
                      initialPrompt: row.letanSeed,
                    },
                  })
                }
              >
                <Text style={[styles.actionPillText, styles.actionPillTextOutline]}>Minh Khang</Text>
              </Pressable>
              {row.id === 'emergency' ? (
                <Pressable
                  style={({ pressed }) => [styles.actionPill, styles.actionPillSos, pressed && { opacity: 0.75 }]}
                  onPress={() => navigation.navigate('EmergencySOS')}
                >
                  <Text style={[styles.actionPillText, styles.actionPillTextOnDanger]}>SOS</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}

        <Text style={styles.footerNote}>
          Nếu cần đặt vé hoặc thanh toán, hãy hoàn tất trên trang chính thức của hãng bay, đại lý hoặc nền tảng bạn tin cậy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 48 },
  topBar: { marginBottom: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 8 },
  backText: { fontSize: 16, color: Colors.text, fontFamily: FontFamily.medium },
  title: { fontSize: 26, fontFamily: FontFamily.bold, color: Colors.text, marginTop: 4 },
  subtitle: { fontSize: 14, fontFamily: FontFamily.regular, color: Colors.textSoft, marginTop: 8, lineHeight: 20 },
  localeHint: { fontSize: 12, fontFamily: FontFamily.regular, color: Colors.textSoft, marginTop: 10 },
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
  sectionTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: Colors.text, marginTop: 22, marginBottom: 10 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    flexGrow: 1,
    minWidth: '42%',
  },
  quickChipDanger: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  quickChipText: { fontSize: 13, fontFamily: FontFamily.semibold, color: Colors.text, flex: 1 },
  quickChipTextOnDanger: { color: '#FFFFFF' },
  flightEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: 6,
    gap: 12,
  },
  flightEntryLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  flightEntryTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: Colors.text },
  flightEntryHint: { fontSize: 12, fontFamily: FontFamily.regular, color: Colors.textSoft, marginTop: 4 },
  card: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: Colors.text },
  cardSubtitle: { fontSize: 13, fontFamily: FontFamily.regular, color: Colors.textSoft, marginTop: 4, lineHeight: 18 },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Colors.background,
  },
  actionPillOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.primary },
  actionPillSos: { backgroundColor: '#DC2626' },
  actionPillText: { fontSize: 12, fontFamily: FontFamily.semibold, color: Colors.primary },
  actionPillTextOutline: { color: Colors.primary },
  actionPillTextOnDanger: { color: '#FFFFFF' },
  footerNote: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: Colors.textSoft,
    marginTop: 20,
    lineHeight: 18,
  },
});
