import { type ComponentProps, type ReactElement } from 'react';
import { useWindowDimensions } from 'react-native';

import { resolveVionaCompactSituationTileLayout } from '../../design/vionaCompactSituationTileLayout';
import {
  VionaCompactSituationTile,
  vionaCompactSituationQuickAccentToUniverse,
  type VionaCompactSituationQuickAccent,
} from './VionaCompactSituationTile';

export type QuickAccent = VionaCompactSituationQuickAccent;

export type VionaQuickActionPillProps = Readonly<{
  label: string;
  icon: ComponentProps<typeof import('@expo/vector-icons').Ionicons>['name'];
  onPress: () => void;
  accent?: QuickAccent;
  /** Stretch to fill a grid cell on wide desktop rows. */
  fill?: boolean;
}>;

export function VionaQuickActionPill({
  label,
  icon,
  onPress,
  accent = 'gold',
  fill = false,
}: VionaQuickActionPillProps): ReactElement {
  const { width, height } = useWindowDimensions();
  const layout = resolveVionaCompactSituationTileLayout(width, height, false);

  return (
    <VionaCompactSituationTile
      label={label}
      icon={icon}
      accent={vionaCompactSituationQuickAccentToUniverse(accent)}
      onPress={onPress}
      fill={fill}
      minHeight={layout.minCardHeight}
      paddingHorizontal={layout.paddingHorizontal}
      capsuleSize={layout.capsuleSize}
      iconSize={layout.iconSize}
      titleLines={layout.titleLines}
    />
  );
}
