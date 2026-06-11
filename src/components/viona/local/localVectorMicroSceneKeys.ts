/**
 * Local hub vector micro-scene keys — aligned with full-card artwork registry IDs.
 */
export type LocalVectorMicroSceneKey =
  | 'local-browse-services'
  | 'local-booking-assist'
  | 'local-restaurant-services'
  | 'local-transit-mobility'
  | 'local-legal-wealth'
  | 'local-my-requests'
  | 'local-nails-beauty'
  | 'local-community-events'
  | 'local-housing-home'
  | 'local-classifieds-market'
  | 'local-document-scanner'
  | 'local-request-sent'
  | 'local-merchant-review'
  | 'local-merchant-declined'
  | 'local-confirmed-not-paid';

export const LOCAL_VECTOR_MICRO_SCENE_KEYS = [
  'local-browse-services',
  'local-booking-assist',
  'local-restaurant-services',
  'local-transit-mobility',
  'local-legal-wealth',
  'local-my-requests',
  'local-nails-beauty',
  'local-community-events',
  'local-housing-home',
  'local-classifieds-market',
  'local-document-scanner',
  'local-request-sent',
  'local-merchant-review',
  'local-merchant-declined',
  'local-confirmed-not-paid',
] as const satisfies readonly LocalVectorMicroSceneKey[];

export const LOCAL_COMPACT_VECTOR_SCENE_KEYS = new Set<LocalVectorMicroSceneKey>([
  'local-request-sent',
  'local-merchant-review',
  'local-merchant-declined',
  'local-confirmed-not-paid',
]);

/** Same mapping as hub artwork keys — testID → vector scene. */
export const LOCAL_HUB_VECTOR_SCENE_KEYS_BY_TEST_ID: Readonly<
  Partial<Record<string, LocalVectorMicroSceneKey>>
> = {
  'local-cta-browse-services': 'local-browse-services',
  'local-cta-booking-assist': 'local-booking-assist',
  'local-tile-restaurant': 'local-restaurant-services',
  'local-tile-transit': 'local-transit-mobility',
  'local-tile-legal-wealth': 'local-legal-wealth',
  'local-tile-my-requests': 'local-my-requests',
  'local-tile-nails': 'local-nails-beauty',
  'local-tile-events': 'local-community-events',
  'local-tile-housing': 'local-housing-home',
  'local-tile-classifieds': 'local-classifieds-market',
  'local-tile-legal-scanner': 'local-document-scanner',
};

export function resolveLocalHubVectorSceneKey(
  testId?: string
): LocalVectorMicroSceneKey | undefined {
  if (!testId) return undefined;
  return LOCAL_HUB_VECTOR_SCENE_KEYS_BY_TEST_ID[testId];
}
