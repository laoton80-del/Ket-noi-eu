import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { ReactElement, ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  computeFashionHomeWebMagneticOffset,
  premiumFrameEdgeOverlay,
  useFashionHomePrefersReducedMotion,
  type FashionHomeWebMagneticOffset,
} from '../viona/fashionHomeDesktopShell';
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

export type TravelGlassVisual = 'standard' | 'hero' | 'quickHelp' | 'flagship';

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
  testID?: string;
  onHoverChange?: (hovered: boolean) => void;
  /** Hero-only: card-driven or direct hover lights the frame (Local dynamic-hero parity). */
  heroFrameBoosted?: boolean;
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

const TRAVEL_WEB_HOVER_TRANSITION_MS = 200;

function detectTravelHoverPointer(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  } catch {
    return false;
  }
}

function travelWebCardMagneticMotionStyle(
  hovered: boolean,
  pressed: boolean,
  visual: TravelGlassVisual,
  magnetic: FashionHomeWebMagneticOffset | null,
  reduceMotion: boolean
): ViewStyle {
  const transition = `transform ${TRAVEL_WEB_HOVER_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${TRAVEL_WEB_HOVER_TRANSITION_MS}ms ease-out`;
  if (Platform.OS !== 'web') {
    return pressed ? ({ transform: [{ scale: 0.988 }] } as ViewStyle) : {};
  }
  if (visual === 'hero') return {};
  const o = magnetic ?? { translateX: 0, translateY: 0, rotateDeg: 0 };
  const isPrimary = visual === 'flagship' || visual === 'quickHelp';
  const lift = isPrimary ? -3 : -2;
  const hoverScale = isPrimary ? 1.01 : 1.006;
  if (pressed) {
    return {
      transform: [
        { translateX: reduceMotion ? 0 : o.translateX },
        { translateY: reduceMotion ? 0 : o.translateY },
        { rotate: `${reduceMotion ? 0 : o.rotateDeg}deg` },
        { scale: 0.988 },
      ],
      transition,
    } as ViewStyle;
  }
  if (!hovered) return {};
  return {
    transform: [
      { translateX: reduceMotion ? 0 : o.translateX },
      { translateY: (reduceMotion ? 0 : o.translateY) + lift },
      { rotate: `${reduceMotion ? 0 : o.rotateDeg}deg` },
      { scale: hoverScale },
    ],
    transition,
  } as ViewStyle;
}

/** Web: subtle artwork lift on card hover (Local world-card parity). */
export function travelCardImageHoverStyle(active: boolean): ImageStyle {
  if (Platform.OS !== 'web' || !active) return {};
  return { filter: 'contrast(1.02) saturate(1.02) brightness(1.03)' } as ImageStyle;
}

export function travelSemanticTokens(accent: TravelSemanticAccent): VionaGlobalLightNetworkAccentTokens {
  return SEMANTIC_TOKENS[accent];
}

/** LocalConstellationFrame has no magenta — keep slab neutral; SOS rim uses travel tokens. */
export function travelFrameAccent(accent: TravelSemanticAccent): LocalConstellationAccent {
  if (accent === 'magenta') return 'cyan';
  return accent;
}

function travelQuickHelpVisual(visual: TravelGlassVisual): boolean {
  return visual === 'flagship' || visual === 'quickHelp';
}

/** Web host: semantic glow + depth. Crisp 1px stroke lives on the rim overlay (always above artwork). */
function travelQuickHelpSemanticWebFrameStyle(
  visual: TravelGlassVisual,
  tokens: VionaGlobalLightNetworkAccentTokens,
  materialActive: boolean,
  glowRadius: number
): ViewStyle {
  if (!travelQuickHelpVisual(visual) || Platform.OS !== 'web') return {};
  const innerRim = materialActive ? `${tokens.glow}96` : `${tokens.glow}78`;
  const innerGlow = materialActive ? Math.round(glowRadius * 1.28) : Math.round(glowRadius * 0.82);
  const outerGlow = materialActive ? Math.round(glowRadius * 1.92) : Math.round(glowRadius * 1.12);
  return {
    boxShadow: `0 0 ${innerGlow}px ${tokens.glow}${materialActive ? '72' : '52'}, 0 0 ${outerGlow}px ${tokens.glow}${materialActive ? '34' : '24'}, inset 0 0 0 1px ${innerRim}, inset 0 1px 0 rgba(255,255,255,${materialActive ? '0.2' : '0.14'}), 0 12px 24px rgba(0, 0, 0, 0.42)`,
    transition: `box-shadow ${TRAVEL_WEB_HOVER_TRANSITION_MS}ms ease-out`,
  } as ViewStyle;
}

