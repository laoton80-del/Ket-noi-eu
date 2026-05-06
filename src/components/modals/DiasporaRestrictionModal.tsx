import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';

export const DIASPORA_RESTRICTION_MODAL_TITLE = 'Dành Riêng Cho Doanh Nghiệp Kiều Bào' as const;

export const DIASPORA_RESTRICTION_MODAL_MESSAGE =
  'Chào bạn, tính năng Quản lý Kinh doanh (B2B) hiện chỉ cấp phép cho các doanh nghiệp và chủ tiệm người Việt đang hoạt động tại nước ngoài. Tuy nhiên, bạn vẫn có thể sử dụng toàn bộ tính năng Khách hàng (B2C) để đặt dịch vụ và sử dụng AI trợ lý cho chuyến đi của mình. Chúc bạn có trải nghiệm tuyệt vời!' as const;

export type DiasporaRestrictionModalProps = Readonly<{
  visible: boolean;
  onClose: () => void;
}>;

export function DiasporaRestrictionModal({ visible, onClose }: DiasporaRestrictionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Đóng">
        <Pressable
          style={[styles.card, { borderColor: theme.colors.glass.border }]}
          className={applyWebStyles('kn-glass')}
          onPress={() => undefined}
        >
          <Text style={styles.title}>{DIASPORA_RESTRICTION_MODAL_TITLE}</Text>
          <Text style={styles.body}>{DIASPORA_RESTRICTION_MODAL_MESSAGE}</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88 }]}
            accessibilityRole="button"
            accessibilityLabel="Đã hiểu"
          >
            <Text style={styles.ctaText}>Đã hiểu</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 12, 22, 0.52)',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(255, 252, 248, 0.96)',
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    ...theme.typeScale.h2,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.textOnLight,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  body: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: theme.colors.textOnLightMuted,
    lineHeight: theme.typeScale.body.lineHeight * 1.35,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  cta: {
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
});
