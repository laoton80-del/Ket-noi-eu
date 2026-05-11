import { Ionicons } from '@expo/vector-icons';
import { useContext, useState, type ReactElement } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { vionaTokens } from '../../design';
import { FontFamily } from '../../theme/typography';
import { VionaActionGridContext } from './VionaActionGrid';
import { VionaStatusPill, type VionaStatusPillProps } from './VionaStatusPill';

export type VionaActionAccent = Readonly<{
  icon: string;
  border: string;
  borderStrong: string;
  shadow: string;
  fillHover: string;
  fillPressed: string;
}>;

function vionaActionAccentFromHexCore(hex: string): VionaActionAccent {
  const raw = hex.trim().replace(/^#/, '');
  const expanded =
    raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw.length === 6 ? raw : '70c8ff';
  const n = Number.parseInt(expanded, 16);
  if (!Number.isFinite(n) || expanded.length !== 6) {
    return {
      icon: '#70c8ff',
      border: 'rgba(112, 200, 255, 0.38)',
      borderStrong: 'rgba(112, 200, 255, 0.56)',
      shadow: 'rgba(112, 200, 255, 0.42)',
      fillHover: 'rgba(112, 200, 255, 0.07)',
      fillPressed: 'rgba(112, 200, 255, 0.11)',
    };
  }
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const rgb = `${r}, ${g}, ${b}`;
  const icon = hex.trim().startsWith('#') ? hex.trim() : `#${expanded}`;
  return {
    icon,
    border: `rgba(${rgb}, 0.38)`,
    borderStrong: `rgba(${rgb}, 0.56)`,
    shadow: `rgba(${rgb}, 0.42)`,
    fillHover: `rgba(${rgb}, 0.07)`,
    fillPressed: `rgba(${rgb}, 0.11)`,
  };
}

const CYAN_FALLBACK: VionaActionAccent = {
  icon: '#70c8ff',
  border: 'rgba(112, 200, 255, 0.38)',
  borderStrong: 'rgba(112, 200, 255, 0.56)',
  shadow: 'rgba(112, 200, 255, 0.42)',
  fillHover: 'rgba(112, 200, 255, 0.07)',
  fillPressed: 'rgba(112, 200, 255, 0.11)',
};

/** Build SOS-style accent fills from a `#rrggbb` icon color. */
export function vionaActionAccentFromHex(hex: string): VionaActionAccent {
  try {
    return vionaActionAccentFromHexCore(hex);
  } catch {
    return CYAN_FALLBACK;
  }
}

export type VionaActionCardProps = Readonly<{
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  kicker?: string;
  accent: VionaActionAccent;
  onPress?: () => void;
  disabled?: boolean;
  badge?: Readonly<{ label: string; tone: VionaStatusPillProps['tone'] }>;
  tags?: readonly string[];
  testID?: string;
  accessibilityHint?: string;
}>;

export function VionaActionCard({
  iconName,
  title,
  subtitle,
  kicker,
  accent,
  onPress,
  disabled = false,
  badge,
  tags,
  testID,
  accessibilityHint,
}: VionaActionCardProps): ReactElement {
  const grid = useContext(VionaActionGridContext);
  const cols = grid?.cols ?? 1;
  const gap = grid?.gap ?? 16;
  const gridLayout = cols >= 2;
  const webPointer: ViewStyle | null =
    Platform.OS === 'web' && !disabled ? ({ cursor: 'pointer' } as ViewStyle) : null;

  const [focused, setFocused] = useState(false);

  const shellStyle: ViewStyle[] = [
    gridLayout ? styles.shellGrid : styles.shellList,
    gridLayout ? grid?.webCellStyle : null,
    gridLayout && Platform.OS !== 'web' && grid?.nativeCardWidth != null
      ? { width: grid.nativeCardWidth }
      : null,
    !gridLayout ? { width: '100%' as const } : null,
  ].filter(Boolean) as ViewStyle[];

  const a11yLabel = `${title}. ${subtitle}`;

  return (
    <View style={shellStyle}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityLabel={a11yLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
        onFocus={Platform.OS === 'web' ? () => setFocused(true) : undefined}
        onBlur={Platform.OS === 'web' ? () => setFocused(false) : undefined}
        style={(state) => {
          const pressed = state.pressed;
          const hovered =
            Platform.OS === 'web' &&
            'hovered' in state &&
            Boolean((state as Readonly<{ hovered?: boolean }>).hovered);
          const baseCard = gridLayout ? styles.cardGrid : styles.cardList;
          return [
            baseCard,
            { borderColor: accent.border },
            webPointer,
            pressed &&
              !disabled && {
                backgroundColor: accent.fillPressed,
                borderColor: accent.borderStrong,
              },
            !disabled &&
              hovered &&
              Platform.OS === 'web' && {
                backgroundColor: accent.fillHover,
                borderColor: accent.borderStrong,
                shadowColor: accent.shadow,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.22,
                shadowRadius: 10,
                elevation: 3,
              },
            !disabled &&
              focused &&
              Platform.OS === 'web' && {
                borderColor: accent.borderStrong,
                shadowColor: accent.shadow,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.18,
                shadowRadius: 8,
              },
            disabled && styles.cardDisabled,
          ];
        }}
      >
        {gridLayout ? (
          <>
            {kicker ? (
              <Text style={styles.kickerGrid} numberOfLines={1}>
                {kicker}
              </Text>
            ) : null}
            {badge ? (
              <View style={styles.badgeRow}>
                <VionaStatusPill label={badge.label} tone={badge.tone} size="sm" />
              </View>
            ) : null}
            <View style={[styles.iconWrapGrid, { borderColor: accent.icon }]}>
              <Ionicons name={iconName} size={26} color={accent.icon} accessibilityIgnoresInvertColors />
            </View>
            <View style={styles.copyGrid}>
              <Text style={styles.titleGrid} numberOfLines={2}>
                {title}
              </Text>
              <Text style={styles.subGrid} numberOfLines={3}>
                {subtitle}
              </Text>
            </View>
            {tags && tags.length > 0 ? (
              <View style={styles.tagRowGrid}>
                {tags.map((tag) => (
                  <View key={tag} style={[styles.tag, { borderColor: accent.border }]}>
                    <Text style={styles.tagText} numberOfLines={1}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.chevronGrid} accessibilityElementsHidden pointerEvents="none">
              <Ionicons name="chevron-forward" size={18} color={vionaTokens.fashionTech.mutedOnDark} />
            </View>
          </>
        ) : (
          <View style={styles.rowList}>
            <View style={[styles.iconWrapList, { borderColor: accent.icon }]}>
              <Ionicons name={iconName} size={26} color={accent.icon} accessibilityIgnoresInvertColors />
            </View>
            <View style={styles.copyList}>
              <View style={styles.metaRowList}>
                {kicker ? (
                  <Text style={styles.kickerList} numberOfLines={1}>
                    {kicker}
                  </Text>
                ) : (
                  <View style={styles.kickerFlex} />
                )}
                {badge ? <VionaStatusPill label={badge.label} tone={badge.tone} size="sm" /> : null}
              </View>
              <Text style={styles.titleList} numberOfLines={2}>
                {title}
              </Text>
              <Text style={styles.subList} numberOfLines={3}>
                {subtitle}
              </Text>
              {tags && tags.length > 0 ? (
                <View style={[styles.tagRowList, { marginTop: gap > 12 ? 10 : 8 }]}>
                  {tags.map((tag) => (
                    <View key={tag} style={[styles.tag, { borderColor: accent.border }]}>
                      <Text style={styles.tagText} numberOfLines={1}>
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
            <Ionicons
              name="chevron-forward"
              size={22}
              color={vionaTokens.fashionTech.mutedOnDark}
              style={styles.chevronList}
              accessibilityElementsHidden
            />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const ft = vionaTokens.fashionTech;

const styles = StyleSheet.create({
  shellGrid: {
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
  },
  shellList: {
    width: '100%',
    maxWidth: '100%',
  },
  cardGrid: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 8,
    paddingBottom: 16,
    borderRadius: 14,
    backgroundColor: ft.surfaceElevated,
    borderWidth: 1,
    minHeight: 112,
  },
  cardList: {
    flexDirection: 'column',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: ft.surfaceElevated,
    borderWidth: 1,
    minHeight: 96,
    width: '100%',
  },
  cardDisabled: { opacity: 0.42 },
  kickerGrid: {
    alignSelf: 'stretch',
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: ft.champagneMuted,
    marginBottom: 6,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  badgeRow: {
    marginBottom: 8,
  },
  iconWrapGrid: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    marginBottom: 8,
  },
  copyGrid: {
    alignItems: 'center',
    gap: 4,
    width: '100%',
    paddingHorizontal: 2,
  },
  titleGrid: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    fontWeight: '800',
    color: ft.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: '100%',
  },
  subGrid: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    fontWeight: '600',
    color: ft.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
    maxWidth: '100%',
  },
  tagRowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  chevronGrid: {
    position: 'absolute',
    right: 6,
    bottom: 8,
  },
  rowList: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    width: '100%',
  },
  iconWrapList: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
  },
  copyList: {
    flex: 1,
    minWidth: 0,
  },
  metaRowList: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  kickerFlex: { flex: 1, minWidth: 0 },
  kickerList: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: ft.champagneMuted,
  },
  titleList: {
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.2,
    color: ft.textPrimary,
    marginBottom: 6,
  },
  subList: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    lineHeight: 19,
    color: ft.textSecondary,
  },
  tagRowList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: vionaTokens.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: ft.mutedOnDark,
  },
  chevronList: {
    alignSelf: 'center',
    marginTop: 8,
  },
});
