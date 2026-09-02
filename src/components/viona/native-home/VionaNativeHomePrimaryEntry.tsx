import { Pressable, StyleSheet, Text, View } from 'react-native';

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
      </Pressable>
      {askVisible && askLabel && onAsk ? (
        <Pressable
          onPress={onAsk}
          accessibilityRole="button"
          accessibilityLabel={askLabel}
          style={({ pressed }) => [styles.ask, pressed && styles.pressed]}
        >
          <Text style={styles.askLabel} numberOfLines={1}>
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
    marginBottom: tkn.spacing[16],
  },
  find: {
    flex: 1,
    minHeight: tkn.hit.min,
    borderRadius: tkn.radius.lg,
    backgroundColor: tkn.bg.surface,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
    justifyContent: 'center',
    paddingHorizontal: tkn.spacing[16],
  },
  findLabel: {
    color: tkn.ink.secondary,
    fontFamily: FontFamily.regular,
    fontSize: tkn.type.body.fontSize,
    lineHeight: tkn.type.body.lineHeight,
  },
  ask: {
    minHeight: tkn.hit.min,
    minWidth: tkn.hit.min,
    borderRadius: tkn.radius.pill,
    backgroundColor: tkn.bg.muted,
    paddingHorizontal: tkn.spacing[16],
    justifyContent: 'center',
    alignItems: 'center',
  },
  askLabel: {
    color: tkn.accent.academy,
    fontFamily: FontFamily.semibold,
    fontSize: tkn.type.body.fontSize,
    lineHeight: tkn.type.body.lineHeight,
  },
  pressed: {
    opacity: 0.86,
  },
});
