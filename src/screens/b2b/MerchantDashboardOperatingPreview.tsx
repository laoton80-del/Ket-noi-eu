import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../../navigation/routes';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { useTranslation } from '../../utils/i18n';
import { MerchantDashboardScreen } from './MerchantDashboardScreen';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Pilot/preview shell: shows the merchant operating dashboard layout without implying paid workspace access.
 * Upgrade path remains {@link B2BPaywallScreen} (pricing only).
 */
export function MerchantDashboardOperatingPreview(): ReactElement {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.root}>
      <View style={styles.banner} accessibilityRole="summary">
        <Text style={styles.bannerTitle}>{t('b2b.operatingPreview.title')}</Text>
        <Text style={styles.bannerBody}>{t('b2b.operatingPreview.body')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('b2b.operatingPreview.upgradeA11y')}
          onPress={() => navigation.navigate('B2BPaywall')}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88 }]}
        >
          <Text style={styles.ctaText}>{t('b2b.operatingPreview.upgradeCta')}</Text>
        </Pressable>
      </View>
      <View style={styles.dashboard}>
        <MerchantDashboardScreen />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  banner: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(244, 214, 144, 0.35)',
    backgroundColor: 'rgba(8, 12, 22, 0.92)',
  },
  bannerTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(248, 232, 196, 0.96)',
    marginBottom: 4,
  },
  bannerBody: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(226, 232, 240, 0.82)',
    marginBottom: theme.spacing.sm,
  },
  cta: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(244, 214, 144, 0.45)',
    backgroundColor: 'rgba(244, 214, 144, 0.12)',
  },
  ctaText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: 'rgba(252, 244, 220, 0.98)',
  },
  dashboard: {
    flex: 1,
    minHeight: 0,
  },
});
