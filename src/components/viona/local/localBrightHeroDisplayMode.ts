import type { LocalHeroVisualKey } from '../../../design/vionaLocalHeroAssets';
import { LOCAL_BRIGHT_REAL_CITY_HERO_FIT } from '../../../design/vionaLocalBrightRealCityFit';

/** Pack 62LOCALBRIGHT_FULLBLEED_RESTORE — Local Bright web-normal full-bleed cover fit only. */
export type LocalBrightHeroEditorialFit = Readonly<{
  backdropScale: number;
  backdropBlurPx: number;
  backdropBrightness: number;
  backdropSaturate: number;
  foregroundScale: number;
}>;

export const LOCAL_BRIGHT_HERO_FULLBLEED_COVER_FIT: LocalBrightHeroEditorialFit = {
  backdropScale: LOCAL_BRIGHT_REAL_CITY_HERO_FIT.backdropScale,
  backdropBlurPx: LOCAL_BRIGHT_REAL_CITY_HERO_FIT.backdropBlurPx,
  backdropBrightness: LOCAL_BRIGHT_REAL_CITY_HERO_FIT.backdropBrightness,
  backdropSaturate: LOCAL_BRIGHT_REAL_CITY_HERO_FIT.backdropSaturate,
  foregroundScale: 1.0,
};

export function resolveLocalBrightHeroEditorialFit(_key: LocalHeroVisualKey): LocalBrightHeroEditorialFit {
  return LOCAL_BRIGHT_HERO_FULLBLEED_COVER_FIT;
}
