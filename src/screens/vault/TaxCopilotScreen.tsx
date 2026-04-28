import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrecisePanel } from '../../components/ui/PrecisePanel';
import { analyzePayslip, type PayslipAnalysis } from '../../services/ai/TaxCopilotClient';
import { useRegionState } from '../../state/region';
import { chargeWalletServer } from '../../state/wallet';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { generateChargeKey } from '../../utils/idempotency';

const MOCK_BASE64_PAYSLIP = 'mock_base64_payslip_payload';

type BreakdownRow = {
  label: string;
  value: string;
};

export function TaxCopilotScreen() {
  const { currentCountry } = useRegionState();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PayslipAnalysis | null>(null);
  const [isCharging, setIsCharging] = useState(false);

  const onUploadPayslip = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzePayslip(MOCK_BASE64_PAYSLIP, currentCountry);
      setAnalysis(result);
    } catch {
      Alert.alert('Phan tich that bai', 'Khong the doc bang luong luc nay. Vui long thu lai.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onGenerateRefundDraft = async () => {
    if (isCharging) return;
    setIsCharging(true);
    try {
      const chargeResult = await chargeWalletServer('tax_refund_draft', generateChargeKey('tax_refund'));
      if (!chargeResult.ok) {
        if (chargeResult.error === 'insufficient_funds') {
          Alert.alert('Khong du Credits', 'Ban can nap them Credits de sinh don Hoan Thue.');
        } else {
          Alert.alert('Thanh toan that bai', 'Khong the tru Credits luc nay. Vui long thu lai sau.');
        }
        return;
      }
      Alert.alert('Da tao yeu cau', 'He thong da tiep nhan yeu cau sinh don Hoan Thue.');
    } finally {
      setIsCharging(false);
    }
  };

  const breakdownRows: BreakdownRow[] = analysis
    ? [
        { label: 'Gross Income', value: analysis.gross },
        { label: 'Net Income', value: analysis.net },
        { label: 'Tax Deducted', value: analysis.taxDeducted },
      ]
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Co van Thue & Tai chinh</Text>
          <Text style={styles.subtitle}>Phan tich bang luong va de xuat toi uu nghia vu thue.</Text>
        </View>

        <Pressable
          onPress={() => void onUploadPayslip()}
          style={({ pressed }) => [styles.uploadZone, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.uploadText}>Chup/Tai len Bang luong (Payslip)</Text>
        </Pressable>

        {isAnalyzing ? (
          <PrecisePanel style={styles.loadingPanel}>
            <ActivityIndicator color={theme.colors.SignatureGold} />
            <Text style={styles.loadingText}>Dang phan tich du lieu tai chinh...</Text>
          </PrecisePanel>
        ) : null}

        {analysis ? (
          <PrecisePanel style={styles.resultPanel}>
            <Text style={styles.resultHeader}>Financial Breakdown</Text>
            <View style={styles.table}>
              {breakdownRows.map((row) => (
                <View key={row.label} style={styles.tableRow}>
                  <Text style={styles.tableLabel}>{row.label}</Text>
                  <Text style={styles.tableValue}>{row.value}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.adviceTitle}>Khuyen nghi AI</Text>
            <Text style={styles.adviceText}>{analysis.advice}</Text>
          </PrecisePanel>
        ) : null}

        <Pressable
          onPress={() => void onGenerateRefundDraft()}
          disabled={isCharging}
          style={({ pressed }) => [styles.footerButton, isCharging && styles.footerButtonDisabled, pressed && { opacity: 0.8 }]}
        >
          {isCharging ? <ActivityIndicator color={theme.components.button.variant.primary.text} /> : null}
          <Text style={styles.footerButtonText}>Sinh don Hoan Thue (30 Credits)</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.DeepInkNavy,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typeScale.h2,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.CeolWhite,
  },
  subtitle: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  uploadZone: {
    minHeight: 130,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  uploadText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  loadingPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.SoftMineralGrey,
  },
  loadingText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: theme.hybrid.panelCoolText,
    flex: 1,
  },
  resultPanel: {
    backgroundColor: theme.colors.SoftMineralGrey,
    borderColor: theme.colors.glass.borderSoft,
    gap: theme.spacing.sm,
  },
  resultHeader: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.hybrid.panelCoolText,
  },
  table: {
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glass.borderSoft,
    paddingHorizontal: theme.spacing.sm,
    minHeight: 42,
    backgroundColor: theme.colors.CeolWhite,
  },
  tableLabel: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.hybrid.panelCoolTextMuted,
  },
  tableValue: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.hybrid.panelCoolText,
  },
  adviceTitle: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.colors.SignalBlue,
  },
  adviceText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: theme.hybrid.panelCoolText,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  footerButton: {
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
    backgroundColor: theme.components.button.variant.primary.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  footerButtonDisabled: {
    opacity: 0.65,
  },
  footerButtonText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.components.button.variant.primary.text,
  },
});
