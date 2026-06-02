/**
 * VIONA reference visual engine — dark crystal glass layers (Local command-center).
 */
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement, ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  vionaReferenceCardGlass,
  vionaReferenceCardShellShadow,
  vionaReferenceCardWebGlass,
  vionaReferencePanelGlass,
  vionaReferencePanelWebGlass,
  vionaReferenceTokensForAccent,
  type VionaReferenceGlassSemanticTokens,
} from '../../design/vionaReferenceVisualTokens';
import type { PremiumTileState, VionaUniverseAccent } from '../../design/premiumTileVisualTokens';

export type VionaGlassLayerProps = {
  borderRadius: number;
  style?: StyleProp<ViewStyle>;
};

/** Dark transparent body — no milky semantic wash. */
export function VionaGlassSurface({
  tokens,
  borderRadius,
  style,
}: VionaGlassLayerProps & { tokens: VionaReferenceGlassSemanticTokens }): ReactElement {
  return (
    <>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { borderRadius, backgroundColor: tokens.crystalFill },
          style,
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { borderRadius, backgroundColor: tokens.deepFill },
        ]}
      />
      {tokens.surfaceTint !== 'transparent' ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius, backgroundColor: tokens.surfaceTint },
          ]}
        />
      ) : null}
    </>
  );
}

export function VionaGradientBorder({
  borderRadius,
  borderWidth,
  colors,
  children,
  style,
}: {
  borderRadius: number;
  borderWidth: number;
  colors: readonly [string, string, ...string[]];
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}): ReactElement {
  const innerRadius = Math.max(0, borderRadius - borderWidth);
  return (
    <LinearGradient
      colors={[...colors]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius, padding: borderWidth }, style]}
    >
      <View style={{ borderRadius: innerRadius, overflow: 'hidden' }}>{children}</View>
    </LinearGradient>
  );
}

export function VionaInnerRim({
  borderRadius,
  color,
  margin = 1,
  style,
}: VionaGlassLayerProps & { color: string; margin?: number }): ReactElement {
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: borderRadius - margin,
          borderWidth: vionaReferenceCardGlass.innerRimWidth,
          borderColor: color,
          margin,
          opacity: vionaReferenceCardGlass.innerRimOpacity,
          zIndex: 4,
        },
        style,
      ]}
    />
  );
}

export function VionaTopEdgeHighlight({
  borderRadius,
  color,
}: VionaGlassLayerProps & { color: string }): ReactElement {
  return (
    <>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 1,
          left: 8,
          right: 8,
          height: 1,
          backgroundColor: color,
          borderRadius: 1,
          zIndex: 5,
          opacity: 0.95,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 8,
          left: 1,
          bottom: 10,
          width: 1,
          backgroundColor: color,
          borderRadius: 1,
          zIndex: 5,
          opacity: 0.45,
        }}
      />
    </>
  );
}

export function VionaCornerSpecular({
  borderRadius,
  tokens,
}: VionaGlassLayerProps & { tokens: VionaReferenceGlassSemanticTokens }): ReactElement {
  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[...tokens.cornerSpecular]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '36%',
          height: '20%',
          borderTopLeftRadius: borderRadius,
          zIndex: 3,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 4,
          left: 6,
          width: 2.5,
          height: 2.5,
          borderRadius: 1.25,
          backgroundColor: 'rgba(245, 252, 255, 0.85)',
          zIndex: 6,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 8,
          left: 10,
          width: 1.6,
          height: 1.6,
          borderRadius: 0.8,
          backgroundColor: 'rgba(180, 235, 255, 0.7)',
          zIndex: 6,
        }}
      />
    </>
  );
}

export function VionaSpecularShine({
  borderRadius,
  tokens,
  heightRatio = vionaReferenceCardGlass.specularHeightRatio,
}: VionaGlassLayerProps & { tokens: VionaReferenceGlassSemanticTokens; heightRatio?: number }): ReactElement {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[...tokens.specularTop]}
      locations={[...tokens.specularLocations]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0.65 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: `${Math.round(heightRatio * 100)}%`,
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
        zIndex: 2,
      }}
    />
  );
}

export function VionaRefractionGlow({
  borderRadius,
  tokens,
  heightRatio = vionaReferenceCardGlass.refractionHeightRatio,
  style,
}: VionaGlassLayerProps & {
  tokens: VionaReferenceGlassSemanticTokens;
  heightRatio?: number;
}): ReactElement {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[...tokens.lowerRefraction]}
      locations={[...tokens.lowerRefractionLocations]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: `${Math.round(heightRatio * 100)}%`,
          borderBottomLeftRadius: borderRadius,
          borderBottomRightRadius: borderRadius,
          zIndex: 1,
        },
        style,
      ]}
    />
  );
}

export function VionaFloorReflection({
  borderRadius,
  tokens,
}: VionaGlassLayerProps & { tokens: VionaReferenceGlassSemanticTokens }): ReactElement {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[...tokens.floorReflection]}
      locations={[...tokens.floorReflectionLocations]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{
        position: 'absolute',
        left: '10%',
        right: '10%',
        bottom: 0,
        height: '24%',
        borderRadius: borderRadius * 0.45,
        zIndex: 1,
      }}
    />
  );
}

export function VionaTextReadabilityVeil({
  borderRadius,
  tokens,
}: VionaGlassLayerProps & { tokens: VionaReferenceGlassSemanticTokens }): ReactElement {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[...tokens.textVeil]}
      locations={[...tokens.textVeilLocations]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '46%',
        zIndex: 2,
      }}
    />
  );
}

