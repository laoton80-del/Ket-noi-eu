/**
 * Real-time geo + local-time awareness for Tourism / Minh Khang surfaces.
 * Uses `expo-location` foreground GPS + reverse geocode; weather & merchants are deterministic mocks until backend hooks.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { reverseGeocodeMapbox } from '../location/mapboxGeocoding';
import { haversineMeters } from '../../utils/geoHaversine';

const STORAGE_LAST_CITY_KEY = '@kn_travel_last_city_key';

export type NearbyMerchantKind = 'hotel' | 'homestay';

export type NearbyMerchantPreview = {
  readonly id: string;
  readonly name: string;
  readonly kind: NearbyMerchantKind;
  /** Approximate distance from user (mock / haversine-lite). */
  readonly distanceM: number;
  readonly latitude: number;
  readonly longitude: number;
};

export type TravelContext = {
  readonly city: string;
  readonly country: string;
  readonly countryCode: string;
  /**
   * True when GPS/reverse-geocode resolves to Vietnam — B2B merchant onboarding/workspace is disabled;
   * B2C (travel concierge, wallet, etc.) remains available.
   */
  readonly isDomesticVN: boolean;
  /** Human-readable local time in region (for UI). */
  readonly localTime: string;
  /** Mock WMO-like code (0–99); replace with Open-Meteo when wired. */
  readonly weatherCode: number;
  readonly nearbyMerchants: readonly NearbyMerchantPreview[];
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracyM: number | null;
  /** True when reverse-geocoded city differs from last persisted city (welcome rail). */
  readonly shouldShowCityWelcome: boolean;
  /** Vietnamese concierge copy when `shouldShowCityWelcome`. */
  readonly welcomeGreetingVi: string | undefined;
};

function hash01(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return (Math.abs(h) % 1000) / 1000;
}

function mockWeatherCode(lat: number, lng: number): number {
  const n = Math.abs(Math.round((lat * 97 + lng * 53) * 100)) % 100;
  return n;
}

function offsetLatLng(lat: number, lng: number, metersApprox: number, angleSeed: number): { lat: number; lng: number } {
  const rad = (angleSeed % 360) * (Math.PI / 180);
  const dLat = (metersApprox * Math.cos(rad)) / 111_320;
  const dLng = (metersApprox * Math.sin(rad)) / (111_320 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

function mockNearbyMerchants(lat: number, lng: number, city: string): readonly NearbyMerchantPreview[] {
  const base = city.trim() || 'Local';
  const seeds = [
    { kind: 'hotel' as const, name: `${base} Grand Hotel`, m: 240 },
    { kind: 'hotel' as const, name: `Airport Express · ${base}`, m: 890 },
    { kind: 'homestay' as const, name: `Old Town Stay · ${base}`, m: 410 },
    { kind: 'homestay' as const, name: `Garden Homestay · ${base}`, m: 620 },
  ];
  return seeds.map((s, i) => {
    const off = offsetLatLng(lat, lng, s.m, hash01(`${city}-${i.toString()}`) * 360);
    const distanceM = Math.round(
      haversineMeters(
        { latitude: lat, longitude: lng },
        { latitude: off.lat, longitude: off.lng }
      )
    );
    return {
      id: `nm_${hash01(`${lat},${lng},${i.toString()}`).toString(36).slice(2, 10)}`,
      name: s.name,
      kind: s.kind,
      distanceM,
      latitude: off.lat,
      longitude: off.lng,
    };
  });
}

function inferTimezoneId(countryCode: string): string {
  const cc = countryCode.toUpperCase();
  if (cc === 'CZ') return 'Europe/Prague';
  if (cc === 'DE') return 'Europe/Berlin';
  if (cc === 'AT') return 'Europe/Vienna';
  if (cc === 'PL') return 'Europe/Warsaw';
  if (cc === 'VN') return 'Asia/Ho_Chi_Minh';
  return 'UTC';
}

function formatLocalTimeVi(countryCode: string): string {
  try {
    const tz = inferTimezoneId(countryCode);
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: tz,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toLocaleString('vi-VN');
  }
}

async function readLastCityKey(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_LAST_CITY_KEY);
  } catch {
    return null;
  }
}

async function writeLastCityKey(key: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_LAST_CITY_KEY, key);
  } catch {
    /* non-fatal */
  }
}

function buildWelcomeVi(city: string, country: string): string {
  return (
    `Chào mừng bạn đến ${city}, ${country}. ` +
    `Minh Khang đã bật Travel Mode — phiên dịch khẩn cấp, menu quét ảnh, và Le Tan AI địa phương (tiếng Việt). ` +
    `Xem “Dịch vụ Việt” trong Tiện ích hoặc mở Concierge du lịch.`
  );
}

export type TravelContextOptions = Readonly<{
  /** Skip persisting welcome state (e.g. tests). */
  readonly skipPersistCity?: boolean;
}>;

/**
 * Fetches GPS (foreground), reverse-geocodes city/country, derives mock weather & nearby stays,
 * and optionally triggers first-time-in-city welcome copy (persisted via AsyncStorage).
 */
export async function getTravelContext(options?: TravelContextOptions): Promise<TravelContext> {
  const skipPersist = options?.skipPersistCity === true;

  let latitude = 50.0755;
  let longitude = 14.4378;
  let accuracyM: number | null = null;
  let city = 'Praha';
  let country = 'Czechia';
  let countryCode = 'CZ';

  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== Location.PermissionStatus.GRANTED) {
      throw new Error('location_permission_denied');
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Platform.OS === 'web' ? Location.Accuracy.Low : Location.Accuracy.Balanced,
    });
    latitude = pos.coords.latitude;
    longitude = pos.coords.longitude;
    accuracyM = pos.coords.accuracy ?? null;

    const mb = await reverseGeocodeMapbox(latitude, longitude);
    if (mb) {
      city = mb.city || city;
      country = mb.country || country;
      countryCode = mb.countryCode || countryCode;
    }
  } catch {
    /* fallback anchor — still return coherent concierge context */
  }

  const cityKey = `${countryCode}:${city}`.toLowerCase();
  const previous = await readLastCityKey();
  const shouldShowCityWelcome = previous !== cityKey;

  if (!skipPersist) {
    await writeLastCityKey(cityKey);
  }

  const weatherCode = mockWeatherCode(latitude, longitude);
  const nearbyMerchants = mockNearbyMerchants(latitude, longitude, city);
  const localTime = formatLocalTimeVi(countryCode);

  const welcomeGreetingVi = shouldShowCityWelcome ? buildWelcomeVi(city, country) : undefined;

  const isDomesticVN = countryCode.trim().toUpperCase() === 'VN';

  return {
    city,
    country,
    countryCode,
    isDomesticVN,
    localTime,
    weatherCode,
    nearbyMerchants,
    latitude,
    longitude,
    accuracyM,
    shouldShowCityWelcome,
    welcomeGreetingVi,
  };
}

/** Clears persisted city key — next `getTravelContext` behaves like first visit. */
export async function resetTravelWelcomePersistence(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_LAST_CITY_KEY);
  } catch {
    /* noop */
  }
}
