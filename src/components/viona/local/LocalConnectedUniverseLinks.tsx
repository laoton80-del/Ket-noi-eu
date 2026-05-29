import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../../../i18n';
import { FontFamily } from '../../../theme/typography';

type LinkItem = Readonly<{
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  accent: string;
  testID: string;
}>;

export type LocalConnectedUniverseLinksProps = Readonly<{
  onTravel: () => void;
  onBusiness: () => void;
  onAcademy: () => void;
  travelEnabled?: boolean;
  academyEnabled?: boolean;
  testID?: string;
}>;

export function LocalConnectedUniverseLinks({
  onTravel,
  onBusiness,
  onAcademy,
  travelEnabled = true,
  academyEnabled = true,
  testID = 'local-connected-universe-links',
}: LocalConnectedUniverseLinksProps): ReactElement {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(null);
  const items: LinkItem[] = [
    travelEnabled
      ? {
          id: 'travel',
          icon: 'airplane-outline',
          title: t('localHub.connectedTravel'),
          subtitle: t('localHub.connectedTravelSub'),
          onPress: onTravel,
          accent: 'rgba(110, 208, 255, 0.9)',
          testID: 'local-link-connected-travel',
        }
      : null,
    {
      id: 'business',
      icon: 'briefcase-outline',
      title: t('localHub.connectedBusiness'),
      subtitle: t('localHub.connectedBusinessSub'),
      onPress: onBusiness,
      accent: 'rgba(234, 196, 124, 0.9)',
      testID: 'local-link-connected-business',
    },
    academyEnabled
      ? {
          id: 'academy',
          icon: 'school-outline',
          title: t('localHub.connectedAcademy'),
          subtitle: t('localHub.connectedAcademySub'),
          onPress: onAcademy,
          accent: 'rgba(198, 172, 248, 0.9)',
          testID: 'local-link-connected-academy',
        }
      : null,
  ].filter((item): item is LinkItem => item != null);

  return (
    <View style={styles.wrap} testID={testID}>
      <Text style={styles.kicker}>{t('localHub.connectedUniversesKicker')}</Text>
      <View style={styles.row}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={item.onPress}
            onHoverIn={() => setActiveId(item.id)}
            onHoverOut={() => setActiveId((current) => (current === item.id ? null : current))}
            onFocus={() => setActiveId(item.id)}
            onBlur={() => setActiveId((current) => (current === item.id ? null : current))}
            style={({ pressed }) => [
              styles.link,
              (activeId === item.id || pressed) && styles.linkActive,
            ]}
            testID={item.testID}
          >
            <Ionicons name={item.icon} size={15} color={item.accent} accessibilityIgnoresInvertColors />
            <View style={styles.copy}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {item.subtitle}
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
    color: 'rgba(182, 198, 220, 0.74)',
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  link: {
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
    // visible (but secondary) border + a soft normal-state depth shadow. Stays below primary cards
    // via the small icon, single-line copy, and absence of photo/glass.
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
  linkActive: {
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
