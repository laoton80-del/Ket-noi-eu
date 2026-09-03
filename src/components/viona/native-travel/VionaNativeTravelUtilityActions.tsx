import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import { FontFamily } from '../../../theme/typography';

export type NativeTravelUtilityId =
  | 'airport'
  | 'taxi'
  | 'transit'
  | 'hotel'
  | 'restaurant'
  | 'shopping'
  | 'hospital'
  | 'translation';

export type NativeTravelUtilityItem = Readonly<{
  id: NativeTravelUtilityId;
  title: string;
  statusLabel: string;
  accessibilityLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}>;

export type VionaNativeTravelUtilityActionsProps = Readonly<{
  items: readonly NativeTravelUtilityItem[];
  twoColumn: boolean;
  reduceMotion: boolean;
}>;

/**
 * Native Travel utility grid. Presentation only. All eight existing utility IDs remain reachable.
 */
export function VionaNativeTravelUtilityActions({
  items,
  twoColumn,
  reduceMotion,
}: VionaNativeTravelUtilityActionsProps) {
  return (
    <View testID="viona-native-travel-utility-actions" style={styles.root}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          testID={`travel-native-utility-${item.id}`}
          onPress={item.onPress}
          accessibilityRole="button"
          accessibilityLabel={item.accessibilityLabel}
          style={({ pressed }) => [
            styles.row,
            twoColumn ? styles.rowHalf : styles.rowFull,
            pressed && (reduceMotion ? styles.pressedFade : styles.pressedScale),
          ]}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={item.icon} size={18} color={tkn.accent.travel} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.status} numberOfLines={1}>
              {item.statusLabel}
            </Text>
          </View>
        </Pressable>
      ))}
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
  row: {
    minHeight: tkn.hit.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tkn.spacing[8],
    margin: tkn.spacing[4],
    paddingHorizontal: tkn.spacing[12],
    paddingVertical: tkn.spacing[8],
    backgroundColor: tkn.bg.surface,
    borderRadius: tkn.radius.lg,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
  },
  rowHalf: {
    width: '47%',
    flexGrow: 1,
  },
  rowFull: {
    width: '100%',
  },
  pressedScale: {
    transform: [{ scale: 0.98 }],
  },
  pressedFade: {
    opacity: 0.88,
  },
  iconWrap: {
    width: tkn.hit.min,
    height: tkn.hit.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tkn.radius.md,
    backgroundColor: tkn.bg.muted,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: FontFamily.semibold,
    color: tkn.ink.primary,
    fontSize: tkn.type.title.fontSize,
    lineHeight: tkn.type.title.lineHeight,
  },
  status: {
    fontFamily: FontFamily.medium,
    color: tkn.ink.secondary,
    fontSize: tkn.type.chip.fontSize,
    lineHeight: tkn.type.chip.lineHeight,
  },
});
