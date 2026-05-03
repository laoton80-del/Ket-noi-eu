import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, ViewStyle, type StyleProp } from 'react-native';
import { gradients } from '../theme/gradients';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

type AppButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export function AppButton({ label, onPress, variant = 'primary', style, disabled = false }: AppButtonProps) {
  const variantToken = theme.components.button.variant[variant];

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [pressed && !disabled && styles.pressed, disabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={[...gradients.goldExecutive]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientBtn, disabled && styles.gradientDisabled]}
        >
          <Text style={styles.gradientLabel}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: variantToken.background,
          borderColor: variantToken.border,
        },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, { color: variantToken.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gradientBtn: {
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  gradientLabel: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.onAccent,
    letterSpacing: 0.4,
  },
  gradientDisabled: { opacity: 0.45 },
  base: {
    height: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
});
