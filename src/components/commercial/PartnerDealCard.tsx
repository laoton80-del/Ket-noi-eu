import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type PartnerDealCardProps = {
  title: string;
  discountBadge: string;
  partnerLabel: string;
  onPress: () => void;
};

export function PartnerDealCard({
  title,
  discountBadge,
  partnerLabel,
  onPress,
}: PartnerDealCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      <View style={styles.logoPlaceholder}>
        <Ionicons name="storefront-outline" size={22} color={theme.colors.primary} />
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.partner}>{partnerLabel}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discountBadge}</Text>
        </View>
        <View style={styles.ctaButton}>
          <Text style={styles.ctaText}>Nhận Ưu Đãi</Text>
          <Ionicons name="open-outline" size={14} color={theme.components.button.variant.primary.text} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    minHeight: 176,
  },
  logoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: theme.colors.glass.goldGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typeScale.body,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  partner: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  discountBadge: {
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    backgroundColor: theme.components.button.variant.danger.background,
    paddingHorizontal: theme.spacing.sm,
    minHeight: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountText: {
    ...theme.typeScale.caption,
    color: theme.colors.danger,
    fontFamily: FontFamily.bold,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minHeight: 34,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
    backgroundColor: theme.components.button.variant.primary.background,
    paddingHorizontal: theme.spacing.sm,
  },
  ctaText: {
    ...theme.typeScale.caption,
    color: theme.components.button.variant.primary.text,
    fontFamily: FontFamily.bold,
  },
});
