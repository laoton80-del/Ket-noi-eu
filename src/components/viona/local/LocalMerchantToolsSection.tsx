import { useMemo, type ReactElement } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { useTranslation } from '../../../i18n';
import type { VionaUniverseAccent } from '../../../design/premiumTileVisualTokens';
import {
  resolveVionaCompactSituationGridColumns,
  resolveVionaCompactSituationTileLayout,
} from '../../../design/vionaCompactSituationTileLayout';
import { VionaCompactSituationTile } from '../VionaCompactSituationTile';
import { vionaCompactSituationSectionStyles } from '../vionaCompactSituationSectionStyles';

type MerchantTool = Readonly<{
  id: string;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  accent: VionaUniverseAccent;
  testID: string;
}>;

export type LocalMerchantToolsSectionProps = Readonly<{
  onMerchantHub: () => void;
  onBookingAssist: () => void;
  onAiReceptionist: () => void;
  testID?: string;
}>;

export function LocalMerchantToolsSection({
  onMerchantHub,
  onBookingAssist,
  onAiReceptionist,
  testID = 'local-merchant-tools-section',
}: LocalMerchantToolsSectionProps): ReactElement {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const columns = Math.min(resolveVionaCompactSituationGridColumns(width), 3);
  const tileLayout = useMemo(
    () => resolveVionaCompactSituationTileLayout(width, height, false),
    [width, height]
  );
  const cellStyle =
    columns === 1
      ? vionaCompactSituationSectionStyles.cell2
      : columns === 2
        ? vionaCompactSituationSectionStyles.cell2
        : vionaCompactSituationSectionStyles.cell3;

  const tools: readonly MerchantTool[] = [
    {
      id: 'merchant-hub',
      icon: 'briefcase-outline',
      title: t('localHub.connectedBusiness'),
      subtitle: t('localHub.reframe.merchantToolsHubSub'),
      onPress: onMerchantHub,
      accent: 'gold',
      testID: 'local-merchant-tool-hub',
    },
    {
      id: 'merchant-booking-assist',
      icon: 'chatbubble-ellipses-outline',
      title: t('localCommerce.cta.requestBooking'),
      subtitle: t('localHub.reframe.merchantToolsBookingSub'),
      onPress: onBookingAssist,
      accent: 'cyan',
      testID: 'local-merchant-tool-booking-assist',
    },
    {
      id: 'merchant-ai-receptionist',
      icon: 'headset-outline',
      title: t('localHub.reframe.quickActionAiReceptionist'),
      subtitle: t('localHub.aiPilotCardSub'),
      onPress: onAiReceptionist,
      accent: 'violet',
      testID: 'local-merchant-tool-ai-receptionist',
    },
  ];

  return (
    <View style={vionaCompactSituationSectionStyles.panel} testID={testID}>
      <Text style={[vionaCompactSituationSectionStyles.kicker, vionaCompactSituationSectionStyles.kickerGold]}>
        {t('localHub.reframe.forVietnameseBusinesses')}
      </Text>
      <View style={vionaCompactSituationSectionStyles.grid}>
        {tools.map((tool) => (
          <View key={tool.id} style={[vionaCompactSituationSectionStyles.gridCell, cellStyle]}>
            <VionaCompactSituationTile
              testID={tool.testID}
              label={tool.title}
              icon={tool.icon}
              accent={tool.accent}
              onPress={tool.onPress}
              fill
              minHeight={tileLayout.minCardHeight}
              paddingHorizontal={tileLayout.paddingHorizontal}
              capsuleSize={tileLayout.capsuleSize}
              iconSize={tileLayout.iconSize}
              titleLines={tileLayout.titleLines}
              accessibilityLabel={`${tool.title}. ${tool.subtitle}`}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
