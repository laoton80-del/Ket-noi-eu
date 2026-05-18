import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CREDIT_EXCHANGE_RATE_USD, PRICING_BASELINE_CURRENCY } from '../../config/pricingConfig';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/routes';
import {
  evaluatePayoutRequest,
  triggerMockBankPayoutApi,
} from '../../services/admin/AutoFraudEngine';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles, mergeWebClassNames } from '../../utils/applyWebStyles';
import { formatCurrency } from '../../utils/currencyFormatter';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Mock ledger split (replace with API). */
const MOCK_PURCHASE_WALLET_XU = 200;
/** 185 USD-major equivalent — shows progress toward bank rail goal (ledger anchor). */
const MOCK_COMMISSION_WALLET_XU = 18_500;

/** CEO rule: 50,000 Xu = 500 USD-major for bank rail (reference ledger). */
const BANK_RAIL_GOAL_XU = 50_000;
const BANK_RAIL_GOAL_MAJOR_USD = 500;

/** Low tier: ecosystem voucher from 50 USD-major retained in VIONA (demo). */
const VOUCHER_MIN_MAJOR_USD = 50;
const VOUCHER_MIN_XU = Math.round(VOUCHER_MIN_MAJOR_USD / CREDIT_EXCHANGE_RATE_USD);

const AI_REVIEW_MS = 1800;

function formatXuVi(xu: number): string {
  return `${xu.toLocaleString('vi-VN')} Xu`;
}

