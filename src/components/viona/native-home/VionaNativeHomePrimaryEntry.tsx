import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import { FontFamily } from '../../../theme/typography';

export type VionaNativeHomePrimaryEntryProps = Readonly<{
  findLabel: string;
  findA11yLabel: string;
  onFind: () => void;
  askVisible: boolean;
  askLabel?: string;
  onAsk?: () => void;
}>;

/**
 * Honest Find / Ask slot. No query state, no results API, no travel flight-search route.
 * Find is a Local entry action, not a fake global search field.
 */
export function VionaNativeHomePrimaryEntry({
  findLabel,
  findA11yLabel,
  onFind,
  askVisible,
  askLabel,
  onAsk,
}: VionaNativeHomePrimaryEntryProps) {
  return (
    <View testID="viona-native-home-primary-entry" style={styles.root}>
      <Pressable
        onPress={onFind}
        accessibilityRole="button"
        accessibilityLabel={findA11yLabel}
        style={({ pressed }) => [styles.find, pressed && styles.pressed]}
      >
        <Text style={styles.findLabel} numberOfLines={1}>
          {findLabel}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={tkn.ink.secondary} />
      </Pressable>
      {askVisible && askLabel && onAsk ? (
        <Pressable
          onPress={onAsk}
          accessibilityRole="button"
          accessibilityLabel={askLabel}
          style={({ pressed }) => [styles.ask, pressed && styles.pressed]}
        >
          <Text style={styles.askLabel} numberOfLines={2}>
            {askLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tkn.spacing[8],
    marginBottom: tkn.spacing[12],
  },
  find: {
    flex: 1,
    minHeight: tkn.hit.min,
    borderRadius: tkn.radius.md,
    backgroundColor: tkn.bg.muted,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tkn.spacing[12],
    gap: tkn.spacing[8],
  },
  findLabel: {
    flex: 1,
    color: tkn.ink.primary,
    fontFamily: FontFamily.semibold,
    fontSize: tkn.type.body.fontSize,
    lineHeight: tkn.type.body.lineHeight,
  },
  ask: {
    maxWidth: '34%',
    minHeight: tkn.hit.min,
    minWidth: tkn.hit.min,
    borderRadius: tkn.radius.pill,
    backgroundColor: tkn.bg.surface,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    paddingHorizontal: tkn.spacing[8],
    paddingVertical: tkn.spacing[4],
    justifyContent: 'center',
    alignItems: 'center',
  },
  askLabel: {
    color: tkn.ink.secondary,
    fontFamily: FontFamily.medium,
    fontSize: tkn.type.ask.fontSize,
    lineHeight: tkn.type.ask.lineHeight,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.86,
  },
});
