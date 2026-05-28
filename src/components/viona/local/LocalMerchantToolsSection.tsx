import { Ionicons } from '@expo/vector-icons';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../../../i18n';
import { FontFamily } from '../../../theme/typography';

type MerchantTool = Readonly<{
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  accent: string;
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
  const tools: readonly MerchantTool[] = [
    {
      id: 'merchant-hub',
      icon: 'briefcase-outline',
      title: t('localHub.connectedBusiness'),
      subtitle: t('localHub.reframe.merchantToolsHubSub'),
      onPress: onMerchantHub,
      accent: 'rgba(234, 196, 124, 0.9)',
      testID: 'local-merchant-tool-hub',
    },
    {
      id: 'merchant-booking-assist',
      icon: 'chatbubble-ellipses-outline',
      title: t('localCommerce.cta.requestBooking'),
      subtitle: t('localHub.reframe.merchantToolsBookingSub'),
      onPress: onBookingAssist,
      accent: 'rgba(124, 210, 255, 0.9)',
      testID: 'local-merchant-tool-booking-assist',
    },
    {
      id: 'merchant-ai-receptionist',
      icon: 'headset-outline',
      title: t('localHub.reframe.quickActionAiReceptionist'),
      subtitle: t('localHub.aiPilotCardSub'),
      onPress: onAiReceptionist,
      accent: 'rgba(206, 178, 255, 0.9)',
      testID: 'local-merchant-tool-ai-receptionist',
    },
  ];

  return (
    <View style={styles.wrap} testID={testID}>
      <Text style={styles.kicker}>{t('localHub.reframe.forVietnameseBusinesses')}</Text>
      <View style={styles.row}>
        {tools.map((tool) => (
          <Pressable
            key={tool.id}
            accessibilityRole="button"
            accessibilityLabel={tool.title}
            onPress={tool.onPress}
            style={({ pressed }) => [styles.tool, pressed && styles.toolPressed]}
            testID={tool.testID}
          >
            <Ionicons name={tool.icon} size={14} color={tool.accent} accessibilityIgnoresInvertColors />
            <View style={styles.copy}>
              <Text style={styles.title} numberOfLines={1}>
                {tool.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {tool.subtitle}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 8,
  },
  kicker: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(188, 202, 220, 0.76)',
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tool: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '31%',
    minWidth: 0,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    backgroundColor: 'rgba(8, 14, 24, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    opacity: 0.83,
  },
  toolPressed: {
    opacity: 0.7,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  title: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: FontFamily.semibold,
    color: 'rgba(241, 247, 255, 0.94)',
  },
  subtitle: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: FontFamily.medium,
    color: 'rgba(176, 194, 218, 0.78)',
  },
});
