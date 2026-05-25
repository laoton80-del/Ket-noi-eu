/**
 * VIONA Wave 3B — typed textless universe background registry.
 * Folder law: assets/viona/backgrounds/{universe}/
 * Naming: viona-{universe}-bg-main-{device}-{orientation}-v1.png
 */
import type { ImageSourcePropType } from 'react-native';

import { premiumShellBreakpoints } from './premiumTileVisualTokens';

export type VionaBackgroundUniverse =
  | 'local'
  | 'travel'
  | 'academy'
  | 'business'
  | 'account'
  | 'sos';

export type VionaBackgroundDevice = 'mobile' | 'tablet' | 'web';

export type VionaBackgroundOrientation = 'portrait' | 'landscape';

export type VionaBackgroundVariantKey = `${VionaBackgroundDevice}-${VionaBackgroundOrientation}`;

export type VionaBackgroundAssetEntry = Readonly<{
  key: VionaBackgroundVariantKey;
  filename: string;
  source: ImageSourcePropType;
}>;

export type GetVionaBackgroundAssetParams = Readonly<{
  universe: VionaBackgroundUniverse;
  device: VionaBackgroundDevice;
  orientation: VionaBackgroundOrientation;
}>;

export type VionaBackgroundAssetResult = Readonly<{
  universe: VionaBackgroundUniverse;
  device: VionaBackgroundDevice;
  orientation: VionaBackgroundOrientation;
  requestedKey: VionaBackgroundVariantKey;
  resolvedKey: VionaBackgroundVariantKey;
  source: ImageSourcePropType;
  filename: string;
  usedFallback: boolean;
  missingRequested: boolean;
}>;

type UniverseSources = Partial<Record<VionaBackgroundVariantKey, ImageSourcePropType>>;

const LOCAL_ASSETS: UniverseSources = {
  'mobile-portrait': require('../../assets/viona/backgrounds/local/viona-local-bg-main-mobile-portrait-v1.png'),
  'mobile-landscape': require('../../assets/viona/backgrounds/local/viona-local-bg-main-mobile-landscape-v1.png'),
  'tablet-portrait': require('../../assets/viona/backgrounds/local/viona-local-bg-main-tablet-portrait-v1.png'),
  'tablet-landscape': require('../../assets/viona/backgrounds/local/viona-local-bg-main-tablet-landscape-v1.png'),
  'web-landscape': require('../../assets/viona/backgrounds/local/viona-local-bg-main-web-landscape-v1.png'),
};

const TRAVEL_ASSETS: UniverseSources = {
  'mobile-portrait': require('../../assets/viona/backgrounds/travel/viona-travel-bg-main-mobile-portrait-v1.png'),
  'mobile-landscape': require('../../assets/viona/backgrounds/travel/viona-travel-bg-main-mobile-landscape-v1.png'),
  'tablet-portrait': require('../../assets/viona/backgrounds/travel/viona-travel-bg-main-tablet-portrait-v1.png'),
  'tablet-landscape': require('../../assets/viona/backgrounds/travel/viona-travel-bg-main-tablet-landscape-v1.png'),
  'web-landscape': require('../../assets/viona/backgrounds/travel/viona-travel-bg-main-web-landscape-v1.png'),
};

const ACADEMY_ASSETS: UniverseSources = {
  'mobile-portrait': require('../../assets/viona/backgrounds/academy/viona-academy-bg-main-mobile-portrait-v1.png'),
  'mobile-landscape': require('../../assets/viona/backgrounds/academy/viona-academy-bg-main-mobile-landscape-v1.png'),
  'tablet-portrait': require('../../assets/viona/backgrounds/academy/viona-academy-bg-main-tablet-portrait-v1.png'),
  'tablet-landscape': require('../../assets/viona/backgrounds/academy/viona-academy-bg-main-tablet-landscape-v1.png'),
  'web-landscape': require('../../assets/viona/backgrounds/academy/viona-academy-bg-main-web-landscape-v1.png'),
};

const BUSINESS_ASSETS: UniverseSources = {
  'mobile-portrait': require('../../assets/viona/backgrounds/business/viona-business-bg-main-mobile-portrait-v1.png'),
  'mobile-landscape': require('../../assets/viona/backgrounds/business/viona-business-bg-main-mobile-landscape-v1.png'),
  'tablet-portrait': require('../../assets/viona/backgrounds/business/viona-business-bg-main-tablet-portrait-v1.png'),
  'tablet-landscape': require('../../assets/viona/backgrounds/business/viona-business-bg-main-tablet-landscape-v1.png'),
  'web-landscape': require('../../assets/viona/backgrounds/business/viona-business-bg-main-web-landscape-v1.png'),
};

const ACCOUNT_ASSETS: UniverseSources = {
  'mobile-portrait': require('../../assets/viona/backgrounds/account/viona-account-bg-main-mobile-portrait-v1.png'),
  'mobile-landscape': require('../../assets/viona/backgrounds/account/viona-account-bg-main-mobile-landscape-v1.png'),
  'tablet-portrait': require('../../assets/viona/backgrounds/account/viona-account-bg-main-tablet-portrait-v1.png'),
  'tablet-landscape': require('../../assets/viona/backgrounds/account/viona-account-bg-main-tablet-landscape-v1.png'),
  'web-landscape': require('../../assets/viona/backgrounds/account/viona-account-bg-main-web-landscape-v1.png'),
};

