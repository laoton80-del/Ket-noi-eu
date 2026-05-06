import { Alert, Linking, Platform } from 'react-native';

/**
 * Open turn-by-turn / maps without Google Maps URLs (geo:, Apple Maps, OSM fallback).
 */
export async function openDirectionsExternally(
  latitude: number,
  longitude: number,
  label?: string
): Promise<void> {
  const name = label?.trim() || 'Destination';
  const lat = latitude;
  const lon = longitude;

  const candidates: string[] =
    Platform.OS === 'ios'
      ? [
          `maps://?daddr=${lat},${lon}&dirflg=d`,
          `http://maps.apple.com/?daddr=${lat},${lon}&dirflg=d`,
        ]
      : [
          `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(name)})`,
          `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${lat}%2C${lon}`,
        ];

  for (const url of candidates) {
    try {
      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      /* try next */
    }
  }

  try {
    await Linking.openURL(`https://www.openstreetmap.org/#map=16/${lat}/${lon}`);
  } catch {
    Alert.alert('Bản đồ', 'Không mở được ứng dụng chỉ đường lúc này.');
  }
}

export function openOsmSearchQuery(query: string): void {
  const q = encodeURIComponent(query.trim());
  void Linking.openURL(`https://www.openstreetmap.org/search?query=${q}`);
}
