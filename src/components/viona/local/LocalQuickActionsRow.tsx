/**
 * Compact Local quick actions — lighter than flagship cards (Home quick-action grammar).
 * Uses a Local-scoped pill so the row can run a slightly taller, more tappable target
 * without altering the shared Home `VionaQuickActionPill`.
 */
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

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

type LocalQuickActionPillProps = Readonly<{
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  accent: LocalQuickAccent;
  minHeight: number;
  onPress: () => void;
}>;

function LocalQuickActionPill({
  label,
  icon,
  accent,
  minHeight,
  onPress,
}: LocalQuickActionPillProps): ReactElement {
  const tone = ACCENT_COLOR[accent];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        {
          minHeight,
          borderColor: `${tone}ea`,
          shadowColor: ACCENT_GLOW[accent],
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 3,
        },
        pressed && styles.pillPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${tone}22`, borderColor: `${tone}3a` }]}>
        <Ionicons name={icon} size={17} color={tone} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
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
    minWidth: 0,
    flexGrow: 0,
    flexShrink: 0,
  },
  cell2: { width: '48.6%' },
  cell3: { width: '31.2%' },
  cell4: { width: '23.2%' },
  cell8: { width: '10.7%' },
  gridCellGhost: {
    opacity: 0,
  },
  pill: {
    width: '100%',
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: vionaTokens.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: 'rgba(8, 12, 20, 0.72)',
    elevation: 1,
  },
  pillPressed: {
    opacity: 0.88,
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
    fontSize: 13,
    lineHeight: 16,
    color: vionaTokens.fashionTech.textPrimary,
    fontFamily: FontFamily.semibold,
  },
});
