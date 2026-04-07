import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { GuidedIntentId } from '../onboarding/guidedOnboardingStorage';
import { Colors } from '../theme/colors';
import { gradients } from '../theme/gradients';
import { FontFamily } from '../theme/typography';

const OPTIONS: { id: GuidedIntentId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'call_book', label: 'Gọi / đặt lịch', icon: 'call' },
  { id: 'language', label: 'Không hiểu tiếng', icon: 'language' },
  { id: 'documents', label: 'Làm giấy tờ', icon: 'document-text' },
  { id: 'services', label: 'Tìm dịch vụ', icon: 'location' },
];

type Props = {
  visible: boolean;
  onSelectIntent: (id: GuidedIntentId) => void;
  onSkip: () => void;
};

export function IntentEntryModal({ visible, onSelectIntent, onSkip }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <LinearGradient colors={gradients.sandCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
            <Text style={styles.question}>Bạn đang cần gì nhất lúc này?</Text>
            <Text style={styles.sub}>Chọn một mục — app sẽ đưa bạn thẳng vào việc.</Text>
            <View style={styles.grid}>
              {OPTIONS.map((opt) => (
                <Pressable
                  key={opt.id}
                  onPress={() => onSelectIntent(opt.id)}
                  style={({ pressed }) => [styles.option, pressed && { opacity: 0.88 }]}
                >
                  <View style={styles.optionIcon}>
                    <Ionicons name={opt.icon} size={22} color="#7A5A1C" />
                  </View>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={onSkip} style={({ pressed }) => [styles.skip, pressed && { opacity: 0.75 }]}>
              <Text style={styles.skipText}>Để sau</Text>
            </Pressable>
          </LinearGradient>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 22, 18, 0.52)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  safe: { flex: 1, justifyContent: 'center' },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.45)',
  },
  question: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
    color: Colors.textSoft,
    textAlign: 'center',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  option: {
    width: '47%',
    minHeight: 88,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212,175,55,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: Colors.text,
    textAlign: 'center',
  },
  skip: {
    marginTop: 18,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: 'rgba(90,70,40,0.65)',
  },
});
