const COUNTRY_POINT: Readonly<Record<string, Readonly<{ latitude: number; longitude: number }>>> = {
  AT: { latitude: 48.2082, longitude: 16.3738 },
  CZ: { latitude: 50.0755, longitude: 14.4378 },
  DE: { latitude: 52.52, longitude: 13.405 },
  FR: { latitude: 48.8566, longitude: 2.3522 },
  GB: { latitude: 51.5072, longitude: -0.1276 },
  JP: { latitude: 35.6762, longitude: 139.6503 },
  KR: { latitude: 37.5665, longitude: 126.978 },
  PL: { latitude: 52.2297, longitude: 21.0122 },
  SK: { latitude: 48.1486, longitude: 17.1077 },
  US: { latitude: 38.9072, longitude: -77.0369 },
  VN: { latitude: 21.0278, longitude: 105.8342 },
};

export type VionaDockObservation = Readonly<{
  place: string | null;
  temperatureC: number | null;
}>;

type Point = Readonly<{ latitude: number; longitude: number }>;

function countryPoint(countryCode: string | undefined): Point | null {
  const code = countryCode?.trim().toUpperCase() ?? '';
  return COUNTRY_POINT[code] ?? null;
}

function readDevicePosition(): Promise<Point | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 10 * 60 * 1000 }
    );
  });
}

async function readPlaceName(point: Point, language: string): Promise<string | null> {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${point.latitude}` +
    `&longitude=${point.longitude}&localityLanguage=${encodeURIComponent(language)}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const body = (await response.json()) as { city?: string; locality?: string; countryName?: string };
  const city = body.city?.trim() || body.locality?.trim() || '';
  const country = body.countryName?.trim() || '';
  const place = [city, country].filter(Boolean).join(', ');
  return place || null;
}

async function readTemperature(point: Point): Promise<number | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${point.latitude}` +
    `&longitude=${point.longitude}&current=temperature_2m`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const body = (await response.json()) as { current?: { temperature_2m?: number } };
  const temperature = body.current?.temperature_2m;
  return typeof temperature === 'number' && Number.isFinite(temperature) ? Math.round(temperature) : null;
}

/** Place and temperature for the dock. Missing permission or network leaves that part empty. */
export async function observeVionaDockPlaceWeather(
  fallbackPlace: string | null,
  countryCode: string | undefined,
  language: string
): Promise<VionaDockObservation> {
  const device = await readDevicePosition();
  const point = device ?? countryPoint(countryCode);
  if (!point) return { place: fallbackPlace, temperatureC: null };
  const [place, temperatureC] = await Promise.all([
    device ? readPlaceName(device, language) : Promise.resolve(fallbackPlace),
    readTemperature(point),
  ]);
  return { place: place ?? fallbackPlace, temperatureC };
}
