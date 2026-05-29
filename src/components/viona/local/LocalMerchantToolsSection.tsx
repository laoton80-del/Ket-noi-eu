import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactElement } from 'react';
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
  const [activeId, setActiveId] = useState<string | null>(null);
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
            onHoverIn={() => setActiveId(tool.id)}
            onHoverOut={() => setActiveId((current) => (current === tool.id ? null : current))}
            onFocus={() => setActiveId(tool.id)}
            onBlur={() => setActiveId((current) => (current === tool.id ? null : current))}
            style={({ pressed }) => [
              styles.tool,
              (activeId === tool.id || pressed) && styles.toolActive,
            ]}
            testID={tool.testID}
          >
            <Ionicons name={tool.icon} size={15} color={tool.accent} accessibilityIgnoresInvertColors />
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
    // Secondary, but clearly clickable in the NORMAL state (no hover needed). ROOT-CAUSE FIX:
    // previous passes only raised the ALPHA of a near-black fill (rgba(10,16,28,…)) sitting on a
    // near-black page canvas, which produced ~no visible contrast. The fill now uses a clearly
    // LIGHTER elevated slate (raised luminance) so the card body separates from the canvas, plus a
    // visible (but secondary) border + a soft normal-state depth shadow. Hierarchy below primary
    // cards is kept via the small icon, single-line copy, and absence of photo/edge-lit glass.
    borderColor: 'rgba(178, 196, 222, 0.6)',
    backgroundColor: 'rgba(30, 43, 64, 0.78)',
    shadowColor: 'rgba(0, 0, 0, 0.45)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolActive: {
    // Hover / focus / press: brighten the fill + sharpen the border with a soft (non-neon) glow.
    borderColor: 'rgba(212, 226, 246, 0.82)',
    backgroundColor: 'rgba(42, 58, 84, 0.86)',
    shadowColor: 'rgba(150, 180, 220, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
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
    color: 'rgba(247, 251, 255, 0.98)',
  },
  subtitle: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: FontFamily.medium,
    color: 'rgba(196, 212, 232, 0.82)',
  },
});
