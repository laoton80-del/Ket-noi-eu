import { useCallback, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import {
  VionaNativeLocalContextHero,
  type VionaNativeLocalContextHeroProps,
} from './VionaNativeLocalContextHero';
import {
  VionaNativeLocalFlagshipActions,
  type VionaNativeLocalFlagshipActionsProps,
} from './VionaNativeLocalFlagshipActions';
import {
  VionaNativeLocalSecondaryStack,
  type VionaNativeLocalSecondaryStackProps,
} from './VionaNativeLocalSecondaryStack';
import {
  VionaNativeLocalUtilityActions,
  type VionaNativeLocalUtilityActionsProps,
} from './VionaNativeLocalUtilityActions';

export type NativeLocalLayoutInput = Readonly<{
  mode: 'mobile' | 'tablet';
  isLandscape: boolean;
  reduceMotion: boolean;
}>;

export type VionaNativeLocalClearPremiumCompositionProps = Readonly<{
  layout: NativeLocalLayoutInput;
  context: Omit<VionaNativeLocalContextHeroProps, 'reduceMotion' | 'imageHeight' | 'compact'>;
  flagship: Omit<
    VionaNativeLocalFlagshipActionsProps,
    'reduceMotion' | 'columns' | 'tileWidth' | 'compact' | 'shortTile' | 'imageHeight'
  >;
  utility: Omit<VionaNativeLocalUtilityActionsProps, 'reduceMotion' | 'columns' | 'tileWidth'>;
  secondary: Omit<VionaNativeLocalSecondaryStackProps, 'reduceMotion' | 'contentWidth' | 'widePair'>;
}>;

export type NativeLocalGridColumns = 1 | 2 | 3 | 4;

/** Gap between Local native tiles. Source-backed from P3-B `tkn.spacing[8]`. */
export const LOCAL_NATIVE_TILE_GAP = tkn.spacing[8];
/** Minimum Local native tile width from P3-B `minWidth: 148`. */
export const LOCAL_NATIVE_MIN_TILE_WIDTH = 148;
/** Two-column fit: 148 * 2 + 8. */
export const LOCAL_NATIVE_TWO_COL_MIN_WIDTH = 304;
/** Three-column fit: 148 * 3 + 16. */
export const LOCAL_NATIVE_THREE_COL_MIN_WIDTH = 460;
/** Four-column fit: 148 * 4 + 24. */
export const LOCAL_NATIVE_FOUR_COL_MIN_WIDTH = 616;
/**
 * Landscape vertical density uses measured content width, not `mode === 'mobile'`.
 * Typical phone-landscape rail is below this; typical tablet-landscape rail is above.
 */
export const LOCAL_NATIVE_COMPACT_LANDSCAPE_MAX_CONTENT_WIDTH = 900;

/**
 * Column count follows measured Local composition content width W.
 * 1-col: W < 148 (and any W < 304). 2-col: W >= 304. 3-col: W >= 460. 4-col: W >= 616.
 * `layout.mode === 'tablet'` alone is NOT sufficient. Device labels are not column authority.
 */
export function resolveNativeLocalGridColumns(contentWidth: number): NativeLocalGridColumns {
  if (contentWidth <= 0) return 2;
  if (contentWidth >= LOCAL_NATIVE_FOUR_COL_MIN_WIDTH) return 4;
  if (contentWidth >= LOCAL_NATIVE_THREE_COL_MIN_WIDTH) return 3;
  if (contentWidth >= LOCAL_NATIVE_TWO_COL_MIN_WIDTH) return 2;
  return 1;
}

/**
 * Genuine landscape compact density: isLandscape + measured W.
 * Must not use `mode === 'mobile' && isLandscape` as the sole signal — phone landscape
 * width may already classify as tablet.
 * Tablet landscape (wide measured W) is not maximally compact.
 */
export function resolveNativeLocalCompactLandscape(
  contentWidth: number,
  isLandscape: boolean
): boolean {
  if (!isLandscape) return false;
  if (contentWidth <= 0) return true;
  return contentWidth < LOCAL_NATIVE_COMPACT_LANDSCAPE_MAX_CONTENT_WIDTH;
}

export function tileWidthForNativeLocalColumns(
  contentWidth: number,
  columns: number,
  gap: number = LOCAL_NATIVE_TILE_GAP
): number {
  if (contentWidth <= 0 || columns <= 0) return 0;
  return Math.max(tkn.hit.min, Math.floor((contentWidth - gap * (columns - 1)) / columns));
}

/**
 * Native-only Local Clear Premium layout owner (P3-B composition + P3-C responsive refinement).
 * Presentation only. No domain, SOS host, Account chrome, search engine, or commercial mutation.
 * Canonical signal: onLayout measured content width + layout.isLandscape + layout.reduceMotion.
 * PHONE PORTRAIT / PHONE LANDSCAPE / TABLET PORTRAIT / TABLET LANDSCAPE are layout branches.
 * Source assertions do not prove visual GREEN.
 * Final accessibility/regression/Phase 3 closure is not claimed.
 */
export function VionaNativeLocalClearPremiumComposition({
  layout,
  context,
  flagship,
  utility,
  secondary,
}: VionaNativeLocalClearPremiumCompositionProps) {
  const [contentWidth, setContentWidth] = useState(0);

  const onWidthLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next <= 0) return;
    setContentWidth((prev) => (prev === next ? prev : next));
  }, []);

  const columns = resolveNativeLocalGridColumns(contentWidth);
  const compactLandscape = resolveNativeLocalCompactLandscape(contentWidth, layout.isLandscape);
  const widePair = !compactLandscape && contentWidth >= LOCAL_NATIVE_FOUR_COL_MIN_WIDTH;
  const tileWidth = tileWidthForNativeLocalColumns(contentWidth, columns);
  const heroImageHeight = compactLandscape ? 72 : 132;
  const flagshipImageHeight = compactLandscape ? 36 : 56;

  return (
    <View
      testID="viona-native-local-clear-premium-composition"
      style={[styles.root, compactLandscape && styles.rootCompact]}
      collapsable={false}
    >
      <View
        testID="viona-native-local-clear-premium-measure"
        style={styles.measure}
        collapsable={false}
        onLayout={onWidthLayout}
      >
        <VionaNativeLocalContextHero
          {...context}
          reduceMotion={layout.reduceMotion}
          imageHeight={heroImageHeight}
          compact={compactLandscape}
        />
        <VionaNativeLocalFlagshipActions
          {...flagship}
          reduceMotion={layout.reduceMotion}
          columns={columns}
          tileWidth={tileWidth}
          compact={compactLandscape}
          shortTile={compactLandscape}
          imageHeight={flagshipImageHeight}
        />
        <VionaNativeLocalUtilityActions
          {...utility}
          reduceMotion={layout.reduceMotion}
          columns={columns}
          tileWidth={tileWidth}
        />
        <VionaNativeLocalSecondaryStack
          {...secondary}
          reduceMotion={layout.reduceMotion}
          contentWidth={contentWidth}
          widePair={widePair}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: tkn.bg.canvas,
    paddingBottom: tkn.spacing[8],
  },
  rootCompact: {
    paddingBottom: tkn.spacing[4],
  },
  measure: {
    width: '100%',
  },
});
