/** Great-circle distance in meters — no external APIs. */

const EARTH_RADIUS_M = 6_371_000;

export function haversineMeters(
  a: Readonly<{ latitude: number; longitude: number }>,
  b: Readonly<{ latitude: number; longitude: number }>
): number {
  const φ1 = (a.latitude * Math.PI) / 180;
  const φ2 = (b.latitude * Math.PI) / 180;
  const Δφ = ((b.latitude - a.latitude) * Math.PI) / 180;
  const Δλ = ((b.longitude - a.longitude) * Math.PI) / 180;

  const sinΔφ = Math.sin(Δφ / 2);
  const sinΔλ = Math.sin(Δλ / 2);
  const h = sinΔφ * sinΔφ + Math.cos(φ1) * Math.cos(φ2) * sinΔλ * sinΔλ;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_M * c;
}

/** Distance in kilometers (legacy call signature used by travel services). */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return (
    haversineMeters(
      { latitude: lat1, longitude: lon1 },
      { latitude: lat2, longitude: lon2 }
    ) / 1000
  );
}
