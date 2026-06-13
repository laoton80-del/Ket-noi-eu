import { type ReactElement } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { VionaRequestRecord } from '../../../domain/requests/vionaRequestTypes';
import {
  getRequestHumanConfirmationNote,
  getRequestNotProductionCopy,
  getRequestUniverseSafetyNote,
} from '../../../domain/requests/vionaRequestSafetyCopy';
import { FontFamily } from '../../../theme/typography';
import { vionaSpacing } from '../vionaDesignTokens';
import { vionaTrust } from '../vionaTrustTokens';
import { VionaRequestStatusBadge } from './VionaRequestStatusBadge';

export type VionaRequestDetailReadOnlyProps = Readonly<{
  request: VionaRequestRecord;
}>;

export function VionaRequestDetailReadOnly({
  request,
}: VionaRequestDetailReadOnlyProps): ReactElement {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.previewBanner}>Read-only preview</Text>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{request.id}</Text>
        <VionaRequestStatusBadge status={request.status} />
      </View>
      <Text style={styles.meta}>
        {request.universe} · {request.intent} · risk {request.riskLevel}
      </Text>
      <Text style={styles.sectionLabel}>Audit reason</Text>
      <Text style={styles.body}>{request.auditReason}</Text>
      <Text style={styles.sectionLabel}>Universe safety</Text>
      <Text style={styles.note}>{getRequestUniverseSafetyNote(request.universe)}</Text>
      <Text style={styles.sectionLabel}>Human confirmation</Text>
      <Text style={styles.note}>{getRequestHumanConfirmationNote(request)}</Text>
      <Text style={styles.sectionLabel}>Not production</Text>
      <Text style={styles.note}>{getRequestNotProductionCopy(request)}</Text>
      <Text style={styles.footer}>
        No payment captured · Not booking confirmed · Ops readiness required for live actions
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: vionaTrust.surface,
  },
  content: {
    padding: vionaSpacing.md,
    gap: vionaSpacing.sm,
  },
  previewBanner: {
    fontFamily: FontFamily.extrabold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: vionaTrust.inkMuted,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: vionaSpacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: vionaTrust.ink,
  },
  meta: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: vionaTrust.inkMuted,
  },
  sectionLabel: {
    marginTop: vionaSpacing.xs,
    fontFamily: FontFamily.extrabold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: vionaTrust.inkMuted,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: vionaTrust.ink,
  },
  note: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: vionaTrust.ink,
  },
  footer: {
    marginTop: vionaSpacing.md,
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: vionaTrust.inkMuted,
  },
});
