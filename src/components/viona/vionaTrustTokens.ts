/**
 * VIONA Hybrid Visual System — shared tokens for Expo / React Native.
 * - Clean Trust Light: default B2C (Home, Login, Local).
 * - Navy Premium Minimal: travel / VIP touches (accents only).
 * - Dark Ops: merchant / staff dashboards (use sparingly on consumer shells).
 */

/** Canonical palette — matches product direction (trust-first, not casino/neon). */
export const vionaHybrid = {
  navy: '#071936',
  navyDeep: '#050B14',
  gold: '#C8A44D',
  background: '#F6F8FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  trustBlue: '#2563EB',
  danger: '#DC2626',
  opsBg: '#08111F',
  opsSurface: '#111827',
  opsBorder: 'rgba(148, 163, 184, 0.22)',
  opsText: '#F8FAFC',
  opsTextMuted: 'rgba(248, 250, 252, 0.68)',
} as const;

/** Consumer “Clean Trust Light” — Home / Hub / Local / Login canvas. */
export const vionaTrust = {
  canvas: vionaHybrid.background,
  canvasDeep: '#EDF1F7',
  surface: vionaHybrid.surface,
  surfaceMuted: vionaHybrid.surfaceMuted,
  border: vionaHybrid.border,
  ink: vionaHybrid.textPrimary,
  inkMuted: vionaHybrid.textSecondary,
  signal: vionaHybrid.trustBlue,
  signalMutedBg: 'rgba(37, 99, 235, 0.12)',
  accentGold: vionaHybrid.gold,
  accentGoldLine: 'rgba(200, 164, 77, 0.38)',
} as const;

/** Travel / VIP moments — restrained navy + gold (no full chrome takeover). */
export const vionaPremium = {
  headerInk: vionaHybrid.navy,
  ribbonGold: vionaHybrid.gold,
  cardBorder: 'rgba(7, 25, 54, 0.12)',
  subtleWash: '#EEF2F7',
  /** Large chauffeur / emphasis tile — dark navy panel on light canvas */
  conciergeBg: vionaHybrid.navy,
  conciergeInk: '#F8FAFC',
  conciergeInkMuted: 'rgba(248, 250, 252, 0.72)',
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
