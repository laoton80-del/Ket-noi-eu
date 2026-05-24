/**
 * Wave 3B — hub page anatomy (slots only; no universe business logic).
 */
import { type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { resolvePremiumHubSlotGap } from '../../design/premiumTileVisualTokens';

export type PremiumHubLayoutProps = Readonly<{
  hero?: ReactNode;
  statusStrip?: ReactNode;
  primaryActions?: ReactNode;
  connectedUniverses?: ReactNode;
  footer?: ReactNode;
  /** Section blocks (clarity, grids, modules) between primary actions and universes. */
  children?: ReactNode;
  testID?: string;
}>;

export function PremiumHubLayout({
  hero,
  statusStrip,
  primaryActions,
  connectedUniverses,
  footer,
  children,
  testID,
}: PremiumHubLayoutProps): ReactElement {
  const { width } = useWindowDimensions();
  const gap = resolvePremiumHubSlotGap(width);

  return (
    <View testID={testID} style={[styles.root, { gap }]}>
      {hero ? <View style={styles.slot}>{hero}</View> : null}
      {statusStrip ? <View style={styles.slot}>{statusStrip}</View> : null}
      {primaryActions ? <View style={styles.slot}>{primaryActions}</View> : null}
      {children ? <View style={styles.sections}>{children}</View> : null}
      {connectedUniverses ? <View style={styles.slot}>{connectedUniverses}</View> : null}
      {footer ? <View style={styles.slot}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
  },
  slot: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
  },
  sections: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    gap: 10,
  },
});
