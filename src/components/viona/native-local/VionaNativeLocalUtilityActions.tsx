import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import { FontFamily } from '../../../theme/typography';

export type NativeLocalUtilityId =
  | 'restaurants'
  | 'transit'
  | 'rentals'
  | 'classifieds'
  | 'nails'
  | 'community'
  | 'aiReceptionist'
  | 'language';

export type NativeLocalUtilityItem = Readonly<{
  id: NativeLocalUtilityId;
  title: string;
  statusLabel: string;
  accessibilityLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}>;

export type VionaNativeLocalUtilityActionsProps = Readonly<{
  kicker: string;
  items: readonly NativeLocalUtilityItem[];
  reduceMotion: boolean;
}>;

/**
 * Native Local utility grid. Presentation only for L05–L12.
 * Does not own Leona, DailyReward, language, or classifieds domain.
 */
export function VionaNativeLocalUtilityActions({
  kicker,
  items,
  reduceMotion,
}: VionaNativeLocalUtilityActionsProps) {
  return (
    <View testID="viona-native-local-utility-actions" style={styles.root}>
      <Text style={styles.kicker}>{kicker}</Text>
      <View style={styles.row}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            testID={`local-native-utility-${item.id}`}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={item.accessibilityLabel}
            style={({ pressed }) => [
              styles.tile,
              pressed && (reduceMotion ? styles.pressedFade : styles.pressedScale),
            ]}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={18} color={tkn.accent.local} />
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
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: tkn.spacing[16],
    width: '100%',
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
    width: '48%',
    flexGrow: 1,
    minWidth: 148,
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