export type VionaReferenceGlassCardProps = {
  accent: VionaUniverseAccent;
  borderRadius: number;
  state?: PremiumTileState;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  decor?: ReactNode;
};

/** Command-center flagship card — dark crystal shell, neon edge. */
export function VionaReferenceGlassCard({
  accent,
  borderRadius,
  state = 'default',
  style,
  children,
  decor,
}: VionaReferenceGlassCardProps): ReactElement {
  const tokens = vionaReferenceTokensForAccent(accent);
  const bw = vionaReferenceCardGlass.borderWidth;
  const innerRadius = Math.max(0, borderRadius - bw);

  return (
    <VionaGradientBorder
      borderRadius={borderRadius}
      borderWidth={bw}
      colors={tokens.borderGradient}
      style={[vionaReferenceCardShellShadow(accent, state), style]}
    >
      <View
        style={[
          { borderRadius: innerRadius, overflow: 'hidden', backgroundColor: tokens.deepFill },
          vionaReferenceCardWebGlass(),
        ]}
      >
        <VionaGlassSurface tokens={tokens} borderRadius={innerRadius} />
        <VionaRefractionGlow borderRadius={innerRadius} tokens={tokens} />
        <VionaFloorReflection borderRadius={innerRadius} tokens={tokens} />
        <VionaCornerSpecular borderRadius={innerRadius} tokens={tokens} />
        <VionaSpecularShine borderRadius={innerRadius} tokens={tokens} />
        <VionaInnerRim borderRadius={innerRadius} color={tokens.innerRim} />
        <VionaTopEdgeHighlight borderRadius={innerRadius} color={tokens.edgeHighlight} />
        {decor}
        <VionaTextReadabilityVeil borderRadius={innerRadius} tokens={tokens} />
        <View style={{ zIndex: 3 }}>{children}</View>
      </View>
    </VionaGradientBorder>
  );
}

export type VionaReferenceGlassPanelProps = {
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  skyline?: ReactNode;
  refractionGrid?: ReactNode;
  children: ReactNode;
  flagshipFloor?: ReactNode;
};

/** Local command-center universe panel — floating dark crystal. */
export function VionaReferenceGlassPanel({
  borderRadius = 14,
  style,
  testID,
  skyline,
  refractionGrid,
  children,
  flagshipFloor,
}: VionaReferenceGlassPanelProps): ReactElement {
  const bw = vionaReferencePanelGlass.borderWidth;
  const innerRadius = Math.max(0, borderRadius - bw);
  const panelTokens = vionaReferenceTokensForAccent('emerald');
  const horizonPct = Math.round(vionaReferencePanelGlass.horizonHeightRatio * 100);

  return (
    <View testID={testID} style={style}>
      <VionaGradientBorder
        borderRadius={borderRadius}
        borderWidth={bw}
        colors={[...vionaReferencePanelGlass.borderGradient]}
        style={vionaReferencePanelWebGlass()}
      >
        <View
          style={{
            borderRadius: innerRadius,
            overflow: 'hidden',
            backgroundColor: vionaReferencePanelGlass.shellFill,
            ...(Platform.OS === 'web'
              ? ({ boxShadow: vionaReferencePanelGlass.webOuterShadow } as ViewStyle)
              : {}),
          }}
        >
          <LinearGradient
            colors={[...vionaReferencePanelGlass.crystalGradient]}
            locations={[...vionaReferencePanelGlass.crystalLocations]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {skyline ? (
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '76%',
                opacity: vionaReferencePanelGlass.skylineOpacity,
                zIndex: 0,
              }}
              pointerEvents="none"
            >
              {skyline}
            </View>
          ) : null}
          {refractionGrid}
          <LinearGradient
            colors={[...vionaReferencePanelGlass.horizonGlow]}
            locations={[...vionaReferencePanelGlass.horizonLocations]}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: `${horizonPct}%`,
              zIndex: 0,
            }}
            pointerEvents="none"
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 12,
              right: 12,
              bottom: 2,
              height: 1,
              borderRadius: 1,
              backgroundColor: 'rgba(160, 235, 255, 0.48)',
              zIndex: 2,
            }}
          />
          <VionaCornerSpecular borderRadius={innerRadius} tokens={panelTokens} />
          <VionaSpecularShine borderRadius={innerRadius} tokens={panelTokens} heightRatio={0.18} />
          <VionaInnerRim borderRadius={innerRadius} color={vionaReferencePanelGlass.innerRim} margin={2} />
          <VionaTopEdgeHighlight borderRadius={innerRadius} color="rgba(200, 245, 255, 0.7)" />
          <LinearGradient
            colors={[...vionaReferencePanelGlass.topAccentRail]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 5 }}
            pointerEvents="none"
          />
          <View style={{ zIndex: 2 }}>{children}</View>
          {flagshipFloor ? (
            <View style={{ zIndex: 2, position: 'relative' }}>
              <LinearGradient
                pointerEvents="none"
                colors={[...vionaReferencePanelGlass.flagshipFloorGlow]}
                locations={[...vionaReferencePanelGlass.flagshipFloorLocations]}
                style={[StyleSheet.absoluteFill, { borderRadius: 10 }]}
              />
              {flagshipFloor}
            </View>
          ) : null}
        </View>
      </VionaGradientBorder>
    </View>
  );
}
