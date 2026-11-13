/**
 * Phase 2-A — Travel presentation-target mapping.
 *
 * Shared logic mapper (not native UI, not Travel domain owner).
 * Selects which presentation owner mounts. Does not restyle Travel.
 * Does not reuse or modify `homePresentationTarget.ts`.
 *
 * Web-desktop uses Travel's existing flagship desktop threshold (1024).
 * Native never returns web-desktop / web-adaptive.
 */

export type TravelPresentationTarget =
  | 'web-desktop'
  | 'web-adaptive'
  | 'native-adaptive'
  | 'legacy';

/** Matches `TRAVEL_FLAGSHIP_DESKTOP_ROW_MIN_WIDTH` in TravelScreen (web desktop row). */
export const TRAVEL_WEB_DESKTOP_MIN_WIDTH = 1024;

export type TravelPresentationTargetInput = Readonly<{
  platform: string;
  windowWidth: number;
}>;

export function resolveTravelPresentationTarget(
  input: TravelPresentationTargetInput
): TravelPresentationTarget {
  if (input.platform === 'ios' || input.platform === 'android') {
    return 'native-adaptive';
  }

  if (input.platform === 'web') {
    if (input.windowWidth >= TRAVEL_WEB_DESKTOP_MIN_WIDTH) {
      return 'web-desktop';
    }
    return 'web-adaptive';
  }

  return 'legacy';
}
