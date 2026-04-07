import * as Location from 'expo-location';

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
    try {
      const geocoded = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const g = geocoded[0];
      const address = [g?.name, g?.street, g?.city, g?.region, g?.country].filter(Boolean).join(', ');
      const fallback = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
      return { status: 'ok', label: address || fallback };
    } catch {
      return {
        status: 'ok',
        label: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
      };
    }
  } catch {
    return { status: 'unavailable', label: 'Không lấy được vị trí. Hãy nói địa chỉ gần nhất bạn biết.' };
  }
}
