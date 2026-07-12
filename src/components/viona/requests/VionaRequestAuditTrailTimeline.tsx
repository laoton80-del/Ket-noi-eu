import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FontFamily } from '../../../theme/typography';
import { vionaSpacing } from '../vionaDesignTokens';
import { vionaTrust } from '../vionaTrustTokens';
import type { VionaRequestAuditTrailTimelineItem } from './vionaRequestAuditTrailTimelineDisplay';

export type VionaRequestAuditTrailTimelineProps = Readonly<{
  items: readonly VionaRequestAuditTrailTimelineItem[];
}>;

function AuditTrailRow({
  item,
}: Readonly<{ item: VionaRequestAuditTrailTimelineItem }>): ReactElement {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.eventTypeLabel}>{item.eventTypeLabel}</Text>
        <Text style={styles.timestampLabel}>{item.timestampLabel}</Text>
      </View>
      {item.stateChangeLabel != null ? (
        <Text style={styles.stateChangeLabel}>{item.stateChangeLabel}</Text>
      ) : null}
      <Text style={styles.actorLabel}>By {item.actorLabel}</Text>
    </View>
  );
}

/**
 * Pack30D-3 — read-only Audit Trail Timeline for a `VionaRequest` detail screen. Renders the full
 * audit-event ledger (newest first), sourced entirely from the already-fetched, already-authorized
 * `GET /api/viona/requests/:id` detail response (`detail.auditEvents`) — no new API call, no
 * write affordance of any kind (no edit/delete control exists in this component).
 */
export function VionaRequestAuditTrailTimeline({
  items,
}: VionaRequestAuditTrailTimelineProps): ReactElement {
  if (items.length === 0) {
    return <Text style={styles.empty}>No audit events recorded yet.</Text>;
  }

  return (
    <View style={styles.timeline}>
      <Text style={styles.readOnlyHint}>
        Read-only · sourced from the append-only audit ledger · newest first
      </Text>
      {items.map((item) => (
        <AuditTrailRow key={item.id} item={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: {
    gap: vionaSpacing.xs,
  },
  readOnlyHint: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: vionaTrust.inkMuted,
    marginBottom: 4,
  },
  row: {
    borderLeftWidth: 2,
    borderLeftColor: vionaTrust.border,
    paddingLeft: vionaSpacing.sm,
    paddingVertical: 4,
    gap: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: vionaSpacing.sm,
  },
  eventTypeLabel: {
    flex: 1,
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: vionaTrust.ink,
  },
  timestampLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: vionaTrust.inkMuted,
  },
  stateChangeLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: vionaTrust.ink,
  },
  actorLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: vionaTrust.inkMuted,
  },
  empty: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: vionaTrust.inkMuted,
  },
});
