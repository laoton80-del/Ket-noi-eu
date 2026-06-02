/**
 * Lab-only premium text glow — title + subtitle stack.
 */
import type { ReactElement } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import {
  vionaCrystalLabText,
  vionaCrystalLabTitleGlowStyle,
} from '../../../../design/vionaCrystalLabTokens';
import { FontFamily } from '../../../../theme/typography';

export type VionaTextGlowLabProps = {
  title: string;
  subtitleLines: readonly string[];
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
};

export function VionaTextGlowLab({
  title,
  subtitleLines,
  style,
  titleStyle,
}: VionaTextGlowLabProps): ReactElement {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={[styles.title, vionaCrystalLabTitleGlowStyle(), titleStyle]}>{title}</Text>
      <View style={styles.subBlock}>
        {subtitleLines.map((line) => (
          <Text key={line} style={styles.sub}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 3,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 14.5,
    lineHeight: 17,
    color: vionaCrystalLabText.titleEmerald,
    letterSpacing: -0.12,
  },
  subBlock: {
    gap: 1,
  },
  sub: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    lineHeight: 13,
    color: vionaCrystalLabText.subtitle,
  },
});
