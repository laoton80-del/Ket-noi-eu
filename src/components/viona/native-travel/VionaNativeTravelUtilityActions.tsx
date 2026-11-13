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

export type NativeTravelUtilityColumns = 2 | 3 | 4;

export type VionaNativeTravelUtilityActionsProps = Readonly<{
  items: readonly NativeTravelUtilityItem[];
  columns: NativeTravelUtilityColumns;
  reduceMotion: boolean;
  tileWidth?: number;
}>;

const UTILITY_GROUPS = [
  { id: 'move', heading: 'Move', ids: ['airport', 'taxi', 'transit'] },
  { id: 'stay', heading: 'Stay', ids: ['hotel'] },
  { id: 'help', heading: 'Help', ids: ['restaurant', 'shopping', 'hospital', 'translation'] },
] as const satisfies readonly {
  id: 'move' | 'stay' | 'help';
  heading: string;
  ids: readonly NativeTravelUtilityId[];
}[];

function groupedUtilityItems(items: readonly NativeTravelUtilityItem[]): readonly {
  id: string;
  heading: string;
  items: NativeTravelUtilityItem[];
}[] {
  const used = new Set<NativeTravelUtilityId>();
  const groups = UTILITY_GROUPS.map((group) => {
    const grouped = group.ids
      .map((id) => items.find((item) => item.id === id))
      .filter((item): item is NativeTravelUtilityItem => Boolean(item));
    grouped.forEach((item) => used.add(item.id));
    return { id: group.id, heading: group.heading, items: grouped };
  });
  const leftover = items.filter((item) => !used.has(item.id));
  if (leftover.length === 0) return groups.filter((group) => group.items.length > 0);
  return [...groups.filter((group) => group.items.length > 0), { id: 'more', heading: '', items: leftover }];
}

/**
 * Native Travel utility grid. Presentation only. All eight existing utility IDs remain reachable.
 * Column count, wrapping, and Move/Stay/Help grouping are P2-C presentation branches.
 */
export function VionaNativeTravelUtilityActions({
  items,
  columns,
  reduceMotion,
  tileWidth = 0,
}: VionaNativeTravelUtilityActionsProps) {
  const groups = groupedUtilityItems(items);

  return (
    <View
      testID={
        columns === 2
          ? 'viona-native-travel-utility-actions'
          : `viona-native-travel-utility-actions-cols-${columns}`
      }
      style={styles.root}
    >
      {groups.map((group) => (
        <View
          key={group.id}
          testID={
            group.id === 'move'
              ? 'viona-native-travel-utility-group-move'
              : group.id === 'stay'
                ? 'viona-native-travel-utility-group-stay'
                : group.id === 'help'
                  ? 'viona-native-travel-utility-group-help'
                  : `viona-native-travel-utility-group-${group.id}`
          }
          style={styles.group}
        >
          {group.heading ? <Text style={styles.heading}>{group.heading}</Text> : null}
          <View style={styles.row}>
            {group.items.map((item) => (
              <Pressable
                key={item.id}
                testID={`travel-native-utility-${item.id}`}
                onPress={item.onPress}
                accessibilityRole="button"
                accessibilityLabel={item.accessibilityLabel}
                style={({ pressed }) => [
                  styles.tile,
                  tileWidth > 0
                    ? { width: tileWidth, flexGrow: 0, flexShrink: 0 }
                    : columns === 4
                      ? styles.tileFourFallback
                      : columns === 3
                        ? styles.tileThreeFallback
                        : styles.tileTwoFallback,
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
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: tkn.spacing[16],
    width: '100%',
    gap: tkn.spacing[8],
  },
  group: {
    width: '100%',
    gap: tkn.spacing[4],
  },
  heading: {
    fontFamily: FontFamily.semibold,
    color: tkn.accent.travel,
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
    minHeight: tkn.hit.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tkn.spacing[8],
    paddingHorizontal: tkn.spacing[12],
    paddingVertical: tkn.spacing[8],
    backgroundColor: tkn.bg.surface,
    borderRadius: tkn.radius.lg,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
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
