/**
 * VIONA Apex UI — layout & interaction tokens (palette lives in `vionaTrustTokens`).
 * Mobile-first; web uses `maxContentWidth` for readable line length.
 */

import { vionaHybrid, vionaOps, vionaPremium, vionaTrust } from './vionaTrustTokens';

export { vionaHybrid, vionaOps, vionaPremium, vionaTrust };

/** Hub / consumer shell */
export const vionaShellLight = {
  background: vionaTrust.canvas,
  backgroundAlt: vionaTrust.canvasDeep,
} as const;

/** Travel / VIP shell — still light base; navy as ink accent */
export const vionaShellPremium = {
  background: vionaPremium.subtleWash,
  backgroundAlt: vionaTrust.canvas,
} as const;

/** Merchant / ops shell */
export const vionaShellOps = {
  background: vionaOps.bg,
} as const;

export type VionaShellVariant = 'light' | 'premium' | 'ops';

export function vionaShellBackground(variant: VionaShellVariant): string {
  switch (variant) {
    case 'premium':
      return vionaShellPremium.background;
    case 'ops':
      return vionaShellOps.background;
    default:
      return vionaShellLight.background;
  }
}

export const vionaSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const vionaRadius = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** WCAG-friendly minimum touch target */
export const vionaTouchMin = 44;

export const vionaPressedOpacity = 0.88;

/** Centered column max width on large phones / web */
export const vionaMaxContentWidth = 720;

export const vionaShadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;