const SOS_ASSETS: UniverseSources = {
  'mobile-portrait': require('../../assets/viona/backgrounds/sos/viona-sos-bg-main-mobile-portrait-v1.png'),
  'mobile-landscape': require('../../assets/viona/backgrounds/sos/viona-sos-bg-main-mobile-landscape-v1.png'),
  'tablet-portrait': require('../../assets/viona/backgrounds/sos/viona-sos-bg-main-tablet-portrait-v1.png'),
  'tablet-landscape': require('../../assets/viona/backgrounds/sos/viona-sos-bg-main-tablet-landscape-v1.png'),
  'web-landscape': require('../../assets/viona/backgrounds/sos/viona-sos-bg-main-web-landscape-v1.png'),
};

/** Assets registered but not wired to screens in this pack (Local-only consumer). */
export const VIONA_BACKGROUND_REGISTRY_UNIVERSES = [
  'local',
  'travel',
  'academy',
  'business',
  'account',
  'sos',
] as const satisfies readonly VionaBackgroundUniverse[];

/** Optional batch 6 — not imported. */
export const VIONA_BACKGROUND_MISSING_BY_UNIVERSE: Readonly<
  Record<VionaBackgroundUniverse, readonly VionaBackgroundVariantKey[]>
> = {
  local: ['web-portrait'],
  travel: ['web-portrait'],
  academy: ['web-portrait'],
  business: ['web-portrait'],
  account: ['web-portrait'],
  sos: ['web-portrait'],
};

const UNIVERSE_SOURCES: Readonly<Record<VionaBackgroundUniverse, UniverseSources>> = {
  local: LOCAL_ASSETS,
  travel: TRAVEL_ASSETS,
  academy: ACADEMY_ASSETS,
  business: BUSINESS_ASSETS,
  account: ACCOUNT_ASSETS,
  sos: SOS_ASSETS,
};

/** Spec fallbacks — landscape/portrait gaps only; never throws. */
const VARIANT_FALLBACK: Readonly<Partial<Record<VionaBackgroundVariantKey, readonly VionaBackgroundVariantKey[]>>> = {
  'mobile-landscape': ['mobile-portrait'],
  'tablet-landscape': ['tablet-portrait'],
  'web-portrait': ['web-landscape', 'tablet-portrait', 'mobile-portrait'],
};

function variantKey(
  device: VionaBackgroundDevice,
  orientation: VionaBackgroundOrientation
): VionaBackgroundVariantKey {
  return `${device}-${orientation}`;
}

function entryFor(
  universe: VionaBackgroundUniverse,
  key: VionaBackgroundVariantKey
): VionaBackgroundAssetEntry | null {
  const source = UNIVERSE_SOURCES[universe][key];
  if (!source) return null;
  return {
    key,
    filename: `viona-${universe}-bg-main-${key}-v1.png`,
    source,
  };
}

/**
 * Resolve a static background asset for universe + device + orientation.
 * Uses documented fallbacks when a variant file is missing.
 */
export function getVionaBackgroundAsset(
  params: GetVionaBackgroundAssetParams
): VionaBackgroundAssetResult | null {
  const { universe, device, orientation } = params;
  const requestedKey = variantKey(device, orientation);
  const chain: VionaBackgroundVariantKey[] = [
    requestedKey,
    ...(VARIANT_FALLBACK[requestedKey] ?? []),
  ];

  for (const key of chain) {
    const entry = entryFor(universe, key);
    if (entry) {
      return {
        universe,
        device,
        orientation,
        requestedKey,
        resolvedKey: key,
        source: entry.source,
        filename: entry.filename,
        usedFallback: key !== requestedKey,
        missingRequested: !UNIVERSE_SOURCES[universe][requestedKey],
      };
    }
  }

  const firstKey = Object.keys(UNIVERSE_SOURCES[universe])[0] as VionaBackgroundVariantKey | undefined;
  const fallbackEntry = firstKey ? entryFor(universe, firstKey) : null;
  if (!fallbackEntry) return null;

  return {
    universe,
    device,
    orientation,
    requestedKey,
    resolvedKey: fallbackEntry.key,
    source: fallbackEntry.source,
    filename: fallbackEntry.filename,
    usedFallback: true,
    missingRequested: true,
  };
}

export function resolveVionaBackgroundDevice(width: number): VionaBackgroundDevice {
  if (width >= premiumShellBreakpoints.desktop) return 'web';
  if (width >= premiumShellBreakpoints.tablet) return 'tablet';
  return 'mobile';
}

export function resolveVionaBackgroundOrientation(
  width: number,
  height: number
): VionaBackgroundOrientation {
  return height >= width ? 'portrait' : 'landscape';
}

/** Viewport helper for shells — device + orientation from window dimensions. */
export function getVionaBackgroundAssetForViewport(
  universe: VionaBackgroundUniverse,
  width: number,
  height: number
): VionaBackgroundAssetResult | null {
  return getVionaBackgroundAsset({
    universe,
    device: resolveVionaBackgroundDevice(width),
    orientation: resolveVionaBackgroundOrientation(width, height),
  });
}

/** Local shell opacity — readability under luminous veil. */
export function resolveLocalLuminousBackgroundOpacity(width: number): number {
  return width >= premiumShellBreakpoints.landscapeTablet ? 0.48 : 0.4;
}
