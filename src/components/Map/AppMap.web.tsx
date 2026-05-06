import { type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

/** Marker categories for PointAnnotation styling (native). */
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
  markers?: readonly AppMapMarker[];
  children?: ReactNode;
}>;

/** Web placeholder map; native live map lives in `AppMap.tsx`. */
export function AppMap({
  latitude,
  longitude,
  zoomLevel = 14,
  style,
  markers = [],
  children,
}: AppMapProps) {
  return (
    <View style={[styles.wrap, style]} accessibilityLabel="Map preview unavailable on web">
      <Text style={styles.title}>Map preview is not available on web.</Text>
      <Text style={styles.sub}>Open the mobile app for live map discovery.</Text>
      <Text style={styles.meta}>
        {latitude.toFixed(4)}, {longitude.toFixed(4)} · zoom {zoomLevel} · {markers.length} markers
      </Text>
      {children ? <View style={styles.childrenSlot}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#0E1624',
  },
  title: {
    color: '#E8EEF9',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 15,
  },
  sub: {
    color: '#9AA7BC',
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  meta: {
    color: 'rgba(154, 167, 188, 0.85)',
    textAlign: 'center',
    fontSize: 12,
  },
  childrenSlot: {
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
});
