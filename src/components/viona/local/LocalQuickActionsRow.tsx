/**
 * Compact Local quick actions — lighter than flagship cards (Home quick-action grammar).
 * Uses a Local-scoped pill so the row can run a slightly taller, more tappable target
 * without altering the shared Home `VionaQuickActionPill`.
 */
import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentProps, type ReactElement } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';

import { VionaGlassPanel } from '..';
import { vionaTokens } from '../../../design';
import {
  FASHION_HOME_GLOW_CYAN,
  FASHION_HOME_GLOW_GOLD,
} from '../fashionHomeDesktopShell';
import { FontFamily } from '../../../theme/typography';
import { useTranslation } from '../../../i18n';

type LocalQuickAccent = 'gold' | 'cyan' | 'emerald' | 'violet';

const ACCENT_COLOR: Record<LocalQuickAccent, string> = {
  gold: vionaTokens.fashionTech.accentGold,
  cyan: vionaTokens.fashionTech.accentCyan,
  emerald: vionaTokens.fashionTech.accentEmerald,
  violet: vionaTokens.fashionTech.accentViolet,
};

const ACCENT_GLOW: Record<LocalQuickAccent, string> = {
  gold: FASHION_HOME_GLOW_GOLD,
  cyan: FASHION_HOME_GLOW_CYAN,
  emerald: 'rgba(88, 214, 168, 0.12)',
  violet: 'rgba(176, 140, 255, 0.12)',
};

/**
 * Utility pills stay clean: only a smooth web transition so the hover/focus rim + icon glow ease in
 * instead of snapping. No network lines, no traveling pulse (Local For You is a utility row).
 */
const PILL_WEB_TRANSITION: ViewStyle =
  Platform.OS === 'web'
    ? ({
        transitionProperty: 'border-color, box-shadow',
        transitionDuration: '160ms',
        transitionTimingFunction: 'ease-out',
      } as unknown as ViewStyle)
    : {};

// Fixed icon-zone width (matches the icon capsule). On wide pills the row is split into three
// deterministic zones — [icon zone][label zone][spacer zone] — with the spacer equal to the icon
// zone, so the label zone is mathematically centered in the pill regardless of label length and the
// label text is centered inside it. This decouples the dense leading icon from label position, so it
// can no longer drag the readable content left.
const ICON_ZONE = 29;

type LocalQuickActionPillProps = Readonly<{
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  accent: LocalQuickAccent;
  minHeight: number;
  /**
   * `true` on wide pills (roomy desktop columns): use the deterministic three-zone grid.
   * `false` on narrow columns (tablet-portrait/mobile): fall back to the snug centered icon+label
   * group, which already fills those pills and avoids breaking long single-word labels.
   */
  balanced: boolean;
  onPress: () => void;
}>;

