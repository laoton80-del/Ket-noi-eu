/**
 * Wave 3B — shared Premium App Tile primitive (visual only; no business logic).
 *
 * Design law: `VIONA_SEMANTIC_COLOR_MAPPING_V1.md`, `VIONA_LUMINOUS_DARK_PREMIUM_UI_LAW.md`,
 * `VIONA_WAVE_3_PREMIUM_APP_TILE_RULES.md` §5.
 *
 * Color governance:
 * - `variant` → **leadingUniverseAccent** (hub atmosphere) when `accent` is omitted.
 * - `accent` → **semanticFeatureAccent** per tile — may differ from universe leading color; multicolor grids are required when meanings differ.
 * - Visual accent/glow never replaces text status meaning; chip label is mandatory.
 * - Not one color per universe — controlled semantic multicolor by feature.
 *
 * Safety (semantic feature accents — never imply locked business state):
 * - Gold — not paid, commercial ready, payout, or settlement.
 * - Emerald — not settled, provider paid, or payment captured.
 * - Magenta — not dispatch, rescue guarantee, auto-alert, or normal commerce checkout.
 * - Cyan / Violet / Assistant — pilot surfaces only; not autonomous AI or production certification.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement, ReactNode } from 'react';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { PremiumTileMicroSceneKind } from '../../design/premiumTileMicroScene';
import type {
  VionaLocalCardArtworkKey,
  VionaLocalCardArtworkTier,
} from '../../design/vionaLocalCardArtworkAssets';
import {
  getVionaLocalCardArtworkImageSource,
  resolveLocalCardArtworkMinHeight,
  resolveLocalCardArtworkTier,
  shouldUseLocalLuminousMicroSceneArtDirection,
  vionaLocalCardArtworkLayout,
} from '../../design/vionaLocalCardArtworkAssets';
import type { VionaMicroSceneKey } from '../../design/vionaMicroSceneAssets';
import { getVionaMicroSceneAsset } from '../../design/vionaMicroSceneAssets';
import { vionaReferenceCtaOrbStyle } from '../../design/vionaReferenceVisualTokens';
import { VionaReferenceGlassCard } from './VionaReferenceGlass';
import {
  premiumGlassSurface,
  premiumLuminousInk,
  premiumSemanticGlow,
  premiumTileMicroSceneLayout,
  premiumTileGlass,
  premiumTileInteraction,
  premiumTileLayout,
  premiumTileMinHeight,
  premiumTileSemanticShadowStyle,
  premiumTileWebBackdropBlur,
  premiumUniverseAccentByHub,
  premiumUniverseAccentSpec,
  type PremiumTileSize,
  type PremiumTileState,
  type VionaUniverseAccent,
} from '../../design/premiumTileVisualTokens';
import { FontFamily } from '../../theme/typography';
import { PremiumIconCapsule } from './PremiumIconCapsule';
import { PremiumStatusChip } from './PremiumStatusChip';
import { PremiumTileMicroScene } from './PremiumTileMicroScene';
import { VionaLocalCardArtworkLayer } from './VionaLocalCardArtworkLayer';
import type { LocalVectorMicroSceneKey, LocalVectorSceneScale } from './local/LocalVectorMicroScene';
import { LocalVectorMicroScene } from './local/LocalVectorMicroScene';
import { VionaMicroSceneImageLayer } from './VionaMicroSceneImageLayer';

/** Local reference compact pass — command-center tile proportions (not poster heights). */
const LOCAL_REFERENCE_COMPACT_MIN_HEIGHT = {
  hero: { mobile: 182, wide: 192, desktop: 202 },
  primary: { mobile: 136, wide: 142 },
  secondary: { mobile: 126, wide: 130 },
} as const;

/** Command-center panel flagship — reference geometry (portrait-leaning modules). */
const LOCAL_COMMAND_CENTER_FLAGSHIP_MIN_HEIGHT = {
  mobile: 136,
  wide: 142,
  desktop: 144,
} as const;

/** Wide desktop — cap tile width so 4-col cells do not stretch flat. */
export const LOCAL_COMMAND_CENTER_FLAGSHIP_MAX_WIDTH = 176;

const LOCAL_REFERENCE_COMPACT_PADDING: Record<'hero' | 'primary' | 'secondary', number> = {
  hero: 10,
  primary: 10,
  secondary: 9,
};

