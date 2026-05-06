import { useMemo, type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getAiCostGuard } from '../../core/aiCost';
import {
  DEFAULT_AI_AUTO_PAUSE_POLICY,
  evaluateAiAutoPauseDecision,
  type AiAutoPauseAction,
} from '../../core/aiEnforcement';
import { AI_USAGE_AUDIT_FIXTURES, evaluateAiUsageFixtureForAudit } from '../../core/aiUsage';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

const PANEL_BG = 'rgba(15, 28, 52, 0.96)';
const BORDER = 'rgba(34, 211, 238, 0.35)';
const MISMATCH = '#fbbf24';

type FixtureRow = Readonly<{
  fixtureId: string;
  featureLabel: string;
  guardStatus: string;
  productionReady: boolean;
  unit: string;
  hardCap: number;
  used: number;
  remaining: number;
  providerMinor: number;
  billedMinor: number;
  marginMinor: number;
  expectedVerdict: string;
  actualVerdict: string;
  autoPauseRecommended: boolean;
  mismatch: boolean;
  note: string;
  enforcementAction: AiAutoPauseAction;
  enforcementProductionEnforced: boolean;
}>;

export function AiUsageMeteringPreview(): ReactElement {
  const { t } = useTranslation();

  const rows = useMemo((): readonly FixtureRow[] => {
    return AI_USAGE_AUDIT_FIXTURES.map((fixture) => {
      const guard = getAiCostGuard(fixture.featureId);
      const result = evaluateAiUsageFixtureForAudit(fixture);
      const pauseDecision = evaluateAiAutoPauseDecision(result, DEFAULT_AI_AUTO_PAUSE_POLICY);
      const mismatch = result.verdict !== fixture.expectedVerdict;
      return {
        fixtureId: fixture.id,
        featureLabel: t(guard.labelKey, { defaultValue: fixture.featureId }),
        guardStatus: guard.status,
        productionReady: guard.productionReady,
        unit: fixture.snapshot.unit,
        hardCap: fixture.snapshot.hardCap,
        used: fixture.snapshot.used,
        remaining: result.remaining,
        providerMinor: fixture.eventInput.estimatedProviderCostMinor,
        billedMinor: fixture.eventInput.estimatedBilledAmountMinor,
        marginMinor: result.estimatedMarginMinor,
        expectedVerdict: fixture.expectedVerdict,
        actualVerdict: result.verdict,
        autoPauseRecommended: result.autoPauseRecommended,
        mismatch,
        note: fixture.note,
        enforcementAction: pauseDecision.action,
        enforcementProductionEnforced: pauseDecision.productionEnforced,
      };
    });
  }, [t]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('aiUsage.preview.title')}</Text>
      <Text style={styles.subtitle}>{t('aiUsage.preview.subtitle')}</Text>
      <Text style={styles.disclaimer}>{t('aiUsage.preview.evidenceOnly')}</Text>
      <Text style={styles.disclaimer}>{t('aiUsage.preview.noProviderCalls')}</Text>
      <Text style={styles.enforcementHeader}>{t('aiEnforcement.preview.title')}</Text>
      <Text style={styles.disclaimer}>{t('aiEnforcement.preview.dryRun')}</Text>

      {rows.map((row) => (
        <View key={row.fixtureId} style={styles.fixtureBlock}>
          <Text style={styles.fixtureTitle}>
            {t('aiUsage.preview.fixture')}: {row.fixtureId}
          </Text>
          <Text style={styles.lineMuted}>{row.featureLabel}</Text>
          <Text style={styles.line}>
            guard: {row.guardStatus} · unit: {row.unit} · cap: {String(row.hardCap)} · used: {String(row.used)} ·{' '}
            {t('aiUsage.preview.remaining')}: {String(row.remaining)}
          </Text>
          <Text style={styles.line}>
            provider (event est. minor): {String(row.providerMinor)} · billed (event est. minor): {String(row.billedMinor)}
          </Text>
          <Text style={styles.line}>
            {t('aiUsage.preview.margin')}: {String(row.marginMinor)} · {t('aiUsage.preview.autoPause')}:{' '}
            {row.autoPauseRecommended ? 'yes' : 'no'} · {t('aiUsage.preview.productionReady')}:{' '}
            {row.productionReady ? 'yes' : 'no'}
          </Text>
          <Text style={styles.line}>
            {t('aiUsage.preview.expected')}: {row.expectedVerdict} · {t('aiUsage.preview.actual')}: {row.actualVerdict}
          </Text>
          {row.mismatch ? (
            <Text style={styles.mismatch}>{t('aiUsage.preview.mismatch')}</Text>
          ) : (
            <Text style={styles.pass}>{t('aiUsage.preview.pass')}</Text>
          )}
          <Text style={styles.note}>{row.note}</Text>
          <Text style={styles.enforcementLine}>
            {t(`aiEnforcement.action.${row.enforcementAction}`)} · {t('aiEnforcement.preview.productionEnforced')}:{' '}
            {row.enforcementProductionEnforced ? 'true' : 'false'}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: PANEL_BG,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  title: {
    fontFamily: FontFamily.extrabold,
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  disclaimer: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: 'rgba(148, 163, 184, 0.95)',
  },
  enforcementHeader: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: '#e879f9',
    marginTop: theme.spacing.xs,
  },
  enforcementLine: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: 'rgba(226, 232, 240, 0.88)',
    marginTop: 4,
  },
  fixtureBlock: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.35)',
    gap: 4,
  },
  fixtureTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: '#22d3ee',
  },
  line: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: theme.colors.text.primary,
    lineHeight: 18,
  },
  lineMuted: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  mismatch: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: MISMATCH,
  },
  pass: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: '#4ade80',
  },
  note: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: 'rgba(226, 232, 240, 0.72)',
    fontStyle: 'italic',
  },
});
