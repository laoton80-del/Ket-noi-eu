import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrecisePanel } from '../../components/ui/PrecisePanel';
import { analyzePayslip, type PayslipAnalysis } from '../../services/ai/TaxCopilotClient';
import { useRegionState } from '../../state/region';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

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
      Alert.alert('Phân tích thất bại', 'Không thể đọc bảng lương lúc này. Vui lòng thử lại.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onGenerateRefundDraft = async () => {
    if (isCharging) return;
    setIsCharging(true);
    try {
      Alert.alert('Đã tạo yêu cầu', 'Hệ thống đã tiếp nhận yêu cầu tạo đơn hoàn thuế.');
    } finally {
      setIsCharging(false);
    }
  };

  const breakdownRows: BreakdownRow[] = analysis
    ? [
        { label: 'Thu nhập gộp', value: analysis.gross },
        { label: 'Thu nhập ròng', value: analysis.net },
        { label: 'Thuế đã khấu trừ', value: analysis.taxDeducted },
      ]
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Cố vấn thuế & tài chính</Text>
          <Text style={styles.subtitle}>Phân tích bảng lương và đề xuất tối ưu nghĩa vụ thuế.</Text>
        </View>

        <Pressable
          onPress={() => void onUploadPayslip()}
          style={({ pressed }) => [styles.uploadZone, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.uploadText}>Chụp/Tải lên bảng lương (Payslip)</Text>
        </Pressable>

        {isAnalyzing ? (
          <PrecisePanel style={styles.loadingPanel}>
            <ActivityIndicator color={theme.colors.SignatureGold} />
            <Text style={styles.loadingText}>Đang phân tích dữ liệu tài chính...</Text>
          </PrecisePanel>
        ) : null}

        {analysis ? (
          <PrecisePanel style={styles.resultPanel}>
            <Text style={styles.resultHeader}>Bảng phân tích tài chính</Text>
            <View style={styles.table}>
              {breakdownRows.map((row) => (
                <View key={row.label} style={styles.tableRow}>
                  <Text style={styles.tableLabel}>{row.label}</Text>
                  <Text style={styles.tableValue}>{row.value}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.adviceTitle}>Khuyến nghị AI</Text>
            <Text style={styles.adviceText}>{analysis.advice}</Text>
          </PrecisePanel>
        ) : null}

        <Pressable
          onPress={() => void onGenerateRefundDraft()}
          disabled={isCharging}
          style={({ pressed }) => [styles.footerButton, isCharging && styles.footerButtonDisabled, pressed && { opacity: 0.8 }]}
        >
          {isCharging ? <ActivityIndicator color={theme.components.button.variant.primary.text} /> : null}
          <Text style={styles.footerButtonText}>Tạo đơn hoàn thuế (30 Điểm tín dụng)</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    color: theme.hybrid.panelCoolText,
  },
  subtitle: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.hybrid.panelCoolTextMuted,
  },
  uploadZone: {
    minHeight: 130,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  uploadText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.semibold,
    color: theme.hybrid.panelCoolText,
    textAlign: 'center',
  },
  loadingPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#FFFFFF',
    borderColor: theme.hybrid.panelCoolBorder,
  },
  loadingText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: theme.hybrid.panelCoolText,
    flex: 1,
  },
  resultPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: theme.hybrid.panelCoolBorder,
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
    color: theme.hybrid.signalStrong,
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
