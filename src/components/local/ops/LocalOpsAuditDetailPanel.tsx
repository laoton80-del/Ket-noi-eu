import type { ReactElement } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import type { LocalOpsRequestListItem } from '../../../services/localOpsAuditApi';
import { theme } from '../../../theme/theme';
import { FontFamily } from '../../../theme/typography';
import { useTranslation } from '../../../utils/i18n';

import { LocalOpsAuditSafetyChips } from './LocalOpsAuditSafetyChips';

type Props = Readonly<{
  item: LocalOpsRequestListItem | null;
  loading: boolean;
  error: string | null;
  formatTime: (iso: string | null) => string;
}>;

function FieldRow(props: Readonly<{ label: string; value: string }>): ReactElement {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <Text style={styles.fieldValue}>{props.value}</Text>
    </View>
  );
}

export function LocalOpsAuditDetailPanel({
  item,
  loading,
  error,
  formatTime,
}: Props): ReactElement {
  const { t } = useTranslation();

  if (loading) {
    return (
      <View style={styles.panel}>
        <ActivityIndicator color={theme.colors.primaryBright} />
        <Text style={styles.hint}>{t('local.opsAudit.detail.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.panel}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.panel}>
        <Text style={styles.hint}>{t('local.opsAudit.detail.selectRow')}</Text>
      </View>
    );
  }

  const decisionKey = `local.opsAudit.merchantDecision.${item.merchantDecision}` as const;

  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{t('local.opsAudit.detail.title')}</Text>
      <LocalOpsAuditSafetyChips />
      <FieldRow label={t('local.opsAudit.fields.requestId')} value={item.id} />
      <FieldRow label={t('local.opsAudit.fields.status')} value={item.statusLabel} />
      <FieldRow label={t('local.opsAudit.fields.serviceType')} value={item.serviceType} />
      <FieldRow label={t('local.opsAudit.fields.title')} value={item.title} />
      <FieldRow label={t('local.opsAudit.fields.walletMode')} value={item.walletMode} />
      <FieldRow label={t('local.opsAudit.fields.walletPhase')} value={item.walletPhase} />
      <FieldRow label={t('local.opsAudit.fields.merchantDecision')} value={t(decisionKey)} />
      <FieldRow label={t('local.opsAudit.fields.requestedAt')} value={formatTime(item.requestedAt)} />
      <FieldRow label={t('local.opsAudit.fields.createdAt')} value={formatTime(item.createdAt)} />
      <FieldRow label={t('local.opsAudit.fields.updatedAt')} value={formatTime(item.updatedAt)} />
      {item.confirmedAt ? (
        <FieldRow
          label={t('local.opsAudit.fields.confirmedAt')}
          value={formatTime(item.confirmedAt)}
        />
      ) : null}
      {item.rejectedAt ? (
        <FieldRow
          label={t('local.opsAudit.fields.rejectedAt')}
          value={formatTime(item.rejectedAt)}
        />
      ) : null}
      <Text style={styles.section}>{t('local.opsAudit.fields.requesterSection')}</Text>
      <FieldRow label={t('local.opsAudit.fields.roleLabel')} value={item.requester.roleLabel} />
      <FieldRow label={t('local.opsAudit.fields.userId')} value={item.requester.userId} />
      <Text style={styles.section}>{t('local.opsAudit.fields.businessSection')}</Text>
      <FieldRow label={t('local.opsAudit.fields.businessName')} value={item.business.name} />
      <FieldRow label={t('local.opsAudit.fields.businessId')} value={item.business.id} />
      <FieldRow
        label={t('local.opsAudit.fields.ownerRole')}
        value={item.business.owner.roleLabel}
      />
      <FieldRow label={t('local.opsAudit.fields.ownerUserId')} value={item.business.owner.userId} />
      <Text style={styles.section}>{t('local.opsAudit.fields.tenantSection')}</Text>
      <FieldRow
        label={t('local.opsAudit.fields.requesterUserId')}
        value={item.tenantIsolation.requesterUserId}
      />
      <FieldRow
        label={t('local.opsAudit.fields.businessOwnerUserId')}
        value={item.tenantIsolation.businessOwnerUserId}
      />
      <FieldRow
        label={t('local.opsAudit.fields.requesterIsOwner')}
        value={
          item.tenantIsolation.requesterIsBusinessOwner
            ? t('local.opsAudit.fields.yes')
            : t('local.opsAudit.fields.no')
        }
      />
      <FieldRow
        label={t('local.opsAudit.fields.noPaymentCaptured')}
        value={
          item.display.noPaymentCaptured
            ? t('local.opsAudit.fields.yes')
            : t('local.opsAudit.fields.no')
        }
      />
      <FieldRow
        label={t('local.opsAudit.fields.requestOnlyNoCharge')}
        value={
          item.display.requestOnlyNoCharge
            ? t('local.opsAudit.fields.yes')
            : t('local.opsAudit.fields.no')
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(232, 237, 247, 0.2)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    backgroundColor: theme.colors.surfaceElevated,
    minHeight: 200,
  },
  panelTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  section: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  fieldRow: {
    gap: 2,
  },
  fieldLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  fieldValue: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: theme.colors.text.primary,
  },
  hint: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  error: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: theme.colors.danger,
  },
});
