import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdaptiveContainer } from '../../components/layout/AdaptiveContainer';
import { QuantumShieldBadge } from '../../components/security/QuantumShieldBadge';
import { useDeviceLayout } from '../../hooks/useDeviceLayout';
import { syncWalletFromServer, useWalletState } from '../../state/wallet';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type TransactionRow = {
  id: string;
  title: string;
  amount: string;
  status: 'success';
};

function randomHexLine(length: number): string {
  const chars = '0123456789ABCDEF';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function GlobalWalletScreen() {
  const { isLandscape, isTablet, isWeb } = useDeviceLayout();
  const wallet = useWalletState();
  const showSplitView = (isTablet || isWeb) && isLandscape;
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVaultProcessing, setIsVaultProcessing] = useState(false);
  const [vaultSuccess, setVaultSuccess] = useState(false);
  const [matrixLines, setMatrixLines] = useState<string[]>([]);

  const authenticateWallet = useCallback(async (): Promise<void> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Xác thực để mở Ví Global',
      fallbackLabel: 'Dùng mã thiết bị',
      cancelLabel: 'Hủy',
    });
    setIsAuthenticated(result.success);
    if (result.success) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  useEffect(() => {
    void authenticateWallet();
  }, [authenticateWallet]);

  useEffect(() => {
    void syncWalletFromServer();
  }, []);

  useEffect(() => {
    if (!isVaultProcessing) return;

    const timer = setInterval(() => {
      setMatrixLines((prev) => {
        const next = [randomHexLine(26), randomHexLine(22), randomHexLine(24)];
        return prev.length > 12 ? next : [...prev, ...next].slice(-12);
      });
    }, 90);

    const doneTimer = setTimeout(() => {
      setIsVaultProcessing(false);
      setVaultSuccess(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1600);

    return () => {
      clearInterval(timer);
      clearTimeout(doneTimer);
    };
  }, [isVaultProcessing]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 1500);
  }, []);

  const transactionRows = useMemo<TransactionRow[]>(
    () =>
      wallet.transactions.slice(0, 20).map((tx) => ({
        id: tx.id,
        title: tx.description,
        amount: `${tx.type === 'topup' ? '+' : '-'}${Math.abs(tx.amount).toLocaleString('vi-VN')}`,
        status: 'success',
      })),
    [wallet.transactions]
  );

  const startCrossBorderTransfer = () => {
    if (isVaultProcessing) return;
    setVaultSuccess(false);
    setMatrixLines([]);
    setIsVaultProcessing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <AdaptiveContainer contentStyle={styles.unlockLayout}>
          <View style={styles.unlockCard}>
            <Ionicons name="lock-closed-outline" size={28} color={theme.colors.primary} />
            <Text style={styles.unlockTitle}>Ví Global đang khóa</Text>
            <Text style={styles.unlockHint}>Vui lòng xác thực sinh trắc học để truy cập số dư và lịch sử giao dịch.</Text>
            <Pressable
              onPress={() => void authenticateWallet()}
              style={({ pressed }) => [styles.unlockButton, pressed && { opacity: 0.86 }]}
            >
              <Text style={styles.unlockButtonText}>Mở khóa Ví Global</Text>
            </Pressable>
          </View>
        </AdaptiveContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AdaptiveContainer contentStyle={[styles.layout, showSplitView ? styles.layoutSplit : styles.layoutStack]}>
        <View style={[styles.balancePane, showSplitView && styles.balancePaneSplit]}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Số dư ví toàn cầu</Text>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.success} />
            </View>
            <Text style={styles.balanceValue}>{wallet.credits.toLocaleString('vi-VN')} Điểm tín dụng</Text>
            <Text style={styles.balanceHint}>Đồng bộ bảo mật theo hồ sơ quốc gia và giao dịch thời gian thực.</Text>
            <QuantumShieldBadge />

            <Pressable
              onPress={() => {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
              style={({ pressed }) => [styles.topupButton, pressed && { opacity: 0.84 }]}
            >
              <Ionicons name="add-circle-outline" size={18} color={theme.components.button.variant.primary.text} />
              <Text style={styles.topupButtonText}>Nạp Tiền</Text>
            </Pressable>
          </View>

          <View style={styles.vaultCard}>
            <View style={styles.vaultHeader}>
              <Text style={styles.vaultTitle}>Web3 Cross-Border Vault</Text>
              <Ionicons name="lock-closed-outline" size={16} color={theme.colors.primaryBright} />
            </View>

            <Text style={styles.vaultHint}>Mã hóa đa lớp, xác nhận phân tán và thanh toán xuyên biên giới tức thời.</Text>

            {isVaultProcessing ? (
              <View style={styles.matrixWrap}>
                {matrixLines.map((line, idx) => (
                  <Text key={`matrix_${idx}`} style={styles.matrixLine}>
                    {line}
                  </Text>
                ))}
              </View>
            ) : vaultSuccess ? (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.vaultSuccessWrap}>
                <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.success} />
                <Text style={styles.vaultSuccessText}>Giao dịch phi tập trung đã xác nhận thành công.</Text>
              </Animated.View>
            ) : null}

            <Pressable
              onPress={startCrossBorderTransfer}
              style={({ pressed }) => [styles.vaultButton, pressed && { opacity: 0.84 }]}
            >
              <Text style={styles.vaultButtonText}>Chuyển tiền xuyên biên giới (0% Phí)</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.historyPane}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Lịch sử giao dịch</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.historyList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          >
            {transactionRows.map((row) => (
              <Animated.View key={row.id} entering={FadeIn} exiting={FadeOut} layout={Layout.springify()}>
                <View style={styles.historyItem}>
                  <View style={styles.historyItemLeft}>
                    <Text style={styles.historyItemTitle}>{row.title}</Text>
                    <Text style={styles.historyItemMeta}>
                      Đã hoàn tất
                    </Text>
                  </View>
                  <Text style={[styles.historyAmount, styles.amountSuccess]}>
                    {row.amount}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      </AdaptiveContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  },
  layout: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  layoutSplit: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  layoutStack: {
    flexDirection: 'column',
  },
  unlockLayout: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  unlockCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  unlockTitle: {
    ...theme.typeScale.h2,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  unlockHint: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  unlockButton: {
    marginTop: theme.spacing.sm,
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
    backgroundColor: theme.components.button.variant.primary.background,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  unlockButtonText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.components.button.variant.primary.text,
  },
  balancePane: {
    width: '100%',
  },
  balancePaneSplit: {
    width: '40%',
    minWidth: 320,
  },
  vaultCard: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.backgroundDeep,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  vaultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vaultTitle: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
  },
  vaultHint: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  matrixWrap: {
    minHeight: 108,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: 2,
  },
  matrixLine: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    color: theme.colors.success,
  },
  vaultSuccessWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  vaultSuccessText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    color: theme.colors.success,
    flex: 1,
  },
  vaultButton: {
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  vaultButtonText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.hybrid.onSignal,
    textAlign: 'center',
  },
  historyPane: {
    flex: 1,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.glass.surface,
    padding: theme.spacing.md,
  },
  balanceCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: theme.elevation.card.shadowOffset,
    shadowOpacity: theme.elevation.card.shadowOpacity,
    shadowRadius: theme.elevation.card.shadowRadius,
    elevation: theme.elevation.card.elevation,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
  },
  balanceValue: {
    ...theme.typeScale.h1,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  balanceHint: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  topupButton: {
    marginTop: theme.spacing.sm,
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
    backgroundColor: theme.components.button.variant.primary.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  topupButtonText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.components.button.variant.primary.text,
  },
  historyHeader: {
    marginBottom: theme.spacing.sm,
  },
  historyTitle: {
    ...theme.typeScale.h2,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  historyList: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  historyItem: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyItemLeft: {
    flex: 1,
    paddingRight: theme.spacing.sm,
    gap: 2,
  },
  historyItemTitle: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.primary,
  },
  historyItemMeta: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  historyAmount: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
  },
  amountSuccess: {
    color: theme.colors.success,
  },
  amountPending: {
    color: theme.colors.primary,
  },
});
