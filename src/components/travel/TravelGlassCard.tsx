import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { ReactElement, ReactNode } from 'react';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { LocalConstellationFrame } from '../local/LocalConstellationFrame';
import type { LocalConstellationAccent, LocalNetworkCardTier } from '../local/localConstellationTokens';
import {
  VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_CYAN,
  VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_EMERALD,
  VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_GOLD,
  VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_MAGENTA,
  VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_VIOLET,
  type VionaGlobalLightNetworkAccentTokens,
} from '../viona/globalLightNetworkTokens';

/** Controlled semantic lighting accents for Travel hub. */
export type TravelSemanticAccent = 'cyan' | 'gold' | 'emerald' | 'violet' | 'magenta';

/** @deprecated Use TravelSemanticAccent */
export type TravelGlassAccent = TravelSemanticAccent;

export type TravelGlassIntensity = 'quiet' | 'standard' | 'primary';

export type TravelGlassVisual = 'standard' | 'hero' | 'quickHelp';

export type TravelGlassCardProps = Readonly<{
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  tier?: LocalNetworkCardTier;
  accent?: TravelSemanticAccent;
  intensity?: TravelGlassIntensity;
  compact?: boolean;
  visual?: TravelGlassVisual;
  disabled?: boolean;
  accessibilityLabel?: string;
}>;

const SEMANTIC_TOKENS: Readonly<Record<TravelSemanticAccent, VionaGlobalLightNetworkAccentTokens>> = {
  cyan: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_CYAN,
  gold: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_GOLD,
  emerald: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_EMERALD,
  violet: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_VIOLET,
  magenta: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_MAGENTA,
};

/** Per-accent rim/glint visibility (non-cyan reads clearer). */
const ACCENT_LIFT: Readonly<Record<TravelSemanticAccent, number>> = {
  cyan: 1.06,
  gold: 1.44,
  emerald: 1.41,
  violet: 1.39,
  magenta: 1.46,
};

const CAPSULE_GLOW_BOOST = 1.3;

export function travelSemanticTokens(accent: TravelSemanticAccent): VionaGlobalLightNetworkAccentTokens {
  return SEMANTIC_TOKENS[accent];
}

export function travelFrameAccent(accent: TravelSemanticAccent): LocalConstellationAccent {
  if (accent === 'magenta') return 'violet';
  return accent;
}

type IntensitySpec = Readonly<{
  glowMul: number;
  edgeMul: number;
  rimMul: number;
  washMul: number;
  tier: LocalNetworkCardTier;
  outerShadow: number;
  edgePx: number;
}>;

function resolveIntensity(
  intensity: TravelGlassIntensity,
  visual: TravelGlassVisual
): IntensitySpec {
  if (visual === 'hero') {
    return {
      glowMul: 1.64,
      edgeMul: 1.02,
      rimMul: 1.14,
      washMul: 1.28,
      tier: 'hero',
      outerShadow: 0.56,
      edgePx: 3,
    };
  }
  if (visual === 'quickHelp' || intensity === 'primary') {
    return {
      glowMul: 2.04,
      edgeMul: 1.08,
      rimMul: 1.28,
      washMul: 1.54,
      tier: 'service',
      outerShadow: 0.58,
      edgePx: 3,
    };
  }
  if (intensity === 'quiet') {
    return {
      glowMul: 0.4,
      edgeMul: 0.36,
      rimMul: 0.52,
      washMul: 0.5,
      tier: 'utility',
      outerShadow: 0.1,
      edgePx: 2,
    };
  }
  return {
    glowMul: 1.28,
    edgeMul: 0.68,
    rimMul: 1.08,
    washMul: 1.34,
    tier: 'service',
    outerShadow: 0.44,
    edgePx: 2,
  };
}

function resolveTier(
  visual: TravelGlassVisual,
  spec: IntensitySpec,
  tier?: LocalNetworkCardTier
): LocalNetworkCardTier {
  if (tier) return tier;
  return spec.tier;
}

