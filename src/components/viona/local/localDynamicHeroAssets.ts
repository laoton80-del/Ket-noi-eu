import type { ImageSourcePropType } from 'react-native';

import {
  DYNAMIC_HERO_DEFAULT_EDITORIAL_FOCAL,
  type DynamicHeroAssetMode,
  dynamicHeroAssetModeToLegacyDevice,
  isDynamicHeroWebAssetMode,
} from '../dynamicHeroMediaFit';
import type { LocalHeroVisualKey } from '../../../design/vionaLocalHeroAssets';

/** Scenario keys with dedicated dynamic hero assets (excludes resting `default`). */
export type LocalDynamicHeroScenarioKey = Exclude<LocalHeroVisualKey, 'default'>;

type LocalDynamicHeroAssetPair = Readonly<
  Record<'web' | 'mobile', ImageSourcePropType>
>;

/** Pack 62LOCALBRIGHT_PREVIEW — Real City large-hero masters (web-normal + fullscreen). */
const LOCAL_DYNAMIC_HERO_WEB_NORMAL_62LOCALBRIGHT: Readonly<Record<LocalHeroVisualKey, ImageSourcePropType>> = {
  default: require('../../../../assets/viona/dynamic-hero/local/local-overview-web-normal-master-62localbright.png'),
  myRequests: require('../../../../assets/viona/dynamic-hero/local/local-my-requests-web-normal-master-62localbright.png'),
  bookingAssist: require('../../../../assets/viona/dynamic-hero/local/local-booking-assist-web-normal-master-62localbright.png'),
  legalWealth: require('../../../../assets/viona/dynamic-hero/local/local-legal-wealth-web-normal-master-62localbright.png'),
  browseServices: require('../../../../assets/viona/dynamic-hero/local/local-browse-services-web-normal-master-62localbright.png'),
};

const LOCAL_DYNAMIC_HERO_WEB_FULLSCREEN_SOURCE: Readonly<
  Record<LocalDynamicHeroScenarioKey, ImageSourcePropType>
> = {
  browseServices: LOCAL_DYNAMIC_HERO_WEB_NORMAL_62LOCALBRIGHT.browseServices,
  myRequests: LOCAL_DYNAMIC_HERO_WEB_NORMAL_62LOCALBRIGHT.myRequests,
  bookingAssist: LOCAL_DYNAMIC_HERO_WEB_NORMAL_62LOCALBRIGHT.bookingAssist,
  legalWealth: LOCAL_DYNAMIC_HERO_WEB_NORMAL_62LOCALBRIGHT.legalWealth,
};

const LOCAL_DYNAMIC_HERO_WEB_NORMAL_62LOCALBRIGHT_FILENAME: Readonly<Record<LocalHeroVisualKey, string>> = {
  default: 'local-overview-web-normal-master-62localbright.png',
  browseServices: 'local-browse-services-web-normal-master-62localbright.png',
  myRequests: 'local-my-requests-web-normal-master-62localbright.png',
  bookingAssist: 'local-booking-assist-web-normal-master-62localbright.png',
  legalWealth: 'local-legal-wealth-web-normal-master-62localbright.png',
};

const LOCAL_DYNAMIC_HERO_WEB_NORMAL_SOURCE: Readonly<
  Record<LocalDynamicHeroScenarioKey, ImageSourcePropType>
> = {
  browseServices: LOCAL_DYNAMIC_HERO_WEB_NORMAL_62LOCALBRIGHT.browseServices,
  myRequests: LOCAL_DYNAMIC_HERO_WEB_NORMAL_62LOCALBRIGHT.myRequests,
  bookingAssist: LOCAL_DYNAMIC_HERO_WEB_NORMAL_62LOCALBRIGHT.bookingAssist,
  legalWealth: LOCAL_DYNAMIC_HERO_WEB_NORMAL_62LOCALBRIGHT.legalWealth,
};

