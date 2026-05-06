import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AiAdminAlertPreview } from '../../core/aiAlerts';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type Props = Readonly<{
  preview: AiAdminAlertPreview;
}>;

export function AiAdminAlertPreviewPanel({ preview }: Props): ReactElement {
  const { t } = useTranslation();
  const { alert } = preview;
  const channelLabels = alert.channels.map((ch) => t(`aiAlerts.channel.${ch}`)).join(' · ');

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>{t('aiAlerts.preview.title')}</Text>
      <Text style={styles.line}>
        {t('aiAlerts.severity.' + alert.severity)} · {t(alert.recommendedActionKey)}
      </Text>
      <Text style={styles.lineMuted}>{t(alert.titleKey)}</Text>
      <Text style={styles.lineMuted}>{t(alert.bodyKey)}</Text>
      <Text style={styles.line}>
        {t('aiAlerts.preview.channels')}: {channelLabels}
      </Text>
      <Text style={styles.line}>
        {t('aiAlerts.preview.ownerReview')}: {alert.requiresOwnerReview ? t('aiAlerts.preview.flagYes') : t('aiAlerts.preview.flagNo')}
      </Text>
      <Text style={styles.line}>
        {t('aiAlerts.preview.incidentLog')}: {alert.requiresIncidentLog ? t('aiAlerts.preview.flagYes') : t('aiAlerts.preview.flagNo')}
      </Text>
      <Text style={styles.line}>{t('aiAlerts.preview.productionSendDisabled')}</Text>
      <Text style={styles.highlight}>{t('aiAlerts.preview.previewOnly')}</Text>
      <Text style={styles.subtitle}>{t('aiAlerts.preview.subtitle')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(5, 11, 20, 0.65)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 121, 249, 0.35)',
    gap: 4,
  },
  sectionLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: '#e879f9',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  line: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: theme.colors.text.primary,
    lineHeight: 16,
  },
  lineMuted: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: 'rgba(226, 232, 240, 0.75)',
    lineHeight: 14,
  },
  highlight: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: '#fbbf24',
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: 'rgba(148, 163, 184, 0.95)',
  },
});
