import { Ionicons } from '@expo/vector-icons';
import { type ReactElement, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  canPerformVionaRequestStatusAction,
  canSubmitVionaRequestNote,
  pack18ControlledWriteBlockedReason,
} from '../../../lib/viona/requests/vionaRequestControlledWritePolicy';
import type { VionaRequestDetail } from '../../../services/vionaRequestReadOnlyApi';
import { FontFamily } from '../../../theme/typography';
import { vionaSpacing } from '../vionaDesignTokens';
import { vionaTrust } from '../vionaTrustTokens';
import {
  buildReadOnlyTimelineItems,
  formatVionaRequestUpdatedLabel,
  isKnownVionaRequestStatus,
  normalizeStatusLabel,
} from './vionaRequestActivityTimelineDisplay';
import { VionaRequestActivityTimelineReadOnly } from './VionaRequestActivityTimelineReadOnly';
import { mapVionaRequestNoteAuditTimelineItems } from './vionaRequestNoteAuditDisplay';
import { VionaRequestNoteAuditTimelineReadOnly } from './VionaRequestNoteAuditTimelineReadOnly';
import { VionaRequestNoteInputWrite } from './VionaRequestNoteInputWrite';
import { VionaRequestStatusActionWrite } from './VionaRequestStatusActionWrite';
import { VionaRequestStatusBadge } from './VionaRequestStatusBadge';

export type VionaRequestLiveDetailControlledWriteProps = Readonly<{
  detail: VionaRequestDetail | null;
  loading: boolean;
  unauthorized?: boolean;
  error: string | null;
  onNoteSubmitted: () => Promise<boolean>;
  onStatusActionCompleted: () => Promise<boolean>;
}>;

function Section({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>): ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {children}
    </View>
  );
}

function EmptySectionText({ text }: Readonly<{ text: string }>): ReactElement {
  return <Text style={styles.emptySection}>{text}</Text>;
}

function BlockedWriteHint({ message }: Readonly<{ message: string }>): ReactElement {
  return (
    <View style={styles.blockedBox}>
      <Ionicons name="lock-closed-outline" size={14} color={vionaTrust.inkMuted} />
      <Text style={styles.blockedText}>{message}</Text>
    </View>
  );
}

