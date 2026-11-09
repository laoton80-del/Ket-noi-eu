import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ComponentProps } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType, type TextStyle } from 'react-native';

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

type IconName = ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<VionaRec2UniverseId, IconName> = {
  local: 'location-outline',
  travel: 'airplane-outline',
  academy: 'school-outline',
  business: 'briefcase-outline',
  account: 'person-circle-outline',
  sos: 'shield-checkmark-outline',
};

// Swap a universe to 'licensed' and point its asset at a cleared file.
// The tile layout stays the same; unverified entries keep the accent gradient.
const IMAGE_PROVENANCE: Readonly<Record<VionaRec2UniverseId, VionaRec2ImageInput['provenance']>> = {
  local: 'unverified',
  travel: 'unverified',
  academy: 'unverified',
  business: 'unverified',
  account: 'unverified',
  sos: 'unverified',
};

const UNIVERSE_ASSETS: Readonly<Record<VionaRec2UniverseId, ImageSourcePropType>> = {
  local: require('../../../../assets/brand/viona/cinematic/photos/card-local.webp'),
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
}>;

export function UniversePhotoTile({
  universe,
  callbacks,
  width,
  reducedMotion = false,
  subtitleStyle,
}: UniversePhotoTileProps) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={interactive ? t('home.rec2.universeOpenHint') : stateLabel}
      accessibilityState={{ disabled: !interactive }}
      disabled={!interactive}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={() => invokeVionaRec2UniverseCallback(universe, callbacks)}
      style={({ pressed }) => [
        styles.host,
        { width, borderColor: focused || pressed ? tone.accent : tone.accent },
        pressed && (reducedMotion ? styles.pressedStill : styles.pressed),
      ]}
    >
      <LinearGradient colors={[tone.wash, vionaCinematicTokens.color.navy, vionaCinematicTokens.color.midnight]} style={styles.fill}>
        {canLoadImage ? (
          <View pointerEvents="none" style={[styles.photo, !showImage && styles.photoPending]}>
            <Image
              source={imageSource}
              resizeMode="cover"
              accessible={false}
              accessibilityIgnoresInvertColors
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              style={styles.photoFill}
            />
          </View>
        ) : null}
        {showImage ? <View pointerEvents="none" style={styles.scrim} /> : null}
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
  fill: { flexGrow: 1, minHeight: 196 },
  photo: { ...StyleSheet.absoluteFillObject },
  photoPending: { opacity: 0 },
  photoFill: { width: '100%', height: '100%' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2, 7, 19, 0.55)' },
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
