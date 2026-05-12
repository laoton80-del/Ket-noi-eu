import { vionaTokens } from '../../design';

/** Desktop fashion hero frame aspect (width / height); slightly wider than asset for ~0.5cm less height at 1280px. */
export const FASHION_HOME_DESKTOP_HERO_ASPECT = 1280 / 410;

/** Shared luminous line language for fashion home surfaces. */
export const FASHION_HOME_LINE_GOLD = 'rgba(244, 214, 144, 0.46)';
export const FASHION_HOME_LINE_GOLD_SOFT = 'rgba(242, 212, 136, 0.34)';
export const FASHION_HOME_LINE_CYAN = 'rgba(136, 218, 255, 0.32)';
/** Hero top inner glow only — not a full-width divider. */
export const FASHION_HOME_HERO_TOP_GLOW = 'rgba(244, 214, 144, 0.18)';
export const FASHION_HOME_GLOW_GOLD = 'rgba(238, 206, 128, 0.14)';
export const FASHION_HOME_GLOW_CYAN = 'rgba(128, 210, 255, 0.12)';
export const FASHION_HOME_INNER_HIGHLIGHT = 'rgba(255, 232, 188, 0.18)';
/** Command rail only — lighter than card/hero frames. */
export const FASHION_HOME_COMMAND_RAIL_BORDER = 'rgba(242, 212, 136, 0.2)';
export const FASHION_HOME_COMMAND_RAIL_HIGHLIGHT = 'rgba(255, 232, 188, 0.14)';

export type FashionHomeDesktopLayout = Readonly<{
  /** Full viewport width for fashion desktop home (no centered max-width box). */
  shellWidth: number;
  /** Horizontal inset for readable rails; hero bleeds with negative margin. */
  pad: number;
  /** Content width inside horizontal padding. */
  inner: number;
}>;

/** Desktop fashion home uses the full viewport width with modest edge inset only. */
export function resolveFashionHomeDesktopLayout(windowWidth: number): FashionHomeDesktopLayout {
  const pad =
    windowWidth >= 1440
      ? vionaTokens.spacing[24]
      : windowWidth >= 960
        ? vionaTokens.spacing[16]
        : vionaTokens.spacing[12];
  const shellWidth = windowWidth;
  return { shellWidth, pad, inner: shellWidth - pad * 2 };
}
