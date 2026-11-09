import { vionaCinematicTokens as cine } from '../design/vionaCinematicTokens';

export const KIDS_MODE_TOKENS = {
  colors: {
    background: cine.color.backgroundShell,
    panel: cine.color.surfaceNavy,
    panelBorder: cine.color.line,
    primary: cine.universe.academy.accent,
    secondary: cine.universe.travel.accent,
    accent: cine.universe.local.accent,
    success: cine.color.emerald,
    danger: cine.color.safety,
    textStrong: cine.color.textOnDark,
    textMuted: cine.color.textMutedOnDark,
  },
  radius: {
    card: cine.radius.lg,
    button: cine.radius.sm,
    pill: cine.radius.pill,
  },
  typography: {
    titleSize: 28,
    bodySize: 14,
    captionSize: 12,
  },
  motion: {
    quickMs: 220,
    normalMs: 420,
    celebratoryMs: 900,
  },
  accessibility: {
    minTouchTarget: 44,
    minContrastBody: 4.5,
  },
} as const;

