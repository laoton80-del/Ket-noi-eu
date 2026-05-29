/**
 * Local opening stage — Home-like vertical rhythm (hero → cards → quick actions).
 */
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';

import { vionaTokens } from '../../../design';
import type { LocalHeroVisualKey } from '../../../design/vionaLocalHeroAssets';
import { FASHION_HOME_DESKTOP_MIN_WIDTH } from '../../../navigation/fashionHomeDesktopShell';
import {
  FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_DOCK_GAP_PX,
  FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_VIEWPORT_BOTTOM_AIR_PX,
  FASHION_HOME_WEB_OPENING_STAGE_HERO_MAX_PX,
  FASHION_HOME_WEB_OPENING_STAGE_HERO_MIN_PX,
  FASHION_HOME_WEB_OPENING_STAGE_HERO_TO_CARD_GAP_PX,
  FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_MIN_HEIGHT_PX,
} from '../fashionHomeDesktopShell';
import { LOCAL_HERO_LABEL_AWARE_MAX_BONUS_PX, LocalDynamicHero } from './LocalDynamicHero';
import {
  LOCAL_FLAGSHIP_ROW_KICKER_LINE_HEIGHT_PX,
  LOCAL_FLAGSHIP_ROW_KICKER_TO_GRID_GAP_FULLSCREEN_PX,
  LOCAL_FLAGSHIP_ROW_KICKER_TO_GRID_GAP_PX,
  LOCAL_OPENING_STAGE_FULLSCREEN_WORLD_CARD_MIN_HEIGHT_PX,
  LocalHeroCardsRow,
} from './LocalHeroCardsRow';
import { LocalQuickActionsRow } from './LocalQuickActionsRow';

/** Command rail + shell top pad (1366×768, non-fullscreen). */
const LOCAL_OPENING_STAGE_CHROME_ABOVE_PX = 76;
/** Fullscreen: command rail + hub top pad (measured ~72px at 1366×768). */
const LOCAL_OPENING_STAGE_FULLSCREEN_CHROME_ABOVE_PX = 72;
/** Matches `forYouBridgeDesktopLock` — included in first-view budget (normal web lock only). */
const LOCAL_OPENING_STAGE_NORMAL_WEB_FOR_YOU_BRIDGE_LOCK_PX = 20;
/** Normal web visual gap cards → Local cho bạn (+32px vs lock — hides title peek without shrinking hero). */
const LOCAL_OPENING_STAGE_NORMAL_WEB_FOR_YOU_BRIDGE_PX = 52;
/** Extra buffer so “Local cho bạn” title stays below fold (non-fullscreen desktop). */
const LOCAL_OPENING_STAGE_BELOW_FOLD_BUFFER_PX = 8;
/** Fullscreen rebalance — trim from desktop hero cap. */
const LOCAL_OPENING_STAGE_FULLSCREEN_HERO_MAX_TRIM_PX = 42;
/** Fullscreen: lower hero floor so viewport budget can win on 1366×768. */
const LOCAL_OPENING_STAGE_FULLSCREEN_HERO_FLOOR_OFFSET_PX = 96;
/** Fullscreen visual gap hero → “Bắt đầu tại đây” (+12px vs prior 4px — pushes cards/For You down without shrinking hero). */
const LOCAL_OPENING_STAGE_FULLSCREEN_HERO_TO_CARD_GAP_PX = 16;
/** Fullscreen lock budget gap — unchanged so dynamic hero height stays fixed. */
const LOCAL_OPENING_STAGE_FULLSCREEN_HERO_TO_CARD_LOCK_GAP_PX = 4;
/** Fullscreen visual gap cards → Local cho bạn (dense mode — lock budget fits 2 For You rows). */
const LOCAL_OPENING_STAGE_FULLSCREEN_FOR_YOU_BRIDGE_PX = 6;
/** Fullscreen lock budget bridge — unchanged so dynamic hero height stays fixed. */
const LOCAL_OPENING_STAGE_FULLSCREEN_FOR_YOU_BRIDGE_LOCK_PX = 6;
/** Fullscreen: panel peeks on first screen — not pushed below fold. */
const LOCAL_OPENING_STAGE_FULLSCREEN_BELOW_FOLD_BUFFER_PX = 4;
/** Fullscreen: reserve title + two pill rows + panel chrome. */
const LOCAL_OPENING_STAGE_FULLSCREEN_FOR_YOU_PANEL_RESERVE_PX = 148;
const LOCAL_OPENING_STAGE_DESKTOP_ROW_MIN_WIDTH = 1024;

