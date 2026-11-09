import { cinematicFontFamily, vionaCinematicTokens as cine } from '../vionaCinematicTokens';
import type { TypeRole, UniverseId } from './types';

/**
 * @deprecated UI-1 hybrid light-card source. Names remain.
 * Values alias `vionaCinematicTokens` (dark shell, dark glass). Do not delete while imports may exist.
 */

export const fontFamily = cinematicFontFamily;

export const vionaHybridDesignTokens = {
  color: {
    backgroundShell: cine.color.backgroundShell,
    surfaceShell: cine.color.surfaceNavy,
    surfaceCard: cine.color.surfaceGlass,
    surfaceCardAlt: cine.color.surfaceNavy,
    divider: cine.color.line,
    textOnDark: cine.color.textOnDark,
    textMutedOnDark: cine.color.textMutedOnDark,
    textOnLight: cine.color.textOnDark,
    textMutedOnLight: cine.color.textMutedOnDark,
    accentGold: cine.color.accentGold,
    universe: {
      local: cine.universe.local.accent,
      travel: cine.universe.travel.accent,
      academy: cine.universe.academy.accent,
      business: cine.universe.business.accent,
      account: cine.universe.account.accent,
      sos: cine.universe.sos.accent,
    },
  },
  fontFamily,
  typography: cine.typography,
  spacing: cine.space,
  radius: {
    sm: cine.radius.sm,
    md: cine.radius.md,
    lg: cine.radius.lg,
    xl: cine.radius.xl,
    pill: cine.radius.pill,
  },
  elevation: cine.elevation,
  zIndex: cine.zIndex,
} as const;

export type HybridDesignTokens = typeof vionaHybridDesignTokens;

type TypographyRoleName = keyof HybridDesignTokens['typography'];

export const typographyRoles: Readonly<Record<TypographyRoleName, TypeRole>> =
  vionaHybridDesignTokens.typography;

export const universeAccent: Readonly<Record<UniverseId, string>> =
  vionaHybridDesignTokens.color.universe;
