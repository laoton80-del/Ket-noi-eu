import * as Location from 'expo-location';
import { Platform } from 'react-native';

/** Serializable payload ready for POST to ViGlobal safety / admin APIs. */
export type SosIncidentPayload = Readonly<{
  kind: 'medical' | 'police' | 'scam_report';
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  capturedAtIso: string;
  platform: string;
}>;

/**
 * Requests foreground location and returns high-accuracy coordinates when permitted.
 * Uses best available accuracy on device; web falls back to lower accuracy.
 */
export async function fetchPreciseSosCoordinates(): Promise<
  Readonly<{
    latitude: number;
    longitude: number;
    accuracyMeters: number | null;
  }> | null
> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const accuracy =
      Platform.OS === 'web' ? Location.Accuracy.Balanced : Location.Accuracy.Highest;

    const pos = await Location.getCurrentPositionAsync({
      accuracy,
    });

    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracyMeters: pos.coords.accuracy ?? null,
    };
  } catch {
    return null;
  }
}

export function buildSosIncidentPayload(
  kind: SosIncidentPayload['kind'],
  coords: Readonly<{
    latitude: number | null;
    longitude: number | null;
    accuracyMeters: number | null;
  }>
): SosIncidentPayload {
  return {
    kind,
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracyMeters: coords.accuracyMeters,
    capturedAtIso: new Date().toISOString(),
    platform: Platform.OS,
  };
}

/** JSON body for `fetch` / logging until the production endpoint is wired. */
export function serializeSosPayload(payload: SosIncidentPayload): string {
  return JSON.stringify(payload);
}
