import { type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FontFamily } from '../../../theme/typography';
import { vionaSpacing } from '../vionaDesignTokens';
import { vionaTrust } from '../vionaTrustTokens';
import type { VionaRequestActivityTimelineItem } from './vionaRequestActivityTimelineDisplay';

export type VionaRequestActivityTimelineReadOnlyProps = Readonly<{
  items: readonly VionaRequestActivityTimelineItem[];
}>;

function ActivityTimelineCard({
  item,
}: Readonly<{ item: VionaRequestActivityTimelineItem }>): ReactElement {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>{item.label}</Text>
        <Text style={styles.cardMeta}>
          {item.actorLabel} · {item.timestampLabel}
        </Text>
      </View>
      <Text style={styles.cardBody}>{item.summary}</Text>
      {item.detail != null ? <Text style={styles.cardDetail}>{item.detail}</Text> : null}
    </View>
  );
}

export function VionaRequestActivityTimelineReadOnly({
  items,
}: VionaRequestActivityTimelineReadOnlyProps): ReactElement {
  if (items.length === 0) {
    return <Text style={styles.empty}>No activity yet.</Text>;
  }

  return (
    <View style={styles.timeline}>
      {items.map((item) => (
        <ActivityTimelineCard key={item.id} item={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: {
    gap: vionaSpacing.sm,
  },
  card: {
    borderWidth: 1,
    borderColor: vionaTrust.border,
    borderRadius: 8,
    backgroundColor: vionaTrust.surfaceMuted,
    padding: vionaSpacing.sm,
    gap: 4,
  },
  cardHeader: {
    gap: 2,
  },
  cardLabel: {
    fontFamily: FontFamily.extrabold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: vionaTrust.ink,
  },
  cardMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: vionaTrust.inkMuted,
  },
  cardBody: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: vionaTrust.ink,
  },
  cardDetail: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
    color: vionaTrust.inkMuted,
  },
  empty: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: vionaTrust.inkMuted,
  },
});
