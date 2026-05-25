/**
 * Wave 3B — semantic micro-scene kinds for Premium App Tile interior art.
 * Visual-only; meaning is carried by title + status chip first.
 */
export type PremiumTileMicroSceneKind =
  | 'marketplace-grid'
  | 'chat-request-beam'
  | 'signal-directional'
  | 'approval-ring'
  | 'signal-broken'
  | 'info-pulse'
  | 'timeline-pulse'
  | 'emerald-shimmer'
  | 'dining-arc'
  | 'route-lines'
  | 'data-doc-matrix'
  | 'social-nodes'
  | 'listing-tags'
  | 'node-mesh'
  | 'universe-travel'
  | 'universe-business'
  | 'universe-academy'
  | 'scan-rings'
  | 'housing-grid';

/** Local hub tile testID → micro-scene (visual polish pack). */
export const LOCAL_TILE_MICRO_SCENES: Readonly<Record<string, PremiumTileMicroSceneKind>> = {
  'local-tile-my-requests': 'timeline-pulse',
  'local-tile-nails': 'emerald-shimmer',
  'local-tile-restaurant': 'dining-arc',
  'local-tile-legal-wealth': 'data-doc-matrix',
  'local-tile-transit': 'route-lines',
  'local-tile-events': 'social-nodes',
  'local-tile-housing': 'housing-grid',
  'local-tile-classifieds': 'listing-tags',
  'local-tile-legal-scanner': 'scan-rings',
  'local-tile-connected-travel': 'universe-travel',
  'local-tile-connected-business': 'universe-business',
  'local-tile-connected-academy': 'universe-academy',
};

export const CLARITY_LEGEND_MICRO_SCENES: Readonly<
  Record<string, PremiumTileMicroSceneKind>
> = {
  legendRequestSent: 'signal-directional',
  legendMerchantConfirmed: 'approval-ring',
  legendMerchantDeclined: 'signal-broken',
  legendConfirmedNotPaid: 'info-pulse',
};

export const CLARITY_CTA_MICRO_SCENES = {
  browse: 'marketplace-grid' as const,
  assist: 'chat-request-beam' as const,
};

/** Capability preview tiles — semantic interior art by feature id. */
export const CLARITY_CAPABILITY_MICRO_SCENES: Readonly<
  Record<string, PremiumTileMicroSceneKind>
> = {
  localMarketplace: 'marketplace-grid',
  serviceMenu: 'route-lines',
  bookingRequest: 'signal-directional',
  merchantDashboard: 'data-doc-matrix',
  aiReceptionistPilot: 'chat-request-beam',
  nativeLanguageBooking: 'social-nodes',
};

export function resolveLocalTileMicroScene(
  testId?: string
): PremiumTileMicroSceneKind | undefined {
  if (!testId) return undefined;
  return LOCAL_TILE_MICRO_SCENES[testId];
}