function TravelMaterialLayers({
  accent,
  tokens,
  spec,
  hovered,
  radius,
  visual,
}: Readonly<{
  accent: TravelSemanticAccent;
  tokens: VionaGlobalLightNetworkAccentTokens;
  spec: IntensitySpec;
  hovered: boolean;
  radius: number;
  visual: TravelGlassVisual;
}>): ReactElement {
  const lift = hovered ? 1.12 : 1;
  const accentBoost = ACCENT_LIFT[accent];
  const edgeAlpha = spec.edgeMul * accentBoost * lift;
  const edgePx = spec.edgePx;
  const edgeBloomStrength = visual === 'standard' ? 0.52 : visual === 'quickHelp' ? 0.78 : 0.8;

  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(7, 12, 22, 0.9)', 'rgba(3, 8, 16, 0.97)', 'rgba(2, 6, 12, 0.98)']}
        locations={[0, 0.55, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[`${tokens.glow}`, 'rgba(5, 11, 20, 0)', 'rgba(5, 11, 20, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          StyleSheet.absoluteFillObject,
          { borderRadius: radius, opacity: 0.24 * spec.washMul * accentBoost * lift },
        ]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255, 255, 255, 0.26)', 'rgba(255, 255, 255, 0.08)', 'transparent']}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.88, y: 0.42 }}
        style={[
          styles.innerTopHighlight,
          {
            borderTopLeftRadius: radius,
            borderTopRightRadius: radius,
            opacity: visual === 'standard' ? 1.08 : 1,
          },
        ]}
      />
      {visual === 'standard' || visual === 'quickHelp' ? (
        <LinearGradient
          pointerEvents="none"
          colors={[`${tokens.glow}`, `${tokens.washHover}`, 'rgba(5, 11, 20, 0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0.72, y: 0.5 }}
          style={[
            styles.capsuleRadiance,
            {
              borderTopLeftRadius: radius,
              borderBottomLeftRadius: radius,
              opacity: (visual === 'quickHelp' ? 0.5 : 0.36) * spec.washMul * accentBoost * lift,
            },
          ]}
        />
      ) : null}
      {visual === 'standard' ? (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={[`${tokens.glow}`, `${tokens.washHover}`, 'rgba(5, 11, 20, 0)']}
            start={{ x: 0.2, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[
              styles.interiorWash,
              { borderRadius: radius, opacity: 0.22 * spec.washMul * accentBoost * lift },
            ]}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.04)', 'transparent']}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 0.55 }}
            style={[styles.interiorWell, { borderRadius: radius, opacity: 0.95 * lift }]}
          />
        </>
      ) : null}
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', 'rgba(0, 0, 0, 0.16)', 'rgba(0, 0, 0, 0.48)']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.depthShadow,
          { borderBottomLeftRadius: radius, borderBottomRightRadius: radius },
        ]}
      />
      {visual === 'standard' || visual === 'quickHelp' ? (
        <LinearGradient
          pointerEvents="none"
          colors={['transparent', 'rgba(0, 0, 0, 0.08)', 'rgba(0, 0, 0, 0.38)']}
          start={{ x: 0.55, y: 0.2 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.depthShadowRight,
            { borderBottomRightRadius: radius, borderTopRightRadius: radius },
          ]}
        />
      ) : null}
      <View
        pointerEvents="none"
        style={[
          styles.rimTop,
          {
            borderTopLeftRadius: radius,
            borderTopRightRadius: radius,
            opacity: 0.38 * spec.rimMul * lift,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.rimLeft,
          {
            borderTopLeftRadius: radius,
            borderBottomLeftRadius: radius,
            backgroundColor: tokens.glow,
            opacity: (visual === 'quickHelp' ? 0.3 : 0.26) * spec.rimMul * edgeAlpha,
          },
        ]}
      />
      {visual === 'standard' || visual === 'quickHelp' ? (
        <View
          pointerEvents="none"
          style={[
            styles.rimRight,
            {
              borderTopRightRadius: radius,
              borderBottomRightRadius: radius,
              backgroundColor: tokens.glow,
              opacity: 0.1 * spec.rimMul * accentBoost * lift,
            },
          ]}
        />
      ) : null}
      <View
        pointerEvents="none"
        style={[
          styles.edgeBloom,
          {
            width: edgePx,
            opacity: Math.min(0.72, edgeAlpha * edgeBloomStrength),
            backgroundColor: tokens.glow,
            shadowColor: tokens.glow,
            shadowOpacity: 0.55 * accentBoost,
            shadowRadius: edgePx + 1,
            shadowOffset: { width: 0, height: 0 },
          },
          Platform.OS === 'web' &&
            ({
              boxShadow: `0 0 ${edgePx + 2}px ${tokens.glow}`,
            } as ViewStyle),
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.edgeBloomBottom,
          {
            height: Math.max(1, edgePx - 1),
            opacity: 0.35 * edgeAlpha,
            backgroundColor: tokens.glow,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.cornerGlintTl,
          {
            borderTopLeftRadius: radius,
            width: visual === 'standard' || visual === 'quickHelp' ? 48 : 42,
            height: visual === 'standard' || visual === 'quickHelp' ? 48 : 42,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.34)', 'rgba(255, 255, 255, 0.08)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.cornerGlintTr,
          {
            borderTopRightRadius: radius,
            width: visual === 'standard' || visual === 'quickHelp' ? 52 : 46,
            height: visual === 'standard' || visual === 'quickHelp' ? 52 : 46,
            opacity: (visual === 'quickHelp' ? 0.58 : 0.52) * spec.glowMul * accentBoost * lift,
          },
        ]}
      >
        <LinearGradient
          colors={[tokens.glow, tokens.washHover, 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.cornerGlintBr,
          {
            borderBottomRightRadius: radius,
            opacity: (visual === 'quickHelp' ? 0.26 : 0.22) * spec.glowMul * accentBoost,
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', tokens.glow]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      {visual === 'hero' ? (
        <TravelHeroChrome hovered={hovered} tokens={tokens} radius={radius} />
      ) : null}
      {visual === 'quickHelp' ? (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.04)', 'transparent']}
            start={{ x: 0.12, y: 0 }}
            end={{ x: 0.88, y: 0.55 }}
            style={[styles.interiorWell, { borderRadius: radius, opacity: 0.98 * lift }]}
          />
          <LinearGradient
            pointerEvents="none"
            colors={[tokens.washHover, 'rgba(5, 11, 20, 0)']}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.quickHelpAura,
              { borderRadius: radius, opacity: 0.5 * spec.washMul * accentBoost * lift },
            ]}
          />
        </>
      ) : null}
    </>
  );
}

