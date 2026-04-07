import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontFamily } from '../theme/typography';

type Props = {
  visible: boolean;
  title?: string;
  description?: string;
  onContinue: () => void;
  onClose: () => void;
};

export function AuthPaywallModal({
  visible,
  title = 'Tính năng VIP',
  description = 'Bạn cần đăng nhập bằng số điện thoại để dùng đầy đủ trợ lý trong app (Lễ tân, học tập, công cụ).',
  onContinue,
  onClose,
}: Props) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
        <Pressable onPress={onContinue} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.82 }]}>
          <Text style={styles.ctaText}>Tiếp tục bằng Số Điện Thoại</Text>
        </Pressable>
        <Pressable onPress={onClose} style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.8 }]}>
          <Text style={styles.secondaryText}>Để sau</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    backgroundColor: 'rgba(40,28,18,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'rgba(255,255,255,0.72)',
    padding: 16,
    shadowColor: '#8B7355',
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    color: '#2A231A',
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(42,35,26,0.82)',
    fontFamily: FontFamily.regular,
    marginBottom: 12,
  },
  cta: {
    borderRadius: 12,
    minHeight: 44,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ctaText: {
    color: '#FFE9D2',
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
  secondary: {
    borderRadius: 10,
    minHeight: 36,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#6A583E',
    fontFamily: FontFamily.medium,
    fontSize: 13,
  },
});
