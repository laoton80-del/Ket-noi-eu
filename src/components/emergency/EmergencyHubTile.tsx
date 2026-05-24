import { Ionicons } from '@expo/vector-icons';
import type { ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { VionaUniverseAccent } from '../../design/premiumTileVisualTokens';
import { PremiumAppTile } from '../viona/PremiumAppTile';
import type { EmergencyHubAccent } from './emergencyUiTokens';

export type EmergencyHubTileProps = Readonly<{
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: EmergencyHubAccent;
  onPress: () => void;
  accessibilityLabel: string;
  statusLabel?: string;
  /** Half-width hub cell (default) or full-width guidance row. */
  layout?: 'grid' | 'full';
  testID?: string;
}>;

/** SOS hub accent → Wave 3B semantic universe (magenta-led; consular/pilot use secondary accents). */
const HUB_ACCENT_MAP: Readonly<Record<EmergencyHubAccent, VionaUniverseAccent>> = {
  emergency: 'magenta',
  consular: 'cyan',
  pilot: 'assistant',
  family: 'magenta',
};

/**
 * Emergency hub tile — Wave 3B `PremiumAppTile` wrapper (guidance-only; no dispatch semantics).
 */
export function EmergencyHubTile({
  title,
  subtitle,
  icon,
  accent,
  onPress,
  accessibilityLabel,
  statusLabel,
  layout = 'grid',
  testID,
}: EmergencyHubTileProps): ReactElement {
  const tileStyle: StyleProp<ViewStyle> = layout === 'full' ? { width: '100%' } : undefined;

  return (
    <PremiumAppTile
      variant="sos"
      accent={HUB_ACCENT_MAP[accent]}
      width="100%"
      icon={icon}
      title={title}
      subtitle={subtitle}
      statusLabel={statusLabel}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={tileStyle}
    />
  );
}
