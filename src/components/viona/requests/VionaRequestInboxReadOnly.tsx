import { type ReactElement, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import type { VionaRequestRecord } from '../../../domain/requests/vionaRequestTypes';
import {
  filterRequestsForInbox,
  getRequestInboxCounts,
  type VionaRequestInboxFilters,
} from '../../../domain/requests/vionaRequestInboxSelectors';
import { getRequestStatusSafetyLabel } from '../../../domain/requests/vionaRequestSafetyCopy';
import { FontFamily } from '../../../theme/typography';
import { vionaSpacing } from '../vionaDesignTokens';
import { vionaTrust } from '../vionaTrustTokens';
import { VionaRequestStatusBadge } from './VionaRequestStatusBadge';

export type VionaRequestInboxReadOnlyProps = Readonly<{
  requests: readonly VionaRequestRecord[];
  filters?: VionaRequestInboxFilters;
}>;

export function VionaRequestInboxReadOnly({
  requests,
  filters = {},
}: VionaRequestInboxReadOnlyProps): ReactElement {
  const filtered = useMemo(
    () => filterRequestsForInbox(requests, filters),
    [requests, filters]
  );
  const counts = useMemo(() => getRequestInboxCounts(filtered), [filtered]);

  return (
    <View style={styles.root}>
      <Text style={styles.banner}>Read-only preview · Admin/Merchant inbox foundation</Text>
      <Text style={styles.counts}>
        {counts.total} requests · {counts.requiringHumanConfirmation} need human confirmation ·{' '}
        {counts.withPartnerResponse} partner responses
      </Text>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={
          <Text style={styles.empty}>No requests match filters — preview only.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowId}>{item.id}</Text>
              <VionaRequestStatusBadge status={item.status} />
            </View>
            <Text style={styles.rowMeta}>
              {item.universe} · {item.intent}
            </Text>
            <Text style={styles.rowNote}>{getRequestStatusSafetyLabel(item.status)}</Text>
            <Text style={styles.rowAudit} numberOfLines={2}>
              {item.auditReason}
            </Text>
          </View>
        )}
      />
      <Text style={styles.footer}>
        No payment captured · Not booking confirmed · SOS guidance only · Ops readiness required
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: vionaTrust.surface,
    padding: vionaSpacing.md,
    gap: vionaSpacing.sm,
  },
  banner: {
    fontFamily: FontFamily.extrabold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: vionaTrust.inkMuted,
  },
  counts: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: vionaTrust.ink,
  },
  empty: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: vionaTrust.inkMuted,
    paddingVertical: vionaSpacing.md,
  },
  row: {
    borderWidth: 1,
    borderColor: vionaTrust.border,
    borderRadius: 10,
    padding: vionaSpacing.sm,
    marginBottom: vionaSpacing.sm,
    backgroundColor: vionaTrust.surfaceMuted,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: vionaSpacing.sm,
  },
  rowId: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: vionaTrust.ink,
  },
  rowMeta: {
    marginTop: 4,
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: vionaTrust.inkMuted,
  },
  rowNote: {
    marginTop: 4,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: vionaTrust.ink,
  },
  rowAudit: {
    marginTop: 4,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: vionaTrust.inkMuted,
  },
  footer: {
    marginTop: vionaSpacing.xs,
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: vionaTrust.inkMuted,
  },
});
