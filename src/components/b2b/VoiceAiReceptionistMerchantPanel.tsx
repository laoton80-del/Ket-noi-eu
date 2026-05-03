import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { canAllocateAiReceptionist } from '../../services/billing/StripeBillingService';
import { PRICING_AUTHORITY, PRICING_BASELINE_CURRENCY, type PackageName } from '../../config/pricingConfig';
import { VOICE_RECEPTIONIST_DEMO_HANDLED } from '../../services/ai/voiceReceptionistB2bDemo';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles, mergeWebClassNames } from '../../utils/applyWebStyles';
import { formatCurrency } from '../../utils/currencyFormatter';

export type VoiceAiReceptionistMerchantPanelProps = {
  /** Active SaaS package for this merchant console (drives included voice pool). */
  merchantPackage: PackageName;
  /** Clock minutes already consumed this billing month (server truth in production). */
  usedVoiceAiMinutesThisMonth: number;
  /** DB `is_kyc_verified` / Stripe Connect — must be true to allocate AI Receptionist (AML). */
  isKycVerified: boolean;
};

function intentLabelVi(intent: string): string {
  if (intent === 'Booking') return 'Đặt lịch';
  if (intent === 'Wholesale Order') return 'Đơn mua sỉ';
  if (intent === 'Room Reservation') return 'Giữ phòng';
  return intent;
}

export function VoiceAiReceptionistMerchantPanel({
  merchantPackage,
  usedVoiceAiMinutesThisMonth,
  isKycVerified,
}: VoiceAiReceptionistMerchantPanelProps) {
  const tel = PRICING_AUTHORITY.voiceAiTelecom;
  const allocationAllowed = canAllocateAiReceptionist(isKycVerified);
  const included =
    merchantPackage === 'Power'
      ? Math.max(PRICING_AUTHORITY.tiers.Power.includedAiVoiceMinutes, tel.powerTierIncludedMinutes)
      : PRICING_AUTHORITY.tiers[merchantPackage].includedAiVoiceMinutes;
  const overageMajorPerMin =
    merchantPackage === 'Power' ? tel.powerTierOverageMinMajor : tel.payAsYouGoVoiceMinMajor;
  const remaining = Math.max(0, included - usedVoiceAiMinutesThisMonth);

  return (
    <View style={styles.shell} className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}>
      <View style={styles.headerRow}>
        <Ionicons name="call" size={22} color={theme.colors.SignatureGold} />
        <Text style={styles.title}>Lịch sử Cuộc gọi AI</Text>
      </View>
      <Text style={styles.sub}>
        Bản ghi &amp; phiên âm do Lễ tân AI xử lý — khách B2C gọi VoIP; cước phút vượt gói tính vào doanh nghiệp.
      </Text>

      {!allocationAllowed ? (
        <View style={styles.kycGate}>
          <Ionicons name="shield-half-outline" size={20} color="#FCA5A5" />
          <Text style={styles.kycGateText}>
            AML/KYC: Hoàn tất Stripe Connect onboarding (is_kyc_verified) trước khi phân bổ Lễ tân AI cho số thật.
          </Text>
        </View>
      ) : null}

      <View style={[styles.tracker, !allocationAllowed && styles.trackerDimmed]} className={applyWebStyles('kn-neon-b2b')}>
        <Ionicons name="time-outline" size={18} color={theme.colors.primaryBright} />
        <Text style={styles.trackerText}>
          Số phút gọi Lễ Tân AI còn lại: {remaining}/{included} phút. (Cước gọi ngoài gói:{' '}
          {formatCurrency(overageMajorPerMin, PRICING_BASELINE_CURRENCY)}/phút)
        </Text>
      </View>

      <View style={[styles.list, !allocationAllowed && styles.listDimmed]}>
        {VOICE_RECEPTIONIST_DEMO_HANDLED.map((row) => (
          <View key={row.id} style={styles.row}>
            <View style={styles.rowTop}>
              <Text style={styles.rowTime}>{row.startedAtLabel}</Text>
              <View style={styles.intentPill}>
                <Text style={styles.intentPillText}>{intentLabelVi(row.intent)}</Text>
              </View>
              <View style={styles.rowFlexSpacer} />
              <Text style={styles.rowDur}>{row.durationMin} phút</Text>
            </View>
            <Text style={styles.rowTranscript} numberOfLines={3}>
              {row.transcriptSnippet}
            </Text>
            <Text style={styles.rowRecording}>
              {row.recordingUriMock ? `Bản ghi (mock): ${row.recordingUriMock}` : 'Bản ghi: chưa có file (mock).'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: 'rgba(8, 18, 32, 0.55)',
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  sub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    lineHeight: 17,
  },
  tracker: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  trackerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
    lineHeight: 19,
  },
  list: {
    gap: theme.spacing.sm,
    marginTop: 4,
  },
  row: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  rowFlexSpacer: {
    flex: 1,
    minWidth: 4,
  },
  rowTime: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
  },
  intentPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 255, 102, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 102, 0.35)',
  },
  intentPillText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: theme.hybrid.onSignal,
  },
  rowDur: {
    marginLeft: 'auto',
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
  },
  rowTranscript: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.primary,
    lineHeight: 17,
  },
  rowRecording: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: 'rgba(200, 210, 225, 0.85)',
  },
  kycGate: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.45)',
    backgroundColor: 'rgba(127, 29, 29, 0.35)',
  },
  kycGateText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#FECACA',
    lineHeight: 18,
  },
  trackerDimmed: { opacity: 0.45 },
  listDimmed: { opacity: 0.45 },
});
