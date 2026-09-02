import { useMemo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';

import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import { FontFamily } from '../../../theme/typography';

export type VionaNativeUniverseLauncherItem = Readonly<{
  id: 'local' | 'travel' | 'academy' | 'business';
  label: string;
  readinessLabel: string;
  image: ImageSourcePropType;
  semanticAccent: 'local' | 'travel' | 'academy' | 'business';
  accessibilityLabel: string;
  onPress?: () => void;
}>;

export type VionaNativeUniverseLauncherProps = Readonly<{
  items: readonly VionaNativeUniverseLauncherItem[];
  fourAcross: boolean;
  reduceMotion: boolean;
}>;

/**
 * Four-universe launcher. No Account tile. No SOS tile.
 * Phone portrait: 2×2. Tablet or landscape: 4-across.
 */
export function VionaNativeUniverseLauncher({
  items,
  fourAcross,
  reduceMotion,
}: VionaNativeUniverseLauncherProps) {
  const { width } = useWindowDimensions();
  const tileMinHeight = useMemo(() => {
    if (fourAcross) return Math.max(96, Math.min(124, Math.floor(width * 0.12)));
    return Math.max(108, Math.min(132, Math.floor(width * 0.28)));
  }, [fourAcross, width]);

  return (
    <View
      testID={
        fourAcross
          ? 'viona-native-universe-launcher-cols-4'
          : 'viona-native-universe-launcher-cols-2'
      }
      style={styles.root}
    >
      {items.map((item) => {
        const accent = tkn.accent[item.semanticAccent];
        return (
          <Pressable
            key={item.id}
            disabled={!item.onPress}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={item.accessibilityLabel}
            accessibilityState={{ disabled: !item.onPress }}
            style={({ pressed }) => [
              styles.tile,
              fourAcross ? styles.tileFour : styles.tileTwo,
              { minHeight: tileMinHeight },
              pressed && !reduceMotion && styles.tilePressedScale,
              pressed && reduceMotion && styles.tilePressedFade,
            ]}
          >
            <View style={[styles.rail, { backgroundColor: accent }]} />
            <Image source={item.image} resizeMode="cover" style={styles.image} />
            <View style={styles.meta}>
              <Text style={styles.label} numberOfLines={2}>
                {item.label}
              </Text>
              <View style={[styles.chip, { borderColor: accent }]}>
                <Text style={[styles.chipText, { color: accent }]} numberOfLines={1}>
                  {item.readinessLabel}
                </Text>
              </View>
            </View>
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
  },
  tile: {
    overflow: 'hidden',
    borderRadius: tkn.radius.xl,
    backgroundColor: tkn.bg.surface,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    margin: tkn.spacing[4],
  },
  tileTwo: {
    width: '47%',
    flexGrow: 1,
  },
  tileFour: {
    width: '23%',
    flexGrow: 1,
  },
  tilePressedScale: {
    transform: [{ scale: 0.98 }],
  },
  tilePressedFade: {
    opacity: 0.88,
  },
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    zIndex: 2,
  },
  image: {
    width: '100%',
    height: 48,
  },
  meta: {
    paddingHorizontal: tkn.spacing[8],
    paddingVertical: tkn.spacing[4],
    gap: tkn.spacing[4],
  },
  label: {
    color: tkn.ink.primary,
    fontFamily: FontFamily.semibold,
    fontSize: tkn.type.title.fontSize,
    lineHeight: tkn.type.title.lineHeight,
  },
  chip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: tkn.radius.pill,
    paddingHorizontal: tkn.spacing[8],
    paddingVertical: tkn.spacing[4],
    backgroundColor: tkn.bg.muted,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: tkn.type.chip.fontSize,
    lineHeight: tkn.type.chip.lineHeight,
  },
});