/** Runtime audit filenames — mirrors require targets exactly. */
export const LOCAL_DYNAMIC_HERO_ASSET_FILENAMES: Readonly<
  Record<
    LocalDynamicHeroScenarioKey,
    Readonly<Record<'webNormal' | 'webFullscreen' | 'mobilePortrait', string>>
  >
> = {
  browseServices: {
    webNormal: 'local-browse-services-web-normal-master-62localbright.png',
    webFullscreen: 'local-browse-services-web-normal-master-62localbright.png',
    mobilePortrait: 'local-browse-services-web-normal-card-62localbright.png',
  },
  myRequests: {
    webNormal: 'local-my-requests-web-normal-master-62localbright.png',
    webFullscreen: 'local-my-requests-web-normal-master-62localbright.png',
    mobilePortrait: 'local-my-requests-web-normal-card-62localbright.png',
  },
  bookingAssist: {
    webNormal: 'local-booking-assist-web-normal-master-62localbright.png',
    webFullscreen: 'local-booking-assist-web-normal-master-62localbright.png',
    mobilePortrait: 'local-booking-assist-web-normal-card-62localbright.png',
  },
  legalWealth: {
    webNormal: 'local-legal-wealth-web-normal-master-62localbright.png',
    webFullscreen: 'local-legal-wealth-web-normal-master-62localbright.png',
    mobilePortrait: 'local-legal-wealth-web-normal-card-62localbright.png',
  },
};

export function resolveLocalDynamicHeroAssetFilename(
  key: LocalHeroVisualKey,
  assetModeOrDevice: DynamicHeroAssetMode | 'web' | 'mobile'
): string {
  const assetMode: DynamicHeroAssetMode =
    assetModeOrDevice === 'web' || assetModeOrDevice === 'mobile'
      ? assetModeOrDevice === 'web'
        ? 'webNormal'
        : 'mobilePortrait'
      : assetModeOrDevice;
  if (assetMode === 'webNormal' || assetMode === 'webFullscreen') {
    return LOCAL_DYNAMIC_HERO_WEB_NORMAL_62LOCALBRIGHT_FILENAME[key];
  }
  const scenarioKey = resolveLocalDynamicHeroScenarioKey(key);
  if (assetMode === 'mobilePortrait') {
    return LOCAL_DYNAMIC_HERO_ASSET_FILENAMES[scenarioKey].mobilePortrait;
  }
  return LOCAL_DYNAMIC_HERO_ASSET_FILENAMES[scenarioKey].webFullscreen;
}

/** Pack 62LOCALBRIGHT — operator-approved card lane for mobile portrait until dedicated mobile masters land. */
const LOCAL_DYNAMIC_HERO_MOBILE_CARD_62LOCALBRIGHT: Readonly<
  Record<LocalDynamicHeroScenarioKey, ImageSourcePropType>
> = {
  browseServices: require('../../../../assets/viona/dynamic-hero/local/local-browse-services-web-normal-card-62localbright.png'),
  myRequests: require('../../../../assets/viona/dynamic-hero/local/local-my-requests-web-normal-card-62localbright.png'),
  bookingAssist: require('../../../../assets/viona/dynamic-hero/local/local-booking-assist-web-normal-card-62localbright.png'),
  legalWealth: require('../../../../assets/viona/dynamic-hero/local/local-legal-wealth-web-normal-card-62localbright.png'),
};

export const localDynamicHeroAssets: Readonly<
  Record<LocalDynamicHeroScenarioKey, LocalDynamicHeroAssetPair>