function TravelQuickHelpRimOverlay({
  visual,
  tokens,
  materialActive,
  radius,
}: Readonly<{
  visual: TravelGlassVisual;
  tokens: VionaGlobalLightNetworkAccentTokens;
  materialActive: boolean;
  radius: number;
}>): ReactElement | null {
  if (!travelQuickHelpVisual(visual) || Platform.OS !== 'web') return null;
  const stroke = materialActive ? tokens.strokeHover : tokens.stroke;
  const rimGlow = materialActive ? `${tokens.glow}44` : `${tokens.glow}30`;
  return (
    <View
      pointerEvents="none"
      style={[
        premiumFrameEdgeOverlay(radius),
        styles.quickHelpSemanticRim,
        {
          borderWidth: 1,
          borderColor: stroke,
          boxShadow: `inset 0 0 0 1px ${stroke}, 0 0 ${materialActive ? 14 : 10}px ${rimGlow}`,
          transition: `box-shadow ${TRAVEL_WEB_HOVER_TRANSITION_MS}ms ease-out, border-color ${TRAVEL_WEB_HOVER_TRANSITION_MS}ms ease-out`,
        } as ViewStyle,
      ]}
    />
  );
}

function travelHeroSemanticWebFrameStyle(
  visual: TravelGlassVisual,
  tokens: VionaGlobalLightNetworkAccentTokens,
  materialActive: boolean,
  glowRadius: number
): ViewStyle {
  if (visual !== 'hero' || Platform.OS !== 'web') return {};
  const stroke = materialActive ? tokens.strokeHover : tokens.stroke;
  const innerGlow = materialActive ? Math.round(glowRadius * 1.42) : Math.round(glowRadius * 1.06);
  const outerGlow = materialActive ? Math.round(glowRadius * 2.12) : Math.round(glowRadius * 1.62);
  return {
    boxShadow: `0 0 0 1px ${stroke}, 0 0 ${innerGlow}px ${tokens.glow}${materialActive ? '66' : '48'}, 0 0 ${outerGlow}px ${tokens.glow}${materialActive ? '30' : '20'}, inset 0 1px 0 rgba(255,255,255,0.12), 0 14px 26px rgba(0, 0, 0, 0.4)`,
    transition: `box-shadow ${TRAVEL_WEB_HOVER_TRANSITION_MS}ms ease-out`,
  } as ViewStyle;
}

function travelQuickHelpSemanticNativeFrameStyle(
  visual: TravelGlassVisual,
  tokens: VionaGlobalLightNetworkAccentTokens,
  materialActive: boolean
): ViewStyle {
  if (!travelQuickHelpVisual(visual) || Platform.OS === 'web') return {};
  return {
    borderWidth: 1,
    borderColor: materialActive ? tokens.strokeHover : tokens.stroke,
  };
}

function travelHeroSemanticNativeFrameStyle(
  visual: TravelGlassVisual,
  tokens: VionaGlobalLightNetworkAccentTokens,
  materialActive: boolean
): ViewStyle {
  if (visual !== 'hero') return {};
  if (Platform.OS === 'web') return {};
  return {
    borderWidth: 1,
    borderColor: materialActive ? tokens.strokeHover : tokens.stroke,
  };
}

