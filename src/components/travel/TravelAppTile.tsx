import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement } from 'react';
import { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_MIN_HEIGHT_PX } from '../viona/fashionHomeDesktopShell';
import { FontFamily } from '../../theme/typography';
import { localConstellation } from '../local/localConstellationTokens';
import {
  TravelGlassCard,
  TravelIconCapsule,
  travelCardImageHoverStyle,
  travelSemanticTokens,
  type TravelSemanticAccent,
} from './TravelGlassCard';
import { TravelCardLightingNetwork } from './TravelCardLightingNetwork';

const INK = localConstellation.inkStrong;
const CYAN = localConstellation.accentCyan;

/** Hub metrics — Local opening-stage grammar adapted for Travel midnight soul. */
export function travelAppTileMetrics(viewportWidth: number): Readonly<{
  flagshipMinHeight: number;
  utilityPillMinHeight: number;
  flagshipPaddingV: number;
  iconSize: number;
  flagshipIconSize: number;
  flagshipCapsuleSize: number;
  utilityColumns: 2 | 3 | 4 | 8;
  utilityBalancedPills: boolean;
}> {
  if (viewportWidth >= 1480) {
    return {
      flagshipMinHeight: FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_MIN_HEIGHT_PX,
      utilityPillMinHeight: 50,
      flagshipPaddingV: 14,
      iconSize: 16,
      flagshipIconSize: 24,
      flagshipCapsuleSize: 44,
      utilityColumns: 8,
      utilityBalancedPills: false,
    };
  }
  if (viewportWidth >= 1024) {
    return {
      flagshipMinHeight: FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_MIN_HEIGHT_PX,
      utilityPillMinHeight: 50,
      flagshipPaddingV: 14,
      iconSize: 16,
      flagshipIconSize: 24,
      flagshipCapsuleSize: 44,
      utilityColumns: 4,
      utilityBalancedPills: true,
    };
  }
  if (viewportWidth >= 768) {
    return {
      flagshipMinHeight: 160,
      utilityPillMinHeight: 46,
      flagshipPaddingV: 12,
      iconSize: 17,
      flagshipIconSize: 20,
      flagshipCapsuleSize: 42,
      utilityColumns: 4,
      utilityBalancedPills: false,
    };
  }
  if (viewportWidth >= 520) {
    return {
      flagshipMinHeight: 148,
      utilityPillMinHeight: 46,
      flagshipPaddingV: 11,
      iconSize: 18,
      flagshipIconSize: 20,
      flagshipCapsuleSize: 40,
      utilityColumns: 3,
      utilityBalancedPills: false,
    };
  }
  return {
    flagshipMinHeight: 136,
    utilityPillMinHeight: 46,
    flagshipPaddingV: 10,
    iconSize: 19,
    flagshipIconSize: 21,
    flagshipCapsuleSize: 40,
    utilityColumns: 2,
    utilityBalancedPills: false,
  };
}

/** Hero-level preview cards for Travel perspective row (Góc nhìn du lịch). */
export function travelPerspectiveCardMetrics(viewportWidth: number): Readonly<{
  minHeight: number;
  paddingV: number;
  gridGap: number;
  iconSize: number;
  capsuleSize: number;
  titleSize: number;
  subtitleSize: number;
  badgeSize: number;
}> {
  if (viewportWidth >= 1024) {
    return {
      minHeight: 196,
      paddingV: 14,
      gridGap: 12,
      iconSize: 22,
      capsuleSize: 44,
      titleSize: 15.5,
      subtitleSize: 11.5,
      badgeSize: 10,
    };
  }
  if (viewportWidth >= 768) {
    return {
      minHeight: 176,
      paddingV: 13,
      gridGap: 10,
      iconSize: 21,
      capsuleSize: 42,
      titleSize: 15,
      subtitleSize: 11,
      badgeSize: 9.5,
    };
  }
  if (viewportWidth >= 520) {
    return {
      minHeight: 160,
      paddingV: 12,
      gridGap: 10,
      iconSize: 20,
      capsuleSize: 40,
      titleSize: 14.5,
      subtitleSize: 10.5,
      badgeSize: 9,
    };
  }
  return {
    minHeight: 148,
    paddingV: 11,
    gridGap: 8,
    iconSize: 19,
    capsuleSize: 38,
    titleSize: 14,
    subtitleSize: 10,
    badgeSize: 9,
  };
}

export type TravelAppTileVariant = 'flagship' | 'utilityPill' | 'perspective';

