/**
 * Phase 3-A — Local presentation-target mapping.
 *
 * Shared logic mapper (not native UI, not Local domain owner).
 * Selects which presentation owner mounts. Does not restyle Local.
 * Does not reuse or modify `homePresentationTarget.ts` or `travelPresentationTarget.ts`.
 *
 * Web-desktop uses Local's existing `desktopWeb` threshold (`width > 768`).
 * Native never returns web-desktop / web-adaptive.
 */

export type LocalPresentationTarget =
  | 'web-desktop'
  | 'web-adaptive'
  | 'native-adaptive'
  | 'legacy';

/** Matches `desktopWeb` in LocalScreen (`Platform.OS === 'web' && width > 768`). */
export const LOCAL_WEB_DESKTOP_WIDTH_EXCLUSIVE = 768;

export type LocalPresentationTargetInput = Readonly<{
  platform: string;
  windowWidth: number;
}>;

export function resolveLocalPresentationTarget(
  input: LocalPresentationTargetInput
): LocalPresentationTarget {
  if (input.platform === 'ios' || input.platform === 'android') {
    return 'native-adaptive';
  }

  if (input.platform === 'web') {
    if (input.windowWidth > LOCAL_WEB_DESKTOP_WIDTH_EXCLUSIVE) {
      return 'web-desktop';
    }
    return 'web-adaptive';
  }

  return 'legacy';
}
