import { Ionicons } from '@expo/vector-icons';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { FontFamily } from '../../theme/typography';
import { LocalConstellationFrame } from './LocalConstellationFrame';
import {
  localAccentIconChipFill,
  localAccentInk,
  localAccentInkHover,
  localAccentStatusFill,
  localAccentStroke,
  localAccentStrokeHover,
  localConstellation,
  localWebCompactGlassChipStyle,
  type LocalConstellationAccent,
} from './localConstellationTokens';

const INK_STRONG = localConstellation.inkStrong;
const INK_SUB = localConstellation.inkCardSub;

export type LocalAppTileProps = Readonly<{
  cardWidth: number;
  accent: LocalConstellationAccent;
  icon: keyof typeof Ionicons.glyphMap;
  statusLabel: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  testID?: string;
}>;

export function LocalAppTile({
  cardWidth,
  accent,
  icon,
  statusLabel,
  title,
  subtitle,
  onPress,
  accessibilityLabel,
  disabled = false,
  testID,
}: LocalAppTileProps): ReactElement {
  const [hovered, setHovered] = useState(false);
  const ink = hovered ? localAccentInkHover(accent) : localAccentInk(accent);

  return (
    <View style={{ width: cardWidth, opacity: disabled ? 0.72 : 1 }}>
      <Pressable
        testID={testID}
        onPress={onPress}
        disabled={disabled}
        onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
        onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
        style={({ pressed }) => [
          styles.pressable,
          Platform.OS === 'web' && styles.pressableInteractive,
          Platform.OS === 'web' && hovered && styles.pressableHovered,
          pressed && styles.pressablePressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <LocalConstellationFrame
          accent={accent}
          radius={16}
          hovered={hovered}
          contentStyle={styles.tileInner}
        >
          <View style={styles.stack}>
            <View style={styles.iconRow}>
              <View
                style={[
                  styles.iconChip,
                  {
                    borderColor: hovered ? localAccentStrokeHover(accent) : localAccentStroke(accent),
                    borderWidth: localConstellation.cardEdgeWidth,
                    backgroundColor: localAccentIconChipFill(accent, hovered),
                    shadowColor: ink,
                    shadowOpacity: hovered ? 0.28 : 0.12,
                    shadowRadius: hovered ? 8 : 4,
                    shadowOffset: { width: 0, height: 0 },
                  },
                  Platform.OS === 'web' ? localWebCompactGlassChipStyle(accent, hovered) : null,
                ]}
              >
                <Ionicons name={icon} size={24} color={ink} />
              </View>
              <View
                style={[
                  styles.statusPill,
                  {
                    borderColor: hovered ? localAccentStrokeHover(accent) : localAccentStroke(accent),
                    borderWidth: localConstellation.cardEdgeWidth,
                    backgroundColor: localAccentStatusFill(accent, hovered),
                  },
                  Platform.OS === 'web' ? localWebCompactGlassChipStyle(accent, hovered) : null,
                ]}
              >
                <Text style={[styles.statusText, { color: ink }]} numberOfLines={1}>
                  {statusLabel}
                </Text>
              </View>
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.title, hovered && { color: ink }]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            </View>
          </View>
        </LocalConstellationFrame>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: { width: '100%', minHeight: 44 },
  pressableInteractive:
    Platform.OS === 'web'
      ? ({
          transitionProperty: 'transform, opacity',
          transitionDuration: `${localConstellation.cardHoverTransitionMs}ms`,
          transitionTimingFunction: 'ease-out',
        } as ViewStyle)
      : {},
  pressableHovered:
    Platform.OS === 'web'
      ? ({
          transform: [
            { translateY: -localConstellation.cardHoverLiftPx },
            { scale: localConstellation.cardHoverScale },
          ],
        } as ViewStyle)
      : {},
  pressablePressed: { opacity: 0.9 },
  tileInner: {
    minHeight: 120,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  stack: {
    gap: 10,
    alignItems: 'flex-start',
    width: '100%',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexShrink: 1,
    maxWidth: '58%',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 8,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  textBlock: {
    width: '100%',
    gap: 4,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    color: INK_STRONG,
    letterSpacing: -0.16,
    lineHeight: 17,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: INK_SUB,
    lineHeight: 14,
    opacity: 0.94,
  },
});
