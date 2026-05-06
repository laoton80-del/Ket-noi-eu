import { type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { INCIDENT_DRY_RUN_PREVIEW_FIXTURES } from '../../core/incidents';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

export function AiIncidentDryRunPreviewPanel(): ReactElement {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('incidents.preview.title')}</Text>
      <Text style={styles.subtitle}>{t('incidents.preview.subtitle')}</Text>
      <Text style={styles.banner}>{t('incidents.preview.previewOnly')}</Text>

      {INCIDENT_DRY_RUN_PREVIEW_FIXTURES.map((row) => {
        const ack = row.preview;
        const { incident } = ack;
        const backupLabel =
          incident.backupOwnerRole === 'none' ? '—' : t(`incidents.ownerRole.${incident.backupOwnerRole}`);

        return (
          <View key={row.fixtureId} style={styles.card}>
            <Text style={styles.fixtureId}>{row.fixtureId}</Text>
            <Text style={styles.line}>
              {t('incidents.preview.feature')}: {row.featureId} · {t('incidents.source.' + incident.source)}
            </Text>
            <Text style={styles.line}>
              {t('incidents.preview.severity')}: {t(`incidents.severity.${incident.severity}`)} ·{' '}
              {t('incidents.status.' + incident.status)}
            </Text>
            <Text style={styles.line}>
              {t('incidents.preview.ownerRole')}: {t(`incidents.ownerRole.${incident.ownerRole}`)}
            </Text>
            <Text style={styles.line}>
              {t('incidents.preview.backupOwnerRole')}: {backupLabel}
            </Text>
            <Text style={styles.line}>
              {t('incidents.preview.acknowledgementMode')}: {t(`incidents.acknowledgementMode.${incident.acknowledgementMode}`)}
            </Text>
            <Text style={styles.line}>
              {t('incidents.preview.nextStatus')}: {t(`incidents.status.${ack.nextStatus}`)} ({t('incidents.preview.nextStatusHint')})
            </Text>
            <Text style={styles.line}>
              {t('incidents.preview.productionPersisted')}: {incident.productionPersisted ? t('incidents.preview.flagYes') : t('incidents.preview.flagNo')}
            </Text>
            <Text style={styles.line}>
              {t('incidents.preview.humanReview')}: {incident.requiresHumanReview ? t('incidents.preview.flagYes') : t('incidents.preview.flagNo')}
            </Text>
            <Text style={styles.line}>
              {t('incidents.preview.incidentLog')}: {incident.requiresIncidentLog ? t('incidents.preview.flagYes') : t('incidents.preview.flagNo')}
            </Text>
            <Text style={styles.note}>{t(ack.notesKey)}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              disabled
              style={({ pressed }) => [styles.ackBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.ackBtnText}>{t(ack.acknowledgementLabelKey)}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.35)',
    gap: theme.spacing.sm,
  },
  title: {
    fontFamily: FontFamily.extrabold,
    fontSize: 14,
    color: '#f472b6',
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: 'rgba(226, 232, 240, 0.85)',
  },
  banner: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: '#fbbf24',
  },
  card: {
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(5, 11, 20, 0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244, 114, 182, 0.35)',
    gap: 4,
    marginTop: theme.spacing.xs,
  },
  fixtureId: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: '#22d3ee',
  },
  line: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: theme.colors.text.primary,
    lineHeight: 16,
  },
  note: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: 'rgba(148, 163, 184, 0.95)',
    marginTop: 2,
  },
  ackBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(71, 85, 105, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.45)',
  },
  ackBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: 'rgba(226, 232, 240, 0.65)',
  },
});
