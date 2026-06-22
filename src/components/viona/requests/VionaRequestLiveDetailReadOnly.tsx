import { type ReactElement, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { VionaRequestDetail } from '../../../services/vionaRequestApi';
import { FontFamily } from '../../../theme/typography';
import { vionaSpacing } from '../vionaDesignTokens';
import { vionaTrust } from '../vionaTrustTokens';
import {
  filterNonNoteAuditEvents,
  mapVionaRequestNoteAuditTimelineItems,
} from './vionaRequestNoteAuditDisplay';
import { VionaRequestNoteAuditTimelineReadOnly } from './VionaRequestNoteAuditTimelineReadOnly';
import { VionaRequestNoteInputWrite } from './VionaRequestNoteInputWrite';

export type VionaRequestLiveDetailReadOnlyProps = Readonly<{
  detail: VionaRequestDetail | null;
  loading: boolean;
  error: string | null;
  onNoteSubmitted?: () => Promise<boolean>;
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

export function VionaRequestLiveDetailReadOnly({
  detail,
  loading,
  error,
  onNoteSubmitted,
}: VionaRequestLiveDetailReadOnlyProps): ReactElement {
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={vionaTrust.inkMuted} />
        <Text style={styles.hint}>Loading read-only detail…</Text>
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
        <Text style={styles.hint}>Select a request to view read-only detail.</Text>
      </View>
    );
  }

  const { request } = detail;
  const noteTimelineItems = mapVionaRequestNoteAuditTimelineItems(detail.auditEvents);
  const otherAuditEvents = filterNonNoteAuditEvents(detail.auditEvents);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.banner}>Live inbox · note submit below read-only history</Text>
      <Text style={styles.title}>{request.title}</Text>
      <Text style={styles.meta}>
        {request.sourceUniverse} · {request.requestType} · {request.status}
      </Text>
      <Text style={styles.note}>{request.display.notProductionCopy}</Text>
      <Text style={styles.body}>{request.summary}</Text>

      <Section title="Participants">
        {detail.participants.length === 0 ? (
          <EmptySectionText text="No participants returned." />
        ) : (
          detail.participants.map((p) => (
            <Text key={p.id} style={styles.itemLine}>
              {p.displayName ?? p.userRef ?? p.id}
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

      <Section title="Status events">
        {detail.statusEvents.length === 0 ? (
          <EmptySectionText text="No status events returned." />
        ) : (
          detail.statusEvents.map((event) => (
            <Text key={event.id} style={styles.itemLine}>
              {event.fromStatus ?? '—'} → {event.toStatus}
              {event.reason ? ` · ${event.reason}` : ''}
            </Text>
          ))
        )}
      </Section>

      <Section title="Notes">
        <Text style={styles.readOnlyHint}>Read-only note history above · audited submit below</Text>
        <VionaRequestNoteAuditTimelineReadOnly items={noteTimelineItems} />
        {onNoteSubmitted != null ? (
          <VionaRequestNoteInputWrite
            requestId={request.id}
            onNoteSubmitted={onNoteSubmitted}
          />
        ) : null}
      </Section>

      <Section title="Audit events">
        {otherAuditEvents.length === 0 ? (
          <EmptySectionText text="No other audit events returned." />
        ) : (
          otherAuditEvents.map((event) => (
            <Text key={event.id} style={styles.itemLine}>
              {event.eventType}
              {event.message ? ` · ${event.message}` : ''}
            </Text>
          ))
        )}
      </Section>

      <Section title="Attachment references">
        {detail.attachmentReferences.length === 0 ? (
          <EmptySectionText text="No attachment references returned." />
        ) : (
          detail.attachmentReferences.map((ref) => (
            <Text key={ref.id} style={styles.itemLine}>
              {ref.filename ?? ref.externalRef ?? ref.id}
              {ref.mimeType ? ` · ${ref.mimeType}` : ''}
            </Text>
          ))
        )}
      </Section>

      <Text style={styles.footer}>
        Note submit only · No status change · Not booking confirmed · SOS guidance only · Other
        write/actions blocked
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
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: vionaTrust.ink,
  },
  meta: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
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
  hint: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: vionaTrust.inkMuted,
    textAlign: 'center',
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
