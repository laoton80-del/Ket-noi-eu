import { isReferenceLabsEnabled } from '../config/referenceLabsGate';

/** Deep-link paths for reference lab routes (capture scripts in docs/design). */
export const REFERENCE_LAB_LINKING_SCREENS = {
  VionaReferenceLocalPanelLab: 'viona-reference-local-panel-lab',
  VionaReferenceSingleCardLab: 'viona-reference-single-card-my-requests',
  VionaReferenceMaterialLab: 'viona-reference-material-lab',
  VionaReferencePanelCompositionLab: 'viona-reference-panel-composition-lab',
  VionaReferenceFlagshipCardsLab: 'viona-reference-flagship-cards-lab',
  VionaNeonCardLab: 'viona-neon-card-lab',
} as const;

export function getReferenceLabLinkingScreens(): Record<string, string> {
  if (!isReferenceLabsEnabled()) return {};
  return { ...REFERENCE_LAB_LINKING_SCREENS };
}
