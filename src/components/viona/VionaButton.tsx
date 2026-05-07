import { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { vionaTokens } from '../../design';
import { FontFamily } from '../../theme/typography';

export type VionaButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
export type VionaButtonSize = 'sm' | 'md' | 'lg';

export type VionaButtonProps = Readonly<{
  label?: string;
  children?: ReactNode;
  onPress: () => void;
  variant?: VionaButtonVariant;
  size?: VionaButtonSize;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  leftIcon?: ReactNode;
}>;

const toneStyles: Record<VionaButtonVariant, { bg: string; border: string; text: string; spinner: string }> = {
  primary: {
    bg: vionaTokens.colors.blue,
    border: vionaTokens.colors.blue,
    text: vionaTokens.colors.white,
    spinner: vionaTokens.colors.white,
  },
  secondary: {
    bg: vionaTokens.colors.white,
    border: vionaTokens.colors.border,
    text: vionaTokens.colors.softInk,
    spinner: vionaTokens.colors.softInk,
  },
  ghost: {
    bg: 'transparent',
    border: 'transparent',
    text: vionaTokens.colors.blue,
    spinner: vionaTokens.colors.blue,
  },
  danger: {
    bg: vionaTokens.colors.safetyRed,
    border: vionaTokens.colors.safetyRed,
    text: vionaTokens.colors.white,
    spinner: vionaTokens.colors.white,
  },
  soft: {
    bg: vionaTokens.colors.cloud,
    border: 'rgba(33, 81, 154, 0.2)',
    text: vionaTokens.colors.indigo,
    spinner: vionaTokens.colors.indigo,
  },
};

const sizeStyles: Record<VionaButtonSize, ViewStyle> = {
  sm: { minHeight: 34, paddingHorizontal: vionaTokens.spacing[12], paddingVertical: vionaTokens.spacing[6] },
  md: { minHeight: 42, paddingHorizontal: vionaTokens.spacing[16], paddingVertical: vionaTokens.spacing[8] },
  lg: { minHeight: 50, paddingHorizontal: vionaTokens.spacing[20], paddingVertical: vionaTokens.spacing[12] },
};

const textSizeStyles: Record<VionaButtonSize, object> = {
  sm: vionaTokens.typography.meta,
  md: vionaTokens.typography.bodyStrong,
  lg: vionaTokens.typography.title,
};

export function VionaButton({
  label,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
  leftIcon,
}: VionaButtonProps) {
  const busy = disabled || loading;
  const tone = toneStyles[variant];
  const textContent = children ?? label ?? '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        {
          backgroundColor: tone.bg,
          borderColor: tone.border,
          borderWidth: variant === 'ghost' ? 0 : 1,
        },
        busy && styles.disabled,
        pressed && !busy && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone.spinner} />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.label, textSizeStyles[size], { color: tone.text }]} numberOfLines={2}>
            {textContent}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: vionaTokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: vionaTokens.spacing[8],
  },
  label: {
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.88,
  },
});
