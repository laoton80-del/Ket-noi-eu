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
}>;

/**
 * Native Travel flagship row. Presentation only: airport, translation, taxi, emergency.
 * Emergency is a safety-styled entry; SOS provider stays upstream.
 */
export function VionaNativeTravelFlagshipActions({
  items,
  fourAcross,
  reduceMotion,
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
              fourAcross ? styles.tileFour : styles.tileTwo,
              pressed && (reduceMotion ? styles.pressedFade : styles.pressedScale),
            ]}
          >
            <View style={[styles.rail, { backgroundColor: accent }]} />
            <Image source={item.image} resizeMode="cover" style={styles.image} />
            <View style={styles.meta}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>
              <View style={[styles.chip, { borderColor: accent }]}>
                <Text style={[styles.chipText, { color: accent }]} numberOfLines={1}>
                  {item.statusLabel}
                </Text>
              </View>
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
    marginHorizontal: -tkn.spacing[4],
    marginBottom: tkn.spacing[16],
    width: '100%',
  },
  tile: {
    overflow: 'hidden',
    borderRadius: tkn.radius.xl,
    backgroundColor: tkn.bg.surface,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    margin: tkn.spacing[4],
    minHeight: 148,
  },
  tileTwo: {
    width: '47%',
    flexGrow: 1,
  },
  tileFour: {
    width: '23%',
    flexGrow: 1,
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
  image: {
    width: '100%',
    height: 72,
  },
  meta: {
    padding: tkn.spacing[12],
    gap: tkn.spacing[4],
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
