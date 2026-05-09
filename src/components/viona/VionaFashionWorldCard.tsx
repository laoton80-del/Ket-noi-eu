import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type ImageSourcePropType,
  type StyleProp,
} from 'react-native';

import { vionaTokens } from '../../design';
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

const ACCENT_NEON_GLOW: Readonly<Record<FashionAccent, string>> = {
  /** Emerald-led rim; cyan halo layered in `NeonRimHalo` for desktop fashion. */
  local: vionaTokens.fashionTech.accentEmerald,
  travel: vionaTokens.fashionTech.accentCyan,
  academy: vionaTokens.fashionTech.accentViolet,
  business: vionaTokens.fashionTech.accentGold,
  care: vionaTokens.fashionTech.accentMagenta,
};

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
}: VionaFashionWorldCardProps) {
  const fallbackGrad = FALLBACK_GRADIENT[accent];
  const accentColor = ACCENT_RAIL[accent];
  const minH = variant === 'heroRow' ? 168 : 158;
  const glow = ACCENT_NEON_GLOW[accent];
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

  const animShadowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.36] });
  const animShadowRadius = pulse.interpolate({ inputRange: [0, 1], outputRange: [9, 16] });
  const animBorderOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0.72] });

  const photoLayer =
    backgroundImage != null ? (
      <View style={styles.imageClipFull} pointerEvents="none">
        <Image source={backgroundImage} resizeMode="cover" style={[styles.imageFull, imageStyle]} />
      </View>
    ) : (
      <LinearGradient colors={fallbackGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
    );

  /** Narrow left scrim for title/sub copy only — keeps photo side bright (no full-card blanket). */
  const textScrim = (
    <LinearGradient
      colors={['rgba(6, 9, 14, 0.34)', 'rgba(6, 9, 14, 0.14)', 'rgba(6, 9, 14, 0)']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.textScrim}
      pointerEvents="none"
    />
  );

  const localEmeraldCyanHalo =
    neonRim && accent === 'local' ? (
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.neonDualHalo,
          { borderColor: 'rgba(112, 200, 255, 0.28)' },
        ]}
      />
    ) : null;

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

  const gradShell = neonRim && animatedNeonRim ? (
    <Animated.View
      style={[
        styles.grad,
        stretch.shell,
        {
          shadowColor: glow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: animShadowOpacity,
          shadowRadius: animShadowRadius,
          elevation: 6,
        },
      ]}
    >
      {photoLayer}
      {backgroundImage != null ? textScrim : null}
      {localEmeraldCyanHalo}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.neonPulseRing,
          {
            borderColor: glow,
            opacity: animBorderOpacity,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.accentFrame,
          {
            borderColor: accentColor,
            shadowColor: accentColor,
          },
        ]}
      />
      <View pointerEvents="none" style={[styles.accentEdgeHighlight, { backgroundColor: accentColor }]} />
      <View style={[styles.rowShell, stretch.row]}>
        <View style={stretch.inner}>
          <View style={styles.topRow}>
            {icon ? <View style={styles.iconSlot}>{icon}</View> : null}
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
                <Ionicons name="arrow-forward-circle-outline" size={22} color={vionaTokens.fashionTech.champagneMuted} />
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  ) : (
    <View
      style={[
        styles.grad,
        stretch.shell,
        neonRim && {
          shadowColor: glow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.32,
          shadowRadius: 14,
          elevation: 6,
        },
      ]}
    >
      {photoLayer}
      {backgroundImage != null ? textScrim : null}
      {localEmeraldCyanHalo}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.accentFrame,
          {
            borderColor: accentColor,
            shadowColor: accentColor,
          },
        ]}
      />
      <View pointerEvents="none" style={[styles.accentEdgeHighlight, { backgroundColor: accentColor }]} />
      <View style={[styles.rowShell, stretch.row]}>
        <View style={stretch.inner}>
          <View style={styles.topRow}>
            {icon ? <View style={styles.iconSlot}>{icon}</View> : null}
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
                <Ionicons name="arrow-forward-circle-outline" size={22} color={vionaTokens.fashionTech.champagneMuted} />
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );

  /** Hover/focus for Living Hero (desktop) must work even when `onPress` is omitted (e.g. coming-soon travel). */
  const hoverOnly = onPress == null && (onHoverIn != null || onHoverOut != null || onFocus != null || onBlur != null);

  if (!onPress && !hoverOnly) {
    return <View style={stretch.press}>{gradShell}</View>;
  }

  return (
    <Pressable
      onPress={onPress ?? (() => {})}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={onPress != null && disabled}
      style={({ pressed }) => [styles.pressWrap, stretch.press, pressed && onPress != null && !disabled && styles.pressed]}
    >
      {gradShell}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressWrap: {
    borderRadius: vionaTokens.radius.lg,
    overflow: 'hidden',
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
    borderRadius: vionaTokens.radius.lg,
    borderWidth: 1,
    borderColor: vionaTokens.fashionTech.champagneLine,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 14, 20, 0.2)',
    position: 'relative',
  },
  imageClipFull: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
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
    width: '62%',
    zIndex: 0,
  },
  rowShell: {
    flexDirection: 'row',
    alignItems: 'stretch',
    zIndex: 1,
  },
  accentFrame: {
    zIndex: 1,
    borderRadius: vionaTokens.radius.lg,
    borderWidth: 1,
    opacity: 0.34,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
  },
  accentEdgeHighlight: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 1.5,
    opacity: 0.46,
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
    paddingTop: vionaTokens.spacing[4],
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
    borderColor: vionaTokens.fashionTech.champagneLine,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: vionaTokens.spacing[6],
  },
  title: {
    color: vionaTokens.fashionTech.inkOnDark,
    fontFamily: FontFamily.extrabold,
    fontSize: 16,
    lineHeight: 21,
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
  neonPulseRing: {
    zIndex: 0,
    borderRadius: vionaTokens.radius.lg,
    borderWidth: 1,
  },
  neonDualHalo: {
    zIndex: 0,
    borderRadius: vionaTokens.radius.lg,
    borderWidth: 1,
  },
});
