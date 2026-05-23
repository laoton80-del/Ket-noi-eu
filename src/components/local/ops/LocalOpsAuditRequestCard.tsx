import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { LocalOpsRequestListItem } from '../../../services/localOpsAuditApi';
import { theme } from '../../../theme/theme';
import { FontFamily } from '../../../theme/typography';
import { useTranslation } from '../../../utils/i18n';

type Props = Readonly<{
  item: LocalOpsRequestListItem;
  selected: boolean;
  formattedUpdatedAt: string;
  onPress: () => void;
}>;

export function LocalOpsAuditRequestCard({
  item,
  selected,
  formattedUpdatedAt,
  onPress,
}: Props): ReactElement {
  const { t } = useTranslation();
  const decisionKey = `local.opsAudit.merchantDecision.${item.merchantDecision}` as const;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && { opacity: 0.92 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={t('local.opsAudit.card.a11y', {
        status: item.statusLabel,
        id: item.id,
      })}
    >
      <View style={styles.rowTop}>
        <Text style={styles.status}>{item.statusLabel}</Text>
        <Text style={styles.time}>{formattedUpdatedAt}</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.meta}>
        {item.serviceType} · {t(decisionKey)}
      </Text>
      <Text style={styles.meta}>
        {item.walletMode} · {item.walletPhase}
      </Text>
      <Text style={styles.id} numberOfLines={1}>
        {item.id}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: 'rgba(232, 237, 247, 0.2)',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    backgroundColor: theme.colors.surfaceElevated,
  },
  cardSelected: {
    borderColor: theme.colors.primaryBright,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  status: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: theme.colors.text.primary,
    flex: 1,
  },
  time: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  title: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  meta: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  id: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
});
