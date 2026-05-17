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
  VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_GOLD,
  VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_MAGENTA,
  VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_VIOLET,
} from './globalLightNetworkTokens';

export type VionaBottomEscapeAccent = 'cyan' | 'magenta' | 'emerald' | 'violet' | 'gold';

export type VionaBottomEscapeBarProps = Readonly<{
  showBack?: boolean;
  showClose?: boolean;
  showHome?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  onHome?: () => void;
  /** Active miniapp / universe shortcut (e.g. Local hub). */
  showCurrent?: boolean;
  currentLabel?: string;
  onPressCurrent?: () => void;
  currentAccentKind?: VionaBottomEscapeAccent;
  currentIcon?: keyof typeof Ionicons.glyphMap;
  /** Extra padding below the bar (e.g. tab bar reserve when not already in scroll padding). */
  bottomInsetExtra?: number;
  align?: 'center' | 'end';
  /** `fixed` pins above the tab bar; `inline` stays in scroll content (default). */
  placement?: 'inline' | 'fixed';
  /** Used when `placement` is `fixed` — distance from screen bottom (above safe area). */
  fixedBottomOffset?: number;
  /** Tighter pills for inline tab-root hubs (avoids heavy double chrome). */
  variant?: 'default' | 'compact';
  /** Lower visual weight when inline above tab bar (tab-root hubs). */
  subdued?: boolean;
}>;

function accentFor(kind: VionaBottomEscapeAccent) {
  if (kind === 'cyan') return VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_CYAN;
  if (kind === 'magenta') return VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_MAGENTA;
  if (kind === 'violet') return VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_VIOLET;
  if (kind === 'gold') return VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_GOLD;
  return VIONA_GLOBAL_LIGHT_NETWORK_ACCENT_EMERALD;
}

function EscapePill({
  icon,
  label,
  a11y,
  accentKind,
  onPress,
  active = false,
  compact = false,
  subdued = false,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  a11y: string;
  accentKind: VionaBottomEscapeAccent;
  onPress: () => void;
  active?: boolean;
  compact?: boolean;
  subdued?: boolean;
}>): ReactElement {
  const [hovered, setHovered] = useState(false);
  const a = accentFor(accentKind);
  const ink = hovered ? a.inkHover : a.ink;
  const stroke = hovered ? a.strokeHover : a.stroke;
  const glow = hovered ? a.glowHover : a.glow;
  const wash = hovered ? a.washHover : a.washDefault;
  const baseShadow = subdued ? 0.12 : 0.22;
  const hoverShadow = subdued ? 0.24 : 0.42;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={({ pressed }) => [
        styles.pill,
        compact && styles.pillCompact,
        subdued && styles.pillSubdued,
        {
          borderColor: active ? stroke : stroke,
          backgroundColor: active ? a.washHover : wash,
          shadowColor: glow,
          shadowOpacity: hovered || active ? hoverShadow : baseShadow,
          shadowRadius: hovered || active ? (subdued ? 8 : 12) : subdued ? 4 : 6,
          shadowOffset: { width: 0, height: 0 },
        },
        active && styles.pillActive,
        Platform.OS === 'web' && hovered && !subdued && styles.pillHoverLift,
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
  showCurrent = false,
  currentLabel = '',
  onPressCurrent,
  currentAccentKind = 'emerald',
  currentIcon = 'ellipse-outline',
  bottomInsetExtra = 0,
  align = 'center',
  placement = 'inline',
  fixedBottomOffset,
  variant = 'default',
  subdued = false,
}: VionaBottomEscapeBarProps): ReactElement | null {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const narrow = width < 420;
  const pillCompact = variant === 'compact' || narrow;

  const labels = useMemo(
    () => ({
      back: t('shell.miniapp.back'),
      close: t('shell.bottomEscape.close'),
      home: t('shell.miniapp.home'),
      backA11y: t('shell.bottomEscape.backA11y'),
      closeA11y: t('shell.bottomEscape.closeA11y'),
      homeA11y: t('shell.bottomEscape.homeA11y'),
    }),
    [t]
  );

  if (!showBack && !showClose && !showHome && !(showCurrent && currentLabel.trim().length > 0 && onPressCurrent)) {
    return null;
  }

  const padBottom = placement === 'fixed' ? 0 : Math.max(insets.bottom, 10) + bottomInsetExtra;
  const fixedBottom =
    fixedBottomOffset ?? Math.max(insets.bottom, 10) + bottomInsetExtra;

  const rail = (
    <View
      style={[
        styles.glassRail,
        pillCompact && styles.glassRailCompact,
        subdued && styles.glassRailSubdued,
      ]}
    >
      {showBack && onBack ? (
        <EscapePill
          icon="arrow-back"
          label={labels.back}
          a11y={labels.backA11y}
          accentKind="cyan"
          onPress={onBack}
          compact={pillCompact}
          subdued={subdued}
        />
      ) : null}
      {showHome && onHome ? (
        <EscapePill
          icon="home-outline"
          label={labels.home}
          a11y={labels.homeA11y}
          accentKind="emerald"
          onPress={onHome}
          compact={pillCompact}
          subdued={subdued}
        />
      ) : null}
      {showCurrent && currentLabel.trim().length > 0 && onPressCurrent ? (
        <EscapePill
          icon={currentIcon}
          label={currentLabel}
          a11y={currentLabel}
          accentKind={currentAccentKind}
          onPress={onPressCurrent}
          active
          compact={pillCompact}
          subdued={subdued}
        />
      ) : null}
      {showClose && onClose ? (
        <EscapePill
          icon="close"
          label={labels.close}
          a11y={labels.closeA11y}
          accentKind="magenta"
          onPress={onClose}
          compact={pillCompact}
          subdued={subdued}
        />
      ) : null}
    </View>
  );

  const toolbar = (
    <View
      style={[
        styles.wrap,
        placement === 'fixed' ? styles.wrapFixed : null,
        { paddingBottom: padBottom },
        align === 'end' ? styles.wrapAlignEnd : styles.wrapAlignCenter,
      ]}
      accessibilityRole="toolbar"
      accessibilityLabel={t('shell.bottomEscape.toolbarA11y')}
    >
      {rail}
    </View>
  );

  if (placement === 'fixed') {
    return (
      <View pointerEvents="box-none" style={[styles.fixedHost, { bottom: fixedBottom }]}>
        {toolbar}
      </View>
    );
  }

  return toolbar;
}

const styles = StyleSheet.create({
  fixedHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 8,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  wrapFixed: {
    marginTop: 0,
  },
  wrap: {
    marginTop: 8,
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
  glassRailSubdued: {
    backgroundColor: 'rgba(7, 12, 26, 0.04)',
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.1)',
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
  pillCompact: {
    minHeight: 44,
    paddingHorizontal: 11,
    paddingVertical: 6,
    gap: 5,
  },
  pillSubdued: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillHoverLift: {
    transform: [{ translateY: -1 }],
  },
  pillActive: {
    borderWidth: 1.5,
  },
  pillLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.2,
    maxWidth: 120,
  },
});
