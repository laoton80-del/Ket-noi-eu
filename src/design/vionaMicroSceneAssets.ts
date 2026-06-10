/**
 * VIONA Wave 3B — typed Local micro-scene PNG registry (textless card interior art).
 * Folder law: assets/viona/micro-scenes/local/
 * Naming: {microSceneKey}-v1.png
 *
 * Activation: add static `require()` entries to LOCAL_MICRO_SCENE_SOURCES when PNGs land.
 * Never throws — missing files resolve to null (vector micro-scene fallback on tiles).
 */
import type { ImageSourcePropType } from 'react-native';

export type VionaMicroSceneKey =
  | 'local-hero-service-network'
  | 'local-booking-calendar-beam'
  | 'local-language-bridge'
  | 'local-paperwork-documents'
  | 'local-merchant-storefront'
  | 'local-community-map-pulse'
  | 'local-request-status-path'
  | 'local-no-payment-shield';

export const VIONA_LOCAL_MICRO_SCENE_KEYS = [
  'local-hero-service-network',
  'local-booking-calendar-beam',
  'local-language-bridge',
  'local-paperwork-documents',
  'local-merchant-storefront',
  'local-community-map-pulse',
  'local-request-status-path',
  'local-no-payment-shield',
] as const satisfies readonly VionaMicroSceneKey[];

/** Expected on-disk filenames (batch v1). */
export const VIONA_MICRO_SCENE_FILENAMES: Readonly<Record<VionaMicroSceneKey, string>> = {
  'local-hero-service-network': 'local-hero-service-network-v1.png',
  'local-booking-calendar-beam': 'local-booking-calendar-beam-v1.png',
  'local-language-bridge': 'local-language-bridge-v1.png',
  'local-paperwork-documents': 'local-paperwork-documents-v1.png',
  'local-merchant-storefront': 'local-merchant-storefront-v1.png',
  'local-community-map-pulse': 'local-community-map-pulse-v1.png',
  'local-request-status-path': 'local-request-status-path-v1.png',
  'local-no-payment-shield': 'local-no-payment-shield-v1.png',
};

export type VionaMicroSceneAssetResult = Readonly<{
  key: VionaMicroSceneKey;
  filename: string;
  source: ImageSourcePropType;
}>;

/**
 * Static requires only — uncomment lines when matching PNG exists under
 * assets/viona/micro-scenes/local/
 */
const LOCAL_MICRO_SCENE_SOURCES: Partial<Record<VionaMicroSceneKey, ImageSourcePropType>> = {
  // 'local-hero-service-network': require('../../assets/viona/micro-scenes/local/local-hero-service-network-v1.png'),
  // 'local-booking-calendar-beam': require('../../assets/viona/micro-scenes/local/local-booking-calendar-beam-v1.png'),
  // 'local-language-bridge': require('../../assets/viona/micro-scenes/local/local-language-bridge-v1.png'),
  // 'local-paperwork-documents': require('../../assets/viona/micro-scenes/local/local-paperwork-documents-v1.png'),
  // 'local-merchant-storefront': require('../../assets/viona/micro-scenes/local/local-merchant-storefront-v1.png'),
  // 'local-community-map-pulse': require('../../assets/viona/micro-scenes/local/local-community-map-pulse-v1.png'),
  // 'local-request-status-path': require('../../assets/viona/micro-scenes/local/local-request-status-path-v1.png'),
  // 'local-no-payment-shield': require('../../assets/viona/micro-scenes/local/local-no-payment-shield-v1.png'),
};

/** Keys registered in code but awaiting PNG import. */
export function listMissingVionaMicroSceneAssets(): readonly VionaMicroSceneKey[] {
  return VIONA_LOCAL_MICRO_SCENE_KEYS.filter((key) => !LOCAL_MICRO_SCENE_SOURCES[key]);
}

/** Tile interior PNG layer — bright object/scene (not dark poster). */
export const vionaMicroSceneTileLayout = {
  imageOpacity: 0.38,
  veilOpacity: 0.52,
  prominentImageOpacity: 0.88,
  prominentVeilOpacity: 0.22,
  slotWidth: 112,
  slotHeight: 76,
  prominentSlotWidth: '100%' as const,
  prominentSlotHeight: '100%' as const,
  coverWidth: '100%' as const,
  coverHeight: '72%' as const,
} as const;

/**
 * Primary resolver — returns image source or null when PNG not yet imported.
 * Never throws.
 */
export function getVionaMicroSceneImageSource(
  key: VionaMicroSceneKey
): ImageSourcePropType | null {
  return LOCAL_MICRO_SCENE_SOURCES[key] ?? null;
}

/**
 * Extended resolver — source plus registry metadata (filename, key).
 */
export function getVionaMicroSceneAsset(
  key: VionaMicroSceneKey
): VionaMicroSceneAssetResult | null {
  const source = getVionaMicroSceneImageSource(key);
  if (!source) return null;
  return {
    key,
    filename: VIONA_MICRO_SCENE_FILENAMES[key],
    source,
  };
}

/** Local hub PremiumAppTile testID → micro-scene key (visual layer only). */
export const LOCAL_HUB_MICRO_SCENE_KEYS_BY_TEST_ID: Readonly<
  Partial<Record<string, VionaMicroSceneKey>>
> = {
  'local-cta-browse-services': 'local-hero-service-network',
  'local-cta-booking-assist': 'local-booking-calendar-beam',
  'local-tile-restaurant': 'local-merchant-storefront',
  'local-tile-transit': 'local-language-bridge',
  'local-tile-legal-wealth': 'local-paperwork-documents',
  'local-tile-my-requests': 'local-request-status-path',
  'local-tile-events': 'local-community-map-pulse',
  'local-tile-legal-scanner': 'local-no-payment-shield',
};

export function resolveLocalHubMicroSceneKey(
  testId?: string
): VionaMicroSceneKey | undefined {
  if (!testId) return undefined;
  return LOCAL_HUB_MICRO_SCENE_KEYS_BY_TEST_ID[testId];
}
