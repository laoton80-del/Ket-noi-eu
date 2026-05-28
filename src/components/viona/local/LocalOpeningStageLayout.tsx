/**
 * Local opening stage — Home-like vertical rhythm (hero → cards → quick actions).
 */
import { useCallback, useState, type ReactElement } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { vionaTokens } from '../../../design';
import type { LocalHeroVisualKey } from '../../../design/vionaLocalHeroAssets';
import { LocalDynamicHero } from './LocalDynamicHero';
import { LocalHeroCardsRow } from './LocalHeroCardsRow';
import { LocalQuickActionsRow } from './LocalQuickActionsRow';

export type LocalOpeningStageLayoutProps = Readonly<{
  /** @deprecated Ignored — Local opening visuals are theme-invariant premium glass. */
  daylight?: boolean;
  onBrowseServices: () => void;
  onBookingAssist: () => void;
  onMyRequests: () => void;
  onLegalWealth: () => void;
  onRestaurants: () => void;
  onTransit: () => void;
  onRentals: () => void;
  onClassifieds: () => void;
  onNailsSpa: () => void;
  onCommunityEvents: () => void;
  onAiReceptionist: () => void;
  onLanguageAssist: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}>;

export function LocalOpeningStageLayout({
  onBrowseServices,
  onBookingAssist,
  onMyRequests,
  onLegalWealth,
  onRestaurants,
  onTransit,
  onRentals,
  onClassifieds,
  onNailsSpa,
  onCommunityEvents,
  onAiReceptionist,
  onLanguageAssist,
  style,
  testID = 'local-opening-stage',
}: LocalOpeningStageLayoutProps): ReactElement {
  const [activeHeroKey, setActiveHeroKey] = useState<LocalHeroVisualKey>('default');
  const onHeroCardLeave = useCallback(() => setActiveHeroKey('default'), []);

  return (
    <View testID={testID} style={[styles.root, style]}>
      <LocalDynamicHero
        activeHeroKey={activeHeroKey}
        onBrowseServices={onBrowseServices}
        onBookingAssist={onBookingAssist}
      />
      <LocalHeroCardsRow
        hoveredHeroKey={activeHeroKey}
        onMyRequests={onMyRequests}
        onBookingAssist={onBookingAssist}
        onLegalWealth={onLegalWealth}
        onBrowseServices={onBrowseServices}
        onHeroCardHover={setActiveHeroKey}
        onHeroCardLeave={onHeroCardLeave}
      />
      <LocalQuickActionsRow
        onRestaurants={onRestaurants}
        onTransit={onTransit}
        onRentals={onRentals}
        onClassifieds={onClassifieds}
        onNailsSpa={onNailsSpa}
        onCommunityEvents={onCommunityEvents}
        onAiReceptionist={onAiReceptionist}
        onLanguageAssist={onLanguageAssist}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    gap: vionaTokens.spacing[12],
    marginBottom: vionaTokens.spacing[16],
  },
});
