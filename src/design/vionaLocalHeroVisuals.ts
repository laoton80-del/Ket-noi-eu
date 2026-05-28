import type { LocalHeroVisualKey } from './vionaLocalHeroAssets';

/**
 * Local opening hero/cards use one premium dark-glass shell in all app theme states.
 * Daylight/golden-hour raster assets are unchanged; app `daylightBoost` does not branch Local glass.
 */
export const LOCAL_OPENING_PREMIUM_GLASS_THEME_INVARIANT = true as const;

export type LocalHeroMood = 'daylight' | 'goldenHour' | 'nightNeon';

export type LocalHeroVisualSpec = Readonly<{
  accent: string;
  secondaryAccent: string;
  networkIntensity: number;
  preferredObjectPosition: string;
  textScrimStrength: number;
  preferredMood: Exclude<LocalHeroMood, 'nightNeon'>;
  allowedMoods: readonly LocalHeroMood[];
  assetFileName: string;
  optionalNightAssetFileName?: string;
  cardAssetFileName: string;
}>;

export const LOCAL_HERO_VISUALS: Record<LocalHeroVisualKey, LocalHeroVisualSpec> = {
  default: {
    accent: '#78E8C4',
    secondaryAccent: '#8CD4FF',
    networkIntensity: 0.28,
    preferredObjectPosition: '58% 42%',
    textScrimStrength: 0.58,
    preferredMood: 'goldenHour',
    allowedMoods: ['daylight', 'goldenHour', 'nightNeon'],
    assetFileName: 'local-hero-default-1600x520.png',
    optionalNightAssetFileName: 'local-hero-default-night-1600x520.png',
    cardAssetFileName: 'local-card-my-requests-640x360.png',
  },
  myRequests: {
    accent: '#78E8C4',
    secondaryAccent: '#8CD4FF',
    networkIntensity: 0.3,
    preferredObjectPosition: '56% 44%',
    textScrimStrength: 0.58,
    preferredMood: 'daylight',
    allowedMoods: ['daylight', 'goldenHour', 'nightNeon'],
    assetFileName: 'local-hero-my-requests-1600x520.png',
    optionalNightAssetFileName: 'local-hero-my-requests-night-1600x520.png',
    cardAssetFileName: 'local-card-my-requests-640x360.png',
  },
  bookingAssist: {
    accent: '#8CD4FF',
    secondaryAccent: '#66B6FF',
    networkIntensity: 0.34,
    preferredObjectPosition: '62% 42%',
    textScrimStrength: 0.6,
    preferredMood: 'goldenHour',
    allowedMoods: ['daylight', 'goldenHour', 'nightNeon'],
    assetFileName: 'local-hero-booking-assist-1600x520.png',
    optionalNightAssetFileName: 'local-hero-booking-assist-night-1600x520.png',
    cardAssetFileName: 'local-card-booking-assist-640x360.png',
  },
  legalWealth: {
    accent: '#E8C878',
    secondaryAccent: '#F0B35D',
    networkIntensity: 0.24,
    preferredObjectPosition: '40% 52%',
    textScrimStrength: 0.64,
    preferredMood: 'daylight',
    allowedMoods: ['daylight', 'goldenHour', 'nightNeon'],
    assetFileName: 'local-hero-legal-wealth-1600x520.png',
    optionalNightAssetFileName: 'local-hero-legal-wealth-night-1600x520.png',
    cardAssetFileName: 'local-card-legal-wealth-640x360.png',
  },
  browseServices: {
    accent: '#C8A8F0',
    secondaryAccent: '#B56DFF',
    networkIntensity: 0.28,
    preferredObjectPosition: '62% 50%',
    textScrimStrength: 0.6,
    preferredMood: 'daylight',
    allowedMoods: ['daylight', 'goldenHour', 'nightNeon'],
    assetFileName: 'local-hero-browse-services-1600x520.png',
    optionalNightAssetFileName: 'local-hero-browse-services-night-1600x520.png',
    cardAssetFileName: 'local-card-browse-services-640x360.png',
  },
};

export function getLocalHeroVisualSpec(key: LocalHeroVisualKey): LocalHeroVisualSpec {
  return LOCAL_HERO_VISUALS[key] ?? LOCAL_HERO_VISUALS.default;
}
