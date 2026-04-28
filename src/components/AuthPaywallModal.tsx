import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontFamily } from '../theme/typography';
import { theme } from '../theme/theme';

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
    backgroundColor: theme.colors.overlay.dim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.card,
    padding: 16,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    ...theme.typeScale.h2,
    color: theme.colors.SignatureGold,
    fontFamily: FontFamily.bold,
    marginBottom: 6,
  },
  desc: {
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
    marginBottom: 12,
  },
  cta: {
    borderRadius: 12,
    minHeight: 44,
    backgroundColor: theme.colors.RouteError,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ctaText: {
    color: theme.colors.CeolWhite,
    ...theme.typeScale.body,
  },
  secondary: {
    borderRadius: 10,
    minHeight: 36,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: theme.colors.text.secondary,
    ...theme.typeScale.body,
  },
});
