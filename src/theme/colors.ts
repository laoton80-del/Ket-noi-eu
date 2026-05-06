/**
 * Unified Multiverse — global shell + per-Hub “Aura” accents.
 * Core structure stays dark navy/charcoal; only aura-driven borders, glows, and active tints change.
 */

/** Core shell (every Hub). */
export const hubCore = {
  backgroundTop: '#121212',
  backgroundBottom: '#1A1A24',
  textPrimary: '#FFFFFF',
  /** Imperial Gold — premium headlines, key numerals. */
  imperialGold: '#C5A059',
  imperialGoldBright: '#E8D5A3',
} as const;

/**
 * Hub aura pairs: [primary glow, secondary glow].
 * Used for borders, icon tints, and subtle dual-tone emphasis — not full-screen repaints.
 */
export const hubAuras = {
  HUB_SERVICE: ['#00FF00', '#8A2BE2'] as const,
  HUB_TOURISM: ['#00BFFF', '#1E90FF'] as const,
  HUB_CHARITY: ['#FF3333', '#FF1493'] as const,
  HUB_ACADEMY: ['#E5E4E2', '#FFFFFF'] as const,
} as const;

export type HubId = keyof typeof hubAuras;

export const HUB_IDS: readonly HubId[] = [
  'HUB_SERVICE',
  'HUB_TOURISM',
  'HUB_CHARITY',
  'HUB_ACADEMY',
] as const;

export function getAuraPair(hub: HubId): readonly [string, string] {
  return hubAuras[hub];
}

/** First aura stop — primary neon / platinum highlight for icons & 1px glow. */
export function getAuraPrimary(hub: HubId): string {
  return hubAuras[hub][0];
}

export function getAuraSecondary(hub: HubId): string {
  return hubAuras[hub][1];
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** Hex `#RRGGBB` → `rgba(..., a)` for subtle glass borders. */
export function auraHexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '').trim();
  if (h.length !== 6) return `rgba(255,255,255,${clamp01(alpha)})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((x) => Number.isNaN(x))) return `rgba(255,255,255,${clamp01(alpha)})`;
  return `rgba(${r},${g},${b},${clamp01(alpha)})`;
}

/**
 * Legacy flat palette — maps onto multiverse core so existing screens keep working.
 * Prefer `hubCore` / `useHubTheme()` for new Hub-aware UI.
 */
export const Colors = {
  background: hubCore.backgroundTop,
  backgroundDeep: hubCore.backgroundBottom,
  backgroundElevated: hubCore.backgroundTop,
  primary: hubCore.imperialGold,
  primaryBright: hubCore.imperialGoldBright,
  accent: hubCore.textPrimary,
  text: hubCore.textPrimary,
  textSoft: 'rgba(255, 255, 255, 0.68)',
  textOnGold: hubCore.backgroundTop,
  tabBarBackground: 'rgba(18, 18, 18, 0.96)',
  glass: 'rgba(26, 26, 36, 0.75)',
  glassBorder: auraHexToRgba(hubCore.imperialGold, 0.35),
} as const;
