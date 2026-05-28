import type { ImageSourcePropType } from 'react-native';
import { getLocalHeroVisualSpec, type LocalHeroMood } from './vionaLocalHeroVisuals';

/**
 * Local hero keys for opening-stage visual variants.
 */
export type LocalHeroVisualKey =
  | 'default'
  | 'myRequests'
  | 'bookingAssist'
  | 'legalWealth'
  | 'browseServices';

/**
 * Required target hero asset dimensions (image-production contract):
 * - 1600x520 for dynamic hero banners
 * - 640x360 for optional matching card crops
 *
 * Until dedicated files are delivered in `assets/viona/local/hero/`,
 * the registry safely falls back to current Local-safe imagery.
 */
const FALLBACK_HERO = require('../assets/viona/home/viona-hero-local-1280x428.png');
const FALLBACK_CARD = require('../assets/viona/home/viona-home-local-night-market.png');

type LocalHeroAssetRegistry = Record<LocalHeroVisualKey, ImageSourcePropType>;

/**
 * Safe require helper for future Local hero files.
 * Keep image requires guarded to avoid runtime crashes in transition periods.
 */
function safeRequire(loader: () => ImageSourcePropType): ImageSourcePropType | null {
  try {
    return loader();
  } catch {
    return null;
  }
}

const LOCAL_HERO_IMAGE_ASSETS: Partial<Record<LocalHeroVisualKey, ImageSourcePropType>> = {
  default:
    safeRequire(() => require('../../assets/viona/local/hero/local-hero-default-1600x520.png')) ??
    undefined,
  myRequests:
    safeRequire(() => require('../../assets/viona/local/hero/local-hero-my-requests-1600x520.png')) ??
    undefined,
  bookingAssist:
    safeRequire(() => require('../../assets/viona/local/hero/local-hero-booking-assist-1600x520.png')) ??
    undefined,
  legalWealth:
    safeRequire(() => require('../../assets/viona/local/hero/local-hero-legal-wealth-1600x520.png')) ??
    undefined,
  browseServices:
    safeRequire(() => require('../../assets/viona/local/hero/local-hero-browse-services-1600x520.png')) ??
    undefined,
};

/**
 * Optional future mood variants (currently night-only placeholders).
 * These are non-required and always safely fallback to base hero assets.
 */
type LocalHeroMoodRegistry = Record<LocalHeroVisualKey, Partial<Record<LocalHeroMood, ImageSourcePropType>>>;

const OPTIONAL_LOCAL_HERO_MOOD_ASSETS: Partial<
  Record<LocalHeroVisualKey, Partial<Record<LocalHeroMood, ImageSourcePropType>>>
> = {
  default: { nightNeon: undefined },
  myRequests: { nightNeon: undefined },
  bookingAssist: { nightNeon: undefined },
  legalWealth: { nightNeon: undefined },
  browseServices: { nightNeon: undefined },
};

const LOCAL_HERO_CARD_IMAGE_ASSETS: Partial<Record<LocalHeroVisualKey, ImageSourcePropType>> = {
  myRequests:
    safeRequire(() => require('../../assets/viona/local/hero/local-card-my-requests-640x360.png')) ??
    undefined,
  bookingAssist:
    safeRequire(() => require('../../assets/viona/local/hero/local-card-booking-assist-640x360.png')) ??
    undefined,
  legalWealth:
    safeRequire(() => require('../../assets/viona/local/hero/local-card-legal-wealth-640x360.png')) ??
    undefined,
  browseServices:
    safeRequire(() => require('../../assets/viona/local/hero/local-card-browse-services-640x360.png')) ??
    undefined,
};

