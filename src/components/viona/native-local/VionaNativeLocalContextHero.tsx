import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import { FontFamily } from '../../../theme/typography';

export type VionaNativeLocalContextHeroProps = Readonly<{
  kicker: string;
  title: string;
  subtitle: string;
  trustLine: string;
  accessibilityLabel: string;
  image: ImageSourcePropType;
  reduceMotion: boolean;
}>;

/**
 * Native Local context hero. Presentation only.
 * Not a search control. No query field. No fabricated results.
 */
export function VionaNativeLocalContextHero({
  kicker,
  title,
  subtitle,
  trustLine,
  accessibilityLabel,
  image,
  reduceMotion,
}: VionaNativeLocalContextHeroProps) {
  return (
    <View
      testID="viona-native-local-context-hero"
      accessibilityLabel={accessibilityLabel}
      style={styles.root}
    >
      <Image
        source={image}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        style={[styles.image, reduceMotion && styles.imageStill]}
      />
      <View style={styles.copy}>
        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.trust}>{trustLine}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    marginBottom: tkn.spacing[12],
    borderRadius: tkn.radius.xl,
    overflow: 'hidden',
    backgroundColor: tkn.bg.surface,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
  },
  image: {
    width: '100%',
    height: 132,
  },
  imageStill: {
    opacity: 1,
  },
  copy: {
    padding: tkn.spacing[16],
    gap: tkn.spacing[4],
  },
  kicker: {
    fontFamily: FontFamily.semibold,
    color: tkn.accent.local,
    fontSize: tkn.type.chip.fontSize,
    lineHeight: tkn.type.chip.lineHeight,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: FontFamily.bold,
    color: tkn.ink.primary,
    fontSize: tkn.type.greeting.fontSize,
    lineHeight: tkn.type.greeting.lineHeight,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    color: tkn.ink.secondary,
    fontSize: tkn.type.body.fontSize,
    lineHeight: tkn.type.body.lineHeight,
  },
  trust: {
    marginTop: tkn.spacing[4],
    fontFamily: FontFamily.medium,
    color: tkn.ink.secondary,
    fontSize: tkn.type.meta.fontSize,
    lineHeight: tkn.type.meta.lineHeight,
  },
});
