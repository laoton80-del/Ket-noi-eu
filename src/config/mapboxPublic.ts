import Constants from 'expo-constants';

/**
 * Public Mapbox token (pk.*) — safe in client; restrict by bundle / URL in Mapbox dashboard.
 * CEO naming: `EXPO_PUBLIC_MAPBOX_KEY` (legacy `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` still supported via app.config).
 */
export function getMapboxPublicToken(): string {
  const extra = Constants.expoConfig?.extra as
    | { mapboxKey?: string; mapboxAccessToken?: string }
    | undefined;
  const fromExtra = extra?.mapboxKey?.trim() || extra?.mapboxAccessToken?.trim();
  if (fromExtra) return fromExtra;
  return process.env.EXPO_PUBLIC_MAPBOX_KEY?.trim() ?? process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? '';
}

/** Dark basemap; override with `EXPO_PUBLIC_MAPBOX_STYLE_URL` for custom Studio style. */
export function getMapboxStyleUrl(): string {
  const custom = process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL?.trim();
  if (custom) return custom;
  return 'mapbox://styles/mapbox/dark-v11';
}
