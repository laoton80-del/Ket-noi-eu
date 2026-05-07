import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { vionaTokens } from '../../design';
import { type VionaSurfaceVariant, vionaSurfaceColors } from './vionaTrustTokens';

type FoundationVariant = 'elevated' | 'hero' | 'glass' | 'impact';
type SurfaceVariant = VionaSurfaceVariant | 'default' | FoundationVariant;

export type VionaSurfaceProps = Readonly<{
  children: ReactNode;
  variant?: SurfaceVariant;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}>;

const foundationStyles: Record<FoundationVariant, ViewStyle> = {
  elevated: {
    backgroundColor: vionaTokens.colors.elevatedSurface,
    borderColor: vionaTokens.colors.border,
    borderRadius: vionaTokens.radius.xl,
    ...vionaTokens.shadows.medium,
  },
  hero: {
    backgroundColor: vionaTokens.colors.white,
    borderColor: 'rgba(33, 81, 154, 0.2)',
    borderRadius: vionaTokens.radius.xxl,
    ...vionaTokens.shadows.hero,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: vionaTokens.radius.xl,
    ...vionaTokens.shadows.soft,
  },
  impact: {
    backgroundColor: '#FFF8F5',
    borderColor: 'rgba(230, 124, 106, 0.28)',
    borderRadius: vionaTokens.radius.xl,
    ...vionaTokens.shadows.soft,
  },
};

export function VionaSurface({ children, style, variant = 'light', testID }: VionaSurfaceProps) {
  if (variant === 'elevated' || variant === 'hero' || variant === 'glass' || variant === 'impact') {
    return (
      <View testID={testID} style={[styles.foundationBase, foundationStyles[variant], style]}>
        {children}
      </View>
    );
  }

  const resolvedVariant: VionaSurfaceVariant = variant === 'default' ? 'light' : variant;
  const palette = vionaSurfaceColors(resolvedVariant);
  return (
    <View
      testID={testID}
      style={[
        styles.legacyBase,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  legacyBase: {
    borderRadius: 16,
    borderWidth: 1,
  },
  foundationBase: {
    borderWidth: 1,
    paddingHorizontal: vionaTokens.spacing[16],
    paddingVertical: vionaTokens.spacing[16],
  },
});
