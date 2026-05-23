import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../../theme/theme';
import { FontFamily } from '../../../theme/typography';
import { useTranslation } from '../../../utils/i18n';

export function LocalOpsAuditSafetyChips(): ReactElement {
  const { t } = useTranslation();
  const chips = [
    t('local.opsAudit.chips.requestOnlyNoCharge'),
    t('local.opsAudit.chips.walletPhaseNone'),
    t('local.opsAudit.chips.noPaymentCaptured'),
    t('local.opsAudit.chips.readOnly'),
  ] as const;

  return (
    <View style={styles.row} accessibilityRole="text">
      {chips.map((label) => (
        <View key={label} style={styles.chip}>
          <Text style={styles.chipText}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: theme.colors.text.primary,
  },
});
