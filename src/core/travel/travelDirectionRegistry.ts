import type { TravelDirectionDefinition, TravelDirectionId } from './travelDirectionTypes';

const VIETNAMESE_ABROAD: TravelDirectionDefinition = {
  id: 'vietnameseAbroad',
  titleKey: 'travel.direction.vietnameseAbroad.title',
  subtitleKey: 'travel.direction.vietnameseAbroad.subtitle',
  badgeKey: 'travel.direction.vietnameseAbroad.badge',
  primaryCtaKey: 'travel.direction.select',
  status: 'lite',
  riskLevel: 'low',
  recommendedActions: [
    { labelKey: 'travel.direction.vietnameseAbroad.actions.translate', itemStatus: 'lite' },
    { labelKey: 'travel.direction.vietnameseAbroad.actions.aiCallDemo', itemStatus: 'pilot' },
    { labelKey: 'travel.direction.vietnameseAbroad.actions.checklist', itemStatus: 'lite' },
    { labelKey: 'travel.direction.vietnameseAbroad.actions.sos', itemStatus: 'lite' },
    { labelKey: 'travel.direction.vietnameseAbroad.actions.localServices', itemStatus: 'pilot' },
  ],
};

const INBOUND_VIETNAM: TravelDirectionDefinition = {
  id: 'inboundVietnam',
  titleKey: 'travel.direction.inboundVietnam.title',
  subtitleKey: 'travel.direction.inboundVietnam.subtitle',
  badgeKey: 'travel.direction.inboundVietnam.badge',
  primaryCtaKey: 'travel.direction.select',
  status: 'pilot',
  riskLevel: 'medium',
  recommendedActions: [
    { labelKey: 'travel.direction.inboundVietnam.actions.guide', itemStatus: 'lite' },
    { labelKey: 'travel.direction.inboundVietnam.actions.fixer', itemStatus: 'pilot' },
    { labelKey: 'travel.direction.inboundVietnam.actions.airportSim', itemStatus: 'comingSoon' },
    { labelKey: 'travel.direction.inboundVietnam.actions.translation', itemStatus: 'lite' },
    { labelKey: 'travel.direction.inboundVietnam.actions.experiences', itemStatus: 'pilot' },
  ],
};

const RETURN_VIETNAM: TravelDirectionDefinition = {
  id: 'returnVietnam',
  titleKey: 'travel.direction.returnVietnam.title',
  subtitleKey: 'travel.direction.returnVietnam.subtitle',
  badgeKey: 'travel.direction.returnVietnam.badge',
  primaryCtaKey: 'travel.direction.select',
  status: 'lite',
  riskLevel: 'low',
  recommendedActions: [
    { labelKey: 'travel.direction.returnVietnam.actions.family', itemStatus: 'lite' },
    { labelKey: 'travel.direction.returnVietnam.actions.paperwork', itemStatus: 'lite' },
    { labelKey: 'travel.direction.returnVietnam.actions.concierge', itemStatus: 'pilot' },
    { labelKey: 'travel.direction.returnVietnam.actions.localServices', itemStatus: 'pilot' },
    { labelKey: 'travel.direction.returnVietnam.actions.translation', itemStatus: 'lite' },
  ],
};

const ALL: readonly TravelDirectionDefinition[] = [
  VIETNAMESE_ABROAD,
  INBOUND_VIETNAM,
  RETURN_VIETNAM,
] as const;

export function getAllTravelDirections(): readonly TravelDirectionDefinition[] {
  return ALL;
}

export function getTravelDirectionById(id: TravelDirectionId): TravelDirectionDefinition | undefined {
  return ALL.find((d) => d.id === id);
}
