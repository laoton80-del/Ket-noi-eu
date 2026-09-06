import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import { FontFamily } from '../../../theme/typography';
import {
  VionaNativeTravelContextStrip,
  type NativeTravelContextDensity,
  type NativeTravelDemoPlacement,
  type NativeTravelGateMode,
  type VionaNativeTravelContextStripProps,
} from './VionaNativeTravelContextStrip';
import {
  VionaNativeTravelFlagshipActions,
  type VionaNativeTravelFlagshipActionsProps,
} from './VionaNativeTravelFlagshipActions';
import {
  VionaNativeTravelSecondaryStack,
  type VionaNativeTravelSecondaryStackProps,
} from './VionaNativeTravelSecondaryStack';
import {
  VionaNativeTravelUtilityActions,
  type VionaNativeTravelUtilityActionsProps,
} from './VionaNativeTravelUtilityActions';

export type NativeTravelLayoutInput = Readonly<{
  mode: 'mobile' | 'tablet';
  isLandscape: boolean;
  reduceMotion: boolean;
}>;

export type VionaNativeTravelClearPremiumCompositionProps = Readonly<{
  layout: NativeTravelLayoutInput;
  gate: NativeTravelGateMode;
  context: VionaNativeTravelContextStripProps;
  flagship: Omit<VionaNativeTravelFlagshipActionsProps, 'fourAcross' | 'reduceMotion' | 'tileWidth' | 'compact' | 'shortTile' | 'imageHeight'>;
  utility: Omit<VionaNativeTravelUtilityActionsProps, 'columns' | 'reduceMotion' | 'tileWidth'>;
  secondary: Omit<VionaNativeTravelSecondaryStackProps, 'reduceMotion' | 'contentWidth' | 'wide' | 'lensImageHeight'>;
}>;

const FLAGSHIP_GAP = tkn.spacing[8];
const FLAGSHIP_FOUR_MIN_TILE = 140;
const FLAGSHIP_FOUR_MIN_TILE_LANDSCAPE = 112;
const UTILITY_GAP = tkn.spacing[8];
const UTILITY_MIN_TILE = 148;
const PORTRAIT_FOUR_ACROSS_FLOOR = 640;

/**
 * P2-C: content-width measurement participates; mode==='tablet' alone is NOT sufficient for four-across.
 * Source assertions do not prove visual GREEN.
 */
export function resolveNativeTravelFlagshipFourAcross(
  contentWidth: number,
  layout: NativeTravelLayoutInput
): boolean {
  if (contentWidth <= 0) return false;
  const minTile = layout.isLandscape ? FLAGSHIP_FOUR_MIN_TILE_LANDSCAPE : FLAGSHIP_FOUR_MIN_TILE;
  const required = 4 * minTile + 3 * FLAGSHIP_GAP;
  if (contentWidth < required) return false;
  if (!layout.isLandscape && contentWidth < PORTRAIT_FOUR_ACROSS_FLOOR) return false;
  return true;
}

export function resolveNativeTravelUtilityColumns(
  contentWidth: number,
  layout: NativeTravelLayoutInput
): 2 | 3 | 4 {
  if (contentWidth <= 0 || !layout.isLandscape) return 2;
  if (contentWidth >= 4 * UTILITY_MIN_TILE + 3 * UTILITY_GAP) return 4;
  if (contentWidth >= 3 * UTILITY_MIN_TILE + 2 * UTILITY_GAP) return 3;
  return 2;
}

function tileWidthForColumns(contentWidth: number, columns: number, gap: number): number {
  if (contentWidth <= 0 || columns <= 0) return 0;
  return Math.max(tkn.hit.min, Math.floor((contentWidth - gap * (columns - 1)) / columns));
}

/**
 * Native-only Travel Clear Premium layout owner (P2-B composition + P2-C responsive refinement).
 * Presentation only. No domain, SOS provider, Account chrome, navigation, or AI runtime.
 * Final accessibility and regression closure is not claimed.
 */