export function CashOutScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const [iban, setIban] = useState('');
  const [accountLabel, setAccountLabel] = useState('');
  const [submittingBank, setSubmittingBank] = useState(false);
  const [voucherIssued, setVoucherIssued] = useState(false);

  const commissionMajorUsd = useMemo(
    () => Math.round(MOCK_COMMISSION_WALLET_XU * CREDIT_EXCHANGE_RATE_USD * 100) / 100,
    []
  );
  const purchaseMajorUsd = useMemo(
    () => Math.round(MOCK_PURCHASE_WALLET_XU * CREDIT_EXCHANGE_RATE_USD * 100) / 100,
    []
  );

  const progressToBankGoal = Math.min(commissionMajorUsd / BANK_RAIL_GOAL_MAJOR_USD, 1);
  const remainingMajorToBank = Math.max(0, BANK_RAIL_GOAL_MAJOR_USD - commissionMajorUsd);

  const fmtLedger = (v: number) => formatCurrency(v, PRICING_BASELINE_CURRENCY);

  const voucherUnlocked = MOCK_COMMISSION_WALLET_XU >= VOUCHER_MIN_XU;
  const bankUnlocked = MOCK_COMMISSION_WALLET_XU >= BANK_RAIL_GOAL_XU;
  const ibanOk = iban.replace(/\s+/g, '').length >= 15;
  const canSubmitBank = bankUnlocked && ibanOk && !submittingBank;

  const userKey = user?.phone?.trim() || user?.name?.trim() || 'anonymous-user';

  const onIssueVoucher = (): void => {
    if (!voucherUnlocked) return;
    setVoucherIssued(true);
    Alert.alert(
      'Voucher hệ sinh thái VIONA',
      'Đã phát hành voucher dịch vụ B2B (mock). Tiền thưởng giữ trong nền tảng — không rút ra ngoài.'
    );
  };

  const onBankCashOut = async (): Promise<void> => {
    if (!canSubmitBank) return;
    setSubmittingBank(true);
    await new Promise<void>((resolve) => setTimeout(resolve, AI_REVIEW_MS));
    try {
      const outcome = evaluatePayoutRequest(userKey, commissionMajorUsd);
      if (outcome.decision === 'auto_approved') {
        const wire = triggerMockBankPayoutApi(outcome.mockBankTransferId);
        Alert.alert(
          'AI duyệt — SEPA mock',
          `Rủi ro thấp (${outcome.riskScore}/100). Lệnh chuyển: ${wire.reference}. Ngân hàng đối tác (mock) đã nhận.`
        );
      } else {
        Alert.alert(
          'Tài khoản tạm giữ',
          `AI Fraud: điểm rủi ro ${outcome.riskScore}/100. ${outcome.adminQueueHint} Đội FinTech sẽ liên hệ.`
        );
      }
    } finally {
      setSubmittingBank(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
          </Pressable>
          <Text style={styles.screenTitle}>Rút Tiền Thưởng (Cash-Out)</Text>
          <View style={styles.backSpacer} />
        </View>

        <View style={styles.hero} className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}>
          <Text style={styles.heroKicker}>FinTech · Kiểm soát thanh khoản và AI tuân thủ</Text>
          <Text style={styles.heroBody}>
            Hai lựa chọn: quy đổi trong hệ sinh thái ({fmtLedger(VOUCHER_MIN_MAJOR_USD)}+) hoặc rút ngân hàng khi đạt {fmtLedger(BANK_RAIL_GOAL_MAJOR_USD)} (50.000 Xu).
          </Text>
          <Text style={styles.vigComplianceNote}>
            VIO Credits / Xu ví nạp mua: tiện ích một chiều trong app — không phải tiền mặt, crypto hay rút được. Chỉ ví hoa hồng giới thiệu (nếu bật) mới có quy trình rút sau KYC và ngưỡng (pilot).
          </Text>
          <Text style={styles.aiScanNote}>Hệ thống AI tự động kiểm duyệt gian lận trong 60 giây.</Text>
        </View>

        <View style={[styles.walletGrid, isWide && styles.walletGridWide]}>
          <View style={styles.walletCard} className={applyWebStyles('kn-glass')}>
            <Text style={styles.walletLabel}>Ví Nạp Mua (Chỉ dùng dịch vụ)</Text>
            <Text style={styles.walletXu}>{formatXuVi(MOCK_PURCHASE_WALLET_XU)}</Text>
            <Text style={styles.walletFiat}>≈ {fmtLedger(purchaseMajorUsd)}</Text>
          </View>
          <View style={[styles.walletCard, styles.walletCardGold]} className={applyWebStyles('kn-glass')}>
            <Text style={styles.walletLabel}>Ví Hoa Hồng (Có thể quy đổi)</Text>
            <Text style={styles.walletXu}>{formatXuVi(MOCK_COMMISSION_WALLET_XU)}</Text>
            <Text style={styles.walletFiat}>≈ {fmtLedger(commissionMajorUsd)}</Text>
          </View>
        </View>

        <View style={styles.panel} className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}>
          <Text style={styles.panelTitle}>Mục tiêu rút ngân hàng ({fmtLedger(BANK_RAIL_GOAL_MAJOR_USD)})</Text>
          <Text style={styles.panelSub}>
            Ngưỡng bắt buộc: {formatXuVi(BANK_RAIL_GOAL_XU)} = {fmtLedger(BANK_RAIL_GOAL_MAJOR_USD)} — bảo vệ quỹ và chi phí kênh ngân hàng.
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progressToBankGoal * 100)}%` }]} />
          </View>
          <Text style={styles.thresholdHint}>
            {remainingMajorToBank <= 0
              ? 'Bạn đã đạt ngưỡng rút tiền mặt về ngân hàng.'
              : `Còn cần thêm ${fmtLedger(remainingMajorToBank)} (${formatXuVi(
                  Math.ceil(remainingMajorToBank / CREDIT_EXCHANGE_RATE_USD)
                )}) để mở kênh ngân hàng.`}
          </Text>
        </View>

        <View style={[styles.optionCard, !voucherUnlocked && styles.optionMuted]} className={applyWebStyles('kn-glass')}>
          <View style={styles.optionBadge}>
            <Text style={styles.optionBadgeText}>OPTION 1 · LOW TIER</Text>
          </View>
          <Text style={styles.optionTitle}>Đổi Voucher Hệ Sinh Thái VIONA</Text>
          <Text style={styles.optionBody}>
            Từ {fmtLedger(VOUCHER_MIN_MAJOR_USD)} trở lên — đổi thưởng thành dịch vụ B2B (ưu đãi merchant). Tiền không rời hệ thống, giảm áp lực thanh khoản.
          </Text>
          <Pressable
            onPress={onIssueVoucher}
            disabled={!voucherUnlocked || voucherIssued}
            style={({ pressed }) => [
              styles.optionCta,
              (!voucherUnlocked || voucherIssued) && styles.ctaDisabled,
              pressed && voucherUnlocked && !voucherIssued && { opacity: 0.92 },
            ]}
            className={voucherUnlocked && !voucherIssued ? applyWebStyles('kn-neon-b2b') : undefined}
          >
            <Ionicons name="ticket-outline" size={20} color={theme.colors.onAccent} />
            <Text style={styles.optionCtaText}>
              {voucherIssued ? 'ĐÃ PHÁT HÀNH VOUCHER' : 'PHÁT HÀNH VOUCHER (MOCK)'}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.optionCard, !bankUnlocked && styles.optionMuted]} className={applyWebStyles('kn-glass')}>
          <View style={styles.optionBadgeGold}>
            <Text style={styles.optionBadgeTextDark}>OPTION 2 · HIGH TIER</Text>
          </View>
          <Text style={styles.optionTitle}>Rút Tiền Mặt Về Ngân Hàng</Text>
          <Text style={styles.optionBody}>
            Chỉ mở khi ví hoa hồng ≥ {fmtLedger(BANK_RAIL_GOAL_MAJOR_USD)}. Sau đó AI quét gian lận; rủi ro thấp có thể tự động chuyển kênh ngân hàng (mock).
          </Text>
          {!bankUnlocked ? (
            <View style={styles.lockedRow}>
              <Ionicons name="lock-closed" size={18} color={theme.colors.PendingAmber} />
              <Text style={styles.lockedText}>Đang khóa — cần đạt {fmtLedger(BANK_RAIL_GOAL_MAJOR_USD)} trong ví hoa hồng.</Text>
            </View>
          ) : null}

          <Text style={styles.inputLabel}>IBAN / Số tài khoản EU</Text>
          <TextInput
            value={iban}
            onChangeText={setIban}
            placeholder="VD: DE89370400440532013000"
            placeholderTextColor={theme.colors.text.tertiary}
            autoCapitalize="characters"
            style={[styles.input, !bankUnlocked && styles.inputDisabled]}
            editable={bankUnlocked}
          />
          <Text style={styles.inputLabel}>Tên chủ tài khoản (KYC)</Text>
          <TextInput
            value={accountLabel}
            onChangeText={setAccountLabel}
            placeholder="Trùng khớp eKYC"
            placeholderTextColor={theme.colors.text.tertiary}
            style={[styles.input, !bankUnlocked && styles.inputDisabled]}
            editable={bankUnlocked}
          />

          <Pressable
            onPress={() => void onBankCashOut()}
            disabled={!canSubmitBank}
            style={({ pressed }) => [
              styles.cta,
              !canSubmitBank && styles.ctaDisabled,
              pressed && canSubmitBank && { opacity: 0.92 },
            ]}
            className={canSubmitBank ? applyWebStyles('kn-neon-b2b') : undefined}
          >
            {submittingBank ? (
              <ActivityIndicator color={theme.colors.onAccent} />
            ) : (
              <>
                <Ionicons name="shield-checkmark-outline" size={22} color={theme.colors.onAccent} />
                <Text style={styles.ctaText}>GỬI YÊU CẦU RÚT TIỀN</Text>
              </>
            )}
          </Pressable>
          {!bankUnlocked ? (
            <Text style={styles.ctaHint}>Nút SEPA vô hiệu cho đến khi đạt {formatXuVi(BANK_RAIL_GOAL_XU)}.</Text>
          ) : !ibanOk ? (
            <Text style={styles.ctaHint}>Nhập IBAN hợp lệ (tối thiểu 15 ký tự).</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDeep,
  },
  scroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 2,
    gap: theme.spacing.lg,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  scrollWide: {
    maxWidth: 960,
    paddingHorizontal: theme.spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  backBtn: {
    padding: theme.spacing.xs,
  },
  backSpacer: {
    width: 32,
  },
  screenTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
  },
  hero: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
  },
  heroKicker: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroBody: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
  vigComplianceNote: {
    marginTop: theme.spacing.sm,
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
    lineHeight: 17,
  },
  aiScanNote: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: theme.colors.primaryBright,
    fontStyle: 'italic',
  },
  walletGrid: {
    gap: theme.spacing.md,
  },
  walletGridWide: {
    flexDirection: 'row',
  },
  walletCard: {
    flex: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: theme.colors.executive.card,
    gap: 6,
    minWidth: 0,
  },
  walletCardGold: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.08)',
  },
  walletLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
  },
  walletXu: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
  },
  walletFiat: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: theme.colors.primaryBright,
  },
  panel: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(15, 34, 56, 0.55)',
  },
  panelTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  panelSub: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  progressTrack: {
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 7,
    backgroundColor: theme.colors.primary,
  },
  thresholdHint: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.semibold,
    color: theme.colors.primaryBright,
  },
  optionCard: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(12, 24, 44, 0.88)',
  },
  optionMuted: {
    opacity: 0.85,
  },
  optionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(85, 144, 224, 0.25)',
    borderWidth: 1,
    borderColor: theme.colors.SignalBlue,
  },
  optionBadgeGold: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(197, 160, 89, 0.25)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  optionBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: theme.colors.SignalBlue,
    letterSpacing: 0.5,
  },
  optionBadgeTextDark: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
    letterSpacing: 0.5,
  },
  optionTitle: {
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
  },
  optionBody: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  optionCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    minHeight: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.components.button.variant.primary.background,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
  },
  optionCtaText: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: theme.components.button.variant.primary.text,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(217, 164, 65, 0.12)',
  },
  lockedText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: theme.colors.PendingAmber,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
  },
  input: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    backgroundColor: 'rgba(5, 11, 20, 0.55)',
  },
  inputDisabled: {
    opacity: 0.5,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    minHeight: 54,
    borderRadius: theme.radius.md,
    backgroundColor: theme.components.button.variant.primary.background,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  ctaText: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: theme.components.button.variant.primary.text,
    letterSpacing: 0.4,
  },
  ctaHint: {
    fontSize: 11,
    textAlign: 'center',
    fontFamily: FontFamily.medium,
    color: theme.colors.text.tertiary,
  },
});
