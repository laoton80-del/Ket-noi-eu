import type { ActiveRole } from '../store/userStore';
import type { RootTabParamList } from './routes';
import { MAIN_TAB } from './routes';

/**
 * Explicit Fashion-Tech Home shell mode classification.
 *
 * Phase A: only `desktop` drives rendering (via `isFashionHomeDesktopShell`).
 * `mobile` / `tablet` are source-derived metadata for later activation packs —
 * they must not change visible Home composition in this foundation.
 */
export type FashionHomeShellMode = 'legacy' | 'mobile' | 'tablet' | 'desktop';

/**
 * Desktop Fashion-Tech render gate — must stay equal to
 * `FASHION_HOME_DESKTOP_MIN_WIDTH` in `fashionHomeDesktopShell.ts`.
 * Duplicated here to avoid a circular module dependency.
 */
const FASHION_HOME_DESKTOP_RENDER_MIN_WIDTH = 769;

/**
 * Tablet-band start for web B2C Home metadata (activation plan + Phase-A matrix).
 * Desktop rendering remains gated at 769.
 */
export const FASHION_HOME_TABLET_MIN_WIDTH = 768;

export type FashionHomeShellModeInput = Readonly<{
  platform: string;
  windowWidth: number;
  activeRole: ActiveRole;
  focusedTabRoute: keyof RootTabParamList | undefined;
}>;

function isB2CHomeSurface(input: Readonly<{
  focusedTabRoute: keyof RootTabParamList | undefined;
}>): boolean {
  if (input.focusedTabRoute == null) {
    const maybeLocation = (globalThis as { location?: { pathname?: string } }).location;
    const pathname = maybeLocation?.pathname?.toLowerCase() ?? '';
    return pathname === '/home' || pathname.endsWith('/home');
  }
  return input.focusedTabRoute === MAIN_TAB.B2C.home;
}

/**
 * Whether the **current** Fashion-Tech **desktop** render path is eligible.
 * Preserves pre-Phase-A `isFashionHomeDesktopShell` semantics exactly
 * (including `NaN` width not failing the `< 769` check).
 */
function isFashionHomeDesktopEligible(input: FashionHomeShellModeInput): boolean {
  if (input.platform !== 'web') return false;
  if (input.windowWidth < FASHION_HOME_DESKTOP_RENDER_MIN_WIDTH) return false;
  if (input.activeRole !== 'B2C') return false;
  return isB2CHomeSurface(input);
}

/**
 * Semantic Home shell-mode resolver.
 *
 * - `desktop` — current Fashion-Tech desktop web render (width ≥ 769, web, B2C Home)
 * - `tablet` — web B2C Home metadata at width ≥ 768 when not desktop (typically 768); non-rendering in Phase A
 * - `mobile` — web B2C Home metadata below 768; non-rendering in Phase A
 * - `legacy` — native, non-B2C, non-Home, or otherwise ineligible
 */
export function resolveFashionHomeShellMode(input: FashionHomeShellModeInput): FashionHomeShellMode {
  if (isFashionHomeDesktopEligible(input)) {
    return 'desktop';
  }

  // Metadata-only classifications for future mobile-web / tablet packs.
  if (input.platform === 'web' && input.activeRole === 'B2C' && isB2CHomeSurface(input)) {
    if (input.windowWidth >= FASHION_HOME_TABLET_MIN_WIDTH) {
      return 'tablet';
    }
    return 'mobile';
  }

  return 'legacy';
}
