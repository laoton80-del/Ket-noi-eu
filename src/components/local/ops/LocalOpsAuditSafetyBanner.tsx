import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../../theme/theme';
import { FontFamily } from '../../../theme/typography';
import { useTranslation } from '../../../utils/i18n';

export function LocalOpsAuditSafetyBanner(): ReactElement {
  const { t } = useTranslation();

  return (
    <View style={styles.banner} accessibilityRole="summary">
      <Text style={styles.title}>{t('local.opsAudit.banner.title')}</Text>
      <Text style={styles.line}>{t('local.opsAudit.banner.internalPilot')}</Text>
      <Text style={styles.line}>{t('local.opsAudit.banner.notProduction')}</Text>
      <Text style={styles.line}>{t('local.opsAudit.banner.notPaymentDashboard')}</Text>
      <Text style={styles.line}>{t('local.opsAudit.banner.confirmedNotPaid')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(255, 193, 7, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.45)',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  line: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
});
