/**
 * Shared compact situation-tile layout — aligned with Travel "Tình huống du lịch" grid metrics.
 * UI-only tokens; no business logic.
 */
import { isHubTabletPortraitViewport } from '../components/viona/fashionHomeDesktopShell';

export const VIONA_COMPACT_SITUATION_SECTION_BORDER_RADIUS_PX = 11;
export const VIONA_COMPACT_SITUATION_INLINE_GAP_PX = 7;

const CARD_HEIGHT_FULLSCREEN_PX = 40;
const CARD_HEIGHT_DESKTOP_PX = 44;
const CARD_HEIGHT_TABLET_PX = 48;
const CARD_HEIGHT_MOBILE_PX = 52;

const ROW_GAP_DESKTOP_PX = 8;
const ROW_GAP_TABLET_PX = 7;
const ROW_GAP_MOBILE_PX = 8;
const ROW_GAP_FULLSCREEN_PX = 7;

const PADDING_H_DESKTOP_PX = 12;

export type VionaCompactSituationTileLayout = Readonly<{
  columns: 2 | 3 | 4;
  gap: number;
  minCardHeight: number;
  paddingHorizontal: number;
  capsuleSize: number;
  iconSize: number;
  titleLines: 1 | 2;
}>;

export function resolveVionaCompactSituationTileLayout(
  viewportWidth: number,
  viewportHeight = 0,
  openingStageFullscreen = false
): VionaCompactSituationTileLayout {
  if (openingStageFullscreen && viewportWidth >= 1024) {
    return {
      columns: 4,
      gap: ROW_GAP_FULLSCREEN_PX,
      minCardHeight: CARD_HEIGHT_FULLSCREEN_PX,
      paddingHorizontal: PADDING_H_DESKTOP_PX,
      capsuleSize: 22,
      iconSize: 12,
      titleLines: 1,
    };
  }
  if (viewportWidth >= 1024) {
    if (isHubTabletPortraitViewport(viewportWidth, viewportHeight)) {
      return {
        columns: 2,
        gap: ROW_GAP_TABLET_PX,
        minCardHeight: CARD_HEIGHT_TABLET_PX,
        paddingHorizontal: 12,
        capsuleSize: 26,
        iconSize: 12,
        titleLines: 2,
      };
    }
    return {
      columns: 4,
      gap: ROW_GAP_DESKTOP_PX,
      minCardHeight: CARD_HEIGHT_DESKTOP_PX,
      paddingHorizontal: PADDING_H_DESKTOP_PX,
      capsuleSize: 24,
      iconSize: 12,
      titleLines: 1,
    };
  }
  if (viewportWidth >= 768) {
    return {
      columns: 4,
      gap: ROW_GAP_TABLET_PX,
      minCardHeight: CARD_HEIGHT_TABLET_PX,
      paddingHorizontal: 12,
      capsuleSize: 26,
      iconSize: 12,
      titleLines: 2,
    };
  }
  if (viewportWidth >= 520) {
    return {
      columns: 3,
      gap: ROW_GAP_MOBILE_PX,
      minCardHeight: CARD_HEIGHT_MOBILE_PX,
      paddingHorizontal: 10,
      capsuleSize: 28,
      iconSize: 13,
      titleLines: 2,
    };
  }
  return {
    columns: 2,
    gap: ROW_GAP_MOBILE_PX,
    minCardHeight: CARD_HEIGHT_MOBILE_PX,
    paddingHorizontal: 10,
    capsuleSize: 28,
    iconSize: 13,
    titleLines: 2,
  };
}

export function resolveVionaCompactSituationGridColumns(viewportWidth: number): number {
  if (viewportWidth >= 1480) return 8;
  if (viewportWidth >= 1080) return 4;
  if (viewportWidth >= 768) return 4;
  if (viewportWidth >= 520) return 3;
  return 2;
}
