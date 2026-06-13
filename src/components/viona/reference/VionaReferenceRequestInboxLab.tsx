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
  getVionaRequestReadOnlyFixtures,
  vionaRequestStatuses,
} from '../../../domain/requests';
import { FontFamily } from '../../../theme/typography';
import { vionaSpacing } from '../vionaDesignTokens';
import { vionaTrust } from '../vionaTrustTokens';

const PER_LAB_FLAG = 'EXPO_PUBLIC_VIONA_REFERENCE_REQUEST_INBOX_LAB';

const REQUIRED_SAFETY_COPY = [
  'Read-only ReferenceLab preview',
  'No payment captured',
  'Not booking confirmed',
  'No SOS dispatch',
  'Human confirmation required before any future action',
  'Lab route only',
] as const;

export function isVionaReferenceRequestInboxLabRouteEnabled(): boolean {
  const v = process.env.EXPO_PUBLIC_VIONA_REFERENCE_REQUEST_INBOX_LAB;
  return v === '1' || v === 'true';
}

export function VionaReferenceRequestInboxLab(): ReactElement {
  const requests = useMemo(() => getVionaRequestReadOnlyFixtures(), []);
  const counts = useMemo(() => getRequestInboxCounts(requests), [requests]);
  const confirmationRequests = useMemo(
    () => getRequestsRequiringHumanConfirmation(requests),
    [requests]
  );
  const partnerResponses = useMemo(() => getRequestsWithPartnerResponse(requests), [requests]);
  const selectedRequest = confirmationRequests[0] ?? requests[0];
  const selectedSafetyCopy = selectedRequest
    ? getRequestNotProductionCopy(selectedRequest)
    : 'Read-only ReferenceLab preview';

  return (
    <View style={styles.root} testID="viona-reference-request-inbox-lab-root">
      <View style={styles.header}>
        <Text style={styles.kicker}>Request Inbox ReferenceLab</Text>
        <Text style={styles.title}>Read-only request foundation preview</Text>
        <Text style={styles.body}>
          Lab-only rendering of fixtures, status badges, safety copy, inbox rows, and
          detail state. No navigation actions, API calls, DB reads, or live operations.
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
        <SummaryMetric label="fixtures" value={String(counts.total)} />
        <SummaryMetric
          label="human confirm"
          value={String(counts.requiringHumanConfirmation)}
        />
        <SummaryMetric label="partner response" value={String(partnerResponses.length)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status badge sweep</Text>
        <View style={styles.badgeRow}>
          {vionaRequestStatuses.map((status) => (
            <VionaRequestStatusBadge key={status} status={status} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inbox preview</Text>
        <VionaRequestInboxReadOnly requests={requests} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detail preview</Text>
        <Text style={styles.detailSafety}>{selectedSafetyCopy}</Text>
        {selectedRequest ? (
          <View style={styles.detailFrame}>
            <VionaRequestDetailReadOnly request={selectedRequest} />
          </View>
        ) : (
          <Text style={styles.emptyState}>No request fixtures available for detail preview.</Text>
        )}
      </View>
    </View>
  );
}

export function VionaReferenceRequestInboxLabScreen(): ReactElement {
  if (!isVionaReferenceRequestInboxLabRouteEnabled()) {
    return (
      <SafeAreaView style={styles.safe} testID="viona-reference-request-inbox-lab">
        <View style={styles.disabled}>
          <Text style={styles.disabledTitle}>Request inbox lab off</Text>
          <Text style={styles.disabledBody}>Set {PER_LAB_FLAG}=true</Text>
          <Text style={styles.disabledBody}>Read-only ReferenceLab preview remains gated.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']} testID="viona-reference-request-inbox-lab">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <VionaReferenceRequestInboxLab />
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
    minWidth: 150,
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
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: vionaSpacing.sm,
    padding: vionaSpacing.md,
    backgroundColor: vionaTrust.surface,
  },
  detailSafety: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(232, 250, 246, 0.72)',
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
