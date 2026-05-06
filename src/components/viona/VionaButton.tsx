import { type ReactElement, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { FontFamily } from '../../theme/typography';
import { vionaHybrid, vionaSpacing, vionaTouchMin, vionaPressedOpacity } from './vionaDesignTokens';
import { vionaTrust } from './vionaTrustTokens';

export type VionaButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export type VionaButtonProps = Readonly<{
  label: string;
  onPress: () => void;
  variant?: VionaButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  leftIcon?: ReactNode;
}>;

export function VionaButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
  leftIcon,
}: VionaButtonProps): ReactElement {
  const busy = loading || disabled;
  const colors = buttonColors(variant);

  return (
    <Pressable
      onPress={() => {
        if (!busy) onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: busy }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: variant === 'ghost' ? 0 : 1,
          opacity: pressed && !busy ? vionaPressedOpacity : 1,
        },
        busy && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.spinner} />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.label, { color: colors.text }]} numberOfLines={2}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

function buttonColors(
  variant: VionaButtonVariant
): Readonly<{ bg: string; border: string; text: string; spinner: string }> {
  switch (variant) {
    case 'secondary':
      return {
        bg: vionaTrust.surface,
        border: vionaTrust.border,
        text: vionaTrust.ink,
        spinner: vionaTrust.ink,
      };
    case 'danger':
      return {
        bg: 'rgba(220, 38, 38, 0.08)',
        border: vionaHybrid.danger,
        text: vionaHybrid.danger,
        spinner: vionaHybrid.danger,
      };
    case 'ghost':
      return {
        bg: 'transparent',
        border: 'transparent',
        text: vionaTrust.signal,
        spinner: vionaTrust.signal,
      };
    default:
      return {
        bg: vionaTrust.signal,
        border: vionaTrust.signal,
        text: '#FFFFFF',
        spinner: '#FFFFFF',
      };
  }
}

const styles = StyleSheet.create({
  base: {
    minHeight: vionaTouchMin,
    paddingHorizontal: vionaSpacing.lg,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: vionaSpacing.sm,
  },
  label: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
});
