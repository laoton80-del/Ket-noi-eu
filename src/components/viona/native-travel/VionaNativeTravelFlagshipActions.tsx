import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import { FontFamily } from '../../../theme/typography';

export type NativeTravelFlagshipId = 'airport' | 'translation' | 'taxi' | 'emergency';

export type NativeTravelFlagshipItem = Readonly<{
  id: NativeTravelFlagshipId;
  title: string;
  subtitle: string;
  statusLabel: string;
  accessibilityLabel: string;
  image: ImageSourcePropType;
  onPress: () => void;
}>;

export type VionaNativeTravelFlagshipActionsProps = Readonly<{
  items: readonly NativeTravelFlagshipItem[];
  fourAcross: boolean;
  reduceMotion: boolean;
  tileWidth?: number;
  compact?: boolean;
  shortTile?: boolean;
  imageHeight?: number;
}>;

/**
 * Native Travel flagship row. Presentation only: airport, translation, taxi, emergency.
 * Emergency is a safety-styled entry; SOS provider stays upstream.
 * Column count, tile geometry, and crop height are P2-C presentation branches.
 */
export function VionaNativeTravelFlagshipActions({
  items,
  fourAcross,
  reduceMotion,
  tileWidth = 0,
  compact = false,
  shortTile = false,
  imageHeight = 72,
}: VionaNativeTravelFlagshipActionsProps) {
  return (
    <View
      testID={
        fourAcross ? 'viona-native-travel-flagship-actions-cols-4' : 'viona-native-travel-flagship-actions'
      }
      style={styles.root}
    >
      {items.map((item) => {
        const safety = item.id === 'emergency';
        const accent = safety ? tkn.accent.safety : tkn.accent.travel;
        return (
          <Pressable
            key={item.id}
            testID={`travel-native-flagship-${item.id}`}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={item.accessibilityLabel}
            style={({ pressed }) => [
              styles.tile,
              shortTile && styles.tileCompact,
              tileWidth > 0 ? { width: tileWidth, flexGrow: 0, flexShrink: 0 } : fourAcross ? styles.tileFourFallback : styles.tileTwoFallback,
              pressed && (reduceMotion ? styles.pressedFade : styles.pressedScale),
            ]}
          >
            <View style={[styles.rail, shortTile && styles.railCompact, { backgroundColor: accent }]} />
            <Image
              source={item.image}
              resizeMode="cover"
              style={[styles.image, { height: imageHeight }]}
            />
            <View style={[styles.meta, (compact || shortTile) && styles.metaCompact]}>
              <Text style={styles.title} numberOfLines={compact || shortTile ? 1 : 2}>
                {item.title}
              </Text>
              {compact || shortTile ? null : (
                <Text style={styles.subtitle} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              )}
              {shortTile ? null : (
                <View style={[styles.chip, { borderColor: accent }]}>
                  <Text style={[styles.chipText, { color: accent }]} numberOfLines={1}>
                    {item.statusLabel}
                  </Text>
                </View>
              )}
            </View>
            {safety ? (
              <View style={styles.safetyGlyph} accessibilityElementsHidden>
                <Ionicons name="shield-outline" size={16} color={tkn.accent.safety} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tkn.spacing[8],
    marginBottom: tkn.spacing[12],
    width: '100%',
  },
  tile: {
    overflow: 'hidden',
    borderRadius: tkn.radius.xl,
    backgroundColor: tkn.bg.surface,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    minHeight: 118,
  },
  tileCompact: {
    minHeight: tkn.hit.min,
    borderRadius: tkn.radius.lg,
  },
  tileTwoFallback: {
    width: '48%',
  },
  tileFourFallback: {
    width: '23%',
  },
  pressedScale: {
    transform: [{ scale: 0.98 }],
  },
  pressedFade: {
    opacity: 0.88,
  },
  rail: {
    height: 4,
    width: '100%',
  },
  railCompact: {
    height: 3,
  },
  image: {
    width: '100%',
    height: 56,
  },
  meta: {
    padding: tkn.spacing[12],
    gap: tkn.spacing[4],
  },
  metaCompact: {
    padding: tkn.spacing[8],
    gap: 2,
  },
  title: {
    fontFamily: FontFamily.semibold,
    color: tkn.ink.primary,
    fontSize: tkn.type.title.fontSize,
    lineHeight: tkn.type.title.lineHeight,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    color: tkn.ink.secondary,
    fontSize: tkn.type.meta.fontSize,
    lineHeight: tkn.type.meta.lineHeight,
  },
  chip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: tkn.radius.pill,
    paddingHorizontal: tkn.spacing[8],
    paddingVertical: 2,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: tkn.type.chip.fontSize,
    lineHeight: tkn.type.chip.lineHeight,
  },
  safetyGlyph: {
    position: 'absolute',
    top: tkn.spacing[8],
    right: tkn.spacing[8],
    width: tkn.hit.min,
    height: tkn.hit.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