type LocalOpeningStageFirstViewLock = Readonly<{
  stageMinHeightPx: number;
  heroMaxPx: number;
  isFullscreen: boolean;
}>;

function computeLocalOpeningStageFirstViewLock(
  width: number,
  height: number,
  isFullscreen: boolean
): LocalOpeningStageFirstViewLock | null {
  if (Platform.OS !== 'web' || width < FASHION_HOME_DESKTOP_MIN_WIDTH || height <= 0) return null;
  const compactHero = height < 520 || width / height > 1.8;
  if (compactHero) return null;

  const labelBand =
    LOCAL_FLAGSHIP_ROW_KICKER_LINE_HEIGHT_PX +
    (isFullscreen
      ? LOCAL_FLAGSHIP_ROW_KICKER_TO_GRID_GAP_FULLSCREEN_PX
      : LOCAL_FLAGSHIP_ROW_KICKER_TO_GRID_GAP_PX);
  const heroToCardGap = isFullscreen
    ? LOCAL_OPENING_STAGE_FULLSCREEN_HERO_TO_CARD_LOCK_GAP_PX
    : FASHION_HOME_WEB_OPENING_STAGE_HERO_TO_CARD_GAP_PX;
  const cardMinHeight = isFullscreen
    ? LOCAL_OPENING_STAGE_FULLSCREEN_WORLD_CARD_MIN_HEIGHT_PX
    : FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_MIN_HEIGHT_PX;
  const stackBelowHeroPx = heroToCardGap + labelBand + cardMinHeight;

  const chromeAbove = isFullscreen
    ? LOCAL_OPENING_STAGE_FULLSCREEN_CHROME_ABOVE_PX
    : LOCAL_OPENING_STAGE_CHROME_ABOVE_PX;
  const forYouBridge = isFullscreen
    ? LOCAL_OPENING_STAGE_FULLSCREEN_FOR_YOU_BRIDGE_LOCK_PX
    : LOCAL_OPENING_STAGE_NORMAL_WEB_FOR_YOU_BRIDGE_LOCK_PX;
  const belowFoldBuffer = isFullscreen
    ? LOCAL_OPENING_STAGE_FULLSCREEN_BELOW_FOLD_BUFFER_PX
    : LOCAL_OPENING_STAGE_BELOW_FOLD_BUFFER_PX;
  const bottomReserve = isFullscreen
    ? LOCAL_OPENING_STAGE_FULLSCREEN_FOR_YOU_PANEL_RESERVE_PX +
      FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_DOCK_GAP_PX +
      FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_VIEWPORT_BOTTOM_AIR_PX
    : 0;

  const contentBudget = Math.max(
    360,
    height - chromeAbove - forYouBridge - belowFoldBuffer - bottomReserve
  );
  const heroCap =
    FASHION_HOME_WEB_OPENING_STAGE_HERO_MAX_PX +
    LOCAL_HERO_LABEL_AWARE_MAX_BONUS_PX -
    (isFullscreen ? LOCAL_OPENING_STAGE_FULLSCREEN_HERO_MAX_TRIM_PX : 0);
  const heroFloorOffset = isFullscreen
    ? LOCAL_OPENING_STAGE_FULLSCREEN_HERO_FLOOR_OFFSET_PX
    : 48;
  const heroBudgetPx = contentBudget - stackBelowHeroPx;
  const heroMaxPx = Math.min(
    heroCap,
    Math.max(FASHION_HOME_WEB_OPENING_STAGE_HERO_MIN_PX - heroFloorOffset, heroBudgetPx)
  );

  const minHeroLockPx = isFullscreen ? 332 : 360;
  if (heroMaxPx < minHeroLockPx) return null;

  const lock: LocalOpeningStageFirstViewLock = {
    stageMinHeightPx: contentBudget,
    heroMaxPx,
    isFullscreen,
  };

  if (width >= LOCAL_OPENING_STAGE_DESKTOP_ROW_MIN_WIDTH || isFullscreen) {
    return lock;
  }

  if (heroBudgetPx < heroCap) {
    return { ...lock, stageMinHeightPx: stackBelowHeroPx + heroMaxPx };
  }

  return null;
}

