import { type ReactElement, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  VionaRequestDetailReadOnly,
  VionaRequestInboxReadOnly,
  VionaRequestStatusBadge,
} from '../requests';
import {
  getRequestInboxCounts,
  getRequestNotProductionCopy,
  getRequestsRequiringHumanConfirmation,
  getRequestsWithPartnerResponse,
  getRequestStatusSafetyLabel,
  getRequestUniverseSafetyNote,
  getVionaRequestReadOnlyFixtures,
  groupRequestsByStatus,
  vionaRequestStatuses,
} from '../../../domain/requests';
import type { VionaRequestStatus } from '../../../domain/requests';
import { FontFamily } from '../../../theme/typography';
import { vionaSpacing } from '../vionaDesignTokens';
import { vionaTrust } from '../vionaTrustTokens';

const PER_LAB_FLAG = 'EXPO_PUBLIC_VIONA_REFERENCE_REQUEST_OPERATOR_INBOX_LAB';

const REQUIRED_SAFETY_COPY = [
  'Operator ReferenceLab preview',
  'Read-only queue',
  'No payment captured',
  'Not booking confirmed',
  'No SOS dispatch',
  'Human confirmation required before any future action',
  'No live merchant execution',
  'Lab route only',
] as const;

const TERMINAL_STATUSES: readonly VionaRequestStatus[] = ['failed', 'cancelled', 'completed'];

export function isVionaReferenceRequestOperatorInboxLabRouteEnabled(): boolean {
  const v = process.env.EXPO_PUBLIC_VIONA_REFERENCE_REQUEST_OPERATOR_INBOX_LAB;
  return v === '1' || v === 'true';
}

