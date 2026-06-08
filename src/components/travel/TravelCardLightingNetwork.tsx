/**
 * Travel card lighting network accent — Local card-tier grammar, Travel accents.
 * Pack 62TRAVEL_REMOVE_ALL_CARD_DOTS — Travel cards stay dot/particle-free; rim/glow/veil only.
 */
import type { ReactElement } from 'react';

import {
  type TravelSemanticAccent,
} from './TravelGlassCard';

export type TravelCardLightingNetworkProps = Readonly<{
  accent: TravelSemanticAccent;
  accentSecondary?: TravelSemanticAccent;
  boosted?: boolean;
  radius?: number;
  /** Card-specific network line/node hues (flagship material RGB). */
  networkPrimaryHex?: string;
  networkSecondaryHex?: string;
  /** Reserved — Travel cards do not render particle nodes. */
  showParticles?: boolean;
}>;

export function TravelCardLightingNetwork(_props: TravelCardLightingNetworkProps): ReactElement | null {
  return null;
}