export type LocalOpeningStageLayoutProps = Readonly<{
  /** @deprecated Ignored — Local opening visuals are theme-invariant premium glass. */
  daylight?: boolean;
  onBrowseServices: () => void;
  onBookingAssist: () => void;
  onMyRequests: () => void;
  onLegalWealth: () => void;
  onRestaurants: () => void;
  onTransit: () => void;
  onRentals: () => void;
  onClassifieds: () => void;
  onNailsSpa: () => void;
  onCommunityEvents: () => void;
  onAiReceptionist: () => void;
  onLanguageAssist: () => void;
  /** Web desktop browser fullscreen — tighter stage budget (Home opening-stage parity). */
  openingStageFullscreen?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}>;

export function LocalOpeningStageLayout({
  onBrowseServices,
  onBookingAssist,
  onMyRequests,
  onLegalWealth,
  onRestaurants,
  onTransit,
  onRentals,
  onClassifieds,
  onNailsSpa,
  onCommunityEvents,
  onAiReceptionist,
  onLanguageAssist,
  openingStageFullscreen = false,
  style,
  testID = 'local-opening-stage',
}: LocalOpeningStageLayoutProps): ReactElement {
  const { width, height } = useWindowDimensions();
  const [activeHeroKey, setActiveHeroKey] = useState<LocalHeroVisualKey>('default');
  const onHeroCardLeave = useCallback(() => setActiveHeroKey('default'), []);
  const firstViewLock = useMemo(
    () => computeLocalOpeningStageFirstViewLock(width, height, openingStageFullscreen),
    [width, height, openingStageFullscreen]
  );
  const desktopStageLock =
    firstViewLock != null &&
    (width >= LOCAL_OPENING_STAGE_DESKTOP_ROW_MIN_WIDTH || openingStageFullscreen);

  return (
    <View testID={testID} style={[styles.root, openingStageFullscreen && styles.rootFullscreen, style]}>
      <View
        style={[
          styles.openingStage,
          desktopStageLock && { minHeight: firstViewLock.stageMinHeightPx },
        ]}
      >
        <LocalDynamicHero
          activeHeroKey={activeHeroKey}
          openingStageHeroMaxPx={firstViewLock?.heroMaxPx}
          onBrowseServices={onBrowseServices}
          onBookingAssist={onBookingAssist}
        />
        <View
          style={[
            styles.heroCardsBridge,
            openingStageFullscreen && styles.heroCardsBridgeFullscreen,
          ]}
        >
          <LocalHeroCardsRow
            openingStageFullscreen={openingStageFullscreen}
            hoveredHeroKey={activeHeroKey}
            onMyRequests={onMyRequests}
            onBookingAssist={onBookingAssist}
            onLegalWealth={onLegalWealth}
            onBrowseServices={onBrowseServices}
            onHeroCardHover={setActiveHeroKey}
            onHeroCardLeave={onHeroCardLeave}
          />
        </View>
      </View>
      <View
        style={[
          styles.forYouBridge,
          desktopStageLock && !openingStageFullscreen && styles.forYouBridgeNormalWebLock,
          openingStageFullscreen && styles.forYouBridgeFullscreenLock,
        ]}
      >
        <LocalQuickActionsRow
          onRestaurants={onRestaurants}
          onTransit={onTransit}
          onRentals={onRentals}
          onClassifieds={onClassifieds}
          onNailsSpa={onNailsSpa}
          onCommunityEvents={onCommunityEvents}
          onAiReceptionist={onAiReceptionist}
          onLanguageAssist={onLanguageAssist}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    marginBottom: vionaTokens.spacing[16],
  },
  rootFullscreen: {
    marginBottom: 0,
  },
  openingStage: {
    width: '100%',
    minWidth: 0,
  },
  /** Home opening-stage hero → flagship kicker gap (6px). */
  heroCardsBridge: {
    marginTop: FASHION_HOME_WEB_OPENING_STAGE_HERO_TO_CARD_GAP_PX,
  },
  heroCardsBridgeFullscreen: {
    marginTop: LOCAL_OPENING_STAGE_FULLSCREEN_HERO_TO_CARD_GAP_PX,
  },
  /** Cards → Local cho bạn — below the locked opening stage on desktop. */
  forYouBridge: {
    marginTop: vionaTokens.spacing[16],
  },
  /** Cards → Local cho bạn — below the locked opening stage on desktop (normal web only). */
  forYouBridgeNormalWebLock: {
    marginTop: LOCAL_OPENING_STAGE_NORMAL_WEB_FOR_YOU_BRIDGE_PX,
  },
  forYouBridgeFullscreenLock: {
    marginTop: LOCAL_OPENING_STAGE_FULLSCREEN_FOR_YOU_BRIDGE_PX,
  },
});
