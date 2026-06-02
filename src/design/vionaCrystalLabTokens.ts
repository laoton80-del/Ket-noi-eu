/**
 * VIONA Wave 3B — Crystal material lab tokens (reference engine rebuild).
 * Lab-only — not production LocalScreen.
 */
import { Platform, type ViewStyle } from 'react-native';

import type { VionaReferenceSemantic } from './vionaReferenceVisualTokens';
import { vionaReferenceSemanticGlass } from './vionaReferenceVisualTokens';

export type VionaCrystalLabSemantic = VionaReferenceSemantic;

export const vionaCrystalLabPage = {
  background: '#010408',
  label: 'rgba(140, 200, 185, 0.72)',
  sectionTitle: 'rgba(180, 220, 210, 0.8)',
} as const;

export const vionaCrystalLabBody = {
  deep: 'rgba(0, 0, 1, 0.96)',
  crystal: 'rgba(0, 2, 4, 0.78)',
  topVeil: 'rgba(0, 1, 3, 0.85)',
} as const;

export const vionaCrystalLabCard = {
  width: 200,
  height: 296,
  borderRadius: 14,
  borderWidth: 1,
  panelBorderRadius: 16,
  panelMaxWidth: 920,
} as const;

export const vionaCrystalLabText = {
  titleEmerald: 'rgba(98, 232, 168, 0.97)',
  titleGlow: 'rgba(72, 210, 165, 0.35)',
  subtitle: 'rgba(175, 205, 195, 0.68)',
} as const;

export function vionaCrystalLabSemanticTokens(semantic: VionaCrystalLabSemantic) {
  return vionaReferenceSemanticGlass[semantic];
}

export function vionaCrystalLabOuterGlowStyle(semantic: VionaCrystalLabSemantic): ViewStyle {
  const t = vionaCrystalLabSemanticTokens(semantic);
  if (Platform.OS !== 'web') {
    return {
      shadowColor: t.edgeGlow,
      shadowOpacity: 0.2,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 10 },
      elevation: 10,
    };
  }
  return {
    boxShadow: `0 0 56px ${t.edgeGlow.replace(/0\.\d+\)/, '0.11)')}, 0 0 28px ${t.edgeGlow.replace(/0\.\d+\)/, '0.06)')}, 0 14px 40px rgba(0,0,0,0.48)`,
  } as ViewStyle;
}

export function vionaCrystalLabTitleGlowStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    textShadow: `0 0 12px ${vionaCrystalLabText.titleGlow}, 0 0 24px rgba(72, 210, 165, 0.12)`,
  } as ViewStyle;
}