export const LOCAL_HERO_ASSETS: LocalHeroAssetRegistry = {
  default: LOCAL_HERO_IMAGE_ASSETS.default ?? FALLBACK_HERO,
  myRequests: LOCAL_HERO_IMAGE_ASSETS.myRequests ?? FALLBACK_HERO,
  bookingAssist: LOCAL_HERO_IMAGE_ASSETS.bookingAssist ?? FALLBACK_HERO,
  legalWealth: LOCAL_HERO_IMAGE_ASSETS.legalWealth ?? FALLBACK_HERO,
  browseServices: LOCAL_HERO_IMAGE_ASSETS.browseServices ?? FALLBACK_HERO,
};

export const LOCAL_HERO_CARD_ASSETS: LocalHeroAssetRegistry = {
  default: LOCAL_HERO_CARD_IMAGE_ASSETS.myRequests ?? FALLBACK_CARD,
  myRequests: LOCAL_HERO_CARD_IMAGE_ASSETS.myRequests ?? FALLBACK_CARD,
  bookingAssist: LOCAL_HERO_CARD_IMAGE_ASSETS.bookingAssist ?? FALLBACK_CARD,
  legalWealth: LOCAL_HERO_CARD_IMAGE_ASSETS.legalWealth ?? FALLBACK_CARD,
  browseServices: LOCAL_HERO_CARD_IMAGE_ASSETS.browseServices ?? FALLBACK_CARD,
};

export function getLocalHeroAsset(key: LocalHeroVisualKey): ImageSourcePropType {
  return LOCAL_HERO_ASSETS[key] ?? FALLBACK_HERO;
}

export function getLocalHeroCardAsset(key: LocalHeroVisualKey): ImageSourcePropType {
  return LOCAL_HERO_CARD_ASSETS[key] ?? FALLBACK_CARD;
}

export const LOCAL_HERO_ASSETS_BY_MOOD: LocalHeroMoodRegistry = {
  default: {
    daylight: LOCAL_HERO_ASSETS.default,
    goldenHour: LOCAL_HERO_ASSETS.default,
    nightNeon: OPTIONAL_LOCAL_HERO_MOOD_ASSETS.default?.nightNeon ?? LOCAL_HERO_ASSETS.default,
  },
  myRequests: {
    daylight: LOCAL_HERO_ASSETS.myRequests,
    goldenHour: LOCAL_HERO_ASSETS.myRequests,
    nightNeon:
      OPTIONAL_LOCAL_HERO_MOOD_ASSETS.myRequests?.nightNeon ?? LOCAL_HERO_ASSETS.myRequests,
  },
  bookingAssist: {
    daylight: LOCAL_HERO_ASSETS.bookingAssist,
    goldenHour: LOCAL_HERO_ASSETS.bookingAssist,
    nightNeon:
      OPTIONAL_LOCAL_HERO_MOOD_ASSETS.bookingAssist?.nightNeon ?? LOCAL_HERO_ASSETS.bookingAssist,
  },
  legalWealth: {
    daylight: LOCAL_HERO_ASSETS.legalWealth,
    goldenHour: LOCAL_HERO_ASSETS.legalWealth,
    nightNeon:
      OPTIONAL_LOCAL_HERO_MOOD_ASSETS.legalWealth?.nightNeon ?? LOCAL_HERO_ASSETS.legalWealth,
  },
  browseServices: {
    daylight: LOCAL_HERO_ASSETS.browseServices,
    goldenHour: LOCAL_HERO_ASSETS.browseServices,
    nightNeon:
      OPTIONAL_LOCAL_HERO_MOOD_ASSETS.browseServices?.nightNeon ?? LOCAL_HERO_ASSETS.browseServices,
  },
};

export function getLocalHeroAssetForMood(
  key: LocalHeroVisualKey,
  mood: LocalHeroMood
): ImageSourcePropType {
  return LOCAL_HERO_ASSETS_BY_MOOD[key]?.[mood] ?? getLocalHeroAsset(key);
}

export function getLocalHeroPreferredMoodAsset(key: LocalHeroVisualKey): ImageSourcePropType {
  const preferredMood = getLocalHeroVisualSpec(key).preferredMood;
  return getLocalHeroAssetForMood(key, preferredMood);
}

void safeRequire;