function LocalQuickActionPill({
  label,
  icon,
  accent,
  minHeight,
  balanced,
  onPress,
}: LocalQuickActionPillProps): ReactElement {
  const tone = ACCENT_COLOR[accent];
  const [active, setActive] = useState(false);

  const iconNode = (
    <View
      style={[
        styles.iconWrap,
        { backgroundColor: `${tone}${active ? '30' : '22'}`, borderColor: `${tone}${active ? '5a' : '3a'}` },
        active && {
          shadowColor: tone,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 6,
        },
      ]}
    >
      <Ionicons name={icon} size={17} color={tone} />
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setActive(true)}
      onHoverOut={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      style={({ pressed }) => [
        styles.pill,
        PILL_WEB_TRANSITION,
        {
          minHeight,
          // Resting = clean utility rim. Hover/focus = slightly sharper rim + a touch more semantic
          // glow (no network lines, no pulse — pills stay utility-tier).
          borderColor: active ? `${tone}ff` : `${tone}ea`,
          shadowColor: active ? `${tone}55` : ACCENT_GLOW[accent],
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: active ? 6 : 3,
        },
        pressed && styles.pillPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {balanced ? (
        // Deterministic three-zone grid: icon zone (left) + centered label zone + equal spacer zone
        // (right). Equal side zones keep the label zone centered in the pill; the label fills it and
        // centers its text, so the right side no longer reads as empty and the icon stays a left
        // accent instead of an anchor that pulls everything left.
        <View style={styles.balancedRow}>
          <View style={styles.iconZone}>{iconNode}</View>
          <Text style={styles.labelBalanced} numberOfLines={2}>
            {label}
          </Text>
          <View style={styles.spacerZone} />
        </View>
      ) : (
        // Narrow-column fallback: snug centered icon+label lockup (already fills these small pills).
        <View style={styles.content}>
          {iconNode}
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export type LocalQuickActionsRowProps = Readonly<{
  onRestaurants: () => void;
  onTransit: () => void;
  onRentals: () => void;
  onClassifieds: () => void;
  onNailsSpa: () => void;
  onCommunityEvents: () => void;
  onAiReceptionist: () => void;
  onLanguageAssist: () => void;
  testID?: string;
}>;

export function LocalQuickActionsRow({
  onRestaurants,
  onTransit,
  onRentals,
  onClassifieds,
  onNailsSpa,
  onCommunityEvents,
  onAiReceptionist,
  onLanguageAssist,
  testID = 'local-quick-actions-row',
}: LocalQuickActionsRowProps): ReactElement {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const columns = width >= 1480 ? 8 : width >= 1080 ? 4 : width >= 768 ? 4 : width >= 520 ? 3 : 2;
  const cellStyle =
    columns === 2
        ? styles.cell2
        : columns === 3
          ? styles.cell3
          : columns === 4
            ? styles.cell4
          : styles.cell8;

  const pillMinHeight = width >= 1080 ? 50 : 46;
  // Use the deterministic three-zone grid only where pills are genuinely wide (roomy 4-column
  // desktop range). Below 1024 the 4-column pills are too narrow for fixed side zones (long
  // single-word labels like "Receptionist" would clip), and at ≥1480 the 8-column pills are narrow
  // again — both fall back to the snug centered group, which fills them without overflow.
  const balancedPills = width >= 1024 && width < 1480;

  const actions = [
    {
      id: 'local-quick-restaurant',
      label: t('localHub.restaurantTitle'),
      icon: 'restaurant-outline' as const,
      accent: 'emerald' as const,
      onPress: onRestaurants,
    },
    {
      id: 'local-quick-transit',
      label: t('localHub.transitTitle'),
      icon: 'car-outline' as const,
      accent: 'cyan' as const,
      onPress: onTransit,
    },
    {
      id: 'local-quick-rentals',
      label: t('localHub.classifiedsHousingTitle'),
      icon: 'home-outline' as const,
      accent: 'cyan' as const,
      onPress: onRentals,
    },
    {
      id: 'local-quick-classifieds',
      label: t('localHub.classifiedsTitle'),
      icon: 'pricetags-outline' as const,
      accent: 'gold' as const,
      onPress: onClassifieds,
    },
    {
      id: 'local-quick-nails-spa',
      label: t('localHub.nailsTitle'),
      icon: 'sparkles-outline' as const,
      accent: 'emerald' as const,
      onPress: onNailsSpa,
    },
    {
      id: 'local-quick-community-events',
      label: t('localHub.eventsTitle'),
      icon: 'ticket-outline' as const,
      accent: 'violet' as const,
      onPress: onCommunityEvents,
    },
    {
      id: 'local-quick-ai-receptionist',
      label: t('localHub.reframe.quickActionAiReceptionist'),
      icon: 'headset-outline' as const,
      accent: 'violet' as const,
      onPress: onAiReceptionist,
    },
    {
      id: 'local-quick-language-assist',
      label: t('localHub.reframe.quickActionLanguageAssist'),
      icon: 'language-outline' as const,
      accent: 'cyan' as const,
      onPress: onLanguageAssist,
    },
  ];

  return (
    <View testID={testID} style={styles.wrap}>
      <VionaGlassPanel style={styles.panel} tone="warm">
        <Text style={styles.prompt}>{t('localHub.reframe.quickAccessTitle')}</Text>
        <View style={styles.grid} testID="local-for-you-grid">
          {actions.map((action) => (
            <View key={action.id} style={[styles.gridCell, cellStyle]}>
              <LocalQuickActionPill
                label={action.label}
                icon={action.icon}
                accent={action.accent}
                minHeight={pillMinHeight}
                balanced={balancedPills}
                onPress={action.onPress}
              />
            </View>
          ))}
          {actions.length % columns !== 0
            ? Array.from({ length: columns - (actions.length % columns) }).map((_, idx) => (
                <View key={`quick-access-pad-${idx}`} style={[styles.gridCell, cellStyle, styles.gridCellGhost]} />
              ))
            : null}
        </View>
      </VionaGlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  panel: {
    paddingVertical: vionaTokens.spacing[8],
    paddingHorizontal: vionaTokens.spacing[12],
    gap: vionaTokens.spacing[8],
    borderWidth: 1,
    borderColor: 'rgba(242, 212, 136, 0.24)',
    backgroundColor: 'rgba(8, 12, 20, 0.28)',
    shadowColor: 'rgba(236, 205, 128, 0.1)',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 3,
    elevation: 1,
  },
  prompt: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(255, 232, 188, 0.9)',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: vionaTokens.spacing[8],
  },
  gridCell: {
    // Columns grow to fill the panel: a flexBasis under (100/columns)% guarantees exactly `columns`
    // items per row (the next one wraps), and flexGrow then expands them to absorb the leftover space
    // + gaps so the row spans the full panel width with no dead space on the right.
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  cell2: { flexBasis: '46%' },
  cell3: { flexBasis: '30%' },
  cell4: { flexBasis: '22%' },
  cell8: { flexBasis: '11%' },
  gridCellGhost: {
    opacity: 0,
  },
  pill: {
    width: '100%',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    // The pill centers its single content lockup; the lockup itself owns icon↔label spacing.
    justifyContent: 'center',
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(8, 12, 20, 0.72)',
    elevation: 1,
  },
  pillPressed: {
    opacity: 0.88,
  },
  content: {
    // Self-sizing, centered icon+label lockup: no flexGrow so it shrinks to its content and is
    // centered by the pill; minWidth 0 + maxWidth 100% let the label wrap (max 2 lines) inside it.
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    minWidth: 0,
    maxWidth: '100%',
    gap: 10,
  },
  balancedRow: {
    // Deterministic three-zone grid. Equal iconZone + spacerZone widths centre the label zone in the
    // pill; symmetric gaps keep that true. The label fills the middle zone and centres its own text.
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconZone: {
    width: ICON_ZONE,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  spacerZone: {
    width: ICON_ZONE,
  },
  labelBalanced: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 16,
    color: vionaTokens.fashionTech.textPrimary,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
  },
  iconWrap: {
    width: 29,
    height: 29,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 16,
    color: vionaTokens.fashionTech.textPrimary,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
  },
});