export type TravelAppTileProps = Readonly<{
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: TravelSemanticAccent;
  accentSecondary?: TravelSemanticAccent;
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
  variant?: TravelAppTileVariant;
  statusLabel?: string;
  badgeLabel?: string;
  ctaLabel?: string;
  selected?: boolean;
  layoutMetrics?: ReturnType<typeof travelAppTileMetrics>;
  perspectiveMetrics?: ReturnType<typeof travelPerspectiveCardMetrics>;
  stretchInColumn?: boolean;
  backgroundImage?: ImageSourcePropType;
  imageStyle?: StyleProp<ImageStyle>;
  onHoverChange?: (hovered: boolean) => void;
}>;

function travelAccentRgba(glow: string, alpha: number): string {
  const match = glow.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (match) {
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
  }
  return glow;
}

const TRAVEL_FLAGSHIP_SCRIM_STRENGTH: Readonly<Record<TravelSemanticAccent, number>> = {
  cyan: 0.2,
  gold: 0.17,
  emerald: 0.16,
  violet: 0.19,
  magenta: 0.22,
};

function flagshipAccentScrimColors(accent: TravelSemanticAccent): readonly [string, string, string] {
  const tokens = travelSemanticTokens(accent);
  const peak = TRAVEL_FLAGSHIP_SCRIM_STRENGTH[accent];
  return [
    travelAccentRgba(tokens.glow, peak),
    travelAccentRgba(tokens.glow, peak * 0.42),
    'transparent',
  ];
}

function StatusPill({
  label,
  accent,
  active = false,
}: Readonly<{
  label: string;
  accent: TravelSemanticAccent;
  active?: boolean;
}>): ReactElement {
  const tokens = travelSemanticTokens(accent);
  return (
    <Text
      style={[
        styles.statusPill,
        {
          color: active ? tokens.inkHover : tokens.ink,
          borderColor: active ? tokens.strokeHover : tokens.stroke,
          backgroundColor: active ? tokens.washHover : tokens.statusFill,
          ...(Platform.OS === 'web'
            ? ({
                boxShadow: active
                  ? `0 0 10px ${tokens.glow}, inset 0 0 0 1px ${tokens.strokeHover}`
                  : `0 0 6px ${tokens.glow}, inset 0 0 0 1px ${tokens.stroke}`,
                transition: 'box-shadow 200ms ease-out, border-color 200ms ease-out, color 200ms ease-out',
              } as object)
            : null),
        },
      ]}
      numberOfLines={1}
    >
      {label}
    </Text>
  );
}

const UTILITY_ICON_ZONE = 29;

const TRAVEL_UTILITY_HOVER_TRANSITION_MS = 200;

