/**
 * V7 dual-surface engine — drives `NavigationContainer` theme from Main Tab focus.
 * B2C + Travel → Platinum Light; B2C + Hub/Local/Academy → Midnight Navy/Gold.
 * Other roles keep B2B / Broker / Admin dark shells (never Travel platinum).
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { Theme } from '@react-navigation/native';

import { MAIN_TAB, type RootStackParamList, type RootTabParamList } from '../navigation/routes';
import type { ActiveRole } from '../store/userStore';
import { resolveV7NavigationTheme } from '../theme/v7OmniSurfaceThemes';

export type V7NavigationSurfaceMode = 'platinum_travel' | 'midnight_b2c' | 'b2b' | 'broker' | 'admin';

export type V7NavigationSurfaceValue = Readonly<{
  navigationTheme: Theme;
  /** True when B2C user is on Travel tab — Platinum acrylic universe */
  isPlatinumTravel: boolean;
  /** True when B2C user is on Hub, Local, or Academy — dark navy/gold */
  isMidnightB2C: boolean;
  surfaceMode: V7NavigationSurfaceMode;
  /** StatusBar content: light icons on dark root, dark icons on platinum root */
  statusBarStyle: 'light' | 'dark';
  /** Call from `MainTabNavigator` when role or focused tab changes */
  syncFromMainTab: (role: ActiveRole, focusedRoute: keyof RootTabParamList | undefined) => void;
  /** Call from root `NavigationContainer.onStateChange` — distinguishes `Tabs` vs pushed stack */
  syncFromRootStackRoute: (routeName: keyof RootStackParamList) => void;
}>;

const V7NavigationSurfaceContext = createContext<V7NavigationSurfaceValue | null>(null);

const defaultRole: ActiveRole = 'B2C';
const defaultRoute: keyof RootTabParamList = MAIN_TAB.B2C.home;

function inferSurfaceMode(
  role: ActiveRole,
  tabRoute: keyof RootTabParamList | undefined,
  rootStackRoute: keyof RootStackParamList
): V7NavigationSurfaceMode {
  if (role === 'B2B') return 'b2b';
  if (role === 'BROKER') return 'broker';
  if (role === 'ADMIN') return 'admin';
  if (role === 'B2C' && rootStackRoute === 'Tabs' && tabRoute === MAIN_TAB.B2C.travel) return 'platinum_travel';
  return 'midnight_b2c';
}

export function V7NavigationSurfaceProvider({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  const [role, setRole] = useState<ActiveRole>(defaultRole);
  const [focusedRoute, setFocusedRoute] = useState<keyof RootTabParamList | undefined>(defaultRoute);
  const [rootStackRoute, setRootStackRoute] = useState<keyof RootStackParamList>('Tabs');

  const syncFromMainTab = useCallback((nextRole: ActiveRole, nextRoute: keyof RootTabParamList | undefined) => {
    setRole(nextRole);
    setFocusedRoute(nextRoute);
  }, []);

  const syncFromRootStackRoute = useCallback((routeName: keyof RootStackParamList) => {
    setRootStackRoute(routeName);
  }, []);

  const value = useMemo<V7NavigationSurfaceValue>(() => {
    const navigationTheme = resolveV7NavigationTheme(role, focusedRoute, rootStackRoute);
    const mode = inferSurfaceMode(role, focusedRoute, rootStackRoute);
    const isPlatinumTravel = mode === 'platinum_travel';
    const isMidnightB2C = mode === 'midnight_b2c';
    const statusBarStyle: 'light' | 'dark' = isPlatinumTravel ? 'dark' : 'light';
    return {
      navigationTheme,
      isPlatinumTravel,
      isMidnightB2C,
      surfaceMode: mode,
      statusBarStyle,
      syncFromMainTab,
      syncFromRootStackRoute,
    };
  }, [role, focusedRoute, rootStackRoute, syncFromMainTab, syncFromRootStackRoute]);

  return (
    <V7NavigationSurfaceContext.Provider value={value}>{children}</V7NavigationSurfaceContext.Provider>
  );
}

/** Primary hook — CEO naming */
export function useNavigationThemeForHub(): V7NavigationSurfaceValue {
  const ctx = useContext(V7NavigationSurfaceContext);
  if (ctx == null) {
    throw new Error('useNavigationThemeForHub must be used within V7NavigationSurfaceProvider');
  }
  return ctx;
}

export function useV7NavigationSurface(): V7NavigationSurfaceValue {
  return useNavigationThemeForHub();
}
