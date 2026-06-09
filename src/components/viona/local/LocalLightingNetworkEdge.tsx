/**
 * LocalLightingNetworkEdge — a subtle premium "lighting network" edge accent for Local surfaces.
 *
 * Design intent (VIONA.WAVE_3B.LOCAL_LIGHTING_NETWORK_BORDER_SYSTEM):
 * - A controlled intelligence accent that enhances the frame/edge — NOT noisy decoration.
 * - Anchored to the lower-right / right edge so it never covers hero/card text or faces
 *   (Local text + status pills are top/left aligned; hero faces sit upper-centre).
 * - Cheap + static: a few SVG line segments (non-scaling stroke) + small glowing nodes + a soft
 *   corner glow. pointerEvents none, self-clipped to the surface radius, no layout shift, no
 *   permanent animation.
 *
 * Intensity is tiered: `hero` (strongest, still subtle) > `card` (medium) > `classified` (light).
 * `boosted` gently lifts intensity on hover/focus where the host already tracks that state.
 */
import type { ReactElement } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type LocalLightingNetworkTier = 'hero' | 'card' | 'classified';

export type LocalLightingNetworkEdgeProps = Readonly<{
  /** Primary accent (hex, e.g. '#78E8C4'). */
  accent: string;
  /** Optional secondary accent for node variety (hex). Falls back to `accent`. */
  secondaryAccent?: string;
  tier: LocalLightingNetworkTier;
  /** Hover/focus lift — only where the host supports it (hero is static). */
  boosted?: boolean;
  /** Surface corner radius so the accent self-clips even if the parent does not. */
  radius: number;
  testID?: string;
}>;

type TierConfig = Readonly<{
  lineWidth: number;
  nodeSize: number;
  glowRadius: number;
  lineAlpha: number;
  nodeAlpha: number;
  cornerAlpha: number;
  extraNode: boolean;
}>;

const TIERS: Record<LocalLightingNetworkTier, TierConfig> = {
  hero: { lineWidth: 1.1, nodeSize: 5, glowRadius: 6, lineAlpha: 0.5, nodeAlpha: 0.85, cornerAlpha: 0.1, extraNode: true },
  /** Pack 62LOCALBRIGHT_FINAL_VISUAL_FIX — card flagship: visible semantic network on hover. */
  card: { lineWidth: 1.2, nodeSize: 5.5, glowRadius: 7, lineAlpha: 0.42, nodeAlpha: 0.58, cornerAlpha: 0.12, extraNode: true },
  classified: { lineWidth: 1, nodeSize: 4, glowRadius: 4, lineAlpha: 0.24, nodeAlpha: 0.36, cornerAlpha: 0.05, extraNode: false },
};

/** Lower-right network vertices (viewBox 0..100), kept clear of left-aligned copy + faces. */
const NODES: readonly { x: number; y: number; secondary?: boolean; heroOnly?: boolean }[] = [
  { x: 91, y: 60 },
  { x: 82, y: 79, secondary: true },
  { x: 69, y: 90 },
  { x: 52, y: 96, heroOnly: true },
];

const MAIN_PATH = 'M96,38 L91,60 L82,79 L69,90 L52,96';
const BRANCH_PATH = 'M82,79 L94,84';
/** Pack 62LOCALBRIGHT_FIT_HOVER — extra card-tier branches for visible hover network. */
const CARD_BRANCH_PATHS = ['M78,72 L95,68', 'M58,88 L68,76', 'M91,60 L96,48'] as const;

function withAlpha(color: string, alpha: number): string {
  if (!color.startsWith('#') || (color.length !== 7 && color.length !== 4)) return color;
  const hex = color.length === 4
    ? color
        .slice(1)
        .split('')
        .map((c) => c + c)
        .join('')
    : color.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const clampAlpha = (a: number): number => Math.max(0, Math.min(0.96, a));

export function LocalLightingNetworkEdge({
  accent,
  secondaryAccent,
  tier,
  boosted = false,
  radius,
  testID,
}: LocalLightingNetworkEdgeProps): ReactElement {
  const cfg = TIERS[tier];
  const boost = boosted ? (tier === 'card' ? 1.45 : tier === 'hero' ? 1.42 : 1.08) : 1;
  const secondary = secondaryAccent ?? accent;

  const lineColor = withAlpha(accent, clampAlpha(cfg.lineAlpha * boost));
  const secondaryLineColor = withAlpha(secondary, clampAlpha(cfg.lineAlpha * boost * 0.92));
  const cornerColor = withAlpha(accent, clampAlpha(cfg.cornerAlpha * boost));
  const cardRestOpacity = tier === 'card' && !boosted ? 0.88 : 1;
  const cardHoverOpacity = tier === 'card' && boosted ? 1 : cardRestOpacity;

  const cornerGlowStyle: ViewStyle =
    Platform.OS === 'web'
      ? ({
          backgroundImage: `radial-gradient(120% 100% at 93% 96%, ${cornerColor} 0%, rgba(0,0,0,0) 62%)`,
        } as unknown as ViewStyle)
      : { backgroundColor: 'transparent' };

  const rootWebStyle: ViewStyle =
    Platform.OS === 'web' && tier === 'card'
      ? ({
          opacity: cardHoverOpacity,
          transition: 'opacity 220ms ease-out',
          zIndex: 2,
        } as ViewStyle)
      : tier === 'card'
        ? { zIndex: 2 }
        : {};

  return (
    <View pointerEvents="none" testID={testID} style={[styles.root, { borderRadius: radius }, rootWebStyle]}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, cornerGlowStyle]} />
      <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        pointerEvents="none"
      >
        <Path
          d={MAIN_PATH}
          stroke={lineColor}
          strokeWidth={cfg.lineWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        <Path
          d={BRANCH_PATH}
          stroke={lineColor}
          strokeWidth={cfg.lineWidth}
          strokeLinecap="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        {tier === 'card'
          ? CARD_BRANCH_PATHS.map((d, i) => (
              <Path
                key={d}
                d={d}
                stroke={i % 2 === 1 ? secondaryLineColor : lineColor}
                strokeWidth={cfg.lineWidth * 0.92}
                strokeLinecap="round"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
            ))
          : null}
      </Svg>
      {NODES.filter((node) => cfg.extraNode || !node.heroOnly).map((node) => {
        const color = withAlpha(node.secondary ? secondary : accent, clampAlpha(cfg.nodeAlpha * boost));
        const glow = withAlpha(node.secondary ? secondary : accent, clampAlpha(0.6 * boost));
        return (
          <View
            key={`${node.x}-${node.y}`}
            pointerEvents="none"
            style={[
              styles.node,
              {
                left: `${node.x}%`,
                top: `${node.y}%`,
                width: cfg.nodeSize,
                height: cfg.nodeSize,
                borderRadius: cfg.nodeSize / 2,
                marginLeft: -cfg.nodeSize / 2,
                marginTop: -cfg.nodeSize / 2,
                backgroundColor: color,
                shadowColor: glow,
                shadowRadius: cfg.glowRadius,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  node: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    elevation: 1,
  },
});
