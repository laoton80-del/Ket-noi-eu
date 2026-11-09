import { vionaCinematicTokens as cine } from '../design/vionaCinematicTokens';
import { FontFamily } from './typography';

export const theme = {
  colors: {
    primary: cine.color.accentGold,
    SignatureGold: cine.color.accentGold,
    primaryBright: cine.color.accentGold,
    SignalBlue: cine.color.electric,
    DeepInkNavy: cine.color.backgroundShell,
    GraphiteBlue: cine.color.sapphire,
    CeolWhite: cine.color.ice,
    SoftMineralGrey: '#EDF1F7',
    SoftEmerald: '#81C784',
    PendingAmber: '#D9A441',
    warning: '#D9A441',
    RouteError: '#E57373',
    textOnLight: cine.color.backgroundShell,
    textOnLightMuted: cine.color.textMutedOnDark,
    background: cine.color.backgroundShell,
    bgPrimary: cine.color.backgroundShell,
    backgroundDeep: cine.color.backgroundDeep,
    surface: cine.color.surfaceNavy,
    surfaceElevated: cine.color.sapphire,
    surfaceMuted: 'rgba(15, 34, 56, 0.88)',
    /** Buttons on gold */
    onAccent: cine.color.backgroundShell,
    text: {
      primary: cine.color.textOnDark,
      secondary: cine.color.textMutedOnDark,
      tertiary: cine.color.muted,
      inverse: cine.color.backgroundShell,
      textOnLight: cine.color.backgroundShell,
      textOnLightMuted: cine.color.textMutedOnDark,
    },
    danger: cine.color.safety,
    success: cine.color.emerald,
    overlay: {
      dim: 'rgba(5, 11, 20, 0.72)',
      ringSoft: 'rgba(197, 160, 89, 0.12)',
      ringCore: 'rgba(197, 160, 89, 0.08)',
    },
    glass: {
      border: 'rgba(197, 160, 89, 0.38)',
      borderSoft: 'rgba(197, 160, 89, 0.22)',
      surface: 'rgba(18, 36, 58, 0.88)',
      surfaceStrong: 'rgba(21, 42, 69, 0.94)',
      goldGlow: 'rgba(197, 160, 89, 0.15)',
      shadow: '#000000',
      gradientStrong: 'rgba(197, 160, 89, 0.4)',
      gradientSoft: 'rgba(197, 160, 89, 0.12)',
    },
    /** Chat / panels / secondary surfaces */
    executive: {
      panel: 'rgba(12, 24, 44, 0.94)',
      panelMuted: 'rgba(12, 24, 44, 0.78)',
      card: 'rgba(18, 36, 58, 0.92)',
      bubbleAi: 'rgba(26, 48, 74, 0.96)',
      bubbleUser: 'rgba(244, 241, 234, 0.12)',
      chipFill: 'rgba(244, 241, 234, 0.1)',
      warmHint: '#E8D5A3',
      avatarOrb: '#152A45',
      metricSurface: 'rgba(15, 34, 58, 0.92)',
      liveQueueSurface: 'rgba(20, 40, 64, 0.85)',
      liveQueueBorder: 'rgba(120, 160, 220, 0.35)',
    },
  },
  /**
   * Hybrid master direction (PASS 1): Deep Ink structure + Cool White panels + Signal Blue actions.
   * Muted gold stays a small signature accent via `signatureGold` / legacy `colors.primary`.
   */
  hybrid: {
    signal: '#5590E0',
    signalStrong: '#3D78D4',
    onSignal: '#F5F9FC',
    signalMutedBg: 'rgba(85, 144, 224, 0.2)',
    signalSubtleBorder: 'rgba(85, 144, 224, 0.38)',
    panelCool: '#EDF1F7',
    panelCoolBorder: 'rgba(6, 18, 36, 0.1)',
    panelCoolText: '#0B1628',
    panelCoolTextMuted: 'rgba(11, 22, 40, 0.58)',
    signatureGold: '#C5A059',
    signatureLine: 'rgba(197, 160, 89, 0.42)',
    borderOnInk: 'rgba(236, 242, 252, 0.12)',
    trustChipBg: 'rgba(27, 94, 32, 0.1)',
    trustChipText: '#1B4D20',
    trustChipBorder: 'rgba(27, 94, 32, 0.22)',
    /** Status chips (on dark surfaces — wallet history / system rows). */
    chipProcessingBg: 'rgba(85, 144, 224, 0.16)',
    chipProcessingText: '#B8D4F5',
    chipClearedBg: 'rgba(129, 199, 132, 0.14)',
    chipClearedText: '#C8E6C9',
    chipErrorBg: 'rgba(229, 115, 115, 0.16)',
    chipErrorText: '#FFCDD2',
    chipVerifiedBg: 'rgba(129, 199, 132, 0.12)',
    chipVerifiedText: '#A5D6A7',
  },
  radius: {
    sm: cine.radius.sm,
    md: cine.radius.md,
    lg: cine.radius.lg,
    xl: cine.radius.xl,
    pill: cine.radius.pill,
  },
  spacing: {
    xs: cine.space.xs,
    sm: cine.space.sm,
    md: cine.space.md,
    lg: cine.space.lg,
    xl: cine.space.xl,
    xxl: cine.space.xxl,
  },
  components: {
    button: {
      height: {
        sm: 36,
        md: 48,
        lg: 52,
      },
      variant: {
        primary: {
          background: cine.color.accentGold,
          text: cine.color.backgroundShell,
          border: 'rgba(197, 160, 89, 0.95)',
        },
        secondary: {
          background: 'transparent',
          text: '#E8D5A3',
          border: 'rgba(197, 160, 89, 0.45)',
        },
        danger: {
          background: 'rgba(229, 115, 115, 0.22)',
          text: '#FFCDD2',
          border: 'rgba(229, 115, 115, 0.55)',
        },
        ghost: {
          background: 'transparent',
          text: 'rgba(244, 241, 234, 0.75)',
          border: 'rgba(197, 160, 89, 0.25)',
        },
      },
    },
  },
  elevation: {
    card: cine.elevation.cardOnShell,
    modal: cine.elevation.modal,
    fab: {
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
    },
  },
  typeScale: {
    h1: {
      fontSize: cine.typography.display.fontSize,
      lineHeight: cine.typography.display.lineHeight,
      fontFamily: FontFamily.extrabold,
    },
    h2: {
      fontSize: cine.typography.title.fontSize,
      lineHeight: cine.typography.title.lineHeight,
      fontFamily: FontFamily.bold,
    },
    body: {
      fontSize: cine.typography.body.fontSize,
      lineHeight: cine.typography.body.lineHeight,
      fontFamily: FontFamily.regular,
    },
    caption: {
      fontSize: cine.typography.caption.fontSize,
      lineHeight: cine.typography.caption.lineHeight,
      fontFamily: FontFamily.regular,
    },
  },
} as const;