export function VionaReferenceRequestOperatorInboxLab(): ReactElement {
  const requests = useMemo(() => getVionaRequestReadOnlyFixtures(), []);
  const counts = useMemo(() => getRequestInboxCounts(requests), [requests]);
  const groupedByStatus = useMemo(() => groupRequestsByStatus(requests), [requests]);
  const confirmationRequests = useMemo(
    () => getRequestsRequiringHumanConfirmation(requests),
    [requests]
  );
  const triageRequests = useMemo(
    () => groupedByStatus.triage ?? [],
    [groupedByStatus]
  );
  const partnerResponses = useMemo(
    () => getRequestsWithPartnerResponse(requests),
    [requests]
  );
  const terminalRequests = useMemo(
    () =>
      TERMINAL_STATUSES.flatMap((status) => groupedByStatus[status] ?? []),
    [groupedByStatus]
  );
  const detailRequest =
    confirmationRequests[0] ?? partnerResponses[0] ?? triageRequests[0] ?? requests[0];
  const detailSafetyCopy = detailRequest
    ? getRequestNotProductionCopy(detailRequest)
    : 'Operator ReferenceLab preview';

  return (
    <View style={styles.root} testID="viona-reference-request-operator-inbox-lab-root">
      <View style={styles.header}>
        <Text style={styles.kicker}>Operator Request Inbox ReferenceLab</Text>
        <Text style={styles.title}>Admin/operator triage preview</Text>
        <Text style={styles.body}>
          Lab-only operator queue inspection: human confirmation, triage, partner response,
          terminal statuses, and grouped counts. No navigation actions, API calls, DB reads,
          merchant execution, or live admin routes.
        </Text>
      </View>

      <View style={styles.safetyPanel}>
        {REQUIRED_SAFETY_COPY.map((item) => (
          <Text key={item} style={styles.safetyText}>
            {item}
          </Text>
        ))}
      </View>

      <View style={styles.summaryGrid}>
        <SummaryMetric label="queue total" value={String(counts.total)} />
        <SummaryMetric
          label="human confirm"
          value={String(counts.requiringHumanConfirmation)}
        />
        <SummaryMetric label="triage" value={String(triageRequests.length)} />
        <SummaryMetric label="partner response" value={String(partnerResponses.length)} />
        <SummaryMetric
          label="terminal"
          value={String(terminalRequests.length)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Read-only queue summary</Text>
        <Text style={styles.sectionNote}>
          Grouped fixture counts for operator triage review. Display-only — no queue mutation.
        </Text>
        <View style={styles.statusGrid}>
          {vionaRequestStatuses.map((status) => (
            <View key={status} style={styles.statusCell}>
              <Text style={styles.statusCount}>{counts.byStatus[status] ?? 0}</Text>
              <VionaRequestStatusBadge status={status} />
              <Text style={styles.statusLabel}>{getRequestStatusSafetyLabel(status)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Human confirmation queue</Text>
        <Text style={styles.sectionNote}>
          Requests requiring human confirmation before any future action.
        </Text>
        {confirmationRequests.length ? (
          <VionaRequestInboxReadOnly requests={confirmationRequests} />
        ) : (
          <Text style={styles.emptyState}>No human-confirmation fixtures in queue.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Triage queue</Text>
        <Text style={styles.sectionNote}>Operator triage fixtures awaiting review.</Text>
        {triageRequests.length ? (
          <VionaRequestInboxReadOnly requests={triageRequests} />
        ) : (
          <Text style={styles.emptyState}>No triage fixtures in queue.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Partner response queue</Text>
        <Text style={styles.sectionNote}>
          Partner responses are not booking confirmed and do not imply payment captured.
        </Text>
        {partnerResponses.length ? (
          <VionaRequestInboxReadOnly requests={partnerResponses} />
        ) : (
          <Text style={styles.emptyState}>No partner-response fixtures in queue.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Failed / cancelled / completed</Text>
        <Text style={styles.sectionNote}>
          Terminal status fixtures for operator-safe copy review.
        </Text>
        {terminalRequests.length ? (
          <VionaRequestInboxReadOnly requests={terminalRequests} />
        ) : (
          <Text style={styles.emptyState}>No terminal-status fixtures in queue.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Operator detail preview</Text>
        <Text style={styles.detailSafety}>{detailSafetyCopy}</Text>
        {detailRequest ? (
          <>
            <Text style={styles.detailNote}>
              {getRequestUniverseSafetyNote(detailRequest.universe)}
            </Text>
            <View style={styles.detailFrame}>
              <VionaRequestDetailReadOnly request={detailRequest} />
            </View>
          </>
        ) : (
          <Text style={styles.emptyState}>No request fixtures available for detail preview.</Text>
        )}
      </View>
    </View>
  );
}

export function VionaReferenceRequestOperatorInboxLabScreen(): ReactElement {
  if (!isVionaReferenceRequestOperatorInboxLabRouteEnabled()) {
    return (
      <SafeAreaView style={styles.safe} testID="viona-reference-request-operator-inbox-lab">
        <View style={styles.disabled}>
          <Text style={styles.disabledTitle}>Operator inbox lab off</Text>
          <Text style={styles.disabledBody}>Set {PER_LAB_FLAG}=true</Text>
          <Text style={styles.disabledBody}>
            Operator ReferenceLab preview remains gated behind master ReferenceLab gate.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safe}
      edges={['top', 'bottom']}
      testID="viona-reference-request-operator-inbox-lab"
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <VionaReferenceRequestOperatorInboxLab />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#071016',
  },
  scroll: {
    padding: vionaSpacing.md,
    paddingBottom: vionaSpacing.xl,
  },
  root: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
    gap: vionaSpacing.md,
  },
  header: {
    gap: vionaSpacing.xs,
    padding: vionaSpacing.lg,
    backgroundColor: '#0C1820',
    borderColor: 'rgba(154, 214, 205, 0.28)',
    borderWidth: 1,
  },
  kicker: {
    fontFamily: FontFamily.extrabold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#9AD6CD',
  },
  title: {
    fontFamily: FontFamily.extrabold,
    fontSize: 22,
    color: '#F6FFFC',
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(232, 250, 246, 0.76)',
  },
  safetyPanel: {
    gap: vionaSpacing.xs,
    padding: vionaSpacing.md,
    backgroundColor: vionaTrust.surface,
    borderColor: vionaTrust.border,
    borderWidth: 1,
  },
  safetyText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: vionaTrust.ink,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: vionaSpacing.sm,
  },
  metric: {
    minWidth: 130,
    flexGrow: 1,
    padding: vionaSpacing.md,
    backgroundColor: '#0F1F28',
    borderColor: 'rgba(154, 214, 205, 0.2)',
    borderWidth: 1,
  },
  metricValue: {
    fontFamily: FontFamily.extrabold,
    fontSize: 24,
    color: '#F6FFFC',
  },
  metricLabel: {
    marginTop: 2,
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    textTransform: 'uppercase',
    color: 'rgba(232, 250, 246, 0.66)',
  },
  section: {
    gap: vionaSpacing.sm,
  },
  sectionTitle: {
    fontFamily: FontFamily.extrabold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#9AD6CD',
  },
  sectionNote: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(232, 250, 246, 0.72)',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: vionaSpacing.sm,
  },
  statusCell: {
    minWidth: 140,
    flexGrow: 1,
    gap: vionaSpacing.xs,
    padding: vionaSpacing.sm,
    backgroundColor: '#0F1F28',
    borderColor: 'rgba(154, 214, 205, 0.2)',
    borderWidth: 1,
  },
  statusCount: {
    fontFamily: FontFamily.extrabold,
    fontSize: 20,
    color: '#F6FFFC',
  },
  statusLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(232, 250, 246, 0.66)',
  },
  detailSafety: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(232, 250, 246, 0.72)',
  },
  detailNote: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(232, 250, 246, 0.66)',
  },
  detailFrame: {
    minHeight: 360,
    overflow: 'hidden',
    borderColor: vionaTrust.border,
    borderWidth: 1,
    backgroundColor: vionaTrust.surface,
  },
  emptyState: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: 'rgba(232, 250, 246, 0.72)',
  },
  disabled: {
    flex: 1,
    justifyContent: 'center',
    padding: vionaSpacing.lg,
    backgroundColor: '#071016',
  },
  disabledTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    color: '#F6FFFC',
  },
  disabledBody: {
    marginTop: vionaSpacing.xs,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: 'rgba(232, 250, 246, 0.76)',
  },
});
