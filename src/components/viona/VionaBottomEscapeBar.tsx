import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ReactElement } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '../../i18n';
import { FontFamily } from '../../theme/typography';
import {
  VIONA_BOTTOM_ESCAPE_VISUAL,
  VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_CYAN,
  VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_EMERALD,
  VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_MAGENTA,
} from './globalLightNetworkTokens';

export type VionaBottomEscapeBarProps = Readonly<{
  showBack?: boolean;
  showClose?: boolean;
  showHome?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  onHome?: () => void;
  /** Extra padding below the bar (e.g. tab bar reserve when not already in scroll padding). */
  bottomInsetExtra?: number;
  align?: 'center' | 'end';
}>;

type Accent = 'cyan' | 'magenta' | 'emerald';

function accentFor(kind: Accent) {
  if (kind === 'cyan') return VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_CYAN;
  if (kind === 'magenta') return VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_MAGENTA;
  return VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_EMERALD;
}

function EscapePill({
  icon,
  label,
  a11y,
  accentKind,
  onPress,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  a11y: string;
  accentKind: Accent;
  onPress: () => void;
}>): ReactElement {
  const [hovered, setHovered] = useState(false);
  const a = accentFor(accentKind);
  const ink = hovered ? a.inkHover : a.ink;
  const stroke = hovered ? a.strokeHover : a.stroke;
  const glow = hovered ? a.glowHover : a.glow;
  const wash = hovered ? a.washHover : a.washDefault;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={({ pressed }) => [
        styles.pill,
        {
          borderColor: stroke,
          backgroundColor: wash,
          shadowColor: glow,
          shadowOpacity: hovered ? 0.42 : 0.22,
          shadowRadius: hovered ? 12 : 6,
          shadowOffset: { width: 0, height: 0 },
        },
        Platform.OS === 'web' && hovered && styles.pillHoverLift,
        pressed && { transform: [{ scale: 0.985 }] },
      ]}
    >
      <Ionicons name={icon} size={16} color={ink} />
      <Text style={[styles.pillLabel, { color: ink }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function VionaBottomEscapeBar({
  showBack = false,
  showClose = false,
  showHome = false,
  onBack,
  onClose,
  onHome,
  bottomInsetExtra = 0,
  align = 'center',
}: VionaBottomEscapeBarProps): ReactElement | null {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 420;

  const labels = useMemo(
    () => ({
      back: t('shell.bottomEscape.back'),
      close: t('shell.bottomEscape.close'),
      home: t('shell.bottomEscape.home'),
      backA11y: t('shell.bottomEscape.backA11y'),
      closeA11y: t('shell.bottomEscape.closeA11y'),
      homeA11y: t('shell.bottomEscape.homeA11y'),
    }),
    [t]
  );

  if (!showBack && !showClose && !showHome) {
    return null;
  }

  const padBottom = Math.max(insets.bottom, 10) + bottomInsetExtra;

  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: padBottom },
        align === 'end' ? styles.wrapAlignEnd : styles.wrapAlignCenter,
      ]}
      accessibilityRole="toolbar"
      accessibilityLabel={t('shell.bottomEscape.toolbarA11y')}
    >
      <View style={[styles.glassRail, compact && styles.glassRailCompact]}>
        {showBack && onBack ? (
          <EscapePill
            icon="arrow-back"
            label={labels.back}
            a11y={labels.backA11y}
            accentKind="cyan"
            onPress={onBack}
          />
        ) : null}
        {showClose && onClose ? (
          <EscapePill
            icon="close"
            label={labels.close}
            a11y={labels.closeA11y}
            accentKind="magenta"
            onPress={onClose}
          />
        ) : null}
        {showHome && onHome ? (
          <EscapePill
            icon="home-outline"
            label={labels.home}
            a11y={labels.homeA11y}
            accentKind="emerald"
            onPress={onHome}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
    paddingHorizontal: 4,
  },
  wrapAlignCenter: {
    alignItems: 'center',
  },
  wrapAlignEnd: {
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  glassRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    maxWidth: VIONA_BOTTOM_ESCAPE_VISUAL.railMaxWidth,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(7, 12, 26, 0.12)',
    borderWidth: 0,
  },
  glassRailCompact: {
    maxWidth: '100%',
    paddingHorizontal: 8,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillHoverLift: {
    transform: [{ translateY: -1 }],
  },
  pillLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.2,
    maxWidth: 120,
  },
});
