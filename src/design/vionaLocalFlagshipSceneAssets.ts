/**
 * VIONA Wave 3B — dedicated Local flagship micro-scene assets (transparent SVG/PNG).
 * Folder: assets/viona/reference/local/flagships/
 *
 * Never throws — missing files resolve to null; procedural/vector fallback at render time.
 */
import type { ImageSourcePropType } from 'react-native';

import type { VionaUniverseAccent } from './premiumTileVisualTokens';

/** Vector fallback keys — must match `LocalVectorMicroSceneKey` in localVectorMicroSceneKeys.ts */
export type LocalFlagshipFallbackVectorKey =
  | 'local-my-requests'
  | 'local-booking-assist'
  | 'local-legal-wealth'
  | 'local-community-events';

export type LocalFlagshipSceneAssetKey =
  | 'myRequests'
  | 'bookingAssist'
  | 'legalWealth'
  | 'communityServices';

export const LOCAL_FLAGSHIP_SCENE_ASSET_KEYS = [
  'myRequests',
  'bookingAssist',
  'legalWealth',
  'communityServices',
] as const satisfies readonly LocalFlagshipSceneAssetKey[];

export type LocalFlagshipScenePosition = 'lower-center' | 'lower-left' | 'lower-right';

export type LocalFlagshipSceneAssetMeta = Readonly<{
  key: LocalFlagshipSceneAssetKey;
  /** Base filename without extension — see {@link LOCAL_FLAGSHIP_SCENE_FILENAMES}. */
  basename: string;
  accent: VionaUniverseAccent;
  recommendedOpacity: number;
  recommendedScale: number;
  recommendedPosition: LocalFlagshipScenePosition;
  /** Procedural vector scene when PNG/SVG not imported. */
  fallbackSceneKey: LocalFlagshipFallbackVectorKey;
}>;

export const LOCAL_FLAGSHIP_SCENE_FILENAMES: Readonly<
  Record<LocalFlagshipSceneAssetKey, { png: string; svg: string }>
> = {
  myRequests: {
    png: 'my-requests-scene.png',
    svg: 'my-requests-scene.svg',
  },
  bookingAssist: {
    png: 'booking-assist-scene.png',
    svg: 'booking-assist-scene.svg',
  },
  legalWealth: {
    png: 'legal-wealth-scene.png',
    svg: 'legal-wealth-scene.svg',
  },
  communityServices: {
    png: 'community-services-scene.png',
    svg: 'community-services-scene.svg',
  },
};

export const LOCAL_FLAGSHIP_SCENE_REGISTRY: Readonly<
  Record<LocalFlagshipSceneAssetKey, LocalFlagshipSceneAssetMeta>
> = {
  myRequests: {
    key: 'myRequests',
    basename: 'my-requests-scene',
    accent: 'emerald',
    recommendedOpacity: 0.9,
    recommendedScale: 1,
    recommendedPosition: 'lower-center',
    fallbackSceneKey: 'local-my-requests',
  },
  bookingAssist: {
    key: 'bookingAssist',
    basename: 'booking-assist-scene',
    accent: 'cyan',
    recommendedOpacity: 0.88,
    recommendedScale: 1,
    recommendedPosition: 'lower-center',
    fallbackSceneKey: 'local-booking-assist',
  },
  legalWealth: {
    key: 'legalWealth',
    basename: 'legal-wealth-scene',
    accent: 'gold',
    recommendedOpacity: 0.88,
    recommendedScale: 1,
    recommendedPosition: 'lower-center',
    fallbackSceneKey: 'local-legal-wealth',
  },
  communityServices: {
    key: 'communityServices',
    basename: 'community-services-scene',
    accent: 'violet',
    recommendedOpacity: 0.88,
    recommendedScale: 1,
    recommendedPosition: 'lower-center',
    fallbackSceneKey: 'local-community-events',
  },
};

/**
 * Static requires only — uncomment when matching asset exists under
 * assets/viona/reference/local/flagships/
 */
const LOCAL_FLAGSHIP_SCENE_PNG_SOURCES: Partial<
  Record<LocalFlagshipSceneAssetKey, ImageSourcePropType>
> = {
  // 'myRequests': require('../../assets/viona/reference/local/flagships/my-requests-scene.png'),
  // 'bookingAssist': require('../../assets/viona/reference/local/flagships/booking-assist-scene.png'),
  // 'legalWealth': require('../../assets/viona/reference/local/flagships/legal-wealth-scene.png'),
  // 'communityServices': require('../../assets/viona/reference/local/flagships/community-services-scene.png'),
};

export type LocalFlagshipSceneAssetResult = Readonly<{
  key: LocalFlagshipSceneAssetKey;
  meta: LocalFlagshipSceneAssetMeta;
  source: ImageSourcePropType;
  format: 'png';
}>;

export function getLocalFlagshipSceneAssetMeta(
  key: LocalFlagshipSceneAssetKey
): LocalFlagshipSceneAssetMeta {
  return LOCAL_FLAGSHIP_SCENE_REGISTRY[key];
}

/** PNG source or null — never throws. */
export function getVionaLocalFlagshipSceneImageSource(
  key: LocalFlagshipSceneAssetKey
): ImageSourcePropType | null {
  return LOCAL_FLAGSHIP_SCENE_PNG_SOURCES[key] ?? null;
}

export function getVionaLocalFlagshipSceneAsset(
  key: LocalFlagshipSceneAssetKey
): LocalFlagshipSceneAssetResult | null {
  const source = getVionaLocalFlagshipSceneImageSource(key);
  if (!source) return null;
  return {
    key,
    meta: LOCAL_FLAGSHIP_SCENE_REGISTRY[key],
    source,
    format: 'png',
  };
}

export function hasVionaLocalFlagshipSceneAsset(key: LocalFlagshipSceneAssetKey): boolean {
  return Boolean(getVionaLocalFlagshipSceneImageSource(key));
}

export function listMissingVionaLocalFlagshipSceneAssets(): readonly LocalFlagshipSceneAssetKey[] {
  return LOCAL_FLAGSHIP_SCENE_ASSET_KEYS.filter((key) => !LOCAL_FLAGSHIP_SCENE_PNG_SOURCES[key]);
}

/** Layout hints for {@link LocalFlagshipSceneAssetLayer}. */
export const vionaLocalFlagshipSceneLayout = {
  textSafeTopRatio: 0.38,
  sceneBandHeightRatio: 0.72,
  platformGlowWidthRatio: 0.72,
  platformGlowHeight: 18,
  meshVeilOpacity: 0.22,
} as const;
