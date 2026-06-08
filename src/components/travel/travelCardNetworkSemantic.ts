/**
 * Travel card hover lighting network — semantic primary/secondary hex per scenario.
 * Visual-only; rims and accents elsewhere stay on TravelSemanticAccent tokens.
 */
export type TravelCardNetworkScenarioId =
  | 'airport'
  | 'taxi'
  | 'translation'
  | 'hotel'
  | 'emergency'
  | 'restaurant'
  | 'transit'
  | 'shopping'
  | 'hospital';

export type TravelCardNetworkColors = Readonly<{
  primary: string;
  secondary: string;
}>;

/** Quick Help flagship hover — matches `TRAVEL_QUICK_HELP_FLAGSHIP_MATERIAL` glow / networkSecondary RGB. */
export type TravelQuickHelpFlagshipScenarioId = 'airport' | 'translation' | 'taxi' | 'emergency';

export const TRAVEL_QUICK_HELP_HERO_NETWORK_HEX: Readonly<
  Record<TravelQuickHelpFlagshipScenarioId, TravelCardNetworkColors>
> = {
  airport: { primary: '#60E4FF', secondary: '#8CD4FF' },
  translation: { primary: '#D294FF', secondary: '#B56DFF' },
  taxi: { primary: '#30E8D0', secondary: '#8CD4FF' },
  emergency: { primary: '#FF58A8', secondary: '#FF8CB4' },
};

export function resolveTravelQuickHelpHeroNetworkColors(
  scenarioId: TravelQuickHelpFlagshipScenarioId
): TravelCardNetworkColors {
  return TRAVEL_QUICK_HELP_HERO_NETWORK_HEX[scenarioId];
}

/** Pack 62TRAVEL_HOVER_NETWORK — semantic hover network hues. */
export const TRAVEL_CARD_NETWORK_SEMANTIC_MAP: Readonly<
  Record<TravelCardNetworkScenarioId, TravelCardNetworkColors>
> = {
  airport: TRAVEL_QUICK_HELP_HERO_NETWORK_HEX.airport,
  taxi: TRAVEL_QUICK_HELP_HERO_NETWORK_HEX.taxi,
  translation: TRAVEL_QUICK_HELP_HERO_NETWORK_HEX.translation,
  hotel: { primary: '#84EEFF', secondary: '#F6D46E' },
  emergency: TRAVEL_QUICK_HELP_HERO_NETWORK_HEX.emergency,
  restaurant: { primary: '#58DCA0', secondary: '#84EEFF' },
  transit: { primary: '#84EEFF', secondary: '#40DCD2' },
  shopping: { primary: '#B490F0', secondary: '#F6D46E' },
  hospital: { primary: '#48D2BE', secondary: '#84EEFF' },
};

export function resolveTravelCardNetworkColors(
  scenarioId: TravelCardNetworkScenarioId
): TravelCardNetworkColors {
  return TRAVEL_CARD_NETWORK_SEMANTIC_MAP[scenarioId];
}
