/**
 * Wave 3B — flex-wrap grid helper for Premium App Tiles (layout only).
 */
import { Children, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  premiumTileLayout,
  resolvePremiumTileCellWidthPercent,
} from '../../design/premiumTileVisualTokens';

export type PremiumTileGridProps = Readonly<{
  columns: number;
  gap?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** When true, children are wrapped in column-width containers. */
  wrapCells?: boolean;
}>;

export function PremiumTileGrid({
  columns,
  gap = premiumTileLayout.gridGap,
  children,
  style,
  wrapCells = false,
}: PremiumTileGridProps): ReactElement {
  const cellBasis = resolvePremiumTileCellWidthPercent(Math.max(1, Math.min(4, columns)) as 1 | 2 | 3 | 4);

  if (!wrapCells) {
    return (
      <View style={[styles.grid, { gap }, style]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.grid, { gap }, style]}>
      {Children.map(children, (child, index) => (
        <View key={index} style={[styles.cell, { width: cellBasis }]}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    width: '100%',
  },
  cell: {
    flexGrow: 0,
    flexShrink: 0,
  },
});
