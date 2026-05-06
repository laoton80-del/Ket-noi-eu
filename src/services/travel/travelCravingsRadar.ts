import { B2B_VIET_RESTAURANT_GEO, type B2bVietRestaurantGeoRow } from '../../data/b2bVietRestaurantGeoCatalog';
import { haversineKm } from '../../utils/geoHaversine';

export type CravingsRadarHit = B2bVietRestaurantGeoRow & Readonly<{ distanceKm: number }>;

/**
 * Returns B2B Vietnamese restaurant rows sorted by straight-line distance from the user's GPS fix.
 */
export function listVietnameseRestaurantsByProximity(params: Readonly<{
  latitude: number;
  longitude: number;
}>): CravingsRadarHit[] {
  const { latitude, longitude } = params;
  const enriched: CravingsRadarHit[] = B2B_VIET_RESTAURANT_GEO.map((row) => ({
    ...row,
    distanceKm: haversineKm(latitude, longitude, row.latitude, row.longitude),
  }));
  return enriched.sort((a, b) => a.distanceKm - b.distanceKm);
}
