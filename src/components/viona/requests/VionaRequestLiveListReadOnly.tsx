import { type ReactElement } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import type { VionaRequestListItem } from '../../../services/vionaRequestReadOnlyApi';
import { FontFamily } from '../../../theme/typography';
import { vionaSpacing } from '../vionaDesignTokens';
import { vionaTrust } from '../vionaTrustTokens';

export type VionaRequestLiveListReadOnlyProps = Readonly<{
  requests: readonly VionaRequestListItem[];
  selectedId: string | null;
  onSelect: (requestId: string) => void;
}>;

export function VionaRequestLiveListReadOnly({
  requests,
  selectedId,
  onSelect,
}: VionaRequestLiveListReadOnlyProps): ReactElement {
  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      ListEmptyComponent={
        <Text style={styles.empty}>No requests visible for your account — read-only inbox.</Text>
      }
      renderItem={({ item }) => {
        const selected = item.id === selectedId;
        return (
          <Pressable
            onPress={() => onSelect(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Open read-only request ${item.title}`}
            style={({ pressed }) => [
              styles.row,
              selected && styles.rowSelected,
              pressed && { opacity: 0.9 },
            ]}
          >
            <View style={styles.rowHeader}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            <Text style={styles.meta}>
              {item.sourceUniverse} · {item.requestType}
            </Text>
            <Text style={styles.note} numberOfLines={2}>
              {item.display.statusLabel}
            </Text>
            <Text style={styles.summary} numberOfLines={2}>
              {item.summary}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
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
  rowSelected: {
    borderColor: 'rgba(37, 99, 235, 0.45)',
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: vionaSpacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: vionaTrust.ink,
  },
  status: {
    fontFamily: FontFamily.extrabold,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: vionaTrust.inkMuted,
  },
  meta: {
    marginTop: 4,
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: vionaTrust.inkMuted,
  },
  note: {
    marginTop: 4,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: vionaTrust.ink,
  },
  summary: {
    marginTop: 4,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: vionaTrust.inkMuted,
  },
});
