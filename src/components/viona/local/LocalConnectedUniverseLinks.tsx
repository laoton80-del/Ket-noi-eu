import { Ionicons } from '@expo/vector-icons';
import type { ReactElement } from 'react';
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
            style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
            testID={item.testID}
          >
            <Ionicons name={item.icon} size={14} color={item.accent} accessibilityIgnoresInvertColors />
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
    borderColor: 'rgba(148, 163, 184, 0.22)',
    backgroundColor: 'rgba(8, 14, 24, 0.44)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    opacity: 0.85,
  },
  linkPressed: {
    opacity: 0.72,
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
