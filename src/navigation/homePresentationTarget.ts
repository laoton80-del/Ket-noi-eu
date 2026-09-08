import type { FashionHomeShellMode } from './fashionHomeShellMode';

/**
 * Phase 0 — Home visual-owner mapping.
 *
 * Shell-mode remains layout eligibility (`legacy | mobile | tablet | desktop`).
 * Presentation target selects which opening-stage owner mounts.
 * Does not re-derive width, role, or focused-tab breakpoints.
 */
export type HomePresentationTarget =
  | 'web-desktop'
  | 'web-adaptive'
  | 'native-adaptive'
  | 'legacy';

export type HomePresentationTargetInput = Readonly<{
  platform: string;
  shellMode: FashionHomeShellMode;
}>;

export function resolveHomePresentationTarget(
  input: HomePresentationTargetInput
): HomePresentationTarget {
  if (input.shellMode === 'legacy') {
    return 'legacy';
  }

  // Native never returns web-desktop, including a defensive desktop shell-mode.
  if (input.platform === 'ios' || input.platform === 'android') {
    return 'native-adaptive';
  }

  if (input.platform === 'web') {
    if (input.shellMode === 'desktop') {
      return 'web-desktop';
    }
    if (input.shellMode === 'mobile' || input.shellMode === 'tablet') {
      return 'web-adaptive';
    }
  }

  return 'legacy';
}
