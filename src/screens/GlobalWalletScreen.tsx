import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_BRAND } from '../config/appBrand';
import { PrecisePanel } from '../components/ui/PrecisePanel';
import { StatusChip, type StatusChipState } from '../components/ui/StatusChip';
import { getStrings } from '../i18n/strings';
import { useAssistantSettings } from '../state/assistantSettings';
import { useRegionState } from '../state/region';
import { useWalletState, type Transaction } from '../state/wallet';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

function deriveState(tx: Transaction): StatusChipState {
  if (tx.type === 'topup') return 'Cleared';
  if (tx.description.toLowerCase().includes('fail')) return 'Error';
  return 'Processing';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

export function GlobalWalletScreen() {
  const wallet = useWalletState();
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const w = strings.globalWallet;
  const { currentCountry, localCurrency } = useRegionState();

  return (
    <SafeAreaView style={styles.container}>
      <PrecisePanel style={styles.header}>
        <Text style={styles.brand}>{APP_BRAND.name}</Text>
        <Text style={styles.balanceLabel}>{w.balanceLabel}</Text>
        <Text style={styles.contextLabel}>
          {currentCountry} · {localCurrency}
        </Text>
        <View style={styles.balanceRow}>
          <Ionicons name="wallet-outline" size={18} color={theme.colors.SignatureGold} />
          <Text style={styles.balanceValue}>
            {w.balanceCreditsDisplay.replace('{credits}', String(wallet.credits))}
          </Text>
        </View>
      </PrecisePanel>

      <PrecisePanel style={styles.historyPanel}>
        <Text style={styles.historyTitle}>{w.historySectionTitle}</Text>
        <ScrollView contentContainerStyle={styles.historyList} showsVerticalScrollIndicator={false}>
          {wallet.transactions.slice(0, 20).map((tx) => {
            const status = deriveState(tx);
            return (
              <View key={tx.id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowTitle}>{tx.description}</Text>
                  <Text style={styles.rowMeta}>{formatDate(tx.date)}</Text>
                </View>
                <View style={styles.rowRight}>
                  <StatusChip state={status} />
                  <Text style={[styles.rowAmount, tx.type === 'topup' ? styles.creditPlus : styles.creditMinus]}>
                    {tx.type === 'topup' ? '+' : '-'}
                    {tx.amount}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </PrecisePanel>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.DeepInkNavy,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  header: {
    backgroundColor: theme.colors.executive.card,
  },
  brand: {
    color: theme.colors.SignatureGold,
    ...theme.typeScale.h2,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.3,
  },
  balanceLabel: {
    marginTop: 10,
    color: theme.colors.text.secondary,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
  },
  balanceRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contextLabel: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
    marginTop: 4,
  },
  balanceValue: {
    color: theme.colors.SignatureGold,
    ...theme.typeScale.h1,
    fontFamily: FontFamily.bold,
  },
  historyPanel: {
    flex: 1,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: theme.colors.executive.card,
  },
  historyTitle: {
    ...theme.typeScale.h2,
    color: theme.colors.SignatureGold,
    fontFamily: FontFamily.bold,
    marginBottom: 10,
  },
  historyList: {
    gap: 10,
    paddingBottom: 20,
  },
  row: {
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    borderRadius: 10,
    backgroundColor: theme.colors.DeepInkNavy,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flex: 1,
    paddingRight: 8,
  },
  rowTitle: {
    color: theme.colors.CeolWhite,
    ...theme.typeScale.body,
    fontFamily: FontFamily.semibold,
  },
  rowMeta: {
    marginTop: 3,
    color: theme.colors.text.secondary,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  rowAmount: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
  },
  creditPlus: {
    color: theme.colors.SoftEmerald,
  },
  creditMinus: {
    color: theme.colors.RouteError,
  },
});
