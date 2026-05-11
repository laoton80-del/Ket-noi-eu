import {
  Children,
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { vionaSpacing } from './vionaDesignTokens';

/** Total horizontal gap width between `columnCount` columns at `gapPx` each. */
function totalRowGapPx(columnCount: number, gapPx: number): number {
  if (columnCount <= 1) return 0;
  return gapPx * (columnCount - 1);
}

export type VionaActionGridContextValue = Readonly<{
  cols: number;
  gap: number;
  webCellStyle?: ViewStyle;
  nativeCardWidth?: number;
}>;

export const VionaActionGridContext = createContext<VionaActionGridContextValue | null>(null);

export type VionaActionGridProps = Readonly<{
  children: ReactNode;
  /** Width hint before first layout (e.g. dashboard `contentWidth`) so columns compute immediately. */
  widthHint?: number;
  gap?: number;
  testID?: string;
  /**
   * Account shortcuts only: when exactly four cards are visible, prefer a balanced 2×2 grid on
   * medium/wide containers instead of 3+1 on desktop.
   */
  preferTwoColumnQuartet?: boolean;
  /** Number of visible action cards (must match rendered children when using `preferTwoColumnQuartet`). */
  visibleCardCount?: number;
}>;

/**
 * Responsive column count from **container** width (not full window).
 * AF.UI.2: wide desktop = three SOS-style columns; medium = two; narrow = single column / list.
 */
function colsForContainerWidth(w: number): number {
  if (w <= 0) return 1;
  if (w >= 760) return 3;
  if (w >= 560) return 2;
  return 1;
}

function countRenderableChildren(children: ReactNode): number {
  let count = 0;
  Children.forEach(children, (child) => {
    if (child == null || child === false) return;
    count += 1;
  });
  return count;
}

function resolveColumnCount(
  w: number,
  options: Readonly<{ preferTwoColumnQuartet?: boolean; visibleCardCount?: number }>
): number {
  if (
    options.preferTwoColumnQuartet &&
    options.visibleCardCount === 4 &&
    w >= 560
  ) {
    return 2;
  }
  return colsForContainerWidth(w);
}

function webCellWidthStyle(cols: number, gap: number): ViewStyle | undefined {
  if (Platform.OS !== 'web' || cols <= 1) return undefined;
  const gaps = totalRowGapPx(cols, gap);
  const expr = `calc((100% - ${gaps}px) / ${cols})`;
  return {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: expr as ViewStyle['flexBasis'],
    minWidth: 0,
    width: expr as ViewStyle['width'],
    maxWidth: expr as ViewStyle['width'],
  };
}

export function VionaActionGrid({
  children,
  widthHint,
  gap = vionaSpacing.lg,
  testID,
  preferTwoColumnQuartet,
  visibleCardCount,
}: VionaActionGridProps): ReactElement {
  const [measuredW, setMeasuredW] = useState(0);
  const renderableChildCount = useMemo(() => countRenderableChildren(children), [children]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    setMeasuredW((prev) => (w > 0 && w !== prev ? w : prev));
  }, []);

  const effectiveW = measuredW > 0 ? measuredW : (widthHint ?? 0);
  const quartetEligible =
    preferTwoColumnQuartet === true && renderableChildCount === 4;
  const cols = resolveColumnCount(effectiveW, {
    preferTwoColumnQuartet: quartetEligible,
    visibleCardCount: quartetEligible ? 4 : (visibleCardCount ?? renderableChildCount),
  });

  const nativeCardWidth =
    Platform.OS !== 'web' && cols > 1 && effectiveW > 0
      ? (effectiveW - gap * (cols - 1)) / cols
      : undefined;

  const webCellStyle = useMemo((): ViewStyle | undefined => webCellWidthStyle(cols, gap), [cols, gap]);

  const ctx = useMemo<VionaActionGridContextValue>(
    () => ({ cols, gap, webCellStyle, nativeCardWidth }),
    [cols, gap, webCellStyle, nativeCardWidth]
  );

  return (
    <VionaActionGridContext.Provider value={ctx}>
      <View
        testID={testID}
        style={[styles.grid, cols === 1 ? styles.gridSingleCol : null, { gap }]}
        onLayout={onLayout}
      >
        {children}
      </View>
    </VionaActionGridContext.Provider>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'stretch',
    width: '100%',
    maxWidth: '100%',
  },
  gridSingleCol: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },
});