export function VionaNativeTravelClearPremiumComposition({
  layout,
  gate,
  context,
  flagship,
  utility,
  secondary,
}: VionaNativeTravelClearPremiumCompositionProps) {
  const [contentWidth, setContentWidth] = useState(0);

  const onWidthLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next <= 0) return;
    setContentWidth((prev) => (prev === next ? prev : next));
  }, []);

  const fourAcross = resolveNativeTravelFlagshipFourAcross(contentWidth, layout);
  const utilityColumns = resolveNativeTravelUtilityColumns(contentWidth, layout);
  const phonePortrait = !layout.isLandscape && (contentWidth === 0 ? layout.mode === 'mobile' : contentWidth < 480);
  const phoneLandscape =
    layout.isLandscape && (contentWidth === 0 ? layout.mode === 'mobile' : contentWidth < 800);
  const compactLandscape = phoneLandscape;
  const tabletLandscape = layout.isLandscape && contentWidth >= 800;

  const contextDensity: NativeTravelContextDensity = tabletLandscape
    ? 'wide'
    : compactLandscape
      ? 'compactRow'
      : phonePortrait
        ? 'compact'
        : 'regular';
  const demoPlacement: NativeTravelDemoPlacement = phonePortrait ? 'deferred' : 'inline';

  const flagshipImageHeight = compactLandscape ? 28 : phonePortrait ? 56 : fourAcross ? 64 : 56;
  const lensImageHeight = compactLandscape ? 48 : tabletLandscape ? 88 : 64;
  const flagshipTileWidth = tileWidthForColumns(contentWidth, fourAcross ? 4 : 2, FLAGSHIP_GAP);
  const utilityTileWidth = tileWidthForColumns(contentWidth, utilityColumns, UTILITY_GAP);

  const contextProps = useMemo(
    () => ({
      ...context,
      gate,
      density: contextDensity,
      demoPlacement,
    }),
    [context, contextDensity, demoPlacement, gate]
  );

  return (
    <View
      testID="viona-native-travel-clear-premium-composition"
      style={styles.root}
      collapsable={false}
      onLayout={onWidthLayout}
    >
      <ScrollView
        testID="viona-native-travel-clear-premium-scroll"
        contentContainerStyle={[styles.scroll, phonePortrait && styles.scrollCompact]}
        keyboardShouldPersistTaps="handled"
      >
        <View
          testID="viona-native-travel-clear-premium-measure"
          style={styles.measure}
          collapsable={false}
          onLayout={onWidthLayout}
        >
          <VionaNativeTravelContextStrip {...contextProps} />
          {gate === 'ready' ? (
            <>
              <VionaNativeTravelFlagshipActions
                {...flagship}
                fourAcross={fourAcross}
                reduceMotion={layout.reduceMotion}
                tileWidth={flagshipTileWidth}
                compact={compactLandscape || phonePortrait}
                shortTile={compactLandscape}
                imageHeight={flagshipImageHeight}
              />
              {compactLandscape ? <View style={styles.landscapeClearance} /> : null}
              {demoPlacement === 'deferred' ? (
                <View
                  testID="viona-native-travel-context-demo-deferred"
                  style={styles.deferredDemo}
                  accessibilityLabel={`${context.weatherLine} ${context.fxLine}`}
                >
                  <Text style={styles.demoLine}>{context.weatherLine}</Text>
                  <Text style={styles.demoLine}>{context.fxLine}</Text>
                </View>
              ) : null}
              <VionaNativeTravelUtilityActions
                {...utility}
                columns={utilityColumns}
                reduceMotion={layout.reduceMotion}
                tileWidth={utilityTileWidth}
              />
              <VionaNativeTravelSecondaryStack
                {...secondary}
                reduceMotion={layout.reduceMotion}
                contentWidth={contentWidth}
                wide={tabletLandscape}
                lensImageHeight={lensImageHeight}
              />
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: tkn.bg.canvas,
  },
  scroll: {
    paddingHorizontal: tkn.spacing[16],
    paddingTop: tkn.spacing[12],
    paddingBottom: tkn.spacing[32],
    width: '100%',
  },
  scrollCompact: {
    paddingHorizontal: tkn.spacing[12],
    paddingTop: tkn.spacing[8],
    paddingBottom: tkn.spacing[24],
  },
  measure: {
    width: '100%',
  },
  deferredDemo: {
    marginBottom: tkn.spacing[12],
    paddingHorizontal: tkn.spacing[4],
    gap: tkn.spacing[4],
  },
  landscapeClearance: {
    height: tkn.spacing[32],
  },
  demoLine: {
    fontFamily: FontFamily.regular,
    color: tkn.ink.secondary,
    fontSize: tkn.type.meta.fontSize,
    lineHeight: tkn.type.meta.lineHeight,
  },
});
