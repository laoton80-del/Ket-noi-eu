/**
 * Phase 4-B1 — Account / PersonalHub presentation-target mapping.
 *
 * Shared logic mapper (not native UI, not Account domain owner).
 * Selects which presentation host wraps current PersonalHub children.
 * Does not restyle PersonalHub. Does not mount Clear Premium composition.
 * Does not reuse or modify Home, Travel, or Local presentation mappers.
 *
 * Web-desktop uses Account's existing backdrop cue (`Platform.OS === 'web' && width > 768`).
 * Native never returns web-desktop / web-adaptive.
 */

export type AccountPresentationTarget =
  | 'web-desktop'
  | 'web-adaptive'
  | 'native-adaptive'
  | 'legacy';

/** Matches `accountBackdropOpacity` in CaNhanScreen (`Platform.OS === 'web' && width > 768`). */
export const ACCOUNT_WEB_DESKTOP_WIDTH_EXCLUSIVE = 768;

export type AccountPresentationTargetInput = Readonly<{
  platform: string;
  windowWidth: number;
}>;

export function resolveAccountPresentationTarget(
  input: AccountPresentationTargetInput
): AccountPresentationTarget {
  if (input.platform === 'ios' || input.platform === 'android') {
    return 'native-adaptive';
  }

  if (input.platform === 'web') {
    if (input.windowWidth > ACCOUNT_WEB_DESKTOP_WIDTH_EXCLUSIVE) {
      return 'web-desktop';
    }
    return 'web-adaptive';
  }

  return 'legacy';
}
