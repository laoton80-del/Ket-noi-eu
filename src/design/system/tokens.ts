import type { ShadowToken, TypeRole, UniverseId } from './types';

/**
 * Canonical hybrid tokens: dark shell, light cards.
 * Values are copied from existing theme and design sources. This module does not
 * replace `src/theme/*` or `src/design/vionaTokens.ts`.
 * Light/dark runtime switching is intentionally absent.
 */

export const fontFamily = {
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
  extrabold: 'Montserrat_800ExtraBold',
} as const;

const cardOnShellShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.25,
  shadowRadius: 16,
  elevation: 6,
} as const satisfies ShadowToken;

const modalShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.35,
  shadowRadius: 20,
  elevation: 12,
} as const satisfies ShadowToken;

export const vionaHybridDesignTokens = {
  color: {
    backgroundShell: '#121212',
    surfaceShell: '#1A1A24',
    surfaceCard: '#EDF1F7',
    surfaceCardAlt: '#FFFFFF',
    divider: 'rgba(6, 18, 36, 0.1)',
    textOnDark: '#F4F1EA',
    textMutedOnDark: 'rgba(244, 241, 234, 0.68)',
    textOnLight: '#0B1628',
    textMutedOnLight: 'rgba(11, 22, 40, 0.58)',
    accentGold: '#C5A059',
    universe: {
      local: '#14B8A6',
      travel: '#2563EB',
      academy: '#7C3AED',
      business: '#C5A059',
      account: '#C5A059',
      sos: '#E57373',
    },
  },
  fontFamily,
  typography: {
    display: {
      fontFamily: fontFamily.extrabold,
      fontSize: 30,
      lineHeight: 38,
    },
    title: {
      fontFamily: fontFamily.bold,
      fontSize: 22,
      lineHeight: 30,
    },
    body: {
      fontFamily: fontFamily.regular,
      fontSize: 15,
      lineHeight: 22,
    },
    caption: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      lineHeight: 18,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
    pill: 999,
  },
  elevation: {
    cardOnShell: cardOnShellShadow,
    modal: modalShadow,
  },
  zIndex: {
    base: 0,
    card: 1,
    sticky: 10,
    overlay: 20,
    modal: 40,
  },
} as const;

export type HybridDesignTokens = typeof vionaHybridDesignTokens;

type TypographyRoleName = keyof HybridDesignTokens['typography'];

export const typographyRoles: Readonly<Record<TypographyRoleName, TypeRole>> =
  vionaHybridDesignTokens.typography;

export const universeAccent: Readonly<Record<UniverseId, string>> =
  vionaHybridDesignTokens.color.universe;
