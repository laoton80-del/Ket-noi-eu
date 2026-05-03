import Constants from 'expo-constants';
import { type ReactNode, useEffect, useMemo } from 'react';
import { Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { getMapboxPublicToken, getMapboxStyleUrl } from '../../config/mapboxPublic';

/** Marker categories for PointAnnotation styling. */
export type MapPlaceKind = 'business' | 'homestay' | 'tour';

export type AppMapMarker = Readonly<{
  id: string;
  latitude: number;
  longitude: number;
  kind: MapPlaceKind;
  title?: string;
}>;

export type AppMapProps = Readonly<{
  latitude: number;
  longitude: number;
  zoomLevel?: number;
  style?: ViewStyle;
  /** Businesses, homestays, tour stops — rendered as Mapbox PointAnnotations. */
  markers?: readonly AppMapMarker[];
  /** Optional overlay (native only). */
  children?: ReactNode;
}>;

let accessTokenApplied = false;

function applyMapboxTokenOnce(token: string): void {
  if (accessTokenApplied || Platform.OS === 'web' || !token) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const MapboxGL = require('@rnmapbox/maps').default;
    MapboxGL.setAccessToken(token);
    accessTokenApplied = true;
  } catch {
    /* native module missing */
  }
}

function markerTint(kind: MapPlaceKind): string {
  switch (kind) {
    case 'homestay':
      return '#7CFFB2';
    case 'tour':
      return '#FFB84D';
    default:
      return '#5B8CFF';
  }
}

/**
 * Mapbox GL map — dark style, no Google Maps SDK.
 * Token: `EXPO_PUBLIC_MAPBOX_KEY` (see `app.config.js` → `extra.mapboxKey`).
 */
export function AppMap({
  latitude,
  longitude,
  zoomLevel = 14,
  style,
  markers = [],
  children,
}: AppMapProps) {
  const token = useMemo(() => {
    const t = getMapboxPublicToken();
    if (t) return t;
    const extra = Constants.expoConfig?.extra as { mapboxKey?: string; mapboxAccessToken?: string } | undefined;
    return extra?.mapboxKey?.trim() || extra?.mapboxAccessToken?.trim() || '';
  }, []);

  const styleURL = useMemo(() => getMapboxStyleUrl(), []);

  useEffect(() => {
    applyMapboxTokenOnce(token);
  }, [token]);

  const userPoint = useMemo(
    () => ({
      type: 'Point' as const,
      coordinates: [longitude, latitude] as [number, number],
    }),
    [latitude, longitude]
  );

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackTitle}>Bản đồ Mapbox (native)</Text>
        <Text style={styles.fallbackSub}>
          {latitude.toFixed(4)}, {longitude.toFixed(4)} · {markers.length} điểm
        </Text>
      </View>
    );
  }

  if (!token) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackTitle}>Thiếu EXPO_PUBLIC_MAPBOX_KEY</Text>
        <Text style={styles.fallbackSub}>Thêm public token Mapbox (pk.…) vào `.env` và rebuild.</Text>
      </View>
    );
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const MapboxGL = require('@rnmapbox/maps').default;

    return (
      <View style={[styles.fill, style]}>
        <MapboxGL.MapView style={styles.fill} styleURL={styleURL} logoEnabled={false} attributionEnabled>
          <MapboxGL.Camera
            defaultSettings={{
              centerCoordinate: [longitude, latitude],
              zoomLevel,
            }}
          />
          <MapboxGL.ShapeSource id="appmap-user" shape={userPoint}>
            <MapboxGL.CircleLayer
              id="appmap-user-dot"
              style={{
                circleRadius: 7,
                circleColor: '#C8FFCF',
                circleStrokeWidth: 2,
                circleStrokeColor: '#0B2A66',
              }}
            />
          </MapboxGL.ShapeSource>

          {markers.map((m) => (
            <MapboxGL.PointAnnotation
              key={m.id}
              id={m.id}
              coordinate={[m.longitude, m.latitude]}
              title={m.title ?? m.kind}
            >
              <View style={[styles.pinOuter, { borderColor: markerTint(m.kind) }]}>
                <View style={[styles.pinInner, { backgroundColor: markerTint(m.kind) }]} />
              </View>
            </MapboxGL.PointAnnotation>
          ))}

          {children}
        </MapboxGL.MapView>
      </View>
    );
  } catch {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackTitle}>Không tải Mapbox</Text>
        <Text style={styles.fallbackSub}>Chạy prebuild với plugin @rnmapbox/maps.</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 220 },
  pinOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,12,20,0.92)',
  },
  pinInner: { width: 10, height: 10, borderRadius: 5 },
  fallback: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#0E1624',
  },
  fallbackTitle: { color: '#E8EEF9', fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  fallbackSub: { color: '#9AA7BC', textAlign: 'center', fontSize: 13 },
});
