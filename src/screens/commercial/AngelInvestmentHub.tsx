import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FundingCampaignCard,
  type FundingCampaign,
} from '../../components/commercial/FundingCampaignCard';
import { AdaptiveContainer } from '../../components/layout/AdaptiveContainer';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

const CAMPAIGNS: FundingCampaign[] = [
  {
    id: 'anna-berlin-01',
    projectName: 'Mở rộng chi nhánh Anna Spa tại Berlin',
    raisedAmount: 15000,
    targetAmount: 50000,
    model: 'Chia sẻ 10% doanh thu hàng tháng trong 2 năm',
    roiLabel: '18%/năm',
  },
  {
    id: 'pho-munich-02',
    projectName: 'Nâng cấp bếp trung tâm Phở Việt Munich',
    raisedAmount: 28000,
    targetAmount: 60000,
    model: 'Chia sẻ 8% doanh thu hàng tháng trong 24 tháng',
    roiLabel: '15%/năm',
  },
];

const AGREEMENT_TEXT = 'TÔI ĐỒNG Ý';

export function AngelInvestmentHub() {
  const [selectedCampaign, setSelectedCampaign] = useState<FundingCampaign | null>(null);
  const [agreementInput, setAgreementInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const canProceed = useMemo(
    () => agreementInput.trim().toLocaleUpperCase('vi-VN') === AGREEMENT_TEXT,
    [agreementInput]
  );

  const openDisclaimer = (campaign: FundingCampaign) => {
    setSelectedCampaign(campaign);
    setAgreementInput('');
    setSubmitted(false);
  };

  const closeDisclaimer = () => {
    setSelectedCampaign(null);
    setAgreementInput('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <AdaptiveContainer contentStyle={styles.content}>
        <Text style={styles.headerTitle}>Cộng đồng Đầu tư Thiên thần Kết Nối Global</Text>
        <Text style={styles.headerSubtitle}>
          Kết nối minh bạch giữa nhà đầu tư và dự án mở rộng kinh doanh địa phương.
        </Text>

        <Text style={styles.sectionTitle}>Dự án đang gọi vốn</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.campaignRow}
        >
          {CAMPAIGNS.map((campaign) => (
            <FundingCampaignCard
              key={campaign.id}
              campaign={campaign}
              onInvestNow={openDisclaimer}
            />
          ))}
        </ScrollView>
      </AdaptiveContainer>

      <Modal
        visible={selectedCampaign !== null}
        transparent
        animationType="fade"
        onRequestClose={closeDisclaimer}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Xác nhận Rủi ro Đầu tư</Text>
            <Text style={styles.modalBody}>
              Đầu tư kinh doanh luôn đi kèm rủi ro. Ứng dụng Kết Nối Global đóng vai trò là nền tảng
              kết nối thông tin, không đảm bảo lợi nhuận.
            </Text>

            <Text style={styles.inputLabel}>{`Vui lòng nhập "${AGREEMENT_TEXT}" để tiếp tục:`}</Text>
            <TextInput
              value={agreementInput}
              onChangeText={setAgreementInput}
              placeholder={AGREEMENT_TEXT}
              placeholderTextColor={theme.colors.text.tertiary}
              style={styles.input}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            {submitted && !canProceed ? (
              <Text style={styles.errorText}>{`Bạn cần nhập chính xác cụm "${AGREEMENT_TEXT}".`}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.88 }]}
                onPress={closeDisclaimer}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.acceptBtn,
                  pressed && { opacity: 0.9 },
                  !canProceed && styles.acceptBtnDisabled,
                ]}
                onPress={() => {
                  setSubmitted(true);
                  if (!canProceed) return;
                  closeDisclaimer();
                }}
              >
                <Text style={styles.acceptText}>Tiếp tục đến bước thanh toán</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typeScale.h2,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  headerSubtitle: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  sectionTitle: {
    ...theme.typeScale.body,
    color: theme.colors.primary,
    fontFamily: FontFamily.bold,
    marginTop: theme.spacing.sm,
  },
  campaignRow: {
    gap: theme.spacing.md,
    paddingRight: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay.dim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  modalTitle: {
    ...theme.typeScale.h2,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  modalBody: {
    ...theme.typeScale.body,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  inputLabel: {
    ...theme.typeScale.caption,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.semibold,
  },
  input: {
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    paddingHorizontal: theme.spacing.sm,
    color: theme.colors.text.primary,
    ...theme.typeScale.body,
    fontFamily: FontFamily.medium,
  },
  errorText: {
    ...theme.typeScale.caption,
    color: theme.colors.danger,
    fontFamily: FontFamily.semibold,
  },
  modalActions: {
    marginTop: theme.spacing.xs,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    minHeight: theme.components.button.height.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
  },
  acceptBtn: {
    flex: 2,
    minHeight: theme.components.button.height.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  acceptBtnDisabled: {
    opacity: 0.45,
  },
  acceptText: {
    ...theme.typeScale.caption,
    color: theme.hybrid.onSignal,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
});
