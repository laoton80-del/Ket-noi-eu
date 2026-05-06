import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type SponsoredShopCardProps = {
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onPress?: () => void;
};

export function SponsoredShopCard({
  title,
  subtitle,
  ctaLabel = 'Khám phá ưu đãi',
  onPress,
}: SponsoredShopCardProps) {
  const glow = useSharedValue(0);
  glow.value = withRepeat(
    withTiming(1, {
      duration: 1400,
      easing: Easing.inOut(Easing.quad),
    }),
    -1,
    true
  );

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.35, 0.95]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.98, 1.02]) }],
  }));

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrapper, pressed && { opacity: 0.9 }]}>
      <Animated.View style={StyleSheet.flatten([styles.shimmerOverlay, shimmerStyle])} />
      <View style={styles.headerRow}>
        <View style={styles.sponsoredPill}>
          <Ionicons name="sparkles-outline" size={14} color={theme.colors.onAccent} />
          <Text style={styles.sponsoredPillText}>Tài trợ</Text>
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.footerRow}>
        <Text style={styles.ctaText}>{ctaLabel}</Text>
        <Ionicons name="arrow-forward" size={16} color={theme.colors.onAccent} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: theme.colors.glass.goldGlow,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    minHeight: 148,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.glass.goldGlow,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sponsoredPill: {
    minHeight: 28,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
    backgroundColor: theme.components.button.variant.primary.background,
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  sponsoredPillText: {
    ...theme.typeScale.caption,
    color: theme.colors.onAccent,
    fontFamily: FontFamily.bold,
  },
  title: {
    ...theme.typeScale.h2,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
  },
  footerRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.hybrid.signatureLine,
    paddingTop: theme.spacing.sm,
  },
  ctaText: {
    ...theme.typeScale.body,
    color: theme.colors.onAccent,
    fontFamily: FontFamily.semibold,
  },
});
