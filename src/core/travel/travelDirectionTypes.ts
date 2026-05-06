/**
 * Pack D — Universe Travel direction lens (UI / copy only; no fulfillment contracts).
 */

export type TravelDirectionId = 'vietnameseAbroad' | 'inboundVietnam' | 'returnVietnam';

/** Commercial posture for the whole direction card (not a provider guarantee). */
export type TravelDirectionCommercialStatus = 'lite' | 'pilot' | 'comingSoon' | 'gated';

export type TravelDirectionRiskLevel = 'low' | 'medium' | 'high';

export type TravelDirectionActionItem = Readonly<{
  /** Full i18n key (e.g. `travel.direction.vietnameseAbroad.actions.translate`). */
  labelKey: string;
  itemStatus: TravelDirectionCommercialStatus;
}>;

export type TravelDirectionDefinition = Readonly<{
  id: TravelDirectionId;
  titleKey: string;
  subtitleKey: string;
  badgeKey: string;
  primaryCtaKey: string;
  status: TravelDirectionCommercialStatus;
  riskLevel: TravelDirectionRiskLevel;
  recommendedActions: readonly TravelDirectionActionItem[];
}>;
