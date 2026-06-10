/**
 * VIONA Wave 3B — Local full-card artwork registry (textless mini-poster PNGs).
 * Folder law: assets/viona/card-artwork/local/
 * Naming: {artworkKey}-card-v1.png
 *
 * Art direction (Local golden reference): full-card posters OFF — luminous micro-scene + code shell.
 */
import type { ImageSourcePropType } from 'react-native';

/** When false, Local uses bright micro-scene band + code-driven shell only (command-center reference). */
export const VIONA_LOCAL_FULL_CARD_ARTWORK_RENDER_ENABLED = false;

import type { PremiumTileSize } from './premiumTileVisualTokens';

export type VionaLocalCardArtworkKey =
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

export const VIONA_LOCAL_CARD_ARTWORK_KEYS = [
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
] as const satisfies readonly VionaLocalCardArtworkKey[];

export type VionaLocalCardArtworkTier = 'hero' | 'primary' | 'secondary' | 'compactStatus';

export const VIONA_LOCAL_CARD_ARTWORK_FILENAMES: Readonly<
  Record<VionaLocalCardArtworkKey, string>
> = {
  'local-browse-services': 'local-browse-services-card-v1.png',
  'local-booking-assist': 'local-booking-assist-card-v1.png',
  'local-restaurant-services': 'local-restaurant-services-card-v1.png',
  'local-transit-mobility': 'local-transit-mobility-card-v1.png',
  'local-legal-wealth': 'local-legal-wealth-card-v1.png',
  'local-my-requests': 'local-my-requests-card-v1.png',
  'local-nails-beauty': 'local-nails-beauty-card-v1.png',
  'local-community-events': 'local-community-events-card-v1.png',
  'local-housing-home': 'local-housing-home-card-v1.png',
  'local-classifieds-market': 'local-classifieds-market-card-v1.png',
  'local-document-scanner': 'local-document-scanner-card-v1.png',
  'local-request-sent': 'local-request-sent-card-v1.png',
  'local-merchant-review': 'local-merchant-review-card-v1.png',
  'local-merchant-declined': 'local-merchant-declined-card-v1.png',
  'local-confirmed-not-paid': 'local-confirmed-not-paid-card-v1.png',
};

export const VIONA_LOCAL_CARD_ARTWORK_TIER_BY_KEY: Readonly<
  Record<VionaLocalCardArtworkKey, VionaLocalCardArtworkTier>
> = {
  'local-browse-services': 'hero',
  'local-booking-assist': 'hero',
  'local-restaurant-services': 'primary',
  'local-transit-mobility': 'primary',
  'local-legal-wealth': 'primary',
  'local-my-requests': 'primary',
  'local-nails-beauty': 'secondary',
  'local-community-events': 'secondary',
  'local-housing-home': 'secondary',
  'local-classifieds-market': 'secondary',
  'local-document-scanner': 'secondary',
  'local-request-sent': 'compactStatus',
  'local-merchant-review': 'compactStatus',
  'local-merchant-declined': 'compactStatus',
  'local-confirmed-not-paid': 'compactStatus',
};

/** Visual swap tier targets — Local hub only (via fullCardArtworkKey on PremiumAppTile). */
export const vionaLocalCardArtworkLayout = {
  minHeightInner: {
    hero: 220,
    heroWide: 248,
    heroDesktop: 256,
    primary: 152,
    primaryWide: 168,
    secondary: 144,
    secondaryWide: 150,
    compactStatus: 72,
  },
  paddingVertical: {
    hero: 14,
    primary: 13,
    secondary: 12,
  },
  glow: {
    hero: { edgeWidth: 2.75, frameGlowOpacity: 0.94, haloOpacity: 0.52, shadowRadius: 32, innerRimOpacity: 0.72 },
    primary: { edgeWidth: 2.5, frameGlowOpacity: 0.88, haloOpacity: 0.46, shadowRadius: 26, innerRimOpacity: 0.68 },
    secondary: { edgeWidth: 2.25, frameGlowOpacity: 0.8, haloOpacity: 0.4, shadowRadius: 22, innerRimOpacity: 0.62 },
    compactStatus: { edgeWidth: 1, frameGlowOpacity: 0.62, haloOpacity: 0.24, shadowRadius: 14, innerRimOpacity: 0.5 },
  },
  imageOpacity: {
    hero: 0.74,
    primary: 0.7,
    secondary: 0.64,
    compactStatus: 0.5,
  },
  textSafeGradientHeight: {
    hero: '42%',
    primary: '38%',
    secondary: '36%',
    compactStatus: '55%',
  },
} as const;

const LOCAL_CARD_ARTWORK_SOURCES: Partial<
  Record<VionaLocalCardArtworkKey, ImageSourcePropType>