const LOCAL_REFERENCE_COMPACT_GLOW: Record<
  VionaLocalCardArtworkTier,
  {
    edgeWidth: number;
    frameGlowOpacity: number;
    haloOpacity: number;
    shadowRadius: number;
    innerRimOpacity: number;
  }
> = {
  hero: {
    edgeWidth: 1.75,
    frameGlowOpacity: 0.96,
    haloOpacity: 0.34,
    shadowRadius: 20,
    innerRimOpacity: 0.92,
  },
  primary: {
    edgeWidth: 1.62,
    frameGlowOpacity: 0.94,
    haloOpacity: 0.3,
    shadowRadius: 16,
    innerRimOpacity: 0.86,
  },
  secondary: {
    edgeWidth: 1.45,
    frameGlowOpacity: 0.88,
    haloOpacity: 0.24,
    shadowRadius: 14,
    innerRimOpacity: 0.8,
  },
  compactStatus: {
    edgeWidth: 1,
    frameGlowOpacity: 0.62,
    haloOpacity: 0.2,
    shadowRadius: 10,
    innerRimOpacity: 0.58,
  },
};

function usesLocalReferenceCompactTile(
  fullCardArtworkKey?: VionaLocalCardArtworkKey,
  localVectorSceneKey?: LocalVectorMicroSceneKey
): boolean {
  return Boolean(
    localVectorSceneKey || shouldUseLocalLuminousMicroSceneArtDirection(fullCardArtworkKey)
  );
}

function resolveCommandCenterFlagshipMinHeight(viewportWidth: number): number {
  if (viewportWidth >= 1024) return LOCAL_COMMAND_CENTER_FLAGSHIP_MIN_HEIGHT.desktop;
  if (viewportWidth >= 768) return LOCAL_COMMAND_CENTER_FLAGSHIP_MIN_HEIGHT.wide;
  return LOCAL_COMMAND_CENTER_FLAGSHIP_MIN_HEIGHT.mobile;
}

function resolveLocalReferenceCompactMinHeight(
  tier: VionaLocalCardArtworkTier,
  size: PremiumTileSize,
  viewportWidth: number
): number {
  const isWide = viewportWidth >= 768;
  const isDesktop = viewportWidth >= 1024;
  if (tier === 'hero' || size === 'hero') {
    if (isDesktop) return LOCAL_REFERENCE_COMPACT_MIN_HEIGHT.hero.desktop;
    if (isWide) return LOCAL_REFERENCE_COMPACT_MIN_HEIGHT.hero.wide;
    return LOCAL_REFERENCE_COMPACT_MIN_HEIGHT.hero.mobile;
  }
  if (tier === 'primary') {
    return isWide
      ? LOCAL_REFERENCE_COMPACT_MIN_HEIGHT.primary.wide
      : LOCAL_REFERENCE_COMPACT_MIN_HEIGHT.primary.mobile;
  }
  if (tier === 'secondary') {
    return isWide
      ? LOCAL_REFERENCE_COMPACT_MIN_HEIGHT.secondary.wide
      : LOCAL_REFERENCE_COMPACT_MIN_HEIGHT.secondary.mobile;
  }
  return vionaLocalCardArtworkLayout.minHeightInner.compactStatus;
}

/** Consumer hub variant → universe accent. */
export type PremiumUniverseVariant = keyof typeof premiumUniverseAccentByHub;

export function premiumUniverseVariantToAccent(variant: PremiumUniverseVariant): VionaUniverseAccent {
  return premiumUniverseAccentByHub[variant];
}

export type PremiumAppTileProps = Readonly<{
  variant: PremiumUniverseVariant;
  accent?: VionaUniverseAccent;
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  renderIcon?: () => ReactNode;
  statusLabel?: string;
  size?: PremiumTileSize;
  disabled?: boolean;
  locked?: boolean;
  comingSoon?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
  /** Subtle semantic interior art — must not obscure title/status chip. */
  microScene?: PremiumTileMicroSceneKind;
  /** Textless PNG micro-scene (registry); vector `microScene` used when PNG absent. */
  microSceneKey?: VionaMicroSceneKey;
  /** Full-card textless artwork (registry); renders only when PNG exists — no placeholder. */
  fullCardArtworkKey?: VionaLocalCardArtworkKey;
  /** Local hub sharp vector micro-scene (preferred over raster/legacy vector slot). */
  localVectorSceneKey?: LocalVectorMicroSceneKey;
  /** Vector scene footprint — hero / primary / secondary (defaults from `size`). */
  localVectorSceneScale?: LocalVectorSceneScale;
  /** Local hub WOW tuning — viewport width for tier min-heights (optional). */
  layoutViewportWidth?: number;
  /** Command-center panel flagship — brighter rim/border inside universe panel. */
  commandCenterFlagship?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  width?: number | `${number}%`;
}>;

