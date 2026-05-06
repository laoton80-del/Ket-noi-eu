import { type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { type VionaSurfaceVariant, vionaSurfaceColors } from './vionaTrustTokens';

export type VionaSurfaceProps = Readonly<{
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * `light` — white panel (default consumer).
   * `muted` — soft gray panel.
   * `premium` — white + navy-tinted border (travel / VIP cards).
   * `ops` — dark panel (merchant/staff only).
   * @deprecated Use `light` | `muted` — `default` maps to `light`.
   */
  variant?: VionaSurfaceVariant | 'default';
}>;

export function VionaSurface({ children, style, variant = 'light' }: VionaSurfaceProps): ReactElement {
  const mode: VionaSurfaceVariant = variant === 'default' ? 'light' : variant;
  const pal = vionaSurfaceColors(mode);
  return (
    <View style={[styles.base, { backgroundColor: pal.backgroundColor, borderColor: pal.borderColor }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    borderWidth: 1,
  },
});
