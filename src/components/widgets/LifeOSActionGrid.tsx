import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { WidgetCard } from './WidgetCard';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

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
                <ActivityIndicator size="small" color={theme.colors.CeolWhite} />
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
    ...theme.typeScale.h2,
    fontFamily: FontFamily.bold,
    color: theme.colors.GraphiteBlue,
    marginBottom: 6,
  },
  sectionSub: {
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
    marginBottom: 14,
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
    backgroundColor: theme.colors.GraphiteBlue,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    minHeight: 96,
    justifyContent: 'center',
    gap: 4,
  },
  cellDisabled: {
    backgroundColor: theme.colors.executive.panelMuted,
    opacity: 0.72,
  },
  cellTitle: {
    color: theme.colors.CeolWhite,
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
  costLine: {
    color: theme.colors.CeolWhite,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
  },
  outcomeLine: {
    color: theme.colors.text.secondary,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  loadingRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loadingText: {
    color: theme.colors.CeolWhite,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
  },
  cellMuted: {
    color: theme.colors.text.secondary,
  },
});
