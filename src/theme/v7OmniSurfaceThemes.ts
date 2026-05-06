/**
 * V7 OMNIVERSE — Dual-surface tokens + React Navigation themes.
 * Travel = Platinum Light (acrylic / pearl). Hub · Local · Academy (B2C) = Midnight Navy + Gold.
 * B2B / Broker / Admin keep dedicated dark shells (do not inherit Travel platinum).
 */
import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

import { MAIN_TAB, type RootStackParamList, type RootTabParamList } from '../navigation/routes';
import type { ActiveRole } from '../store/userStore';
import { b2bTheme } from './appModeThemes';

/** Platinum Travel — acrylic white/silver field + imperial gold accents */
export const V7_PLATINUM = {
  bg: '#F2F4F8',
  card: 'rgba(255, 255, 255, 0.94)',
  ink: '#0A1628',
  inkMuted: 'rgba(10, 22, 40, 0.55)',
  gold: '#C5A059',
  goldDeep: '#9A7209',
  border: 'rgba(10, 22, 40, 0.08)',
  gradientA: '#FDFBFB',
  gradientB: '#E4E6E8',
  gradientC: '#EBEDEE',
} as const;

/** B2C dark “universes” (Hub / Local / Academy) — aligned with `theme.colors` navy stack */
export const V7_MIDNIGHT_B2C = {
  bg: '#0A1628',
  card: '#0F2238',
  text: '#F4F1EA',
  gold: '#C5A059',
  border: 'rgba(197, 160, 89, 0.28)',
} as const;

export function buildV7PlatinumTravelNavigationTheme(): Theme {
  return {
    ...DefaultTheme,
    dark: false,
    colors: {
      ...DefaultTheme.colors,
      primary: V7_PLATINUM.gold,
      background: V7_PLATINUM.bg,
      card: V7_PLATINUM.card,
      text: V7_PLATINUM.ink,
      border: V7_PLATINUM.border,
      notification: '#C41E3A',
    },
  };
}

export function buildV7MidnightB2CNavigationTheme(): Theme {
  return {
    ...DarkTheme,
    dark: true,
    colors: {
      ...DarkTheme.colors,
      primary: V7_MIDNIGHT_B2C.gold,
      background: V7_MIDNIGHT_B2C.bg,
      card: V7_MIDNIGHT_B2C.card,
      text: V7_MIDNIGHT_B2C.text,
      border: V7_MIDNIGHT_B2C.border,
      notification: '#E53935',
    },
  };
}

/** Broker deck — black + champagne gold (matches `roleTabChrome` BROKER) */
export const v7BrokerNavigationTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: '#F5D286',
    background: '#030304',
    card: '#0C0C10',
    text: '#F8FAFC',
    border: 'rgba(245, 210, 134, 0.22)',
    notification: '#E53935',
  },
};

/** Admin Command Center */
export const v7AdminNavigationTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: '#38BDF8',
    background: '#030712',
    card: '#0B1220',
    text: '#E2E8F0',
    border: 'rgba(248, 113, 113, 0.28)',
    notification: '#F87171',
  },
};

/**
 * @param rootStackRoute — top-level stack screen (`Tabs` vs modals/pushed routes). When not `Tabs`,
 * B2C uses midnight shell so Travel platinum never “bleeds” over PersonalHub / Wallet / etc.
 */
export function resolveV7NavigationTheme(
  role: ActiveRole,
  focusedTabRoute: keyof RootTabParamList | undefined,
  rootStackRoute: keyof RootStackParamList = 'Tabs'
): Theme {
  if (role === 'B2B') return b2bTheme;
  if (role === 'BROKER') return v7BrokerNavigationTheme;
  if (role === 'ADMIN') return v7AdminNavigationTheme;
  if (role === 'B2C') {
    if (rootStackRoute !== 'Tabs') {
      return buildV7MidnightB2CNavigationTheme();
    }
    if (focusedTabRoute === MAIN_TAB.B2C.travel) {
      return buildV7PlatinumTravelNavigationTheme();
    }
    return buildV7MidnightB2CNavigationTheme();
  }
  return buildV7MidnightB2CNavigationTheme();
}

export {
  V7NavigationSurfaceProvider,
  useNavigationThemeForHub,
  useV7NavigationSurface,
} from '../context/V7NavigationSurfaceContext';
