import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { vionaTokens } from '../../design';
import {
  FASHION_HOME_GLOW_CYAN,
  FASHION_HOME_GLOW_GOLD,
  FASHION_HOME_INNER_HIGHLIGHT,
  FASHION_HOME_WEB_WORLD_CARD_PRESS_SCALE,
  fashionHomeWebDaylightWorldCardTextScrimStyle,
  fashionHomeWebWorldCardImageHoverStyle,
} from './fashionHomeDesktopShell';
import { FontFamily } from '../../theme/typography';
import { VionaStatusPill } from './VionaStatusPill';

type FashionAccent = 'local' | 'travel' | 'academy' | 'business' | 'care';

type FashionStatusTone = 'lite' | 'pilot' | 'demo' | 'comingSoon' | 'safe';

const FALLBACK_GRADIENT: Readonly<Record<FashionAccent, readonly [string, string, string]>> = {
  local: [vionaTokens.fashionTech.worlds.local[0], vionaTokens.fashionTech.worlds.local[1], vionaTokens.fashionTech.worlds.local[2]],
  travel: [vionaTokens.fashionTech.worlds.travel[0], vionaTokens.fashionTech.worlds.travel[1], vionaTokens.fashionTech.worlds.travel[2]],
  academy: [vionaTokens.fashionTech.worlds.academy[0], vionaTokens.fashionTech.worlds.academy[1], vionaTokens.fashionTech.worlds.academy[2]],
  business: [vionaTokens.fashionTech.worlds.business[0], vionaTokens.fashionTech.worlds.business[1], vionaTokens.fashionTech.worlds.business[2]],
  care: [vionaTokens.fashionTech.worlds.care[0], vionaTokens.fashionTech.worlds.care[1], vionaTokens.fashionTech.worlds.care[2]],
};

const ACCENT_RAIL: Readonly<Record<FashionAccent, string>> = {
  local: vionaTokens.fashionTech.accentEmerald,
  travel: vionaTokens.fashionTech.accentCyan,
  academy: vionaTokens.fashionTech.accentViolet,
  business: vionaTokens.fashionTech.accentGold,
  care: vionaTokens.fashionTech.accentMagenta,
};

const ACCENT_LUMINOUS_GLOW: Readonly<Record<FashionAccent, string>> = {
  local: 'rgba(88, 214, 168, 0.14)',
  travel: FASHION_HOME_GLOW_CYAN,
  academy: 'rgba(176, 140, 255, 0.14)',
  business: FASHION_HOME_GLOW_GOLD,
  care: 'rgba(255, 92, 108, 0.14)',
};

const CARD_RADIUS = vionaTokens.radius.lg;
const CARD_INSET_RADIUS = CARD_RADIUS - 1;

function cardEdgeStrokeStyle(color: string): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      borderWidth: 0,
      boxShadow: `inset 0 0 0 1px ${color}`,
    };
  }
  return {
    borderWidth: 1,
    borderColor: color,
  };
}

function luminousCardShell(accent: FashionAccent) {
  return {
    shadowColor: ACCENT_LUMINOUS_GLOW[accent],
    shadowOffset: { width: 0, height: 0 } as const,
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1 as const,
  };
}

export type VionaFashionWorldCardProps = Readonly<{
  title: string;
  subtitle: string;
  accent: FashionAccent;
  icon?: ReactNode;
  backgroundImage?: ImageSourcePropType;
  imageStyle?: StyleProp<ImageStyle>;
  status?: { label: string; tone: FashionStatusTone };
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'heroRow' | 'grid';
  /** Small metadata line (e.g. “Open”). */
  footerHint?: string;
  showChevron?: boolean;
  /** Subtle colored outer glow under the gold stroke. */
  neonRim?: boolean;
  /** Slow pulse on rim glow (desktop fashion home). */
  animatedNeonRim?: boolean;
  /** Fill parent column height so a row of cards shares identical outer geometry. */
  stretchInColumn?: boolean;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  /**
   * Home Daylight desktop web: suppress full-card atmosphere wash; keep image sharp.
   * Edge glass is supplied by Home `FashionHomeWorldCardGlassLayers` on the host cell.
   */
  glassMaterialMode?: 'default' | 'edgeLit';
  /** Home Daylight web: brighter icon capsule when host cell is hovered. */
  edgeLitHoverBoost?: boolean;
}>;

