import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { WidgetCard } from './WidgetCard';

export type LifeOSActionCell = {
  key: string;
  title: string;
  /** e.g. "99 Credits/cuộc" */
  costLine: string;
  /** Outcome tied to spend */
  outcomeLine: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export type LifeOSActionGridProps = {
  cells: LifeOSActionCell[];
};

const LifeOSActionGridComponent: React.FC<LifeOSActionGridProps> = ({ cells }) => {
  return (
    <WidgetCard>
      <Text style={styles.sectionTitle}>Làm ngay</Text>
      <Text style={styles.sectionSub}>Mỗi ô ghi rõ Credits và kết quả — chạm một lần là vào đúng luồng.</Text>
      <View style={styles.grid}>
        {cells.map((c) => (
          <AnimatedPressable
            key={c.key}
            onPress={() => {
              if (c.disabled) return;
              c.onPress();
            }}
            style={[styles.cell, (c.disabled || c.loading) && styles.cellDisabled]}
          >
            <Text style={[styles.cellTitle, c.disabled && styles.cellMuted]}>{c.title}</Text>
            <Text style={[styles.costLine, c.disabled && styles.cellMuted]}>{c.costLine}</Text>
            {c.loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.loadingText}>Đang mở...</Text>
              </View>
            ) : (
              <Text style={[styles.outcomeLine, c.disabled && styles.cellMuted]}>{c.outcomeLine}</Text>
            )}
          </AnimatedPressable>
        ))}
      </View>
    </WidgetCard>
  );
};

export const LifeOSActionGrid = React.memo(LifeOSActionGridComponent);

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  sectionSub: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 14,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    width: '47%',
    flexGrow: 1,
    minWidth: '44%',
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    minHeight: 96,
    justifyContent: 'center',
    gap: 4,
  },
  cellDisabled: {
    backgroundColor: '#4B5563',
    opacity: 0.72,
  },
  cellTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  costLine: {
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  outcomeLine: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  loadingRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 11,
    fontWeight: '600',
  },
  cellMuted: {
    color: 'rgba(255,255,255,0.65)',
  },
});