function TravelHeroChrome({
  hovered,
  tokens,
  radius,
}: Readonly<{
  hovered: boolean;
  tokens: VionaGlobalLightNetworkAccentTokens;
  radius: number;
}>): ReactElement {
  const lift = hovered ? 1.1 : 1;
  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(132, 238, 255, 0.34)',
          'rgba(246, 212, 110, 0.22)',
          'rgba(244, 230, 255, 0.24)',
          'rgba(5, 11, 20, 0)',
        ]}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 1, y: 0.9 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
      />
      <View
        pointerEvents="none"
        style={[styles.heroOrb, styles.heroOrbCyan, { opacity: (hovered ? 0.9 : 0.76) * lift }]}
      />
      <View
        pointerEvents="none"
        style={[styles.heroOrb, styles.heroOrbViolet, { opacity: (hovered ? 0.58 : 0.44) * lift }]}
      />
      <View
        pointerEvents="none"
        style={[styles.heroOrb, styles.heroOrbGold, { opacity: (hovered ? 0.54 : 0.4) * lift }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', tokens.glow, tokens.ink, tokens.glow, 'transparent']}
        locations={[0, 0.32, 0.5, 0.68, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.heroRouteLine, { opacity: (hovered ? 1 : 0.94) * lift }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', 'rgba(132, 238, 255, 0.88)', 'transparent']}
        start={{ x: 0.08, y: 0.35 }}
        end={{ x: 0.92, y: 0.62 }}
        style={[styles.heroRouteArc, { opacity: 0.68 * lift }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_GOLD.glow, 'transparent']}
        start={{ x: 0.15, y: 0.5 }}
        end={{ x: 0.7, y: 0.5 }}
        style={[styles.heroRouteStreak, { opacity: 0.62 * lift }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_VIOLET.glow, 'transparent']}
        start={{ x: 0.55, y: 0.48 }}
        end={{ x: 1, y: 0.52 }}
        style={[styles.heroRouteStreak, { top: '48%', height: 2, opacity: 0.44 * lift }]}
      />
      <View pointerEvents="none" style={[styles.heroParticle, styles.heroParticleA]} />
      <View pointerEvents="none" style={[styles.heroParticle, styles.heroParticleB]} />
      <View pointerEvents="none" style={[styles.heroParticle, styles.heroParticleC]} />
      <View pointerEvents="none" style={[styles.heroParticle, styles.heroParticleD]} />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', 'rgba(0, 0, 0, 0.35)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.heroVignetteBottom, { borderBottomLeftRadius: radius, borderBottomRightRadius: radius }]}
      />
    </>
  );
}

