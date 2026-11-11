import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { vionaCinematicTokens } from '../../../design/vionaCinematicTokens';
import { useTranslation } from '../../../i18n';
import {
  VIONA_REC2_GATED_CARD_CONTENT_OPACITY,
  invokeVionaRec2UniverseCallback,
  resolveVionaRec2ImagePresentation,
  type VionaRec2ImageInput,
  type VionaRec2UniverseCallbacks,
  type VionaRec2UniverseContract,
  type VionaRec2UniverseId,
} from './vionaRec2HomeContract';
import { ensureVionaReducedMotionGuard } from './vionaReducedMotionGuard';

type IconName = ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<VionaRec2UniverseId, IconName> = {
  local: 'location-outline',
  travel: 'airplane-outline',
  academy: 'school-outline',
  business: 'briefcase-outline',
  account: 'person-circle-outline',
  sos: 'shield-checkmark-outline',
};

// These six cinematic photos are licensed. See PROVENANCE.md.
// A non-licensed value keeps the accent gradient.
const IMAGE_PROVENANCE: Readonly<Record<VionaRec2UniverseId, VionaRec2ImageInput['provenance']>> = {
  local: 'licensed',
  travel: 'licensed',
  academy: 'licensed',
  business: 'licensed',
  account: 'licensed',
  sos: 'licensed',
};

/** Keep the top of each landmark inside the cover frame. */
const PHOTO_FOCUS: Readonly<Record<VionaRec2UniverseId, string>> = {
  local: 'center',
  travel: 'center 30%',
  academy: 'center 16%',
  business: 'center 20%',
  account: 'center top',
  sos: 'center 4%',
};

const UNIVERSE_ASSETS: Readonly<Record<VionaRec2UniverseId, ImageSourcePropType>> = {
  local: require('../../../../assets/brand/viona/cinematic/photos/card-local.jpg'),
  travel: require('../../../../assets/brand/viona/cinematic/photos/card-travel.webp'),
  academy: require('../../../../assets/brand/viona/cinematic/photos/card-academy.webp'),
  business: require('../../../../assets/brand/viona/cinematic/photos/card-business.webp'),
  account: require('../../../../assets/brand/viona/cinematic/photos/card-account.webp'),
  sos: require('../../../../assets/brand/viona/cinematic/photos/card-sos.webp'),
};

export type UniversePhotoTileProps = Readonly<{
  universe: VionaRec2UniverseContract;
  callbacks: VionaRec2UniverseCallbacks;
  width: number;
  reducedMotion?: boolean;
  subtitleStyle?: TextStyle;
  enterIndex?: number;
}>;

