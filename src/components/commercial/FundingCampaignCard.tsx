import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

export type FundingCampaign = {
  id: string;
  projectName: string;
  raisedAmount: number;
  targetAmount: number;
  model: string;
  roiLabel: string;
};

type FundingCampaignCardProps = {
  campaign: FundingCampaign;
  onInvestNow: (campaign: FundingCampaign) => void;
};

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function FundingCampaignCard({ campaign, onInvestNow }: FundingCampaignCardProps) {
  const progress = Math.max(0, Math.min(1, campaign.raisedAmount / campaign.targetAmount));

  return (
    <View style={styles.card}>
      <Text style={styles.projectName}>{campaign.projectName}</Text>

      <Text style={styles.progressLabel}>
        Tiến độ gọi vốn: {formatUsd(campaign.raisedAmount)} / {formatUsd(campaign.targetAmount)}
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as `${number}%` }]} />
      </View>

      <Text style={styles.modelLabel}>Hình thức: {campaign.model}</Text>
      <Text style={styles.roiLabel}>Lợi nhuận dự kiến (ROI): {campaign.roiLabel}</Text>

      <Pressable style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.9 }]} onPress={() => onInvestNow(campaign)}>
        <Text style={styles.ctaText}>Đầu tư ngay</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 320,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: theme.elevation.card.shadowOffset,
    shadowOpacity: theme.elevation.card.shadowOpacity,
    shadowRadius: theme.elevation.card.shadowRadius,
    elevation: theme.elevation.card.elevation,
  },
  projectName: {
    ...theme.typeScale.body,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  progressLabel: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
  },
  modelLabel: {
    ...theme.typeScale.caption,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.regular,
  },
  roiLabel: {
    ...theme.typeScale.body,
    color: theme.colors.success,
    fontFamily: FontFamily.bold,
  },
  ctaButton: {
    marginTop: theme.spacing.xs,
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    ...theme.typeScale.body,
    color: theme.hybrid.onSignal,
    fontFamily: FontFamily.bold,
  },
});
