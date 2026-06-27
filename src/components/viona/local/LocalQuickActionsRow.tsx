/**
 * Compact Local quick actions — Travel "Tình huống du lịch" compact tile grammar.
 */
import { useMemo, type ComponentProps, type ReactElement } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { useTranslation } from '../../../i18n';
import {
  resolveVionaCompactSituationGridColumns,
  resolveVionaCompactSituationTileLayout,
} from '../../../design/vionaCompactSituationTileLayout';
import type { VionaUniverseAccent } from '../../../design/premiumTileVisualTokens';
import {
  VionaCompactSituationTile,
  type VionaCompactSituationQuickAccent,
} from '../VionaCompactSituationTile';
import { vionaCompactSituationSectionStyles } from '../vionaCompactSituationSectionStyles';

type LocalQuickAccent = VionaCompactSituationQuickAccent;

function localAccentToUniverse(accent: LocalQuickAccent): VionaUniverseAccent {
  if (accent === 'blue') return 'cyan';
  if (accent === 'sos') return 'magenta';
  return accent;
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
  const { width, height } = useWindowDimensions();
  const columns = resolveVionaCompactSituationGridColumns(width);
  const tileLayout = useMemo(
    () => resolveVionaCompactSituationTileLayout(width, height, false),
    [width, height]
  );
  const cellStyle =
    columns === 2
      ? vionaCompactSituationSectionStyles.cell2
      : columns === 3
        ? vionaCompactSituationSectionStyles.cell3
        : columns === 4
          ? vionaCompactSituationSectionStyles.cell4
          : vionaCompactSituationSectionStyles.cell8;

  const actions: readonly {
    id: string;
    label: string;
    icon: ComponentProps<typeof import('@expo/vector-icons').Ionicons>['name'];
    accent: LocalQuickAccent;
    onPress: () => void;
  }[] = [
    {
      id: 'local-quick-restaurant',
      label: t('localHub.restaurantTitle'),
      icon: 'restaurant-outline',
      accent: 'emerald',
      onPress: onRestaurants,
    },
    {
      id: 'local-quick-transit',
      label: t('localHub.transitTitle'),
      icon: 'car-outline',
      accent: 'cyan',
      onPress: onTransit,
    },
    {
      id: 'local-quick-rentals',
      label: t('localHub.classifiedsHousingTitle'),
      icon: 'home-outline',
      accent: 'cyan',
      onPress: onRentals,
    },
    {
      id: 'local-quick-classifieds',
      label: t('localHub.classifiedsTitle'),
      icon: 'pricetags-outline',
      accent: 'gold',
      onPress: onClassifieds,
    },
    {
      id: 'local-quick-nails-spa',
      label: t('localHub.nailsTitle'),
      icon: 'sparkles-outline',
      accent: 'emerald',
      onPress: onNailsSpa,
    },
    {
      id: 'local-quick-community-events',
      label: t('localHub.eventsTitle'),
      icon: 'ticket-outline',
      accent: 'violet',
      onPress: onCommunityEvents,
    },
    {
      id: 'local-quick-ai-receptionist',
      label: t('localHub.reframe.quickActionAiReceptionist'),
      icon: 'headset-outline',
      accent: 'violet',
      onPress: onAiReceptionist,
    },
    {
      id: 'local-quick-language-assist',
      label: t('localHub.reframe.quickActionLanguageAssist'),
      icon: 'language-outline',
      accent: 'cyan',
      onPress: onLanguageAssist,
    },
  ];

  return (
    <View testID={testID} style={[vionaCompactSituationSectionStyles.panel, vionaCompactSituationSectionStyles.panelWarm]}>
      <Text style={[vionaCompactSituationSectionStyles.kicker, vionaCompactSituationSectionStyles.kickerEmerald]}>
        {t('localHub.reframe.quickAccessTitle')}
      </Text>
      <View style={vionaCompactSituationSectionStyles.grid} testID="local-for-you-grid">
          {actions.map((action) => (
            <View key={action.id} style={[vionaCompactSituationSectionStyles.gridCell, cellStyle]}>
              <VionaCompactSituationTile
                testID={action.id}
                label={action.label}
                icon={action.icon}
                accent={localAccentToUniverse(action.accent)}
                onPress={action.onPress}
                fill
                minHeight={tileLayout.minCardHeight}
                paddingHorizontal={tileLayout.paddingHorizontal}
                capsuleSize={tileLayout.capsuleSize}
                iconSize={tileLayout.iconSize}
                titleLines={tileLayout.titleLines}
              />
            </View>
          ))}
          {actions.length % columns !== 0
            ? Array.from({ length: columns - (actions.length % columns) }).map((_, idx) => (
                <View
                  key={`quick-access-pad-${idx}`}
                  style={[vionaCompactSituationSectionStyles.gridCell, cellStyle, { opacity: 0 }]}
                />
              ))
            : null}
        </View>
    </View>
  );
}
