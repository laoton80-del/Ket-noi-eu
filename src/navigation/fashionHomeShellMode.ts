import type { ActiveRole } from '../store/userStore';
import type { RootTabParamList } from './routes';
import { MAIN_TAB } from './routes';

/**
 * Explicit Fashion-Tech Home shell mode classification.
 *
 * Phase A: `desktop` drives Fashion-Tech desktop rendering via `isFashionHomeDesktopShell`.
 * Phase B: `mobile` / `tablet` activate adaptive Fashion-Tech **web** composition in HomeScreen
 * while keeping `isFashionHomeDesktopShell` false (tabs + SOS/Profile chrome remain).
 * Native and non-B2C Home remain `legacy`.
 */
export type FashionHomeShellMode = 'legacy' | 'mobile' | 'tablet' | 'desktop';

/** Phase B — adaptive Fashion-Tech Home composition on eligible mobile/tablet **web**. */
export function isFashionHomeAdaptiveWebComposition(mode: FashionHomeShellMode): boolean {
  return mode === 'mobile' || mode === 'tablet';
}

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
 * - `desktop` — Fashion-Tech desktop web render (width ≥ 769, web, B2C Home)
 * - `tablet` — adaptive Fashion-Tech tablet web (typically width 768); tabs remain visible
 * - `mobile` — adaptive Fashion-Tech mobile web (width &lt; 768); tabs remain visible
 * - `legacy` — native, non-B2C, non-Home, or otherwise ineligible
 */
export function resolveFashionHomeShellMode(input: FashionHomeShellModeInput): FashionHomeShellMode {
  if (isFashionHomeDesktopEligible(input)) {
    return 'desktop';
  }

  // Phase B: mobile/tablet modes classify eligible web B2C Home for adaptive composition.
  if (input.platform === 'web' && input.activeRole === 'B2C' && isB2CHomeSurface(input)) {
    if (input.windowWidth >= FASHION_HOME_TABLET_MIN_WIDTH) {
      return 'tablet';
    }
    return 'mobile';
  }

  return 'legacy';
}
