import * as Location from 'expo-location';

import { reverseGeocodeMapbox } from '../location/mapboxGeocoding';

export async function resolveEmergencyLocation(): Promise<{
  status: 'ok' | 'unavailable';
  label: string;
}> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') {
      return { status: 'unavailable', label: 'Không lấy được vị trí (chưa cấp quyền vị trí).' };
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const fallback = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

    try {
      const mb = await reverseGeocodeMapbox(lat, lon);
      if (mb?.placeLabel) {
        return { status: 'ok', label: mb.placeLabel };
      }
      return { status: 'ok', label: fallback };
    } catch {
      return { status: 'ok', label: fallback };
    }
  } catch {
    return { status: 'unavailable', label: 'Không lấy được vị trí. Hãy nói địa chỉ gần nhất bạn biết.' };
  }
}
