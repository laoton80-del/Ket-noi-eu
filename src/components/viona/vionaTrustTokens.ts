/**
 * VIONA Hybrid Visual System — shared tokens for Expo / React Native.
 * - Clean Trust Light: default B2C (Home, Login, Local).
 * - Navy Premium Minimal: travel / VIP touches (accents only).
 * - Dark Ops: merchant / staff dashboards (use sparingly on consumer shells).
 */

import { vionaCinematicTokens as cine } from '../../design/vionaCinematicTokens';

/** Canonical palette — aliases the cinematic source. Exported names stay. */
export const vionaHybrid = {
  navy: cine.color.backgroundShell,
  navyDeep: cine.color.backgroundDeep,
  gold: cine.color.accentGold,
  background: cine.color.backgroundShell,
  surface: cine.color.surfaceNavy,
  surfaceMuted: cine.color.surfaceGlass,
  border: cine.color.line,
  textPrimary: cine.color.textOnDark,
  textSecondary: cine.color.textMutedOnDark,
  trustBlue: cine.universe.travel.accent,
  danger: cine.color.safety,
  opsBg: cine.color.backgroundShell,
  opsSurface: cine.color.surfaceNavy,
  opsBorder: cine.color.line,
  opsText: cine.color.textOnDark,
  opsTextMuted: cine.color.textMutedOnDark,
} as const;

/** Consumer “Clean Trust Light” — Home / Hub / Local / Login canvas. */
export const vionaTrust = {
  canvas: vionaHybrid.background,
  canvasDeep: cine.color.backgroundDeep,
  surface: vionaHybrid.surface,
  surfaceMuted: vionaHybrid.surfaceMuted,
  border: vionaHybrid.border,
  ink: vionaHybrid.textPrimary,
  inkMuted: vionaHybrid.textSecondary,
  signal: vionaHybrid.trustBlue,
  signalMutedBg: 'rgba(37, 99, 235, 0.12)',
  accentGold: vionaHybrid.gold,
  accentGoldLine: cine.color.line,
} as const;

/** Travel / VIP moments — restrained navy + gold (no full chrome takeover). */
export const vionaPremium = {
  headerInk: vionaHybrid.navy,
  ribbonGold: vionaHybrid.gold,
  cardBorder: 'rgba(7, 25, 54, 0.12)',
  subtleWash: cine.color.surfaceNavy,
  /** Large chauffeur / emphasis tile — dark navy panel on light canvas */
  conciergeBg: vionaHybrid.navy,
  conciergeInk: cine.color.textOnDark,
  conciergeInkMuted: cine.color.textMutedOnDark,
} as const;

/** Merchant / ops dashboards — dark shell tokens. */
export const vionaOps = {
  bg: vionaHybrid.opsBg,
  surface: vionaHybrid.opsSurface,
  border: vionaHybrid.opsBorder,
  text: vionaHybrid.opsText,
  textMuted: vionaHybrid.opsTextMuted,
  accent: vionaHybrid.gold,
} as const;

export type VionaSurfaceVariant = 'light' | 'muted' | 'premium' | 'ops';

export function vionaSurfaceColors(
  variant: VionaSurfaceVariant
): Readonly<{ backgroundColor: string; borderColor: string }> {
  switch (variant) {
    case 'muted':
      return { backgroundColor: vionaTrust.surfaceMuted, borderColor: vionaTrust.border };
    case 'premium':
      return { backgroundColor: vionaTrust.surface, borderColor: vionaPremium.cardBorder };
    case 'ops':
      return { backgroundColor: vionaOps.surface, borderColor: vionaOps.border };
    default:
      return { backgroundColor: vionaTrust.surface, borderColor: vionaTrust.border };
  }
}
