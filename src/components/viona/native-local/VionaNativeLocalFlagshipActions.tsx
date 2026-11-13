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

export type NativeLocalGridColumns = 1 | 2 | 3 | 4;

export type NativeLocalFlagshipId = 'myRequests' | 'bookingAssist' | 'legalWealth' | 'browseServices';

export type NativeLocalFlagshipItem = Readonly<{
  id: NativeLocalFlagshipId;
  title: string;
  subtitle: string;
  statusLabel: string;
  accessibilityLabel: string;
  image: ImageSourcePropType;
  onPress: () => void;
}>;

export type VionaNativeLocalFlagshipActionsProps = Readonly<{
  kicker: string;
  items: readonly NativeLocalFlagshipItem[];
  reduceMotion: boolean;
  columns?: NativeLocalGridColumns;
  tileWidth?: number;
  compact?: boolean;
  shortTile?: boolean;
  imageHeight?: number;
}>;

/**
 * Native Local flagship row. Presentation only: My Requests, booking assist, legal/wealth, browse.
 * Domain callbacks stay on LocalScreen. Column count and tileWidth are P3-C geometry branches.
 * Title/subtitle remain MULTILINE_LIMITED (2); status ELLIPSIS_ACCEPTABLE (1); full a11y name required.
 */
export function VionaNativeLocalFlagshipActions({
  kicker,
  items,
  reduceMotion,
  columns = 2,
  tileWidth = 0,
  compact = false,
  shortTile = false,
  imageHeight = 56,
}: VionaNativeLocalFlagshipActionsProps) {
  return (
    <View
      testID={`viona-native-local-flagship-actions-cols-${columns}`}
      style={styles.root}
    >
      <Text style={styles.kicker}>{kicker}</Text>
      <View style={styles.row}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            testID={`local-native-flagship-${item.id}`}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={item.accessibilityLabel}
            style={({ pressed }) => [
              styles.tile,
              shortTile && styles.tileShort,
              compact && styles.tileCompact,
              tileWidth > 0
                ? { width: tileWidth, flexGrow: 0, flexShrink: 0, minWidth: 0 }
                : columns === 4
                  ? styles.tileFourFallback
                  : columns === 3
                    ? styles.tileThreeFallback
                    : columns === 1
                      ? styles.tileOneFallback
                      : styles.tileTwoFallback,
              pressed && (reduceMotion ? styles.pressedFade : styles.pressedScale),
            ]}
          >
            <View style={[styles.rail, shortTile && styles.railShort]} />
            <Image source={item.image} resizeMode="cover" style={[styles.image, { height: imageHeight }]} />
            <View style={[styles.meta, (compact || shortTile) && styles.metaCompact]}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>
              <View style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {item.statusLabel}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    marginBottom: tkn.spacing[12],
    gap: tkn.spacing[8],
  },
  kicker: {
    fontFamily: FontFamily.semibold,
    color: tkn.accent.local,
    fontSize: tkn.type.chip.fontSize,
    lineHeight: tkn.type.chip.lineHeight,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tkn.spacing[8],
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
  tileShort: {
    minHeight: 88,
  },
  tileCompact: {
    borderRadius: tkn.radius.lg,
  },
  tileOneFallback: {
    width: '100%',
  },
  tileTwoFallback: {
    width: '48%',
  },
  tileThreeFallback: {
    width: '31%',
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
    backgroundColor: tkn.accent.local,
  },
  railShort: {
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
    borderColor: tkn.accent.local,
    paddingHorizontal: tkn.spacing[8],
    paddingVertical: 2,
    minHeight: 18,
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: FontFamily.medium,
    color: tkn.accent.local,
    fontSize: tkn.type.chip.fontSize,
    lineHeight: tkn.type.chip.lineHeight,
  },
});