export function UniversePhotoTile({
  universe,
  callbacks,
  width,
  reducedMotion = false,
  subtitleStyle,
  enterIndex = 0,
}: UniversePhotoTileProps) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const playedEntrance = useRef(false);
  const entrance = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const imageSource = UNIVERSE_ASSETS[universe.id];
  const provenance = IMAGE_PROVENANCE[universe.id];
  const loadState: VionaRec2ImageInput['loadState'] = failed ? 'error' : loaded ? 'ready' : 'loading';
  const imagePresentation = resolveVionaRec2ImagePresentation({ provenance, loadState });
  const canLoadImage = provenance === 'licensed' && !failed;
  const showImage = imagePresentation.mode === 'image';
  const tone = vionaCinematicTokens.universe[universe.id];
  const interactive = universe.availability === 'available' && typeof callbacks[universe.id] === 'function';
  const title = t(`home.rec2.universes.${universe.id}.title`);
  const body = t(`home.rec2.universes.${universe.id}.subtitle`);
  const stateLabel = t(`home.rec2.availability.${universe.availability}`);
  const calm = universe.id === 'sos';
  const lifted = interactive && (hovered || focused);

  useEffect(() => {
    ensureVionaReducedMotionGuard();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') setLoaded(true);
  }, [universe.id]);

  useEffect(() => {
    if (reducedMotion) {
      entrance.setValue(1);
      return;
    }
    if (playedEntrance.current) return;
    playedEntrance.current = true;
    const anim = Animated.timing(entrance, {
      toValue: 1,
      duration: 180,
      delay: Math.min(Math.max(enterIndex, 0), 5) * 60,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [entrance, enterIndex, reducedMotion]);

  const cardMotion = reducedMotion
    ? null
    : ({
        transitionProperty: 'transform',
        transitionDuration: '180ms',
        transitionTimingFunction: 'ease-out',
        willChange: 'transform',
      } as ViewStyle);
  const photoMotion = reducedMotion
    ? null
    : ({
        transitionProperty: 'transform',
        transitionDuration: '220ms',
        transitionTimingFunction: 'ease-out',
        willChange: 'transform',
      } as ImageStyle);

  return (
    <View testID="viona-motion" style={{ width }}>
    <Animated.View
      style={{
        opacity: entrance,
        transform: [
          {
            translateY: entrance.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 0],
            }),
          },
        ],
      }}
    >
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={interactive ? t('home.rec2.universeOpenHint') : stateLabel}
      accessibilityState={{ disabled: !interactive }}
      disabled={!interactive}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => invokeVionaRec2UniverseCallback(universe, callbacks)}
      style={({ pressed }) => [
        styles.host,
        cardMotion,
        { borderColor: lifted ? tone.accent : 'rgba(0, 209, 255, 0.16)' },
        !lifted && vionaCinematicTokens.elevation.cardOnShell,
        lifted && {
          shadowColor: tone.accent,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.45,
          shadowRadius: 18,
          elevation: 8,
        },
        lifted && !pressed && !reducedMotion && (calm ? styles.liftCalm : styles.lift),
        pressed && (reducedMotion ? styles.pressedStill : styles.pressed),
      ]}
    >
      <LinearGradient colors={[tone.wash, vionaCinematicTokens.color.navy, vionaCinematicTokens.color.midnight]} style={styles.fill}>
        {canLoadImage ? (
          <View pointerEvents="none" style={[styles.photo, Platform.OS !== 'web' && !showImage && styles.photoPending]}>
            {Platform.OS === 'web' ? (
              <View
                style={[
                  styles.photoFill,
                  photoMotion,
                  {
                    backgroundImage: `url("${Asset.fromModule(imageSource as number).uri}")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                    backgroundPosition: PHOTO_FOCUS[universe.id],
                  } as ViewStyle,
                ]}
              />
            ) : (
              <Image
                source={imageSource}
                resizeMode="cover"
                accessible={false}
                accessibilityIgnoresInvertColors
                onLoad={() => setLoaded(true)}
                onError={() => setFailed(true)}
                style={[styles.photoFill, photoMotion]}
              />
            )}
          </View>
        ) : null}
        {showImage ? (
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(10, 26, 51, 0)', 'rgba(10, 26, 51, 0.72)']}
            style={styles.scrim}
          />
        ) : null}
        <View style={[styles.copy, universe.availability !== 'available' && styles.gatedCopy]}>
          <View style={[styles.icon, { borderColor: tone.accent }]}>
            <Ionicons name={ICONS[universe.id]} size={22} color={tone.accent} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.body, subtitleStyle]}>{body}</Text>
          <View style={styles.footer}>
            <Text style={[styles.state, { color: tone.accent }]}>{stateLabel}</Text>
            <Ionicons
              name={interactive ? 'arrow-forward' : 'lock-closed-outline'}
              size={16}
              color={interactive ? tone.accent : vionaCinematicTokens.color.muted}
            />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
    </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    minHeight: 196,
    borderRadius: vionaCinematicTokens.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: vionaCinematicTokens.color.midnight,
  },
  lift: { transform: [{ translateY: -4 }, { scale: 1.01 }] },
  liftCalm: { transform: [{ translateY: -4 }] },
  fill: { flexGrow: 1, minHeight: 196 },
  photo: { ...StyleSheet.absoluteFillObject },
  photoPending: { opacity: 0 },
  photoFill: { width: '100%', height: '100%' },
  scrim: { ...StyleSheet.absoluteFillObject },
  copy: { flexGrow: 1, minHeight: 196, padding: 16, gap: 8, justifyContent: 'flex-end' },
  gatedCopy: { opacity: VIONA_REC2_GATED_CARD_CONTENT_OPACITY },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 7, 19, 0.55)',
  },
  title: {
    color: vionaCinematicTokens.color.ice,
    fontFamily: vionaCinematicTokens.fontFamily.bold,
    fontSize: 20,
  },
  body: {
    color: vionaCinematicTokens.color.ice,
    fontFamily: vionaCinematicTokens.fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  state: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  pressedStill: { opacity: 0.9 },
});
