import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrecisePanel } from '../../components/ui/PrecisePanel';
import { StatusChip } from '../../components/ui/StatusChip';
import { useRegionState } from '../../state/region';
import { B2B2C_MERCHANTS, type Merchant } from '../../state/b2b2cDirectory';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type HubFilter = 'All' | 'Nails' | 'Legal' | 'Dining';

const FILTERS: HubFilter[] = ['All', 'Nails', 'Legal', 'Dining'];

function matchesFilter(merchant: Merchant, filter: HubFilter): boolean {
  if (filter === 'All') return true;
  if (filter === 'Dining') return merchant.category === 'Restaurant';
  return merchant.category === filter;
}

function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function ServiceHubScreen() {
  const { currentCountry } = useRegionState();
  const [activeFilter, setActiveFilter] = useState<HubFilter>('All');

  const merchants = useMemo(
    () => B2B2C_MERCHANTS.filter((merchant) => matchesFilter(merchant, activeFilter)),
    [activeFilter]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Local Services</Text>
          <Text style={styles.subtitle}>Tai {currentCountry}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((filter) => {
            const active = filter === activeFilter;
            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={({ pressed }) => [
                  styles.filterChip,
                  active && styles.filterChipActive,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{filter}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.list}>
          {merchants.map((merchant) => (
            <PrecisePanel key={merchant.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.merchantName}>{merchant.name}</Text>
                  <Text style={styles.metaLine}>
                    {merchant.category} · {formatRating(merchant.rating)}
                  </Text>
                </View>
                {merchant.isAiActive ? <StatusChip state="Cleared" /> : <StatusChip state="Pending" />}
              </View>

              {merchant.isAiActive ? <Text style={styles.trustText}>AI Booking: Instant</Text> : null}

              <Pressable
                onPress={() => Alert.alert('Thong bao', 'Da gui yeu cau (Inquiry) den chu tiem')}
                style={({ pressed }) => [styles.bookButton, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.bookButtonText}>Dat lich (Book Now)</Text>
              </Pressable>
            </PrecisePanel>
          ))}
        </View>
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
  filterRow: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
  },
  filterChip: {
    minHeight: theme.components.button.height.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panel,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  filterChipActive: {
    borderColor: theme.colors.SignalBlue,
    backgroundColor: theme.hybrid.signalMutedBg,
  },
  filterChipText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
  },
  filterChipTextActive: {
    color: theme.colors.SignalBlue,
  },
  list: {
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.SoftMineralGrey,
    borderColor: theme.colors.glass.borderSoft,
    gap: theme.spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  cardTitleWrap: {
    flex: 1,
    gap: 2,
  },
  merchantName: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.hybrid.panelCoolText,
  },
  metaLine: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.hybrid.panelCoolTextMuted,
  },
  trustText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.colors.SoftEmerald,
  },
  bookButton: {
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
    backgroundColor: theme.components.button.variant.primary.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.components.button.variant.primary.text,
  },
});
