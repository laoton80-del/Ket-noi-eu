/**
 * Canonical cinematic design source.
 * Dark shell and dark glass cards. Home already imports these values.
 * Existing color, radius, layout, and universe accents stay at the mockup values.
 * The unused 6/10/16 spacing steps are replaced by one 4-based scale.
 */
export const cinematicFontFamily = {
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
  extrabold: 'Montserrat_800ExtraBold',
} as const;

export type CinematicUniverseId = 'local' | 'travel' | 'academy' | 'business' | 'account' | 'sos';

export type CinematicShadowToken = Readonly<{
  shadowColor: string;
  shadowOffset: Readonly<{ width: number; height: number }>;
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}>;

export type CinematicTypeRole = Readonly<{
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
}>;

const cardOnShellShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.45,
  shadowRadius: 18,
  elevation: 8,
} as const satisfies CinematicShadowToken;

const modalShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 16 },
  shadowOpacity: 0.55,
  shadowRadius: 24,
  elevation: 16,
} as const satisfies CinematicShadowToken;

export const vionaCinematicTokens = {
  color: {
    midnight: '#07111C',
    navy: '#0B1C33',
    sapphire: '#123A66',
    electric: '#2F7BFF',
    ice: '#F4F8FC',
    muted: '#B7C6D6',
    cyan: '#7DD3FC',
    gold: '#E7C27A',
    violet: '#B794F6',
    emerald: '#3DDC97',
    amber: '#F3B15A',
    safety: '#FF5C6A',
    glass: 'rgba(8, 20, 36, 0.78)',
    line: 'rgba(148, 196, 232, 0.28)',
    backgroundDeep: '#020713',
    backgroundShell: '#07111C',
    surfaceNavy: '#0B1C33',
    surfaceGlass: 'rgba(8, 20, 36, 0.78)',
    accentGold: '#E7C27A',
    textOnDark: '#F4F8FC',
    textMutedOnDark: '#B7C6D6',
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
  radius: { sm: 12, md: 18, lg: 24, xl: 28, pill: 999 },
  type: {
    brand: 22,
    headline: 28,
    title: 18,
    body: 14,
    meta: 12,
  },
  fontFamily: cinematicFontFamily,
  typography: {
    display: { fontFamily: cinematicFontFamily.extrabold, fontSize: 34, lineHeight: 40 },
    title: { fontFamily: cinematicFontFamily.bold, fontSize: 22, lineHeight: 30 },
    body: { fontFamily: cinematicFontFamily.regular, fontSize: 15, lineHeight: 22 },
    caption: { fontFamily: cinematicFontFamily.regular, fontSize: 12, lineHeight: 18 },
  },
  elevation: {
    cardOnShell: cardOnShellShadow,
    modal: modalShadow,
  },
  zIndex: { base: 0, card: 1, sticky: 10, overlay: 20, modal: 40 },
  layout: {
    phoneMax: 767,
    tabletMax: 1179,
    desktopMin: 1180,
    railWidth: 212,
    companionWidth: 300,
  },
  universe: {
    local: { accent: '#F3B15A', wash: 'rgba(243, 177, 90, 0.22)' },
    travel: { accent: '#5EB6FF', wash: 'rgba(47, 123, 255, 0.22)' },
    academy: { accent: '#C4B5FD', wash: 'rgba(183, 148, 246, 0.22)' },
    business: { accent: '#3DDC97', wash: 'rgba(61, 220, 151, 0.2)' },
    account: { accent: '#7DD3FC', wash: 'rgba(125, 211, 252, 0.2)' },
    sos: { accent: '#FF5C6A', wash: 'rgba(255, 92, 106, 0.2)' },
  },
} as const;

export type VionaCinematicTokens = typeof vionaCinematicTokens;

export type VionaCinematicTier = 'phone' | 'tablet' | 'desktop';

export function resolveVionaCinematicTier(width: number): VionaCinematicTier {
  if (width >= vionaCinematicTokens.layout.desktopMin) return 'desktop';
  if (width >= 768) return 'tablet';
  return 'phone';
}
