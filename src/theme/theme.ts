import { FontFamily } from './typography';

export const theme = {
  colors: {
    primary: '#C5A059',
    primaryBright: '#E8D5A3',
    background: '#0A1628',
    backgroundDeep: '#050B14',
    surface: '#0F2238',
    surfaceElevated: '#152A45',
    surfaceMuted: 'rgba(15, 34, 56, 0.88)',
    /** Buttons on gold */
    onAccent: '#0A1628',
    text: {
      primary: '#F4F1EA',
      secondary: 'rgba(244, 241, 234, 0.68)',
      tertiary: 'rgba(244, 241, 234, 0.48)',
      inverse: '#0A1628',
    },
    danger: '#E57373',
    success: '#81C784',
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
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
    pill: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
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
          background: '#C5A059',
          text: '#0A1628',
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
    card: {
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 6,
    },
    modal: {
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 12,
    },
    fab: {
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
    },
  },
  typeScale: {
    h1: {
      fontSize: 30,
      lineHeight: 38,
      fontFamily: FontFamily.bold,
    },
    h2: {
      fontSize: 22,
      lineHeight: 30,
      fontFamily: FontFamily.bold,
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      fontFamily: FontFamily.regular,
    },
    caption: {
      fontSize: 12,
      lineHeight: 18,
      fontFamily: FontFamily.regular,
    },
  },
} as const;
