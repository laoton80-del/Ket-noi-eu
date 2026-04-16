import { memo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Path, Polygon } from 'react-native-svg';
import { theme } from '../theme/theme';

export type TrustSurfaceCardTone = 'gold' | 'dark' | 'trust';

export type TrustSurfaceCardProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  watermarkOpacity?: number;
  cardTone?: TrustSurfaceCardTone;
};

function createStarPolygon(cx: number, cy: number, points = 14, outerR = 28, innerR = 12): string {
  const step = (Math.PI * 2) / points;
  const result: string[] = [];
  for (let i = 0; i < points; i += 1) {
    const aOuter = -Math.PI / 2 + i * step;
    const aInner = aOuter + step / 2;
    result.push(`${cx + Math.cos(aOuter) * outerR},${cy + Math.sin(aOuter) * outerR}`);
    result.push(`${cx + Math.cos(aInner) * innerR},${cy + Math.sin(aInner) * innerR}`);
  }
  return result.join(' ');
}

function BirdRing({ radius, color = '#7A4B0A', opacity = 0.8 }: { radius: number; color?: string; opacity?: number }) {
  const birds: { x: number; y: number; r: number; rot: number }[] = [];
  const ringR = radius * 0.7;
  for (let i = 0; i < 14; i += 1) {
    const a = (-Math.PI / 2) + (i * Math.PI * 2) / 14;
    birds.push({
      x: radius + Math.cos(a) * ringR,
      y: radius + Math.sin(a) * ringR,
      r: (a * 180) / Math.PI + 90,
      rot: (a * 180) / Math.PI + 90,
    });
  }
  return (
    <G opacity={opacity}>
      {birds.map((b, idx) => (
        <G key={`bird-${idx}`} transform={`translate(${b.x} ${b.y}) rotate(${b.rot})`}>
          <Path d="M -4 2 Q 0 -6 4 2 Q 1 0 -1 0 Z" fill={color} />
          <Circle cx="0" cy="3.5" r="0.8" fill={color} />
        </G>
      ))}
    </G>
  );
}

const OrbitWatermark = memo(function OrbitWatermark({ size = 92, opacity = 0.12 }: { size?: number; opacity?: number }) {
  const radius = size / 2;
  const starPoints = createStarPolygon(radius, radius, 14, radius * 0.46, radius * 0.2);
  return (
    <Svg width={size} height={size}>
      <G>
        <Circle cx={radius} cy={radius} r={radius * 0.73} fill="none" stroke="#7A4B0A" strokeWidth={2} opacity={opacity} />
        <Circle cx={radius} cy={radius} r={radius * 0.86} fill="none" stroke="#7A4B0A" strokeWidth={1.5} opacity={opacity * 0.8} />
        <BirdRing radius={radius} color="#7A4B0A" opacity={opacity} />
        <Polygon points={starPoints} fill="#7A4B0A" opacity={opacity} />
      </G>
    </Svg>
  );
});

/**
 * Trust-first panel for wallet / status surfaces (hybrid direction: Cool White / ink / Signal framing).
 * Decorative watermark is optional and kept subtle — not a public brand mark.
 */
export const TrustSurfaceCard = memo(function TrustSurfaceCard({
  children,
  style,
  watermarkOpacity = 0.12,
  cardTone = 'gold',
}: TrustSurfaceCardProps) {
  const darkTone = cardTone === 'dark';
  const trustTone = cardTone === 'trust';
  const gradientColors = trustTone
    ? (['#F5F8FC', '#EEF3F9'] as const)
    : darkTone
      ? (['#0F1116', '#1A1F27', '#0E1014'] as const)
      : (['#F3DEB0', '#DFC175', '#B98A32'] as const);

  return (
    <View style={[styles.cardBase, style]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.cardGradient,
          darkTone && styles.cardGradientDark,
          trustTone && styles.cardGradientTrust,
        ]}
      >
        <View style={styles.cardContent}>{children}</View>
        <View style={styles.watermarkWrap}>
          <OrbitWatermark opacity={watermarkOpacity} />
        </View>
      </LinearGradient>
    </View>
  );
});

const styles = StyleSheet.create({
  cardBase: {
    borderRadius: 24,
    minHeight: 132,
    shadowColor: '#4A3511',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: theme.elevation.modal.elevation + 2,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(122, 75, 10, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardGradientDark: {
    borderColor: theme.hybrid.signalSubtleBorder,
  },
  cardGradientTrust: {
    borderColor: 'rgba(85, 144, 224, 0.28)',
    shadowColor: 'rgba(85, 144, 224, 0.12)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  cardContent: {
    zIndex: 2,
  },
  watermarkWrap: {
    position: 'absolute',
    right: -8,
    bottom: -8,
  },
});
