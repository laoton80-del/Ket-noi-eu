/**
 * Reverse geocoding via Mapbox Geocoding API (no Google Geocoding).
 * Requires `EXPO_PUBLIC_MAPBOX_KEY` (public token) for network calls.
 */

import { getMapboxPublicToken } from '../../config/mapboxPublic';

export type MapboxReverseResult = Readonly<{
  city: string;
  country: string;
  countryCode: string;
  placeLabel: string;
}>;

type MapboxFeature = {
  place_type?: string[];
  text?: string;
  place_name?: string;
  context?: Array<{ id: string; text?: string; short_code?: string }>;
};

type MapboxGeocodeJson = {
  features?: MapboxFeature[];
};

function extractCountryCode(feature: MapboxFeature): string {
  const ctx = feature.context ?? [];
  for (const c of ctx) {
    if (c.id.startsWith('country.') && c.short_code) {
      return c.short_code.toUpperCase();
    }
  }
  return '';
}

function extractCity(feature: MapboxFeature): string {
  const ctx = feature.context ?? [];
  for (const c of ctx) {
    if (c.id.startsWith('place.')) return c.text ?? '';
    if (c.id.startsWith('locality.')) return c.text ?? '';
  }
  return feature.text ?? '';
}

/**
 * Reverse geocode coordinates using Mapbox Places. Returns `null` if no token or request fails.
 */
export async function reverseGeocodeMapbox(
  latitude: number,
  longitude: number
): Promise<MapboxReverseResult | null> {
  const token = getMapboxPublicToken();
  if (!token) return null;

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(`${longitude},${latitude}`)}.json` +
    `?access_token=${encodeURIComponent(token)}&limit=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as MapboxGeocodeJson;
    const f = data.features?.[0];
    if (!f) return null;

    const countryCode = extractCountryCode(f);
    const city = extractCity(f) || f.text || '';
    let country = '';
    for (const c of f.context ?? []) {
      if (c.id.startsWith('country.')) {
        country = c.text ?? '';
        break;
      }
    }
    const placeLabel = (f.place_name ?? [city, country].filter(Boolean).join(', ')).trim();

    return {
      city: city || 'Local',
      country: country || countryCode || 'Unknown',
      countryCode: countryCode || 'XX',
      placeLabel: placeLabel || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    };
  } catch {
    return null;
  }
}