> = {
  // Activate when PNG exists under assets/viona/card-artwork/local/
  // 'local-browse-services': require('../../assets/viona/card-artwork/local/local-browse-services-card-v1.png'),
  // 'local-booking-assist': require('../../assets/viona/card-artwork/local/local-booking-assist-card-v1.png'),
  // 'local-restaurant-services': require('../../assets/viona/card-artwork/local/local-restaurant-services-card-v1.png'),
  // 'local-transit-mobility': require('../../assets/viona/card-artwork/local/local-transit-mobility-card-v1.png'),
  // 'local-legal-wealth': require('../../assets/viona/card-artwork/local/local-legal-wealth-card-v1.png'),
  // 'local-my-requests': require('../../assets/viona/card-artwork/local/local-my-requests-card-v1.png'),
  // 'local-nails-beauty': require('../../assets/viona/card-artwork/local/local-nails-beauty-card-v1.png'),
  // 'local-community-events': require('../../assets/viona/card-artwork/local/local-community-events-card-v1.png'),
  // 'local-housing-home': require('../../assets/viona/card-artwork/local/local-housing-home-card-v1.png'),
  // 'local-classifieds-market': require('../../assets/viona/card-artwork/local/local-classifieds-market-card-v1.png'),
  // 'local-document-scanner': require('../../assets/viona/card-artwork/local/local-document-scanner-card-v1.png'),
  // 'local-request-sent': require('../../assets/viona/card-artwork/local/local-request-sent-card-v1.png'),
  // 'local-merchant-review': require('../../assets/viona/card-artwork/local/local-merchant-review-card-v1.png'),
  // 'local-merchant-declined': require('../../assets/viona/card-artwork/local/local-merchant-declined-card-v1.png'),
  // 'local-confirmed-not-paid': require('../../assets/viona/card-artwork/local/local-confirmed-not-paid-card-v1.png'),
};

export function getVionaLocalCardArtworkImageSource(
  key: VionaLocalCardArtworkKey
): ImageSourcePropType | null {
  if (!VIONA_LOCAL_FULL_CARD_ARTWORK_RENDER_ENABLED) return null;
  return LOCAL_CARD_ARTWORK_SOURCES[key] ?? null;
}

/** Local hub uses micro-scene art direction when tier key is wired (full poster path disabled). */
export function shouldUseLocalLuminousMicroSceneArtDirection(
  fullCardArtworkKey?: VionaLocalCardArtworkKey
): boolean {
  return Boolean(fullCardArtworkKey) && !VIONA_LOCAL_FULL_CARD_ARTWORK_RENDER_ENABLED;
}

export function listMissingVionaLocalCardArtworkAssets(): readonly VionaLocalCardArtworkKey[] {
  return VIONA_LOCAL_CARD_ARTWORK_KEYS.filter((key) => !LOCAL_CARD_ARTWORK_SOURCES[key]);
}

export function resolveLocalCardArtworkTier(
  key?: VionaLocalCardArtworkKey
): VionaLocalCardArtworkTier | undefined {
  if (!key) return undefined;
  return VIONA_LOCAL_CARD_ARTWORK_TIER_BY_KEY[key];
}

export function resolveLocalCardArtworkMinHeight(
  tier: VionaLocalCardArtworkTier,
  size: PremiumTileSize = 'compact',
  viewportWidth = 390
): number {
  const isWide = viewportWidth >= 768;
  const isDesktop = viewportWidth >= 1024;
  const h = vionaLocalCardArtworkLayout.minHeightInner;

  if (tier === 'hero' || size === 'hero') {
    if (isDesktop) return h.heroDesktop;
    if (isWide) return h.heroWide;
    return h.hero;
  }
  if (tier === 'primary') {
    return isWide ? h.primaryWide : h.primary;
  }
  if (tier === 'secondary') {
    return isWide ? h.secondaryWide : h.secondary;
  }
  return h.compactStatus;
}

/** Local hub PremiumAppTile testID → full-card artwork key (visual only). */
export const LOCAL_HUB_CARD_ARTWORK_KEYS_BY_TEST_ID: Readonly<
  Partial<Record<string, VionaLocalCardArtworkKey>>
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

export function resolveLocalHubCardArtworkKey(
  testId?: string
): VionaLocalCardArtworkKey | undefined {
  if (!testId) return undefined;
  return LOCAL_HUB_CARD_ARTWORK_KEYS_BY_TEST_ID[testId];
}

export const LOCAL_STATUS_LEGEND_CARD_ARTWORK_KEYS: Readonly<
  Partial<Record<string, VionaLocalCardArtworkKey>>
> = {
  legendRequestSent: 'local-request-sent',
  legendMerchantConfirmed: 'local-merchant-review',
  legendMerchantDeclined: 'local-merchant-declined',
  legendConfirmedNotPaid: 'local-confirmed-not-paid',
};
