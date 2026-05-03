import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { FontFamily } from '../theme/typography';

const GOLD = 'rgba(197, 160, 89, 0.98)';
const GOLD_BORDER = 'rgba(212, 175, 55, 0.55)';
const NAVY = 'rgba(12, 18, 30, 0.98)';
const TEXT = 'rgba(248, 250, 252, 0.96)';
const MUTED = 'rgba(226, 232, 240, 0.72)';

export type PersonaOnboardingModalProps = Readonly<{
  visible: boolean;
  onPickExpat: () => void;
  onPickTourist: () => void;
}>;

export function PersonaOnboardingModal({ visible, onPickExpat, onPickTourist }: PersonaOnboardingModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>What brings you to ViGlobal?</Text>
          <Text style={styles.sub}>Choose once — we tailor your home dashboard.</Text>
          <Pressable
            onPress={onPickExpat}
            style={({ pressed }) => [styles.option, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityLabel="Living and working abroad"
          >
            <Text style={styles.optionTitle}>Living & Working Abroad</Text>
            <Text style={styles.optionSub}>Diaspora tools, EU services, full B2C hub.</Text>
          </Pressable>
          <Pressable
            onPress={onPickTourist}
            style={({ pressed }) => [styles.option, styles.optionAccent, pressed && { opacity: 0.92 }]}
            accessibilityRole="button"
            accessibilityLabel="Traveling to Vietnam"
          >
            <Text style={styles.optionTitle}>Traveling to Vietnam</Text>
            <Text style={styles.optionSub}>Travel-first layout, wallet & translation front.</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 20, 0.72)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: NAVY,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
  },
  title: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: TEXT,
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: MUTED,
    marginBottom: 16,
    lineHeight: 19,
  },
  option: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 10,
  },
  optionAccent: {
    borderColor: GOLD_BORDER,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: GOLD,
    marginBottom: 4,
  },
  optionSub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: MUTED,
    lineHeight: 17,
  },
});
