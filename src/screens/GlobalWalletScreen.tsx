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
import { formatDate as formatLocalizedDate } from '../utils/formatters';

function deriveState(tx: Transaction): StatusChipState {
  if (tx.type === 'topup') return 'Cleared';
  if (tx.description.toLowerCase().includes('fail')) return 'Error';
  return 'Processing';
}

export function GlobalWalletScreen() {
  const wallet = useWalletState();
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const w = strings.walletTopUp;
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
                  <Text style={styles.rowMeta}>{formatLocalizedDate(tx.date)}</Text>
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
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderColor: theme.hybrid.panelCoolBorder,
  },
  brand: {
    color: theme.hybrid.panelCoolText,
    ...theme.typeScale.h2,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.3,
  },
  balanceLabel: {
    marginTop: 10,
    color: theme.hybrid.panelCoolTextMuted,
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
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.semibold,
    marginTop: 4,
  },
  balanceValue: {
    color: theme.hybrid.signalStrong,
    ...theme.typeScale.h1,
    fontFamily: FontFamily.bold,
  },
  historyPanel: {
    flex: 1,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderColor: theme.hybrid.panelCoolBorder,
  },
  historyTitle: {
    ...theme.typeScale.h2,
    color: theme.hybrid.panelCoolText,
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
    backgroundColor: '#FFFFFF',
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
    color: theme.hybrid.panelCoolText,
    ...theme.typeScale.body,
    fontFamily: FontFamily.semibold,
  },
  rowMeta: {
    marginTop: 3,
    color: theme.hybrid.panelCoolTextMuted,
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
