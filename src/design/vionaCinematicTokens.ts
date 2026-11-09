/**
 * Cinematic Companion OS tokens.
 * Aliased from the shared palette. Existing light-surface tokens stay untouched.
 */
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
  },
  space: { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 },
  radius: { sm: 12, md: 18, lg: 24, pill: 999 },
  type: {
    brand: 22,
    headline: 28,
    title: 18,
    body: 14,
    meta: 12,
  },
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
