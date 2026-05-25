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
  const minInnerHeight =
    size === 'compact' ? premiumTileLayout.minHeightCompactInner : premiumTileMinHeight(size);
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
    >
      <View style={[styles.inner, { minHeight: minInnerHeight }, contentStyle]}>
        <View style={styles.iconRow}>
          <PremiumIconCapsule
            accent={accent}
            icon={icon}
            renderIcon={renderIcon}
            size={size}
            tileState={tileState}
            disabled={disabled}
          />
          {statusLabel ? (
            <PremiumStatusChip accent={accent} label={statusLabel} tileState={tileState} disabled={disabled} />
          ) : null}
        </View>
        <View style={styles.textBlock}>
          <Text
            style={[
              styles.title,
              { color: disabled ? premiumLuminousInk.disabledReadable : premiumLuminousInk.titleBright },
            ]}
            numberOfLines={premiumTileLayout.titleMaxLines}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={styles.subtitle}
              numberOfLines={premiumTileLayout.subtitleMaxLines}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </PremiumTileGlassFrame>
  );

  const shellOpacity = disabled ? premiumTileInteraction.disabledOpacity : 1;

  return (
    <View style={[{ width }, { opacity: shellOpacity }, style]}>
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
  children: ReactNode;
}>;

function PremiumTileGlassFrame({
  accent,
  tileState,
  radius,
  hovered,
  microScene,
  children,
}: PremiumTileGlassFrameProps): ReactElement {
  const visualState: PremiumTileState =
    tileState === 'disabled' ? 'disabled' : hovered ? 'hovered' : tileState;
  const spec = premiumUniverseAccentSpec(accent);
  const stroke =
    visualState === 'hovered' ? spec.strokeHover : spec.stroke;
  const wash = visualState === 'hovered' ? spec.cornerWashHover : spec.cornerWash;
  const blurPx =
    visualState === 'hovered' ? premiumTileGlass.backdropBlurHover : premiumTileGlass.backdropBlurDefault;

  return (
    <View
      style={[
        styles.frame,
        {
          borderRadius: radius,
          borderColor: stroke,
          borderWidth: premiumTileGlass.edgeWidth,
        },
        premiumTileSemanticShadowStyle(accent, visualState),
        premiumTileWebBackdropBlur(blurPx),
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
              visualState === 'hovered' ? premiumTileGlass.glassTintHover : premiumTileGlass.glassTintDefault,
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
            opacity: premiumTileGlass.haloOpacity,
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
            opacity: premiumTileGlass.frameGlowOpacity,
          },
        ]}
      />
      {microScene ? (
        <View
          pointerEvents="none"
          style={[
            styles.microSceneWash,
            {
              borderRadius: radius,
              backgroundColor: premiumSemanticGlow(accent, visualState),
              opacity: premiumTileMicroSceneLayout.backdropWashOpacity,
            },
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
      {microScene ? (
        <View pointerEvents="none" style={styles.microSceneSlot}>
          <PremiumTileMicroScene kind={microScene} accent={accent} />
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
  microSceneWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '68%',
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