export function VionaFashionWorldCard({
  title,
  subtitle,
  accent,
  icon,
  backgroundImage,
  imageStyle,
  status,
  onPress,
  disabled = false,
  variant = 'grid',
  footerHint,
  showChevron = false,
  neonRim = false,
  animatedNeonRim = false,
  stretchInColumn = false,
  onHoverIn,
  onHoverOut,
  onFocus,
  onBlur,
  glassMaterialMode = 'default',
  edgeLitHoverBoost = false,
}: VionaFashionWorldCardProps) {
  const edgeLitGlass = glassMaterialMode === 'edgeLit';
  const fallbackGrad = FALLBACK_GRADIENT[accent];
  const accentColor = ACCENT_RAIL[accent];
  const minH = variant === 'heroRow' ? 172 : 168;
  const cardShell = luminousCardShell(accent);
  const cardEdgeColor = `${accentColor}ea`;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!neonRim || !animatedNeonRim) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 3400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 3400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [animatedNeonRim, neonRim, pulse]);

  const animShadowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.14] });
  const animShadowRadius = pulse.interpolate({ inputRange: [0, 1], outputRange: [3, 4] });

  const stretch = stretchInColumn
    ? {
        press: styles.pressWrapStretch,
        shell: styles.gradStretch,
        row: styles.rowShellStretch,
        inner: [styles.inner, styles.innerStretch, { minHeight: minH }],
      }
    : {
        press: undefined,
        shell: undefined,
        row: undefined,
        inner: [styles.inner, { minHeight: minH }],
      };

  /** Narrow left scrim for title/sub copy only — keeps photo side bright (no full-card blanket). */
  const textScrim = edgeLitGlass ? (
    Platform.OS === 'web' ? (
      <View style={[styles.textScrimEdgeLit, fashionHomeWebDaylightWorldCardTextScrimStyle()]} pointerEvents="none" />
    ) : (
      <LinearGradient
        colors={[
          'rgba(4, 7, 12, 0.21)',
          'rgba(4, 7, 12, 0.072)',
          'rgba(4, 7, 12, 0.02)',
          'rgba(4, 7, 12, 0)',
        ]}
        locations={[0, 0.3, 0.65, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.textScrimEdgeLit}
        pointerEvents="none"
      />
    )
  ) : (
    <LinearGradient
      colors={['rgba(4, 7, 12, 0.48)', 'rgba(4, 7, 12, 0.22)', 'rgba(4, 7, 12, 0)']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.textScrim}
      pointerEvents="none"
    />
  );

  const constellationAtmosphere =
    backgroundImage != null && !edgeLitGlass ? (
      <>
        <LinearGradient
          colors={['rgba(6, 9, 14, 0.1)', 'rgba(3, 6, 11, 0.38)', 'rgba(3, 6, 11, 0.32)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['rgba(233, 199, 120, 0.16)', 'rgba(233, 199, 120, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.cardTopSheen}
          pointerEvents="none"
        />
      </>
    ) : null;

  const localEmeraldCyanHalo = null;

  const footerReadabilityScrim =
    backgroundImage != null && (footerHint != null || showChevron) ? (
      <LinearGradient
        colors={
          edgeLitGlass
            ? ['rgba(4, 7, 12, 0)', 'rgba(4, 7, 12, 0.076)', 'rgba(4, 7, 12, 0.22)']
            : ['rgba(4, 7, 12, 0)', 'rgba(4, 7, 12, 0.24)', 'rgba(4, 7, 12, 0.46)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={edgeLitGlass ? styles.footerScrimEdgeLit : styles.footerScrim}
        pointerEvents="none"
      />
    ) : null;

  const imageHoverStyle =
    edgeLitGlass && edgeLitHoverBoost ? fashionHomeWebWorldCardImageHoverStyle(true) : null;

  const photoLayer =
    backgroundImage != null ? (
      <Image
        source={backgroundImage}
        resizeMode="cover"
        style={[styles.imageFull, imageStyle, imageHoverStyle]}
      />
    ) : (
      <LinearGradient colors={fallbackGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
    );

  const visualStage = (
    <View style={styles.visualStage} pointerEvents="none">
      {photoLayer}
      {constellationAtmosphere}
      {backgroundImage != null ? textScrim : null}
      {footerReadabilityScrim}
      {localEmeraldCyanHalo}
    </View>
  );

  const cardContent = (
    <View style={[styles.rowShell, stretch.row]}>
      <View style={stretch.inner}>
        <View style={styles.topRow}>
          {icon ? (
            <View
              style={[
                styles.iconSlot,
                { borderColor: `${accentColor}${edgeLitGlass && edgeLitHoverBoost ? 'ff' : 'ea'}` },
                edgeLitGlass && styles.iconSlotEdgeLit,
                edgeLitGlass &&
                  edgeLitHoverBoost &&
                  (Platform.OS === 'web'
                    ? ({
                        boxShadow: `0 0 0 1px ${accentColor}66, 0 0 12px ${accentColor}2e`,
                      } as ViewStyle)
                    : styles.iconSlotEdgeLitHoverNative),
              ]}
            >
              {icon}
            </View>
          ) : null}
          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {title}
            </Text>
            <Text style={styles.sub} numberOfLines={2} ellipsizeMode="tail">
              {subtitle}
            </Text>
          </View>
        </View>
        {status ? (
          <View style={styles.pillRow}>
            <VionaStatusPill label={status.label} tone={status.tone} size="sm" />
          </View>
        ) : null}
        {footerHint != null || showChevron ? (
          <View style={styles.footerRow}>
            {footerHint ? (
              <Text style={styles.footerHint} numberOfLines={1}>
                {footerHint}
              </Text>
            ) : (
              <View style={styles.footerSpacer} />
            )}
            {showChevron ? (
              <Ionicons
                name="arrow-forward-circle-outline"
                size={22}
                color={accentColor}
                style={
                  edgeLitHoverBoost && Platform.OS === 'web'
                    ? ({ filter: `drop-shadow(0 0 3px ${accentColor}88)` } as const)
                    : edgeLitHoverBoost
                      ? styles.chevronHoverNative
                      : undefined
                }
              />
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );

  const cardEdgeFrame = edgeLitGlass ? null : (
    <>
      <View pointerEvents="none" style={[styles.cardEdgeOverlay, cardEdgeStrokeStyle(cardEdgeColor)]} />
      <View pointerEvents="none" style={styles.cardInnerTopHighlight} />
    </>
  );

  const cardFace = (
    <View style={[styles.grad, edgeLitGlass && styles.gradEdgeLit, stretch.shell]}>
      {visualStage}
      {cardContent}
    </View>
  );

  const shellGlow = neonRim
    ? {
        shadowColor: cardShell.shadowColor,
        shadowOffset: { width: 0, height: 0 } as const,
        shadowOpacity: 1,
        shadowRadius: 3,
        elevation: 1 as const,
      }
    : cardShell;

  const gradShell =
    neonRim && animatedNeonRim ? (
      <Animated.View
        style={[
          styles.pressWrap,
          stretch.press,
          shellGlow,
          {
            shadowColor: cardShell.shadowColor,
            shadowOpacity: animShadowOpacity,
            shadowRadius: animShadowRadius,
          },
        ]}
      >
        {cardFace}
        {cardEdgeFrame}
      </Animated.View>
    ) : (
      <View style={[styles.pressWrap, stretch.press, shellGlow]}>
        {cardFace}
        {cardEdgeFrame}
      </View>
    );

  /** Hover/focus for Living Hero (desktop) must work even when `onPress` is omitted (e.g. coming-soon travel). */
  const hoverOnly = onPress == null && (onHoverIn != null || onHoverOut != null || onFocus != null || onBlur != null);

  if (!onPress && !hoverOnly) {
    return gradShell;
  }

  return (
    <Pressable
      onPress={onPress ?? (() => {})}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={onPress != null && disabled}
      style={({ pressed }) => [
        stretch.press,
        pressed && onPress != null && !disabled && styles.pressed,
        pressed && onPress != null && !disabled && styles.pressedCompress,
      ]}
    >
      {gradShell}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressWrap: {
    borderRadius: CARD_RADIUS,
    position: 'relative',
  },
  pressWrapStretch: {
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
  },
  gradStretch: {
    flex: 1,
  },
  rowShellStretch: {
    flex: 1,
    alignItems: 'stretch',
  },
  innerStretch: {
    flex: 1,
  },
  grad: {
    borderRadius: CARD_RADIUS,
    backgroundColor: 'rgba(8, 12, 18, 0.28)',
    position: 'relative',
    overflow: 'hidden',
  },
  gradEdgeLit: {
    backgroundColor: 'transparent',
  },
  visualStage: {
    ...StyleSheet.absoluteFillObject,
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderRadius: CARD_INSET_RADIUS,
    overflow: 'hidden',
  },
  cardEdgeOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CARD_RADIUS,
    zIndex: 4,
  },
  cardInnerTopHighlight: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 1,
    height: 1,
    backgroundColor: FASHION_HOME_INNER_HIGHLIGHT,
    zIndex: 5,
  },
  cardTopSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
    zIndex: 0,
  },
  imageFull: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 1,
  },
  textScrim: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '72%',
    zIndex: 0,
  },
  textScrimEdgeLit: {
    position: 'absolute',
    left: 0,
    top: '18%',
    bottom: '30%',
    width: '40%',
    zIndex: 0,
  },
  footerScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
    zIndex: 0,
  },
  footerScrimEdgeLit: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '20%',
    zIndex: 0,
  },
  rowShell: {
    flexDirection: 'row',
    alignItems: 'stretch',
    zIndex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: vionaTokens.spacing[12],
    paddingVertical: vionaTokens.spacing[16],
    gap: vionaTokens.spacing[8],
    justifyContent: 'flex-start',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: vionaTokens.spacing[8],
    marginTop: 'auto',
    paddingTop: vionaTokens.spacing[6],
  },
  footerSpacer: {
    flex: 1,
    minWidth: 0,
  },
  footerHint: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: vionaTokens.fashionTech.mutedOnDark,
    fontFamily: FontFamily.semibold,
    textShadowColor: 'rgba(5, 8, 12, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  topRow: {
    flexDirection: 'row',
    gap: vionaTokens.spacing[12],
    alignItems: 'flex-start',
  },
  iconSlot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(6, 10, 18, 0.55)',
  },
  iconSlotEdgeLit: {
    backgroundColor: 'rgba(6, 10, 18, 0.32)',
  },
  iconSlotEdgeLitHoverNative: {
    backgroundColor: 'rgba(8, 12, 20, 0.52)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 2,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: vionaTokens.spacing[6],
  },
  title: {
    color: vionaTokens.fashionTech.inkOnDark,
    fontFamily: FontFamily.extrabold,
    fontSize: 17,
    lineHeight: 22,
    textShadowColor: 'rgba(5, 8, 12, 0.72)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sub: {
    color: vionaTokens.fashionTech.mutedOnDark,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 17,
    textShadowColor: 'rgba(5, 8, 12, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pillRow: {
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.92,
  },
  pressedCompress: {
    transform: [{ scale: FASHION_HOME_WEB_WORLD_CARD_PRESS_SCALE }],
  },
  chevronHoverNative: {
    opacity: 1,
  },
});
