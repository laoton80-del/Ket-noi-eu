/**
 * Home dynamic hero semantic light-network + frame accents.
 * Keys mirror `LivingHeroVisualKey` in HomeScreen (default | local | travel | academy | business).
 */
import { Platform, type ViewStyle } from 'react-native';

import { vionaTokens } from '../../design';

export type HomeLivingHeroVisualKey = 'default' | 'local' | 'travel' | 'academy' | 'business';

export type HomeHeroSemanticLighting = Readonly<{
  accent: string;
  secondaryAccent: string;
}>;

const ft = vionaTokens.fashionTech;

/** Default Human Constellation — gold primary, cyan glass-tech secondary. */
const HOME_CONSTELLATION: HomeHeroSemanticLighting = {
  accent: ft.accentGold,
  secondaryAccent: ft.accentCyan,
};

/** Semantic hero network + rim accents per active/hovered world card. */
export const HOME_HERO_SEMANTIC_LIGHTING: Record<HomeLivingHeroVisualKey, HomeHeroSemanticLighting> = {
  default: HOME_CONSTELLATION,
  local: { accent: ft.accentEmerald, secondaryAccent: ft.accentCyan },
  travel: { accent: ft.accentCyan, secondaryAccent: '#66B6FF' },
  /** Violet-led only — no magenta/pink secondary (prevents stray pink network node + pulse). */
  academy: { accent: ft.accentViolet, secondaryAccent: '#B56DFF' },
  business: { accent: ft.accentGold, secondaryAccent: '#F0B35D' },
};

export function getHomeHeroSemanticLighting(key: HomeLivingHeroVisualKey): HomeHeroSemanticLighting {
  return HOME_HERO_SEMANTIC_LIGHTING[key] ?? HOME_CONSTELLATION;
}

/** Web: smooth accent crossfade on hover rim (matches 240ms hero lit timing). */
export function homeHeroSemanticHoverRimWebStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    transitionProperty: 'border-color, opacity',
    transitionDuration: '240ms',
    transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  } as ViewStyle;
}
