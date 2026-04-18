import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, G, Path, Polygon } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { gradients } from '../theme/gradients';
import { theme } from '../theme/theme';
import { TrustSurfaceCard, type TrustSurfaceCardTone } from './TrustSurfaceCard';

export type DongSonSkeuomorphicButtonProps = {
  variant?: 'button' | 'card' | 'avatar-ring';
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  watermarkOpacity?: number;
  cardTone?: TrustSurfaceCardTone;
};

const SIZE_MAP = {
  sm: 92,
  md: 120,
  lg: 148,
} as const;

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
          <Path
            d="M -4 2 Q 0 -6 4 2 Q 1 0 -1 0 Z"
            fill={color}
          />
          <Circle cx="0" cy="3.5" r="0.8" fill={color} />
        </G>
      ))}
    </G>
  );
}

/**
 * @deprecated Prefer `TrustSurfaceCard` for `variant="card"` (wallet / status panels).
 * This export remains for `button` and `avatar-ring` (ornate bronze / Đông Sơn-style chrome) and backward compatibility.
 */
export const DongSonSkeuomorphicButton = memo(function DongSonSkeuomorphicButton({
  variant = 'button',
  onPress,
  size = 'md',
  disabled = false,
  children,
  style,
  watermarkOpacity = 0.12,
  cardTone = 'gold',
}: DongSonSkeuomorphicButtonProps) {
  const dimension = SIZE_MAP[size];
  const radius = dimension / 2;
  const starPoints = createStarPolygon(radius, radius, 14, radius * 0.46, radius * 0.2);

  const scale = useSharedValue(1);
  const depth = useSharedValue(12);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOffset: { width: 0, height: depth.value },
  }));

  const onPressIn = () => {
    if (disabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    scale.value = withSpring(0.94, { damping: 14, stiffness: 220 });
    depth.value = withSpring(4, { damping: 14, stiffness: 220 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 220 });
    depth.value = withSpring(12, { damping: 14, stiffness: 220 });
  };

  if (variant === 'card') {
    return (
      <TrustSurfaceCard cardTone={cardTone} watermarkOpacity={watermarkOpacity} style={style}>
        {children}
      </TrustSurfaceCard>
    );
  }

  if (variant === 'avatar-ring') {
    return (
      <Pressable disabled={disabled} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={style}>
        <Animated.View style={[styles.base, { width: dimension, height: dimension, borderRadius: radius }, animatedStyle, disabled && styles.disabled]}>
          <LinearGradient
            colors={gradients.bronzeMetal}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, { width: dimension, height: dimension, borderRadius: radius }]}
          >
            <Svg width={dimension} height={dimension} style={StyleSheet.absoluteFill}>
              <G>
                <Circle cx={radius} cy={radius} r={radius * 0.73} fill="none" stroke="#7A4B0A" strokeWidth={2} opacity={0.8} />
                <Circle cx={radius} cy={radius} r={radius * 0.86} fill="none" stroke="#7A4B0A" strokeWidth={1.5} opacity={0.55} />
                <BirdRing radius={radius} />
              </G>
            </Svg>
            <View style={[styles.avatarCore, { width: dimension * 0.56, height: dimension * 0.56, borderRadius: (dimension * 0.56) / 2 }]}>
              {children}
            </View>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable disabled={disabled} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={style}>
      <Animated.View style={[styles.base, { width: dimension, height: dimension, borderRadius: radius }, animatedStyle, disabled && styles.disabled]}>
        <LinearGradient
          colors={gradients.bronzeMetal}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { width: dimension, height: dimension, borderRadius: radius }]}
        >
          <Svg width={dimension} height={dimension} style={StyleSheet.absoluteFill}>
            <G>
              <Circle cx={radius} cy={radius} r={radius * 0.73} fill="none" stroke="#7A4B0A" strokeWidth={2} opacity={0.8} />
              <Circle cx={radius} cy={radius} r={radius * 0.86} fill="none" stroke="#7A4B0A" strokeWidth={1.5} opacity={0.55} />
              <BirdRing radius={radius} />
              <Polygon points={starPoints} fill="#7A4B0A" opacity={0.8} />
            </G>
          </Svg>
          <View style={styles.buttonContent}>{children}</View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    shadowColor: '#4A3511',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: theme.elevation.fab.elevation + 9,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(122, 75, 10, 0.35)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  disabled: {
    opacity: 0.58,
  },
  avatarCore: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B0000',
    borderWidth: 1,
    borderColor: 'rgba(255,214,160,0.35)',
    shadowColor: '#470000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
});
