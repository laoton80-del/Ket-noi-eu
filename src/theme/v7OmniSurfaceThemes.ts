/**
 * V7 OMNIVERSE — Dual-surface tokens + React Navigation themes.
 * Travel = Platinum Light (acrylic / pearl). Hub · Local · Academy (B2C) = Midnight Navy + Gold.
 * B2B / Broker / Admin keep dedicated dark shells (do not inherit Travel platinum).
 */
import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

import { vionaCinematicTokens as cine } from '../design/vionaCinematicTokens';
import { MAIN_TAB, type RootStackParamList, type RootTabParamList } from '../navigation/routes';
import type { ActiveRole } from '../store/userStore';
import { b2bTheme } from './appModeThemes';

/** Platinum Travel now aliases the cinematic dark glass shell. */
export const V7_PLATINUM = {
  bg: cine.color.backgroundShell,
  card: cine.color.surfaceGlass,
  ink: cine.color.textOnDark,
  inkMuted: cine.color.textMutedOnDark,
  gold: cine.color.accentGold,
  goldDeep: cine.color.accentGold,
  border: cine.color.line,
  gradientA: cine.color.backgroundDeep,
  gradientB: cine.color.backgroundShell,
  gradientC: cine.color.surfaceNavy,
} as const;

/** B2C dark universes — cinematic shell. */
export const V7_MIDNIGHT_B2C = {
  bg: cine.color.backgroundShell,
  card: cine.color.surfaceNavy,
  text: cine.color.textOnDark,
  gold: cine.color.accentGold,
  border: cine.color.line,
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
    primary: cine.color.accentGold,
    background: cine.color.backgroundShell,
    card: cine.color.surfaceNavy,
    text: cine.color.textOnDark,
    border: cine.color.line,
    notification: cine.color.safety,
  },
};

/** Admin Command Center */
export const v7AdminNavigationTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: cine.universe.account.accent,
    background: cine.color.backgroundShell,
    card: cine.color.surfaceNavy,
    text: cine.color.textOnDark,
    border: cine.color.line,
    notification: cine.color.safety,
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
