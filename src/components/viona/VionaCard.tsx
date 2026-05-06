import { type ReactElement, type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { vionaShadow } from './vionaDesignTokens';
import { type VionaSurfaceVariant } from './vionaTrustTokens';
import { VionaSurface } from './VionaSurface';

export type VionaCardProps = Readonly<{
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  /** @deprecated prefer `surfaceVariant` */
  variant?: 'default' | 'muted';
  surfaceVariant?: VionaSurfaceVariant | 'default';
}>;

export function VionaCard({
  children,
  style,
  padded = true,
  variant = 'default',
  surfaceVariant,
}: VionaCardProps): ReactElement {
  const resolved: VionaSurfaceVariant | 'default' =
    surfaceVariant ??
    (variant === 'muted' ? 'muted' : 'default');
  const v = resolved === 'default' ? 'light' : resolved;
  return (
    <VionaSurface variant={v} style={[padded ? styles.pad : null, styles.shadow, style]}>
      {children}
    </VionaSurface>
  );
}

const styles = StyleSheet.create({
  pad: {
    padding: 16,
  },
  shadow: vionaShadow.card,
});
