import * as Location from 'expo-location';

import { reverseGeocodeMapbox } from '../location/mapboxGeocoding';

export type EmergencyLocationStatus = 'ok' | 'permission_denied' | 'unavailable';

export type EmergencyLocationResult = Readonly<{
  status: EmergencyLocationStatus;
  /** Geocoded or coordinate label when status is `ok`. */
  placeLabel?: string;
}>;

export async function resolveEmergencyLocation(): Promise<EmergencyLocationResult> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') {
      return { status: 'permission_denied' };
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const fallback = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

    try {
      const mb = await reverseGeocodeMapbox(lat, lon);
      if (mb?.placeLabel) {
        return { status: 'ok', placeLabel: mb.placeLabel };
      }
      return { status: 'ok', placeLabel: fallback };
    } catch {
      return { status: 'ok', placeLabel: fallback };
    }
  } catch {
    return { status: 'unavailable' };
  }
}
