import type { ActiveRole } from '../store/userStore';
import type { RootTabParamList } from './routes';
import { MAIN_TAB } from './routes';

/**
 * Explicit Fashion-Tech Home shell mode classification.
 *
 * Phase A: `desktop` drives Fashion-Tech desktop rendering via `isFashionHomeDesktopShell`
 * (web-only, width ≥ 769).
 * Phase B: `mobile` / `tablet` activate adaptive Fashion-Tech on eligible **web** B2C Home
 * while keeping `isFashionHomeDesktopShell` false (tabs + SOS/Profile chrome remain).
 * Phase C: eligible **native** iOS/Android B2C Home also resolve to `mobile` / `tablet`
 * and reuse the same adaptive composition (SHARED_ADAPTIVE_NATIVE_REUSE).
 */
export type FashionHomeShellMode = 'legacy' | 'mobile' | 'tablet' | 'desktop';

/**
 * Adaptive Fashion-Tech Home composition (Phase B web + Phase C native).
 * True when mode is `mobile` or `tablet` — never `desktop` / `legacy`.
 */
export function isFashionHomeAdaptiveComposition(mode: FashionHomeShellMode): boolean {
  return mode === 'mobile' || mode === 'tablet';
}

/**
 * @deprecated Prefer `isFashionHomeAdaptiveComposition` (Phase C). Same predicate.
 * Kept for Phase-B test / call-site compatibility.
 */
export function isFashionHomeAdaptiveWebComposition(mode: FashionHomeShellMode): boolean {
  return isFashionHomeAdaptiveComposition(mode);
}

/**
 * Desktop Fashion-Tech render gate — must stay equal to
 * `FASHION_HOME_DESKTOP_MIN_WIDTH` in `fashionHomeDesktopShell.ts`.
 * Duplicated here to avoid a circular module dependency.
 */
const FASHION_HOME_DESKTOP_RENDER_MIN_WIDTH = 769;

/**
 * Tablet-band start for B2C Home adaptive composition (activation plan + Phase-A matrix).
 * Desktop rendering remains gated at 769 and **web-only**.
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

function isAdaptivePlatform(platform: string): boolean {
  return platform === 'web' || platform === 'ios' || platform === 'android';
}

/**
 * Whether the **current** Fashion-Tech **desktop** render path is eligible.
 * Preserves pre-Phase-A `isFashionHomeDesktopShell` semantics exactly
 * (including `NaN` width not failing the `< 769` check).
 * Desktop remains **web-only** after Phase C.
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
 * - `desktop` — Fashion-Tech desktop **web** render (width ≥ 769, web, B2C Home)
 * - `tablet` — adaptive Fashion-Tech (web or native) at width ≥ 768 when not desktop
 * - `mobile` — adaptive Fashion-Tech (web or native) below 768
 * - `legacy` — non-B2C, non-Home, or otherwise ineligible
 */
export function resolveFashionHomeShellMode(input: FashionHomeShellModeInput): FashionHomeShellMode {
  if (isFashionHomeDesktopEligible(input)) {
    return 'desktop';
  }

  // Phase B (web) + Phase C (native): adaptive mobile/tablet for eligible B2C Home.
  // Desktop remains web-only; native never enters `desktop`.
  if (
    isAdaptivePlatform(input.platform) &&
    input.activeRole === 'B2C' &&
    isB2CHomeSurface(input)
  ) {
    if (input.windowWidth >= FASHION_HOME_TABLET_MIN_WIDTH) {
      return 'tablet';
    }
    return 'mobile';
  }

  return 'legacy';
}
