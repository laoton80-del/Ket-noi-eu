/**
 * Native iOS/Android Home Clear Premium token namespace (Phase 1).
 *
 * Imported only by `src/components/viona/native-home/*`.
 * Does not mutate shared Fashion-Tech values or premium tile visual tokens.
 * Does not make Fashion-Tech conditional on Platform.OS.
 *
 * Marker: VIONA_NATIVE_LIGHT_FIRST_CLEAR_PREMIUM_CARVE_PROPOSED_NOT_ACTIVATED
 * This file is a native-home carve, not a global LIGHT_MODE_CANONICAL switch.
 */
import { vionaCinematicTokens as cine } from './vionaCinematicTokens';

export const vionaNativeClearPremiumTokens = {
  bg: {
    canvas: cine.color.backgroundShell,
    surface: cine.color.surfaceNavy,
    elevated: cine.color.sapphire,
    muted: cine.color.surfaceGlass,
    critical: cine.universe.sos.wash,
  },
  ink: {
    primary: cine.color.textOnDark,
    secondary: cine.color.textMutedOnDark,
    inverse: cine.color.backgroundShell,
  },
  line: {
    subtle: cine.color.line,
  },
  accent: {
    local: cine.universe.local.accent,
    travel: cine.universe.travel.accent,
    academy: cine.universe.academy.accent,
    business: cine.universe.business.accent,
    ai: cine.universe.academy.accent,
    safety: cine.universe.sos.accent,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },
  spacing: {
    4: 4,
    8: 8,
    12: 12,
    16: 16,
    20: 20,
    24: 24,
    32: 32,
  },
  type: {
    brand: { fontSize: 12, lineHeight: 14 },
    greeting: { fontSize: 20, lineHeight: 24 },
    wish: { fontSize: 14, lineHeight: 18 },
    meta: { fontSize: 12, lineHeight: 16 },
    title: { fontSize: 14, lineHeight: 18 },
    body: { fontSize: 14, lineHeight: 20 },
    chip: { fontSize: 11, lineHeight: 14 },
    button: { fontSize: 16, lineHeight: 20 },
    ask: { fontSize: 12, lineHeight: 16 },
  },
  hit: {
    min: 44,
  },
} as const;

export type VionaNativeClearPremiumTokens = typeof vionaNativeClearPremiumTokens;
