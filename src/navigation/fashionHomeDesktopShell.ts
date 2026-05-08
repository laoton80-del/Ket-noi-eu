import type { NavigationState } from '@react-navigation/native';
import { Platform } from 'react-native';

import type { ActiveRole } from '../store/userStore';
import { MAIN_TAB, type RootTabParamList } from './routes';

/** Matches `Platform.OS === 'web' && width > 768` used across hub shell code. */
export const FASHION_HOME_DESKTOP_MIN_WIDTH = 769;

const TAB_ROUTE_NAMES = [
  MAIN_TAB.B2C.home,
  MAIN_TAB.B2C.local,
  MAIN_TAB.B2C.travel,
  MAIN_TAB.B2C.ai,
  MAIN_TAB.B2B.merchant,
  MAIN_TAB.B2B.catalog,
  MAIN_TAB.B2B.orders,
  MAIN_TAB.B2B.earnings,
  MAIN_TAB.BROKER.radar,
  MAIN_TAB.BROKER.merchants,
  MAIN_TAB.BROKER.qr,
  MAIN_TAB.BROKER.commissions,
  MAIN_TAB.BROKER.wallet,
  MAIN_TAB.ADMIN.deck,
] as const satisfies readonly (keyof RootTabParamList)[];

function isTabRouteName(name: string): name is keyof RootTabParamList {
  return (TAB_ROUTE_NAMES as readonly string[]).includes(name);
}

/**
 * Resolves the focused bottom-tab route from either:
 * - the **tab navigator** state (active route is `TabHome`, …), or
 * - the **root stack** state where the active route is `Tabs` and nested state holds the tab index.
 *
 * `useNavigationState` from `MainTabNavigator` (and siblings outside `Tab.Navigator`) may receive either shape
 * depending on React Navigation version / tree — this keeps Fashion-Tech Home suppression reliable.
 */
export function readFocusedTabRouteFromRootState(
  state: NavigationState | undefined
): keyof RootTabParamList | undefined {
  if (!state?.routes || state.index == null) return undefined;
  const active = state.routes[state.index];
  if (!active?.name) return undefined;

  if (isTabRouteName(active.name)) {
    return active.name;
  }

  const nestedState = active.state as NavigationState | undefined;
  if (nestedState?.routes != null && nestedState.index != null) {
    const nestedResolved = readFocusedTabRouteFromRootState(nestedState);
    if (nestedResolved) return nestedResolved;
  }

  if (active.name === 'Tabs') {
    const inner = active.state as NavigationState | undefined;
    if (inner?.routes != null && inner.index != null) {
      const innerRoute = inner.routes[inner.index];
      if (innerRoute?.name && isTabRouteName(innerRoute.name)) return innerRoute.name;
      const deepState = innerRoute?.state as NavigationState | undefined;
      if (deepState?.routes != null && deepState.index != null) {
        const deepResolved = readFocusedTabRouteFromRootState(deepState);
        if (deepResolved) return deepResolved;
      }
    }
    return undefined;
  }

  return undefined;
}

export type FashionHomeDesktopShellInput = Readonly<{
  platform: typeof Platform.OS;
  windowWidth: number;
  activeRole: ActiveRole;
  focusedTabRoute: keyof RootTabParamList | undefined;
}>;

/**
 * Single predicate for B2C Fashion-Tech Home **desktop web** shell: integrated command bar, no legacy floating chrome.
 * Admin / B2B / Broker keep existing shells (different roles or tab sets).
 */
export function isFashionHomeDesktopShell(input: FashionHomeDesktopShellInput): boolean {
  if (input.platform !== 'web') return false;
  if (input.windowWidth < FASHION_HOME_DESKTOP_MIN_WIDTH) return false;
  if (input.activeRole !== 'B2C') return false;
  if (input.focusedTabRoute !== MAIN_TAB.B2C.home) return false;
  return true;
}

/** Style fragment to fully hide the bottom tab bar (web + native). */
export const fashionHomeHiddenTabBarStyle = {
  display: 'none' as const,
  height: 0,
  minHeight: 0,
  overflow: 'hidden' as const,
  opacity: 0,
  paddingTop: 0,
  paddingBottom: 0,
  borderTopWidth: 0,
  elevation: 0,
  shadowOpacity: 0,
  pointerEvents: 'none' as const,
};