function travelStandardSemanticWebFrameStyle(
  visual: TravelGlassVisual,
  tokens: VionaGlobalLightNetworkAccentTokens,
  materialActive: boolean,
  glowRadius: number,
  spec: IntensitySpec
): ViewStyle {
  if (visual !== 'standard' || Platform.OS !== 'web' || spec.outerShadow <= 0.12) return {};
  const stroke = materialActive ? tokens.strokeHover : tokens.stroke;
  const innerGlow = materialActive ? Math.round(glowRadius * 1.34) : Math.round(glowRadius * 1.05);
  const outerGlow = materialActive ? Math.round(glowRadius * 1.88) : Math.round(glowRadius * 1.35);
  return {
    boxShadow: `0 0 0 1px ${stroke}, 0 0 ${innerGlow}px ${tokens.glow}${materialActive ? '66' : '44'}, 0 0 ${outerGlow}px ${tokens.glow}${materialActive ? '30' : '18'}, inset 0 1px 0 rgba(255,255,255,${materialActive ? '0.18' : '0.16'}), inset 0 -1px 0 rgba(0,0,0,0.2), 0 10px 20px rgba(0, 0, 0, 0.42)`,
    transition: `box-shadow ${TRAVEL_WEB_HOVER_TRANSITION_MS}ms ease-out`,
  } as ViewStyle;
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
  if (visual === 'quickHelp' || visual === 'flagship' || intensity === 'primary') {
    return {
      glowMul: visual === 'flagship' ? 2.34 : 2.04,
      edgeMul: visual === 'flagship' ? 1.16 : 1.08,
      rimMul: visual === 'flagship' ? 1.38 : 1.28,
      washMul: visual === 'flagship' ? 1.72 : 1.54,
      tier: 'service',
      outerShadow: visual === 'flagship' ? 0.68 : 0.58,
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
    glowMul: 1.36,
    edgeMul: 0.76,
    rimMul: 1.14,
    washMul: 1.42,
    tier: 'service',
    outerShadow: 0.48,
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
  const lift = hovered ? 1.16 : 1;
  const accentBoost = ACCENT_LIFT[accent];
  const edgeAlpha = spec.edgeMul * accentBoost * lift;
  const edgePx = spec.edgePx;
  const edgeBloomStrength =
    visual === 'standard' ? 0.52 : visual === 'quickHelp' || visual === 'flagship' ? 0.78 : 0.8;
  const sosEdgeBoost = accent === 'magenta' && (visual === 'flagship' || visual === 'quickHelp') ? 1.2 : 1;
  const singularOuterRim = visual === 'flagship' || visual === 'quickHelp' || visual === 'hero';

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
      {visual === 'standard' ? (
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
              opacity: 0.36 * spec.washMul * accentBoost * lift,
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
      {visual === 'standard' || visual === 'quickHelp' || visual === 'flagship' ? (
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
      {singularOuterRim ? null : (
      <View
        pointerEvents="none"
        style={[
          styles.rimLeft,
          {
            borderTopLeftRadius: radius,
            borderBottomLeftRadius: radius,
            backgroundColor: tokens.glow,
            opacity: 0.26 * spec.rimMul * edgeAlpha,
          },
        ]}
      />
      )}
      {visual === 'standard' ? (
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
      {singularOuterRim ? null : (
      <View
        pointerEvents="none"
        style={[
          styles.edgeBloom,
          {
            width: edgePx,
            opacity: Math.min(0.78, edgeAlpha * edgeBloomStrength * sosEdgeBoost),
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
      )}
      {singularOuterRim ? null : (
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
      )}
      <View
        pointerEvents="none"
        style={[
          styles.cornerGlintTl,
          {
            borderTopLeftRadius: radius,
            width: visual === 'standard' || visual === 'quickHelp' || visual === 'flagship' ? 48 : 42,
            height: visual === 'standard' || visual === 'quickHelp' || visual === 'flagship' ? 48 : 42,
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
            width: visual === 'standard' || visual === 'quickHelp' || visual === 'flagship' ? 52 : 46,
            height: visual === 'standard' || visual === 'quickHelp' || visual === 'flagship' ? 52 : 46,
            opacity: (visual === 'quickHelp' || visual === 'flagship' ? 0.58 : 0.52) * spec.glowMul * accentBoost * lift,
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
            opacity: (visual === 'quickHelp' || visual === 'flagship' ? 0.26 : 0.22) * spec.glowMul * accentBoost,
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
        <TravelHeroChrome heroLit={hovered} tokens={tokens} radius={radius} />
      ) : null}
      {visual === 'quickHelp' || visual === 'flagship' ? (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={[`${tokens.glow}22`, `${tokens.glow}08`, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.62, y: 0.62 }}
            style={[
              styles.flagshipCornerAccent,
              {
                borderTopLeftRadius: radius,
                opacity: (hovered ? 0.72 : 0.52) * accentBoost,
              },
            ]}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.04)', 'transparent']}
            start={{ x: 0.12, y: 0 }}
            end={{ x: 0.88, y: 0.55 }}
            style={[styles.interiorWell, { borderRadius: radius, opacity: 0.92 * lift }]}
          />
        </>
      ) : null}
    </>
  );
}

function TravelHeroChrome({
  heroLit,
  tokens,
  radius,
}: Readonly<{
  heroLit: boolean;
  tokens: VionaGlobalLightNetworkAccentTokens;
  radius: number;
}>): ReactElement {
  const lift = heroLit ? 1.1 : 1;
  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(92, 205, 255, 0.14)',
          'rgba(92, 205, 255, 0.04)',
          'rgba(5, 11, 20, 0)',
        ]}
        start={{ x: 0, y: 0.15 }}
        end={{ x: 1, y: 0.85 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(92, 205, 255, 0.1)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.35, y: 1 }}
        style={[styles.heroEdgeBloomLeft, { borderTopLeftRadius: radius, borderBottomLeftRadius: radius }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255, 255, 255, 0.08)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.22 }}
        style={[styles.heroEdgeBloomTop, { borderTopLeftRadius: radius, borderTopRightRadius: radius }]}
      />
      <View
        pointerEvents="none"
        style={[styles.heroOrb, styles.heroOrbCyan, { opacity: (heroLit ? 0.72 : 0.52) * lift }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', 'rgba(92, 205, 255, 0.12)', 'transparent']}
        start={{ x: 0.58, y: 0.28 }}
        end={{ x: 0.92, y: 0.72 }}
        style={[styles.heroTransitPathGlow, { opacity: 0.72 * lift }]}
      />
      <View pointerEvents="none" style={[styles.heroParticle, styles.heroParticleA]} />
      <View pointerEvents="none" style={[styles.heroParticle, styles.heroParticleB]} />
      <View pointerEvents="none" style={[styles.heroParticle, styles.heroParticleC]} />
      <View pointerEvents="none" style={[styles.heroParticle, styles.heroParticleD]} />
      <View pointerEvents="none" style={[styles.heroParticle, styles.heroParticleE]} />
      <View pointerEvents="none" style={[styles.heroParticle, styles.heroParticleF]} />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', 'rgba(92, 205, 255, 0.1)', 'rgba(0, 0, 0, 0.28)']}
        start={{ x: 0.5, y: 0.55 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.heroVignetteBottom, { borderBottomLeftRadius: radius, borderBottomRightRadius: radius }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', tokens.glow, 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.heroFrameEdgeGlow, { opacity: (heroLit ? 0.52 : 0.28) * lift }]}
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
  capsuleSize,
  materialActive = false,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  ink: string;
  accent: TravelSemanticAccent;
  accentSecondary?: TravelSemanticAccent;
  size?: number;
  prominent?: boolean;
  intensity?: TravelGlassIntensity;
  capsuleSize?: number;
  materialActive?: boolean;
}>): ReactElement {
  const tokens = travelSemanticTokens(accent);
  const secondary = accentSecondary ? travelSemanticTokens(accentSecondary) : null;
  const spec = resolveIntensity(intensity, prominent ? 'flagship' : 'standard');
  const accentBoost = ACCENT_LIFT[accent] * CAPSULE_GLOW_BOOST;
  const dim = capsuleSize ?? 44;
  const glowPx = (prominent ? 22 : 15) * (materialActive ? 1.22 : 1);
  const iconGlow = (prominent ? 14 : 10) * (materialActive ? 1.18 : 1);
  const iconInk = materialActive ? tokens.inkHover : ink;

  return (
    <View
      style={[
        styles.iconCapsule,
        {
          width: dim,
          height: dim,
          borderRadius: 10,
          borderColor: materialActive ? tokens.strokeHover : tokens.stroke,
          shadowColor: tokens.glow,
          shadowOpacity: (0.42 + spec.glowMul * 0.2 * accentBoost) * (materialActive ? 1.28 : 1),
          shadowRadius: glowPx,
          shadowOffset: { width: 0, height: 0 },
        },
        Platform.OS === 'web' &&
          ({
            boxShadow: materialActive
              ? `0 0 ${Math.round(glowPx * 1.08)}px ${tokens.glow}, 0 0 ${Math.round(glowPx * 1.85)}px ${tokens.glow}88, inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.25)`
              : `0 0 ${glowPx}px ${tokens.glow}, 0 0 ${Math.round(glowPx * 1.6)}px ${tokens.glow}66, inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.25)`,
            transition: `box-shadow ${TRAVEL_WEB_HOVER_TRANSITION_MS}ms ease-out, border-color ${TRAVEL_WEB_HOVER_TRANSITION_MS}ms ease-out`,
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
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: 10,
            opacity: (prominent ? 0.82 : 0.74) * accentBoost * (materialActive ? 1.14 : 1),
          },
        ]}
      />
      {secondary && accent === 'violet' && accentSecondary === 'cyan' ? (
        <View
          pointerEvents="none"
          style={[
            styles.capsuleSecondaryGlint,
            {
              backgroundColor: secondary.glow,
              opacity: 0.16 * spec.glowMul,
            },
          ]}
        />
      ) : secondary ? (
        <View
          pointerEvents="none"
          style={[
            styles.capsuleSecondaryGlint,
            {
              backgroundColor: secondary.glow,
              opacity: 0.32 * spec.glowMul * (accentSecondary ? ACCENT_LIFT[accentSecondary] : 1),
            },
          ]}
        />
      ) : null}
      <View pointerEvents="none" style={styles.capsuleTopSheen} />
      <View
        pointerEvents="none"
        style={[
          styles.capsuleInnerHighlight,
          {
            backgroundColor: tokens.glow,
            opacity: (prominent ? 0.2 : 0.16) * accentBoost * (materialActive ? 1.2 : 1),
          },
        ]}
      />
      <Ionicons
        name={icon}
        size={size}
        color={iconInk}
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
  testID,
  onHoverChange,
  heroFrameBoosted = false,
}: TravelGlassCardProps): ReactElement {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [magnetic, setMagnetic] = useState<FashionHomeWebMagneticOffset | null>(null);
  const supportsHover = useMemo(detectTravelHoverPointer, []);
  const reduceMotion = useFashionHomePrefersReducedMotion();
  const tokens = travelSemanticTokens(accent);
  const spec = resolveIntensity(intensity, visual);
  const accentBoost = ACCENT_LIFT[accent];
  const resolvedTier = resolveTier(visual, spec, tier);
  const radius = compact ? 12 : visual === 'hero' ? 18 : visual === 'flagship' ? 14 : 14;
  const heroLit =
    visual === 'hero' && supportsHover && (hovered || heroFrameBoosted);
  const materialActive = visual === 'hero' ? heroLit : hovered;
  const glowRadius = (materialActive ? 12 : 9) * spec.glowMul * accentBoost;
  const glowOpacity = spec.outerShadow * (materialActive ? 1.36 : 1.14);
  const usesDedicatedQuickHelpWebFrame = Platform.OS === 'web' && travelQuickHelpVisual(visual);
  const quickHelpStroke = materialActive ? tokens.strokeHover : tokens.stroke;

  const setHoverActive = useCallback(
    (active: boolean) => {
      setHovered(active);
      onHoverChange?.(active);
      if (!active) setMagnetic(null);
    },
    [onHoverChange]
  );

  const usesMagneticPointer = Platform.OS === 'web' && supportsHover && visual !== 'hero';

  const magneticPointerHandlers = useMemo(() => {
    if (!usesMagneticPointer) return {};
    return {
      onPointerEnter: () => setHoverActive(true),
      onPointerLeave: () => setHoverActive(false),
      onPointerMove: (event: {
        nativeEvent: { clientX?: number; clientY?: number };
        currentTarget: unknown;
      }) => {
        setHoverActive(true);
        if (reduceMotion) return;
        const target = event.currentTarget as { getBoundingClientRect?: () => DOMRect } | null;
        const rect = target?.getBoundingClientRect?.();
        if (!rect) return;
        const clientX = event.nativeEvent.clientX ?? 0;
        const clientY = event.nativeEvent.clientY ?? 0;
        setMagnetic(computeFashionHomeWebMagneticOffset(clientX, clientY, rect));
      },
    };
  }, [usesMagneticPointer, reduceMotion, setHoverActive]);

  const frame = (
    <View
      testID={onPress ? undefined : testID}
      style={[
        styles.outer,
        {
          borderRadius: radius,
          ...(usesDedicatedQuickHelpWebFrame
            ? {
                borderWidth: 1,
                borderColor: quickHelpStroke,
                transition: `border-color ${TRAVEL_WEB_HOVER_TRANSITION_MS}ms ease-out`,
              }
            : {
                shadowColor: tokens.glow,
                shadowOpacity: glowOpacity,
                shadowRadius: glowRadius,
                shadowOffset: { width: 0, height: visual === 'hero' ? 6 : 4 },
              }),
        },
        travelQuickHelpSemanticWebFrameStyle(visual, tokens, materialActive, glowRadius),
        travelHeroSemanticWebFrameStyle(visual, tokens, materialActive, glowRadius),
        travelStandardSemanticWebFrameStyle(visual, tokens, materialActive, glowRadius, spec),
        travelQuickHelpSemanticNativeFrameStyle(visual, tokens, materialActive),
        travelHeroSemanticNativeFrameStyle(visual, tokens, materialActive),
        style,
      ]}
    >
      <LocalConstellationFrame
        accent={travelFrameAccent(accent)}
        tier={resolvedTier}
        radius={radius}
        hovered={materialActive}
        cinematicVeil={visual === 'hero'}
        suppressAccentRim={visual === 'flagship' || visual === 'quickHelp' || visual === 'hero'}
        contentStyle={[styles.frameContent, compact && styles.frameContentCompact, contentStyle]}
      >
        <TravelMaterialLayers
          accent={accent}
          tokens={tokens}
          spec={spec}
          hovered={materialActive}
          radius={radius}
          visual={visual}
        />
        {children}
      </LocalConstellationFrame>
    </View>
  );

  if (!onPress) {
    if (visual === 'hero' && Platform.OS === 'web' && supportsHover) {
      return (
        <View
          {...({
            onMouseEnter: () => {
              setHovered(true);
              onHoverChange?.(true);
            },
            onMouseLeave: () => {
              setHovered(false);
              onHoverChange?.(false);
            },
          } as object)}
          style={styles.heroHoverShell}
        >
          {frame}
        </View>
      );
    }
    return frame;
  }

  const interactiveShellStyle =
    usesMagneticPointer ? travelWebCardMagneticMotionStyle(hovered, pressed, visual, magnetic, reduceMotion) : undefined;

  return (
    <View {...magneticPointerHandlers} style={interactiveShellStyle}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onHoverIn={Platform.OS === 'web' && !usesMagneticPointer ? () => setHoverActive(true) : undefined}
        onHoverOut={Platform.OS === 'web' && !usesMagneticPointer ? () => setHoverActive(false) : undefined}
        onFocus={Platform.OS === 'web' ? () => setHoverActive(true) : undefined}
        onBlur={Platform.OS === 'web' ? () => setHoverActive(false) : undefined}
        style={({ pressed: pressActive }) => [
          pressActive && { opacity: 0.94 },
          Platform.OS !== 'web' && pressActive && { transform: [{ scale: 0.988 }] },
        ]}
      >
        {frame}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  heroHoverShell: {
    width: '100%',
  },
  outer: {
    position: 'relative',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  frameContent: {
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1,
  },
  frameContentCompact: {
    minHeight: 0,
  },
  quickHelpSemanticRim: {
    zIndex: 12,
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
  flagshipCornerAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '52%',
    height: '48%',
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
    width: 160,
    height: 160,
    top: -52,
    right: -40,
    backgroundColor: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_CYAN.glow,
  },
  heroOrbViolet: {
    width: 88,
    height: 88,
    bottom: -20,
    left: -12,
    backgroundColor: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_VIOLET.glow,
  },
  heroEdgeBloomLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '28%',
    zIndex: 0,
  },
  heroEdgeBloomTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '22%',
    zIndex: 0,
  },
  heroTransitPathGlow: {
    position: 'absolute',
    top: '24%',
    right: '6%',
    width: '42%',
    height: '52%',
    zIndex: 1,
  },
  heroFrameEdgeGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    zIndex: 2,
  },
  heroParticle: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 2,
    backgroundColor: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_CYAN.ink,
    zIndex: 2,
    shadowColor: VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_CYAN.glow,
    shadowOpacity: 0.65,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  heroParticleA: { top: 16, right: 72, opacity: 0.62 },
  heroParticleB: { top: 34, right: 128, opacity: 0.38 },
  heroParticleC: { bottom: 22, left: 56, opacity: 0.48 },
  heroParticleD: { top: 28, left: '58%', opacity: 0.32 },
  heroParticleE: { top: '42%', right: '34%', opacity: 0.28 },
  heroParticleF: { bottom: '36%', right: '18%', opacity: 0.24 },
  heroVignetteBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
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