export function VionaRequestLiveDetailControlledWrite({
  detail,
  loading,
  unauthorized = false,
  error,
  onNoteSubmitted,
  onStatusActionCompleted,
}: VionaRequestLiveDetailControlledWriteProps): ReactElement {
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={vionaTrust.inkMuted} />
        <Text style={styles.hint}>Loading controlled write detail…</Text>
      </View>
    );
  }

  if (unauthorized) {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed-outline" size={20} color={vionaTrust.inkMuted} />
        <Text style={styles.unauthorizedTitle}>Sign in required</Text>
        <Text style={styles.hint}>
          {error ?? 'Sign in required to view this request.'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (detail == null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.hint}>Select a request to view controlled write detail.</Text>
      </View>
    );
  }

  const { request } = detail;
  const writePolicyContext = {
    unauthorized,
    requestStatus: request.status,
  };
  const noteAllowed = canSubmitVionaRequestNote(writePolicyContext);
  const statusAllowed = canPerformVionaRequestStatusAction(writePolicyContext);
  const noteBlockedReason = noteAllowed
    ? null
    : pack18ControlledWriteBlockedReason('note', writePolicyContext);
  const statusBlockedReason = statusAllowed
    ? null
    : pack18ControlledWriteBlockedReason('status', writePolicyContext);

  const noteTimelineItems = mapVionaRequestNoteAuditTimelineItems(detail.auditEvents);
  const activityTimelineItems = buildReadOnlyTimelineItems(
    detail.statusEvents ?? [],
    detail.auditEvents ?? []
  );
  const statusKnown = isKnownVionaRequestStatus(request.status);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.banner}>Controlled write · Pack18 local · not production automation</Text>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{request.title}</Text>
        {statusKnown ? (
          <VionaRequestStatusBadge
            status={request.status}
            displayLabel={normalizeStatusLabel(request.status)}
          />
        ) : (
          <Text style={styles.statusFallback}>{normalizeStatusLabel(request.status)}</Text>
        )}
      </View>
      <Text style={styles.statusLabel}>{request.display.statusLabel}</Text>
      <Text style={styles.meta}>
        {request.sourceUniverse} · {request.requestType}
      </Text>
      <Text style={styles.updated}>
        Updated · {formatVionaRequestUpdatedLabel(request.updatedAt)}
      </Text>
      <Text style={styles.note}>{request.display.notProductionCopy}</Text>
      <Text style={styles.body}>{request.summary}</Text>

      <Section title="Timeline">
        <VionaRequestActivityTimelineReadOnly items={activityTimelineItems} />
      </Section>

      <Section title="Participants">
        {detail.participants.length === 0 ? (
          <EmptySectionText text="No participants returned." />
        ) : (
          detail.participants.map((p) => (
            <Text key={p.id} style={styles.itemLine}>
              {p.displayName ?? p.participantRoleLabel ?? 'Participant'}
              {p.participantRoleLabel ? ` · ${p.participantRoleLabel}` : ''}
            </Text>
          ))
        )}
      </Section>

      <Section title="Source links">
        {detail.sourceLinks.length === 0 ? (
          <EmptySectionText text="No source links returned." />
        ) : (
          detail.sourceLinks.map((link) => (
            <Text key={link.id} style={styles.itemLine}>
              {link.sourceSystem}/{link.sourceEntityType} · {link.linkStatus}
            </Text>
          ))
        )}
      </Section>

      <Section title="Notes">
        <Text style={styles.readOnlyHint}>Note history (read) · controlled submit below</Text>
        <VionaRequestNoteAuditTimelineReadOnly items={noteTimelineItems} />
        {noteAllowed ? (
          <VionaRequestNoteInputWrite
            requestId={request.id}
            writePolicyContext={writePolicyContext}
            onNoteSubmitted={onNoteSubmitted}
          />
        ) : noteBlockedReason != null ? (
          <BlockedWriteHint message={noteBlockedReason} />
        ) : null}
      </Section>

      <Section title="Status action">
        {statusAllowed ? (
          <VionaRequestStatusActionWrite
            requestId={request.id}
            writePolicyContext={writePolicyContext}
            onStatusActionCompleted={onStatusActionCompleted}
          />
        ) : statusBlockedReason != null ? (
          <BlockedWriteHint message={statusBlockedReason} />
        ) : (
          <EmptySectionText text="No status action available for this request state." />
        )}
      </Section>

      <Section title="Attachment references">
        {detail.attachmentReferences.length === 0 ? (
          <EmptySectionText text="No attachment references returned." />
        ) : (
          detail.attachmentReferences.map((ref) => (
            <Text key={ref.id} style={styles.itemLine}>
              {ref.filename ?? ref.externalRef ?? 'Attachment'}
              {ref.mimeType ? ` · ${ref.mimeType}` : ''}
            </Text>
          ))
        )}
      </Section>

      <Text style={styles.footer}>
        Pack18 controlled write · POST note + narrow submitted→triage only · No assign, confirm,
        cancel, payment, booking, SOS, execution, or Pack29 · Pilot only · Not production-ready
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: vionaSpacing.lg,
    gap: vionaSpacing.sm,
    backgroundColor: vionaTrust.surface,
  },
  banner: {
    fontFamily: FontFamily.extrabold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: vionaTrust.inkMuted,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: vionaSpacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: vionaTrust.ink,
  },
  statusLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
    color: vionaTrust.ink,
  },
  meta: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: vionaTrust.inkMuted,
  },
  updated: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: vionaTrust.inkMuted,
  },
  statusFallback: {
    fontFamily: FontFamily.extrabold,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: vionaTrust.inkMuted,
  },
  note: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: vionaTrust.ink,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: vionaTrust.ink,
  },
  section: {
    marginTop: vionaSpacing.sm,
    gap: 4,
  },
  sectionLabel: {
    fontFamily: FontFamily.extrabold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: vionaTrust.inkMuted,
  },
  itemLine: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
    color: vionaTrust.ink,
  },
  emptySection: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: vionaTrust.inkMuted,
  },
  readOnlyHint: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: vionaTrust.inkMuted,
    marginBottom: 4,
  },
  blockedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: vionaSpacing.sm,
    padding: vionaSpacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: vionaTrust.border,
    backgroundColor: vionaTrust.surfaceMuted,
  },
  blockedText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 11,
    lineHeight: 15,
    color: vionaTrust.inkMuted,
  },
  hint: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: vionaTrust.inkMuted,
    textAlign: 'center',
  },
  unauthorizedTitle: {
    fontFamily: FontFamily.extrabold,
    fontSize: 14,
    color: vionaTrust.ink,
  },
  error: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: '#9f1239',
    textAlign: 'center',
  },
  footer: {
    marginTop: vionaSpacing.md,
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: vionaTrust.inkMuted,
  },
});
