import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { vionaNativeClearPremiumTokens as tkn } from '../../../design/vionaNativeClearPremiumTokens';
import { FontFamily } from '../../../theme/typography';

export type VionaNativeQuickActionItem = Readonly<{
  id: string;
  label: string;
  icon: string;
  readiness?: string;
  onPress: () => void;
  category: 'local' | 'travel' | 'academy' | 'ai' | 'docs' | 'safety';
  priority: 'primary' | 'overflow';
  accessibilityLabel: string;
}>;

export type VionaNativeQuickActionsProps = Readonly<{
  items: readonly VionaNativeQuickActionItem[];
  moreLabel: string;
}>;

const CATEGORY_ACCENT: Record<VionaNativeQuickActionItem['category'], string> = {
  local: tkn.accent.local,
  travel: tkn.accent.travel,
  academy: tkn.accent.academy,
  ai: tkn.accent.ai,
  docs: tkn.accent.business,
  safety: tkn.accent.safety,
};

/**
 * Native quick-action peek: 4–6 primary + More. Overflow preserves remaining ids.
 * Safety item is an entry callback only — no hold UI.
 */
export function VionaNativeQuickActions({ items, moreLabel }: VionaNativeQuickActionsProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = useMemo(() => items.filter((item) => item.priority === 'primary'), [items]);
  const overflow = useMemo(() => items.filter((item) => item.priority === 'overflow'), [items]);

  if (items.length === 0) {
    return null;
  }

  return (
    <View testID="viona-native-quick-actions" style={styles.root}>
      <View style={styles.grid}>
        {primary.map((item) => (
          <ActionCell key={item.id} item={item} />
        ))}
        {overflow.length > 0 ? (
          <Pressable
            onPress={() => setMoreOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel={moreLabel}
            accessibilityState={{ expanded: moreOpen }}
            style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
          >
            <View style={[styles.iconWrap, { backgroundColor: tkn.bg.muted }]}>
              <Ionicons name="ellipsis-horizontal" size={18} color={tkn.ink.primary} />
            </View>
          </Pressable>
        ) : null}
      </View>
      {moreOpen
        ? overflow.map((item) => <ActionRow key={`overflow-${item.id}`} item={item} />)
        : null}
    </View>
  );
}

function ActionCell({ item }: { item: VionaNativeQuickActionItem }) {
  const accent = CATEGORY_ACCENT[item.category];
  return (
    <Pressable
      onPress={item.onPress}
      accessibilityRole="button"
      accessibilityLabel={item.accessibilityLabel}
      style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: tkn.bg.muted }]}>
        <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color={accent} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {item.label}
      </Text>
    </Pressable>
  );
}

function ActionRow({ item }: { item: VionaNativeQuickActionItem }) {
  const accent = CATEGORY_ACCENT[item.category];
  return (
    <Pressable
      onPress={item.onPress}
      accessibilityRole="button"
      accessibilityLabel={item.accessibilityLabel}
      testID={`viona-native-quick-action-overflow-${item.id}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color={accent} />
      <Text style={styles.rowLabel} numberOfLines={1}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: tkn.spacing[8],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -tkn.spacing[4],
  },
  cell: {
    width: '15%',
    flexGrow: 1,
    minHeight: tkn.hit.min,
    margin: tkn.spacing[4],
    alignItems: 'center',
    gap: tkn.spacing[4],
  },
  iconWrap: {
    width: tkn.hit.min,
    height: tkn.hit.min,
    borderRadius: tkn.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: tkn.ink.primary,
    fontFamily: FontFamily.medium,
    fontSize: tkn.type.chip.fontSize,
    lineHeight: tkn.type.chip.lineHeight,
    textAlign: 'center',
  },
  row: {
    minHeight: tkn.hit.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tkn.spacing[12],
    paddingHorizontal: tkn.spacing[8],
    borderRadius: tkn.radius.md,
    backgroundColor: tkn.bg.surface,
    borderWidth: 1,
    borderColor: tkn.line.subtle,
  },
  rowLabel: {
    color: tkn.ink.primary,
    fontFamily: FontFamily.medium,
    fontSize: tkn.type.body.fontSize,
    lineHeight: tkn.type.body.lineHeight,
    flex: 1,
  },
  pressed: {
    opacity: 0.86,
  },
});