> = {
  browseServices: {
    web: LOCAL_DYNAMIC_HERO_WEB_NORMAL_SOURCE.browseServices,
    mobile: LOCAL_DYNAMIC_HERO_MOBILE_CARD_62LOCALBRIGHT.browseServices,
  },
  myRequests: {
    web: LOCAL_DYNAMIC_HERO_WEB_NORMAL_SOURCE.myRequests,
    mobile: LOCAL_DYNAMIC_HERO_MOBILE_CARD_62LOCALBRIGHT.myRequests,
  },
  bookingAssist: {
    web: LOCAL_DYNAMIC_HERO_WEB_NORMAL_SOURCE.bookingAssist,
    mobile: LOCAL_DYNAMIC_HERO_MOBILE_CARD_62LOCALBRIGHT.bookingAssist,
  },
  legalWealth: {
    web: LOCAL_DYNAMIC_HERO_WEB_NORMAL_SOURCE.legalWealth,
    mobile: LOCAL_DYNAMIC_HERO_MOBILE_CARD_62LOCALBRIGHT.legalWealth,
  },
};

export function isLocalDynamicHeroScenarioKey(
  key: LocalHeroVisualKey
): key is LocalDynamicHeroScenarioKey {
  return key !== 'default';
}

/** Resting Local hero uses service-discovery (browseServices), not legacy default family tile. */
export function resolveLocalDynamicHeroScenarioKey(
  key: LocalHeroVisualKey
): LocalDynamicHeroScenarioKey {
  if (key === 'default') return 'browseServices';
  return key;
}

/**
 * Resolves dynamic hero raster for scenario + mode.
 * webNormal / webFullscreen → Pack 62LOCALBRIGHT Real City large-hero masters;
 * mobilePortrait → operator-approved 62localbright card lane.
 */
export function getLocalDynamicHeroAsset(
  key: LocalHeroVisualKey,
  assetModeOrDevice: DynamicHeroAssetMode | 'web' | 'mobile'
): ImageSourcePropType {
  const assetMode: DynamicHeroAssetMode =
    assetModeOrDevice === 'web' || assetModeOrDevice === 'mobile'
      ? assetModeOrDevice === 'web'
        ? 'webNormal'
        : 'mobilePortrait'
      : assetModeOrDevice;

  if (assetMode === 'webNormal' || assetMode === 'webFullscreen') {
    return LOCAL_DYNAMIC_HERO_WEB_NORMAL_62LOCALBRIGHT[key];
  }
  const scenarioKey = resolveLocalDynamicHeroScenarioKey(key);
  if (assetMode === 'mobilePortrait') {
    return LOCAL_DYNAMIC_HERO_MOBILE_CARD_62LOCALBRIGHT[scenarioKey];
  }
  if (isDynamicHeroWebAssetMode(assetMode)) {
    return LOCAL_DYNAMIC_HERO_WEB_FULLSCREEN_SOURCE[scenarioKey];
  }
  return LOCAL_DYNAMIC_HERO_WEB_NORMAL_62LOCALBRIGHT[key];
}

/** @deprecated Use {@link dynamicHeroAssetModeToLegacyDevice} + {@link getLocalDynamicHeroAsset}. */
export type LocalDynamicHeroDeviceType = 'web' | 'mobile';

/** Pack 62LOCALBRIGHT_LOWER_1CM — per-master Y focal; X locked at 48%. */
export const localDynamicHeroMediaFocal: Readonly<Record<LocalDynamicHeroScenarioKey, string>> = {
  myRequests: '48% 49%',
  bookingAssist: '48% 61%',
  legalWealth: '48% 65%',
  browseServices: '48% 42%',
} as const;

export const LOCAL_DYNAMIC_HERO_DEFAULT_FOCAL = DYNAMIC_HERO_DEFAULT_EDITORIAL_FOCAL;

export function resolveLocalDynamicHeroFocal(
  key: LocalHeroVisualKey,
  fallback: string,
  assetMode: DynamicHeroAssetMode = 'webNormal'
): string {
  const scenarioKey = resolveLocalDynamicHeroScenarioKey(key);
  if (assetMode === 'webFullscreen') {
    if (key === 'default') return '52% 44%';
    return '52% 44%';
  }
  if (assetMode === 'webNormal' && key === 'default') {
    return '48% 42%';
  }
  return localDynamicHeroMediaFocal[scenarioKey] ?? (LOCAL_DYNAMIC_HERO_DEFAULT_FOCAL || fallback);
}