function TravelUtilityPill({
  label,
  icon,
  accent,
  minHeight,
  balanced,
  onPress,
  testID,
  accessibilityLabel,
  onHoverChange,
}: Readonly<{
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: TravelSemanticAccent;
  minHeight: number;
  balanced: boolean;
  onPress: () => void;
  testID?: string;
  accessibilityLabel?: string;
  onHoverChange?: (hovered: boolean) => void;
}>): ReactElement {
  const tokens = travelSemanticTokens(accent);
  const tone = tokens.ink;
  const [active, setActive] = useState(false);

  const iconNode = (
    <View
      style={[
        styles.utilityIconWrap,
        {
          backgroundColor: `${tone}${active ? '36' : '22'}`,
          borderColor: `${tone}${active ? '66' : '3a'}`,
        },
      ]}
    >
      <Ionicons name={icon} size={17} color={active ? tone : `${tone}ee`} />
    </View>
  );

  const setHoverActive = (hovered: boolean) => {
    setActive(hovered);
    onHoverChange?.(hovered);
  };

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onHoverIn={() => setHoverActive(true)}
      onHoverOut={() => setHoverActive(false)}
      onFocus={() => setHoverActive(true)}
      onBlur={() => setHoverActive(false)}
      style={({ pressed }) => [
        styles.utilityPill,
        Platform.OS === 'web' && {
          minHeight,
          backgroundColor: active ? 'rgba(12, 18, 30, 0.84)' : 'rgba(8, 12, 20, 0.72)',
          borderColor: active ? `${tone}88` : `${tone}55`,
          boxShadow: active
            ? `0 0 0 1px ${tokens.strokeHover}, inset 0 1px 0 rgba(255,255,255,0.06), 0 0 10px ${tokens.glow}, 0 0 16px ${tokens.glow}55`
            : `0 0 0 1px ${tokens.stroke}, inset 0 1px 0 rgba(255,255,255,0.04)`,
          transform: pressed
            ? [{ scale: 0.988 }]
            : active
              ? [{ translateY: -2 }, { scale: 1.006 }]
              : [],
          transition: `transform ${TRAVEL_UTILITY_HOVER_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${TRAVEL_UTILITY_HOVER_TRANSITION_MS}ms ease-out, background-color ${TRAVEL_UTILITY_HOVER_TRANSITION_MS}ms ease-out, border-color ${TRAVEL_UTILITY_HOVER_TRANSITION_MS}ms ease-out`,
        } as object,
        Platform.OS !== 'web' && {
          minHeight,
          borderColor: `${tone}ea`,
        },
        pressed && styles.utilityPillPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {Platform.OS === 'web' && active ? (
        <LinearGradient
          colors={[`${tone}18`, `${tone}00`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
          style={styles.utilityPillSheen}
        />
      ) : null}
      {balanced ? (
        <View style={styles.utilityBalancedRow}>
          <View style={styles.utilityIconZone}>{iconNode}</View>
          <Text style={[styles.utilityLabelBalanced, active && styles.utilityLabelActive]} numberOfLines={2}>
            {label}
          </Text>
          <View style={styles.utilitySpacerZone} />
        </View>
      ) : (
        <View style={styles.utilityContent}>
          {iconNode}
          <Text style={[styles.utilityLabel, active && styles.utilityLabelActive]} numberOfLines={2}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function TravelAppTile({
  title,
  subtitle,
  icon,
  accent,
  accentSecondary,
  onPress,
  accessibilityLabel,
  testID,
  variant = 'flagship',
  statusLabel,
  badgeLabel,
  ctaLabel,
  selected = false,
  layoutMetrics,
  perspectiveMetrics,
  stretchInColumn = false,
  backgroundImage,
  imageStyle,
  onHoverChange,
}: TravelAppTileProps): ReactElement {
  const metrics = layoutMetrics ?? travelAppTileMetrics(390);
  const perspective = perspectiveMetrics ?? travelPerspectiveCardMetrics(390);
  const tokens = travelSemanticTokens(accent);
  const a11y = accessibilityLabel ?? (subtitle ? `${title}. ${subtitle}` : title);
  const [perspectiveHovered, setPerspectiveHovered] = useState(false);
  const [flagshipHovered, setFlagshipHovered] = useState(false);

  const handleFlagshipHoverChange = (hovered: boolean) => {
    setFlagshipHovered(hovered);
    onHoverChange?.(hovered);
  };

  const handlePerspectiveHoverChange = (hovered: boolean) => {
    setPerspectiveHovered(hovered);
    onHoverChange?.(hovered);
  };

  if (variant === 'utilityPill') {
    return (
      <TravelUtilityPill
        label={title}
        icon={icon}
        accent={accent}
        minHeight={metrics.utilityPillMinHeight}
        balanced={metrics.utilityBalancedPills}
        onPress={onPress}
        testID={testID}
        accessibilityLabel={a11y}
        onHoverChange={onHoverChange}
      />
    );
  }

  if (variant === 'perspective') {
    const minHeight = perspective.minHeight;
    const cardLit = selected || perspectiveHovered;
    const selectedFrameStyle =
      cardLit && Platform.OS === 'web'
        ? ({
            boxShadow: `0 0 0 1.5px ${tokens.glow}, 0 0 18px ${tokens.glow}88, 0 0 32px ${tokens.glow}44`,
            borderWidth: 1.5,
            borderColor: tokens.stroke,
          } as ViewStyle)
        : cardLit
          ? ({
              borderWidth: 1.5,
              borderColor: tokens.stroke,
            } as ViewStyle)
          : undefined;
    return (
      <TravelGlassCard
        testID={testID}
        visual="flagship"
        accent={accent}
        intensity="primary"
        compact={false}
        onPress={onPress}
        onHoverChange={handlePerspectiveHoverChange}
        accessibilityLabel={a11y}
        contentStyle={[
          styles.perspectiveInner,
          {
            minHeight,
            paddingTop: perspective.paddingV + 2,
            paddingBottom: perspective.paddingV,
          },
        ]}
        style={[
          styles.perspectiveCard,
          stretchInColumn && { flex: 1, alignSelf: 'stretch' },
          { minHeight },
          selectedFrameStyle,
        ]}
      >
        {backgroundImage ? (
          <View pointerEvents="none" style={styles.flagshipArtworkClip}>
            <Image
              source={backgroundImage}
              style={[
                styles.flagshipArtworkImage,
                imageStyle,
                travelCardImageHoverStyle(cardLit),
              ]}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(4, 8, 16, 0.88)', 'rgba(4, 10, 20, 0.52)', 'rgba(4, 10, 20, 0)']}
              locations={[0, 0.48, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.perspectiveTextScrim}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(4, 8, 16, 0.1)', 'rgba(4, 8, 16, 0.38)']}
              locations={[0.5, 1]}
              style={StyleSheet.absoluteFillObject}
            />
            {cardLit ? (
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFillObject, styles.flagshipHoverBrighten]}
              />
            ) : null}
            <TravelCardLightingNetwork
              accent={accent}
              accentSecondary={accentSecondary}
              boosted={cardLit}
              radius={14}
            />
          </View>
        ) : null}
        <View style={styles.perspectiveStack}>
          <View style={styles.perspectiveTopRow}>
            <TravelIconCapsule
              icon={icon}
              ink={tokens.ink}
              accent={accent}
              accentSecondary={accentSecondary}
              size={perspective.iconSize}
              prominent
              intensity="primary"
              capsuleSize={perspective.capsuleSize}
              materialActive={cardLit}
            />
            <View style={styles.perspectiveTopRowTrail}>
              {statusLabel ? <StatusPill label={statusLabel} accent={accent} active={cardLit} /> : null}
              {selected ? <Ionicons name="checkmark-circle" size={18} color={CYAN} /> : null}
            </View>
          </View>
          {badgeLabel ? (
            <Text style={[styles.perspectiveBadge, { fontSize: perspective.badgeSize }]}>
              {badgeLabel}
            </Text>
          ) : null}
          <Text
            style={[
              styles.flagshipTitle,
              {
                fontSize: perspective.titleSize,
                lineHeight: perspective.titleSize + 4,
                textShadowColor: tokens.glow,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: cardLit ? 10 : 8,
              },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.flagshipSubtitle,
                {
                  fontSize: perspective.subtitleSize,
                  lineHeight: perspective.subtitleSize + 4,
                  opacity: cardLit ? 0.98 : 0.94,
                },
              ]}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          ) : null}
          {ctaLabel ? <Text style={styles.perspectiveCta}>{ctaLabel}</Text> : null}
        </View>
      </TravelGlassCard>
    );
  }

  const minHeight = stretchInColumn ? metrics.flagshipMinHeight : metrics.flagshipMinHeight;

  return (
    <TravelGlassCard
      testID={testID}
      visual="flagship"
      accent={accent}
      intensity="primary"
      compact={false}
      onPress={onPress}
      onHoverChange={handleFlagshipHoverChange}
      accessibilityLabel={a11y}
      contentStyle={[
        styles.flagshipInner,
        {
          minHeight,
          paddingTop: metrics.flagshipPaddingV,
          paddingBottom: metrics.flagshipPaddingV,
        },
      ]}
      style={[styles.flagshipCard, stretchInColumn && { flex: 1, alignSelf: 'stretch' }, { minHeight }]}
    >
      {backgroundImage ? (
        <View pointerEvents="none" style={styles.flagshipArtworkClip}>
          <Image
            source={backgroundImage}
            style={[
              styles.flagshipArtworkImage,
              imageStyle,
              travelCardImageHoverStyle(flagshipHovered),
            ]}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <LinearGradient
            pointerEvents="none"
            colors={flagshipAccentScrimColors(accent)}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0.72, y: 0.5 }}
            style={styles.flagshipAccentScrim}
          />
          <LinearGradient
            pointerEvents="none"
            colors={[
              travelAccentRgba(tokens.glow, 0.1),
              'transparent',
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.flagshipTopSheen}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(4, 7, 12, 0.84)', 'rgba(4, 7, 12, 0.46)', 'rgba(4, 7, 12, 0)']}
            locations={[0, 0.44, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.flagshipTextScrim}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(4, 8, 16, 0)', 'rgba(4, 8, 16, 0.2)']}
            locations={[0.76, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.flagshipBottomVeil}
          />
          {flagshipHovered ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.flagshipHoverBrighten]} />
          ) : null}
          <TravelCardLightingNetwork
            accent={accent}
            accentSecondary={accentSecondary}
            boosted={flagshipHovered}
            radius={14}
          />
        </View>
      ) : null}
      <View style={styles.flagshipStack}>
        <View style={styles.flagshipHeader}>
          <View style={[styles.flagshipContentRow, statusLabel ? styles.flagshipContentRowWithBadge : null]}>
            <TravelIconCapsule
              icon={icon}
              ink={tokens.ink}
              accent={accent}
              accentSecondary={accentSecondary}
              size={metrics.flagshipIconSize}
              prominent
              intensity="primary"
              capsuleSize={metrics.flagshipCapsuleSize}
              materialActive={flagshipHovered}
            />
            <View style={styles.flagshipCopy}>
              <Text
                style={[
                  styles.flagshipTitle,
                  {
                    textShadowColor: 'rgba(5, 8, 12, 0.72)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 4,
                  },
                ]}
                numberOfLines={2}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={[
                    styles.flagshipSubtitle,
                    {
                      color: flagshipHovered ? 'rgba(218, 228, 242, 0.98)' : 'rgba(210, 222, 238, 0.94)',
                      textShadowColor: 'rgba(5, 8, 12, 0.62)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>
          {statusLabel ? (
            <View style={styles.flagshipBadgeSlot}>
              <StatusPill label={statusLabel} accent={accent} active={flagshipHovered} />
            </View>
          ) : null}
        </View>
      </View>
    </TravelGlassCard>
  );
}

const styles = StyleSheet.create({
  flagshipCard: {
    width: '100%',
    minWidth: 0,
  },
  flagshipInner: {
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  flagshipTextScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '62%',
    maxWidth: 292,
    zIndex: 2,
  },
  flagshipBottomVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '34%',
    zIndex: 1,
  },
  flagshipAccentScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '58%',
    zIndex: 1,
  },
  flagshipTopSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
    zIndex: 1,
  },
  flagshipArtworkClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  flagshipArtworkImage: {
    width: '100%',
    height: '100%',
  },
  flagshipHoverBrighten: {
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    zIndex: 2,
  },
  flagshipStack: {
    width: '100%',
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    zIndex: 3,
  },
  flagshipHeader: {
    position: 'relative',
    width: '100%',
  },
  flagshipContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
  },
  flagshipContentRowWithBadge: {
    paddingRight: 54,
  },
  flagshipCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingTop: 1,
  },
  flagshipBadgeSlot: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 2,
  },
  flagshipTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  flagshipTextBlock: {
    width: '100%',
    gap: 4,
    minWidth: 0,
  },
  flagshipTitle: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: INK,
    letterSpacing: -0.16,
    lineHeight: 18,
  },
  flagshipSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: 'rgba(210, 222, 238, 0.94)',
    lineHeight: 15,
  },
  statusPill: {
    flexShrink: 1,
    maxWidth: '58%',
    fontSize: 8,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    textAlign: 'right',
  },
  perspectiveCard: {
    width: '100%',
    minWidth: 0,
  },
  perspectiveCardSelected: {
    borderWidth: 1,
    borderColor: 'rgba(92, 205, 255, 0.42)',
  },
  perspectiveInner: {
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  perspectiveStack: {
    width: '100%',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-start',
    zIndex: 3,
  },
  perspectiveTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  perspectiveTopRowTrail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  perspectiveTextScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '72%',
    zIndex: 1,
  },
  perspectiveBadge: {
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    color: CYAN,
    textTransform: 'uppercase',
    letterSpacing: 0.45,
  },
  perspectiveCta: {
    marginTop: 'auto',
    paddingTop: 4,
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    color: CYAN,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  utilityPill: {
    width: '100%',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(8, 12, 20, 0.72)',
    overflow: 'hidden',
    position: 'relative',
  },
  utilityPillSheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  utilityPillPressed: {
    opacity: 0.88,
  },
  utilityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    minWidth: 0,
    maxWidth: '100%',
    gap: 10,
    zIndex: 1,
  },
  utilityBalancedRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
  },
  utilityIconZone: {
    width: UTILITY_ICON_ZONE,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  utilitySpacerZone: {
    width: UTILITY_ICON_ZONE,
  },
  utilityIconWrap: {
    width: 29,
    height: 29,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityLabel: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 16,
    color: INK,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
  },
  utilityLabelBalanced: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 16,
    color: INK,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
  },
  utilityLabelActive: {
    color: '#FFFFFF',
  },
});