export function TravelIconCapsule({
  icon,
  ink,
  accent,
  accentSecondary,
  size = 18,
  prominent = false,
  intensity = 'standard',
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  ink: string;
  accent: TravelSemanticAccent;
  accentSecondary?: TravelSemanticAccent;
  size?: number;
  prominent?: boolean;
  intensity?: TravelGlassIntensity;
}>): ReactElement {
  const tokens = travelSemanticTokens(accent);
  const secondary = accentSecondary ? travelSemanticTokens(accentSecondary) : null;
  const spec = resolveIntensity(intensity, prominent ? 'quickHelp' : 'standard');
  const accentBoost = ACCENT_LIFT[accent] * CAPSULE_GLOW_BOOST;
  const dim = prominent ? 44 : 38;
  const glowPx = prominent ? 22 : 15;
  const iconGlow = prominent ? 14 : 10;

  return (
    <View
      style={[
        styles.iconCapsule,
        {
          width: dim,
          height: dim,
          borderRadius: 10,
          borderColor: tokens.stroke,
          shadowColor: tokens.glow,
          shadowOpacity: 0.42 + spec.glowMul * 0.2 * accentBoost,
          shadowRadius: glowPx,
          shadowOffset: { width: 0, height: 0 },
        },
        Platform.OS === 'web' &&
          ({
            boxShadow: `0 0 ${glowPx}px ${tokens.glow}, 0 0 ${Math.round(glowPx * 1.6)}px ${tokens.glow}66, inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.25)`,
          } as ViewStyle),
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(8, 14, 26, 0.94)', 'rgba(4, 8, 16, 0.98)']}
        style={[StyleSheet.absoluteFillObject, { borderRadius: 10 }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[`${tokens.glow}`, `${tokens.washHover}`, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: 10, opacity: (prominent ? 0.82 : 0.74) * accentBoost }]}
      />
      {secondary ? (
        <View
          pointerEvents="none"
          style={[
            styles.capsuleSecondaryGlint,
            {
              backgroundColor: secondary.glow,
              opacity: 0.58 * spec.glowMul * (accentSecondary ? ACCENT_LIFT[accentSecondary] : 1),
            },
          ]}
        />
      ) : null}
      <View pointerEvents="none" style={styles.capsuleTopSheen} />
      <View
        pointerEvents="none"
        style={[
          styles.capsuleInnerHighlight,
          { backgroundColor: tokens.glow, opacity: (prominent ? 0.2 : 0.16) * accentBoost },
        ]}
      />
      <Ionicons
        name={icon}
        size={size}
        color={ink}
        style={{
          textShadowColor: tokens.glow,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: iconGlow,
        }}
      />
    </View>
  );
}

export function TravelGlassCard({
  children,
  onPress,
  style,
  contentStyle,
  tier,
  accent = 'cyan',
  intensity = 'standard',
  compact = false,
  visual = 'standard',
  disabled = false,
  accessibilityLabel,
}: TravelGlassCardProps): ReactElement {
  const [hovered, setHovered] = useState(false);
  const tokens = travelSemanticTokens(accent);
  const spec = resolveIntensity(intensity, visual);
  const accentBoost = ACCENT_LIFT[accent];
  const resolvedTier = resolveTier(visual, spec, tier);
  const radius = compact ? 12 : visual === 'hero' ? 18 : 14;
  const glowRadius = (hovered ? 11 : 6) * spec.glowMul * accentBoost;
  const glowOpacity = spec.outerShadow * (hovered ? 1.18 : 1);

  const frame = (
    <View
      style={[
        styles.outer,
        {
          borderRadius: radius,
          shadowColor: tokens.glow,
          shadowOpacity: glowOpacity,
          shadowRadius: glowRadius,
          shadowOffset: { width: 0, height: visual === 'hero' ? 6 : 4 },
        },
        Platform.OS === 'web' &&
          spec.outerShadow > 0.12 &&
          ({
            boxShadow: `0 0 ${glowRadius}px ${tokens.glow}, 0 0 ${Math.round(glowRadius * 1.35)}px ${tokens.glow}55, inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.2), 0 ${visual === 'hero' ? 16 : 10}px ${visual === 'hero' ? 26 : 20}px rgba(0, 0, 0, 0.42)`,
          } as ViewStyle),
        style,
      ]}
    >
      <LocalConstellationFrame
        accent={travelFrameAccent(accent)}
        tier={resolvedTier}
        radius={radius}
        hovered={hovered}
        cinematicVeil={visual === 'hero'}
        contentStyle={[styles.frameContent, compact && styles.frameContentCompact, contentStyle]}
      >
        <TravelMaterialLayers
          accent={accent}
          tokens={tokens}
          spec={spec}
          hovered={hovered}
          radius={radius}
          visual={visual}
        />
        {children}
      </LocalConstellationFrame>
    </View>
  );

  if (!onPress) {
    return frame;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={({ pressed }) => [pressed && { opacity: 0.93 }, pressed && { transform: [{ scale: 0.992 }] }]}
    >
      {frame}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  frameContent: {
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1,
  },
  frameContentCompact: {
    minHeight: 0,
  },
  capsuleRadiance: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '58%',
    bottom: 0,
    zIndex: 0,
  },
  interiorWell: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '72%',
    zIndex: 0,
  },
  interiorWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  innerTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    zIndex: 0,
  },
  depthShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '52%',
    zIndex: 0,
  },
  depthShadowRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '42%',
    bottom: 0,
    zIndex: 0,
  },
  rimTop: {
    position: 'absolute',
    top: 0,
    left: 6,
    right: 6,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.34)',
    zIndex: 2,
  },
  rimLeft: {
    position: 'absolute',
    top: 8,
    left: 0,
    width: 1,
    bottom: 8,
    zIndex: 2,
  },
  rimRight: {
    position: 'absolute',
    top: 10,
    right: 0,
    width: 1,
    bottom: 10,
    zIndex: 2,
  },
  edgeBloom: {
    position: 'absolute',
    top: 10,
    right: 0,
    bottom: 10,
    zIndex: 2,
  },
  edgeBloomBottom: {
    position: 'absolute',
    left: 12,
    right: 8,
    bottom: 0,
    zIndex: 2,
  },
  cornerGlintTl: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 42,
    height: 42,
    zIndex: 2,
    overflow: 'hidden',
  },
  cornerGlintTr: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 46,
    height: 46,
    zIndex: 2,
    overflow: 'hidden',
  },
  cornerGlintBr: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 28,
    zIndex: 2,
    overflow: 'hidden',
  },
  quickHelpAura: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  heroOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  heroOrbCyan: {
    width: 140,
    height: 140,
    top: -44,
    right: -32,
    backgroundColor: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_CYAN.glow,
  },
  heroOrbViolet: {
    width: 100,
    height: 100,
    bottom: -26,
    left: -18,
    backgroundColor: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_VIOLET.glow,
  },
  heroOrbGold: {
    width: 76,
    height: 76,
    top: 4,
    left: '34%',
    backgroundColor: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_GOLD.glow,
  },
  heroRouteLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: '43%',
    height: 2,
    zIndex: 1,
  },
  heroRouteArc: {
    position: 'absolute',
    left: '8%',
    right: '12%',
    top: '36%',
    height: 28,
    zIndex: 1,
  },
  heroRouteStreak: {
    position: 'absolute',
    left: 8,
    right: 24,
    top: '45%',
    height: 3,
    zIndex: 1,
  },
  heroParticle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_CYAN.ink,
    zIndex: 2,
    shadowColor: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_CYAN.glow,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  heroParticleA: { top: 14, right: 56, opacity: 0.85 },
  heroParticleB: { top: 30, right: 104, opacity: 0.55 },
  heroParticleC: { bottom: 18, left: 48, opacity: 0.62 },
  heroParticleD: { top: 22, left: '62%', opacity: 0.45 },
  heroVignetteBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '36%',
    zIndex: 0,
  },
  iconCapsule: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    backgroundColor: 'rgba(5, 10, 20, 0.82)',
  },
  capsuleTopSheen: {
    position: 'absolute',
    top: 0,
    left: 3,
    right: 3,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    zIndex: 2,
  },
  capsuleInnerHighlight: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    height: '38%',
    borderRadius: 8,
    zIndex: 0,
  },
  capsuleSecondaryGlint: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 11,
    height: 11,
    borderRadius: 6,
    zIndex: 1,
  },
});
