import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ComponentProps } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { vionaCinematicTokens } from '../../../design/vionaCinematicTokens';
import { useTranslation } from '../../../i18n';
import {
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

// Image files alone do not establish display rights. Each entry stays unverified
// until its provenance has been independently approved for this surface.
const IMAGE_PROVENANCE: Readonly<Record<VionaRec2UniverseId, VionaRec2ImageInput['provenance']>> = {
  local: 'unverified',
  travel: 'unverified',
  academy: 'unverified',
  business: 'unverified',
  account: 'unverified',
  sos: 'unverified',
};

type VionaCinematicUniverseCardProps = Readonly<{
  universe: VionaRec2UniverseContract;
  callbacks: VionaRec2UniverseCallbacks;
  width: number;
  reducedMotion?: boolean;
  imageSource?: ImageSourcePropType;
}>;

export function VionaCinematicUniverseCard({
  universe,
  callbacks,
  width,
  reducedMotion = false,
  imageSource,
}: VionaCinematicUniverseCardProps) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [loadedImageSource, setLoadedImageSource] = useState<ImageSourcePropType | null>(null);
  const [failedImageSource, setFailedImageSource] = useState<ImageSourcePropType | null>(null);
  const imageProvenance = IMAGE_PROVENANCE[universe.id];
  const imageLoadState: VionaRec2ImageInput['loadState'] = imageSource == null
    ? 'missing'
    : failedImageSource === imageSource
      ? 'error'
      : loadedImageSource === imageSource
        ? 'ready'
        : 'loading';
  const imagePresentation = resolveVionaRec2ImagePresentation({
    provenance: imageProvenance,
    loadState: imageLoadState,
  });
  const canLoadImage = imageSource != null && imageProvenance === 'licensed' && imageLoadState !== 'error';
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
        { width, borderColor: focused || pressed ? tone.accent : vionaCinematicTokens.color.line },
        pressed && (reducedMotion ? styles.pressedStill : styles.pressed),
        !interactive && styles.gated,
      ]}
    >
      <LinearGradient colors={[tone.wash, vionaCinematicTokens.color.navy]} style={styles.fill}>
        {canLoadImage && imageSource != null ? (
          <View pointerEvents="none" style={[styles.photo, !showImage && styles.photoPending]}>
            <Image
              source={imageSource}
              resizeMode="cover"
              accessible={false}
              accessibilityIgnoresInvertColors
              onLoad={() => setLoadedImageSource(imageSource)}
              onError={() => setFailedImageSource(imageSource)}
              style={styles.photoFill}
            />
          </View>
        ) : null}
        {showImage ? <View pointerEvents="none" style={styles.scrim} /> : null}
        <View style={[styles.icon, { borderColor: tone.accent }]}>
          <Ionicons name={ICONS[universe.id]} size={22} color={tone.accent} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <View style={styles.footer}>
          <Text style={[styles.state, { color: tone.accent }]}>{stateLabel}</Text>
          <Ionicons
            name={interactive ? 'arrow-forward' : 'lock-closed-outline'}
            size={16}
            color={interactive ? tone.accent : vionaCinematicTokens.color.muted}
          />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  host: {
    minHeight: 168,
    borderRadius: vionaCinematicTokens.radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: vionaCinematicTokens.color.midnight,
  },
  fill: { flex: 1, minHeight: 168, padding: 14, gap: 8 },
  photo: { ...StyleSheet.absoluteFillObject },
  photoPending: { opacity: 0 },
  photoFill: { width: '100%', height: '100%' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7, 17, 28, 0.62)' },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7, 17, 28, 0.72)',
    zIndex: 1,
  },
  title: { color: vionaCinematicTokens.color.ice, fontSize: 18, fontWeight: '700', zIndex: 1 },
  body: { color: vionaCinematicTokens.color.ice, fontSize: 13, lineHeight: 18, flex: 1, zIndex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, zIndex: 1 },
  state: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  pressedStill: { opacity: 0.88 },
  gated: { opacity: 0.92 },
});
