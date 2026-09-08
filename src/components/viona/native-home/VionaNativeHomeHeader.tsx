import { StyleSheet, Text, View } from 'react-native';

import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import { FontFamily } from '../../../theme/typography';

export type VionaNativeHomeHeaderProps = Readonly<{
  brandLabel: string;
  greetingLine1: string;
  greetingWish: string;
  localeCue: string;
}>;

/**
 * Compact native Home identity. No Account, language, SOS, or role picker.
 */
export function VionaNativeHomeHeader({
  brandLabel,
  greetingLine1,
  greetingWish,
  localeCue,
}: VionaNativeHomeHeaderProps) {
  return (
    <View testID="viona-native-home-header" accessibilityRole="header" style={styles.root}>
      <Text style={styles.brand} numberOfLines={1}>
        {brandLabel}
      </Text>
      <Text style={styles.greeting} numberOfLines={2}>
        {greetingLine1}
      </Text>
      <Text style={styles.wish} numberOfLines={2}>
        {greetingWish}
      </Text>
      {localeCue ? (
        <Text style={styles.cue} numberOfLines={1}>
          {localeCue}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: tkn.spacing[8],
  },
  brand: {
    color: tkn.ink.secondary,
    fontFamily: FontFamily.semibold,
    fontSize: tkn.type.brand.fontSize,
    lineHeight: tkn.type.brand.lineHeight,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: tkn.spacing[4],
  },
  greeting: {
    color: tkn.ink.primary,
    fontFamily: FontFamily.semibold,
    fontSize: tkn.type.greeting.fontSize,
    lineHeight: tkn.type.greeting.lineHeight,
  },
  wish: {
    color: tkn.ink.primary,
    fontFamily: FontFamily.regular,
    fontSize: tkn.type.wish.fontSize,
    lineHeight: tkn.type.wish.lineHeight,
    marginTop: tkn.spacing[4],
  },
  cue: {
    color: tkn.ink.secondary,
    fontFamily: FontFamily.regular,
    fontSize: tkn.type.meta.fontSize,
    lineHeight: tkn.type.meta.lineHeight,
    marginTop: tkn.spacing[4],
  },
});