export function PremiumAppTile({
  variant,
  accent: accentOverride,
  title,
  subtitle,
  icon,
  renderIcon,
  statusLabel,
  size = 'compact',
  disabled = false,
  locked = false,
  comingSoon = false,
  onPress,
  accessibilityLabel,
  testID,
  microScene,
  microSceneKey,
  fullCardArtworkKey,
  localVectorSceneKey,
  localVectorSceneScale,
  layoutViewportWidth,
  commandCenterFlagship = false,
  style,
  contentStyle,
  width = '100%',
}: PremiumAppTileProps): ReactElement {
  const accent = accentOverride ?? premiumUniverseVariantToAccent(variant);
  const nonInteractive = disabled || locked || comingSoon || !onPress;
  const [hovered, setHovered] = useState(false);

  const tileState: PremiumTileState = disabled
    ? 'disabled'
    : hovered
      ? 'hovered'
      : 'default';

  const radius = size === 'hero' ? premiumTileLayout.radiusHero : premiumTileLayout.radius;
  const artworkTier = resolveLocalCardArtworkTier(fullCardArtworkKey);
  const localReferenceCompact = usesLocalReferenceCompactTile(fullCardArtworkKey, localVectorSceneKey);
  const viewport = layoutViewportWidth ?? 390;
  const vectorSceneScale: LocalVectorSceneScale | undefined = localVectorSceneKey
    ? commandCenterFlagship
      ? (localVectorSceneScale ?? 'primary')
      : (localVectorSceneScale ??
          (size === 'hero' || artworkTier === 'hero'
            ? 'hero'
            : artworkTier === 'secondary'
              ? 'secondary'
              : 'primary'))
    : undefined;
  const minInnerHeight =
    commandCenterFlagship && localReferenceCompact
      ? resolveCommandCenterFlagshipMinHeight(viewport)
      : localReferenceCompact && artworkTier
        ? resolveLocalReferenceCompactMinHeight(artworkTier, size, viewport)
        : artworkTier
        ? resolveLocalCardArtworkMinHeight(artworkTier, size, viewport)
        : size === 'compact'
          ? premiumTileLayout.minHeightCompactInner
          : premiumTileMinHeight(size);
  const innerPaddingVertical =
    commandCenterFlagship && localReferenceCompact
      ? 7
      : localReferenceCompact && artworkTier && artworkTier !== 'compactStatus'
        ? LOCAL_REFERENCE_COMPACT_PADDING[artworkTier]
        : artworkTier && artworkTier !== 'compactStatus'
          ? vionaLocalCardArtworkLayout.paddingVertical[artworkTier]
          : premiumTileLayout.paddingVertical;
  const innerStackGap =
    commandCenterFlagship && localReferenceCompact ? 5 : localReferenceCompact ? 6 : premiumTileLayout.stackGap;
  const a11y =
    accessibilityLabel ??
    (subtitle ? `${title}. ${subtitle}${statusLabel ? `. ${statusLabel}` : ''}` : title);

  const frame = (
    <PremiumTileGlassFrame
      accent={accent}
      tileState={tileState}
      radius={radius}
      hovered={hovered}
      microScene={microScene}
      microSceneKey={microSceneKey}
      fullCardArtworkKey={fullCardArtworkKey}
      localVectorSceneKey={localVectorSceneKey}
      localVectorSceneScale={vectorSceneScale}
      artworkTier={artworkTier}
      localReferenceCompact={localReferenceCompact}
      commandCenterFlagship={commandCenterFlagship}
      microSceneProminent={shouldUseLocalLuminousMicroSceneArtDirection(fullCardArtworkKey)}
    >
      <View
        style={[
          styles.inner,
          { minHeight: minInnerHeight, paddingVertical: innerPaddingVertical, gap: innerStackGap },
          contentStyle,
        ]}
      >
        <View style={[styles.iconRow, commandCenterFlagship && styles.iconRowCommandCenter]}>
          {!commandCenterFlagship ? (
            <PremiumIconCapsule
              accent={accent}
              icon={icon}
              renderIcon={renderIcon}
              size={size}
              tileState={tileState}
              disabled={disabled}
            />
          ) : (
            <View style={styles.iconRowCommandCenterSpacer} />
          )}
          {statusLabel ? (
            <PremiumStatusChip accent={accent} label={statusLabel} tileState={tileState} disabled={disabled} />
          ) : null}
        </View>
        <View style={[styles.textBlock, commandCenterFlagship && styles.textBlockCommandCenter]}>
          <Text
            style={[
              styles.title,
              commandCenterFlagship && styles.titleCommandCenter,
              { color: disabled ? premiumLuminousInk.disabledReadable : premiumLuminousInk.titleBright },
            ]}
            numberOfLines={commandCenterFlagship ? 2 : premiumTileLayout.titleMaxLines}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.subtitle, commandCenterFlagship && styles.subtitleCommandCenter]}
              numberOfLines={commandCenterFlagship ? 1 : premiumTileLayout.subtitleMaxLines}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </PremiumTileGlassFrame>
  );

  const shellOpacity = disabled ? premiumTileInteraction.disabledOpacity : 1;

  const flagshipWidthCapStyle: ViewStyle | undefined =
    commandCenterFlagship && viewport >= 1024
      ? { maxWidth: LOCAL_COMMAND_CENTER_FLAGSHIP_MAX_WIDTH, alignSelf: 'center', width: '100%' }
      : undefined;

  return (
    <View style={[{ width }, flagshipWidthCapStyle, { opacity: shellOpacity }, style]}>
      {nonInteractive ? (
        <View
          testID={testID}
          accessibilityRole="summary"
          accessibilityLabel={a11y}
          accessibilityState={{ disabled: disabled || locked }}
        >
          {frame}
        </View>
      ) : (
        <Pressable
          testID={testID}
          onPress={onPress}
          disabled={disabled}
          onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
          onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
          style={({ pressed }) => [
            styles.pressable,
            Platform.OS === 'web' && styles.pressableWeb,
            hovered && Platform.OS === 'web' ? styles.pressableHovered : null,
            pressed ? styles.pressablePressed : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={a11y}
        >
          {frame}
        </Pressable>
      )}
    </View>
  );
}

type PremiumTileGlassFrameProps = Readonly<{
  accent: VionaUniverseAccent;
  tileState: PremiumTileState;
  radius: number;
  hovered: boolean;
  microScene?: PremiumTileMicroSceneKind;
  microSceneKey?: VionaMicroSceneKey;
  fullCardArtworkKey?: VionaLocalCardArtworkKey;
  localVectorSceneKey?: LocalVectorMicroSceneKey;
  localVectorSceneScale?: LocalVectorSceneScale;
  artworkTier?: VionaLocalCardArtworkTier;
  localReferenceCompact?: boolean;
  commandCenterFlagship?: boolean;
  microSceneProminent?: boolean;
  children: ReactNode;
}>;

function prominentVectorSlotStyle(
  scale?: LocalVectorSceneScale,
  localReferenceCompact = false,
  commandCenterFlagship = false
): ViewStyle {
  if (commandCenterFlagship) {
    return styles.microSceneSlotCommandCenter;
  }
  if (!localReferenceCompact) {
    if (scale === 'hero') return styles.microSceneSlotProminentHero;
    if (scale === 'secondary') return styles.microSceneSlotProminentSecondary;
    return styles.microSceneSlotProminent;
  }
  if (scale === 'hero') return styles.microSceneSlotReferenceHero;
  if (scale === 'secondary') return styles.microSceneSlotReferenceSecondary;
  return styles.microSceneSlotReferencePrimary;
}

function PremiumTileGlassFrame({
  accent,
  tileState,
  radius,
  hovered,
  microScene,
  microSceneKey,
  fullCardArtworkKey,
  localVectorSceneKey,
  localVectorSceneScale,
  artworkTier,
  localReferenceCompact = false,
  commandCenterFlagship = false,
  microSceneProminent = false,
  children,
}: PremiumTileGlassFrameProps): ReactElement {
  const fullCardArtwork = fullCardArtworkKey
    ? getVionaLocalCardArtworkImageSource(fullCardArtworkKey)
    : null;
  const hasFullCardArtwork = Boolean(fullCardArtwork);
  const pngMicroScene = microSceneKey ? getVionaMicroSceneAsset(microSceneKey) : null;
  const showMicroSceneLayer = Boolean(
    localVectorSceneKey ||
      ((pngMicroScene || microScene) && (!hasFullCardArtwork || microSceneProminent))
  );
  const visualState: PremiumTileState =
    tileState === 'disabled' ? 'disabled' : hovered ? 'hovered' : tileState;
  const spec = premiumUniverseAccentSpec(accent);
  const stroke =
    visualState === 'hovered' ? spec.strokeHover : spec.stroke;
  const wash = visualState === 'hovered' ? spec.cornerWashHover : spec.cornerWash;
  const blurPx =
    visualState === 'hovered'
      ? premiumTileGlass.backdropBlurHover
      : premiumTileGlass.backdropBlurDefault;

  if (commandCenterFlagship) {
    return (
      <VionaReferenceGlassCard
        accent={accent}
        borderRadius={radius}
        state={visualState}
        decor={
          showMicroSceneLayer ? (
            <View
              pointerEvents="none"
              style={prominentVectorSlotStyle(localVectorSceneScale, false, true)}
            >
              {localVectorSceneKey ? (
                <LocalVectorMicroScene
                  sceneKey={localVectorSceneKey}
                  accent={accent}
                  prominent={microSceneProminent}
                  sceneScale={localVectorSceneScale}
                  replicaFlagship
                />
              ) : pngMicroScene && microSceneKey ? (
                <VionaMicroSceneImageLayer microSceneKey={microSceneKey} prominent={microSceneProminent} />
              ) : microScene ? (
                <PremiumTileMicroScene kind={microScene} accent={accent} prominent={microSceneProminent} />
              ) : null}
            </View>
          ) : null
        }
      >
        <View style={styles.content}>{children}</View>
        <View pointerEvents="none" style={styles.flagshipCtaOrb} accessibilityElementsHidden>
          <View style={[styles.flagshipCtaOrbInner, vionaReferenceCtaOrbStyle(accent)]}>
            <View style={styles.flagshipCtaOrbSpecular} />
            <Ionicons name="arrow-forward" size={11} color={spec.ink} accessibilityIgnoresInvertColors />
          </View>
        </View>
      </VionaReferenceGlassCard>
    );
  }
  const baseTierGlow =
    localReferenceCompact && artworkTier
      ? LOCAL_REFERENCE_COMPACT_GLOW[artworkTier]
      : artworkTier
        ? vionaLocalCardArtworkLayout.glow[artworkTier]
        : null;
  const tierGlow = baseTierGlow;
  const edgeWidth = tierGlow?.edgeWidth ?? premiumTileGlass.edgeWidth;
  const frameGlowOpacity = tierGlow?.frameGlowOpacity ?? premiumTileGlass.frameGlowOpacity;
  const haloOpacity = tierGlow?.haloOpacity ?? premiumTileGlass.haloOpacity;
  const innerRimOpacity = tierGlow?.innerRimOpacity ?? 0.55;
  const semanticShadow = premiumTileSemanticShadowStyle(accent, visualState);
  const boostedShadow =
    tierGlow && Platform.OS === 'web'
      ? ({
          ...semanticShadow,
          boxShadow: `0 ${tierGlow.shadowRadius / 4}px ${tierGlow.shadowRadius}px ${premiumSemanticGlow(accent, visualState)}`,
        } as ViewStyle)
      : semanticShadow;
  const webGlass = premiumTileWebBackdropBlur(blurPx);

  return (
    <View
      style={[
        styles.frame,
        {
          borderRadius: radius,
          borderColor: stroke,
          borderWidth: edgeWidth,
        },
        boostedShadow,
        webGlass,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.surface,
          {
            borderRadius: radius,
            backgroundColor: premiumGlassSurface(visualState),
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.glassTint,
          {
            borderRadius: radius,
            backgroundColor:
              visualState === 'hovered'
                ? premiumTileGlass.glassTintHover
                : localReferenceCompact
                  ? 'rgba(6, 14, 28, 0.78)'
                  : artworkTier
                    ? 'rgba(200, 230, 255, 0.13)'
                    : premiumTileGlass.glassTintDefault,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.outerHalo,
          {
            borderRadius: radius + 2,
            shadowColor: premiumSemanticGlow(accent, visualState),
            opacity: haloOpacity,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.frameGlow,
          {
            borderRadius: radius,
            borderColor: premiumSemanticGlow(accent, visualState),
            opacity: frameGlowOpacity,
          },
        ]}
      />
      {artworkTier ? (
        <View
          pointerEvents="none"
          style={[
            styles.innerRim,
            {
              borderRadius: radius - 1,
              borderColor: premiumSemanticGlow(accent, visualState),
              borderWidth: 1.25,
              opacity: innerRimOpacity,
            },
          ]}
        />
      ) : null}
      {fullCardArtwork && fullCardArtworkKey ? (
        <VionaLocalCardArtworkLayer artworkKey={fullCardArtworkKey} />
      ) : null}
      {showMicroSceneLayer ? (
        <View
          pointerEvents="none"
          style={[
            microSceneProminent
              ? localReferenceCompact
                ? styles.microSceneWashReferenceCompact
                : styles.microSceneWashProminent
              : styles.microSceneWash,
            {
              borderRadius: radius,
              backgroundColor: premiumSemanticGlow(accent, visualState),
              opacity: microSceneProminent
                ? localReferenceCompact
                  ? 0.28
                  : premiumTileMicroSceneLayout.prominentBackdropWashOpacity
                : premiumTileMicroSceneLayout.backdropWashOpacity,
            },
          ]}
        />
      ) : null}
      {microSceneProminent && showMicroSceneLayer ? (
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(5, 11, 20, 0.68)', 'rgba(5, 11, 20, 0.24)', 'transparent']}
          locations={localReferenceCompact ? [0, 0.38, 0.68] : [0, 0.42, 0.72]}
          style={[
            localReferenceCompact ? styles.textSafeVeilReferenceCompact : styles.textSafeVeilTop,
            { borderRadius: radius },
          ]}
        />
      ) : null}
      <LinearGradient
        pointerEvents="none"
        colors={[wash, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.cornerWash,
          { borderRadius: radius, opacity: premiumTileGlass.cornerWashOpacity },
        ]}
      />
      {spec.cornerWashSecondary ? (
        <LinearGradient
          pointerEvents="none"
          colors={[spec.cornerWashSecondary, 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.cornerWashSecondary, { borderRadius: radius }]}
        />
      ) : null}
      <View
        pointerEvents="none"
        style={[
          styles.topHighlight,
          {
            borderTopColor:
              visualState === 'hovered' ? premiumTileGlass.innerHighlightHover : premiumTileGlass.innerHighlight,
          },
        ]}
      />
      {showMicroSceneLayer ? (
        <View
          pointerEvents="none"
          style={
            microSceneProminent
              ? prominentVectorSlotStyle(localVectorSceneScale, localReferenceCompact, false)
              : styles.microSceneSlot
          }
        >
          {localVectorSceneKey ? (
            <LocalVectorMicroScene
              sceneKey={localVectorSceneKey}
              accent={accent}
              prominent={microSceneProminent}
              sceneScale={localVectorSceneScale}
              replicaFlagship={false}
            />
          ) : pngMicroScene && microSceneKey ? (
            <VionaMicroSceneImageLayer microSceneKey={microSceneKey} prominent={microSceneProminent} />
          ) : microScene ? (
            <PremiumTileMicroScene kind={microScene} accent={accent} prominent={microSceneProminent} />
          ) : null}
        </View>
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    minHeight: premiumTileLayout.minPressHeight,
  },
  pressableWeb: {
    ...(Platform.OS === 'web'
      ? ({
          transitionProperty: 'transform, opacity',
          transitionDuration: `${premiumTileGlass.transitionMs}ms`,
          transitionTimingFunction: 'ease-out',
        } as ViewStyle)
      : {}),
  },
  pressableHovered: {
    ...(Platform.OS === 'web'
      ? ({
          transform: [{ translateY: -premiumTileInteraction.hoverLiftPx }],
        } as ViewStyle)
      : {}),
  },
  pressablePressed: {
    opacity: premiumTileInteraction.pressOpacity,
  },
  frame: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  surface: {
    ...StyleSheet.absoluteFillObject,
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
  },
  outerHalo: {
    ...StyleSheet.absoluteFillObject,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    shadowOpacity: 1,
    elevation: 6,
  },
  frameGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
  },
  innerRim: {
    ...StyleSheet.absoluteFillObject,
    margin: 2,
    borderWidth: 1.25,
  },
  textSafeVeilTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
    zIndex: 0,
  },
  textSafeVeilReferenceCompact: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    zIndex: 0,
  },
  microSceneWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '68%',
  },
  microSceneWashProminent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '58%',
  },
  microSceneWashReferenceCompact: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  microSceneWashCommandCenter: {
    position: 'absolute',
    left: '6%',
    right: '6%',
    bottom: 0,
    height: '60%',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  textSafeVeilCommandCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '36%',
    zIndex: 0,
  },
  microSceneSlotCommandCenter: {
    position: 'absolute',
    left: '10%',
    right: 32,
    bottom: 4,
    height: '58%',
    minHeight: 78,
    alignItems: 'center',
    justifyContent: 'flex-end',
    opacity: 1,
    zIndex: 0,
  },
  flagshipTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.85,
    zIndex: 0,
  },
  flagshipBottomRefraction: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '48%',
    zIndex: 0,
  },
  flagshipSpecularShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
    zIndex: 1,
  },
  flagshipSceneFloorGlow: {
    position: 'absolute',
    left: '4%',
    right: '4%',
    bottom: 0,
    height: '58%',
    zIndex: 0,
  },
  flagshipCtaOrb: {
    position: 'absolute',
    right: 7,
    bottom: 7,
    zIndex: 2,
  },
  flagshipCtaOrbInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.25,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  flagshipCtaOrbSpecular: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  iconRowCommandCenter: {
    minHeight: 24,
    marginBottom: 0,
  },
  iconRowCommandCenterSpacer: {
    flex: 1,
    minWidth: 0,
  },
  textBlockCommandCenter: {
    gap: 1,
    maxWidth: '100%',
    paddingRight: 4,
    zIndex: 1,
  },
  titleCommandCenter: {
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: -0.14,
    flexShrink: 1,
  },
  subtitleCommandCenter: {
    fontSize: 8.5,
    lineHeight: 10.5,
    opacity: 0.92,
  },
  cornerWash: {
    ...StyleSheet.absoluteFillObject,
  },
  microSceneSlot: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    opacity: premiumTileMicroSceneLayout.slotOpacity,
    zIndex: 0,
  },
  microSceneSlotProminent: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    height: '52%',
    minHeight: 94,
    alignItems: 'center',
    justifyContent: 'flex-end',
    opacity: premiumTileMicroSceneLayout.prominentSlotOpacity,
    zIndex: 0,
  },
  microSceneSlotProminentHero: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 8,
    height: '56%',
    minHeight: 108,
    alignItems: 'center',
    justifyContent: 'flex-end',
    opacity: premiumTileMicroSceneLayout.prominentSlotOpacity,
    zIndex: 0,
  },
  microSceneSlotProminentSecondary: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    height: '46%',
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'flex-end',
    opacity: premiumTileMicroSceneLayout.prominentSlotOpacity,
    zIndex: 0,
  },
  microSceneSlotReferenceHero: {
    position: 'absolute',
    left: '26%',
    right: 10,
    bottom: 5,
    height: '52%',
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'flex-end',
    opacity: 1,
    zIndex: 0,
  },
  microSceneSlotReferencePrimary: {
    position: 'absolute',
    left: '24%',
    right: 10,
    bottom: 5,
    height: '50%',
    minHeight: 66,
    alignItems: 'center',
    justifyContent: 'flex-end',
    opacity: 1,
    zIndex: 0,
  },
  microSceneSlotReferenceSecondary: {
    position: 'absolute',
    left: '22%',
    right: 10,
    bottom: 4,
    height: '48%',
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'flex-end',
    opacity: 1,
    zIndex: 0,
  },
  cornerWashSecondary: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  inner: {
    paddingVertical: premiumTileLayout.paddingVertical,
    paddingHorizontal: premiumTileLayout.paddingHorizontal,
    gap: premiumTileLayout.stackGap,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: premiumTileLayout.iconRowGap,
    minHeight: premiumTileLayout.minPressHeight,
  },
  textBlock: {
    width: '100%',
    gap: premiumTileLayout.textBlockGap,
    minWidth: 0,
  },
  title: {
    fontSize: premiumTileLayout.titleFontSize,
    lineHeight: premiumTileLayout.titleLineHeight,
    fontFamily: FontFamily.extrabold,
    letterSpacing: -0.16,
  },
  subtitle: {
    fontSize: premiumTileLayout.subtitleFontSize,
    lineHeight: premiumTileLayout.subtitleLineHeight,
    fontFamily: FontFamily.medium,
    color: premiumLuminousInk.subtitle,
  },
});
