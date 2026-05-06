import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/routes';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles, mergeWebClassNames } from '../../utils/applyWebStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Mock multi-stream revenue engine — CFO aggregation (replace with live API). */
const MASTER_PROFIT_MOCK = {
  mrrEur: 125_400,
  aiTelecomEur: 14_250,
  wholesaleCommissionEur: 22_800,
  sponsoredAdsBurnEur: 8500,
  stripeMarkupEur: 18_900,
  grossMarginPct: 88.5,
  openAiCostEur: 12_400,
  twilioCostEur: 8200,
  /** Normalized 0–1 series for sparkline placeholder (7 buckets). */
  revenueTrend7d: [0.62, 0.71, 0.58, 0.84, 0.79, 0.91, 0.88] as const,
  marginTrend7d: [0.86, 0.87, 0.885, 0.88, 0.882, 0.884, 0.885] as const,
} as const;

function formatEurInteger(value: number): string {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })} EUR`;
}

type RevenueAccent = 'gold' | 'green';

type RevenueTileProps = {
  readonly title: string;
  readonly amountLabel: string;
  readonly subtitle: string;
  readonly accent: RevenueAccent;
  readonly isWideTile: boolean;
};

function RevenueTile({ title, amountLabel, subtitle, accent, isWideTile }: RevenueTileProps) {
  const borderGlow =
    accent === 'green'
      ? { borderColor: 'rgba(0, 255, 102, 0.45)', shadowColor: '#00FF66' }
      : { borderColor: theme.colors.glass.border, shadowColor: theme.colors.primary };
  return (
    <View
      style={[styles.revenueTile, isWideTile && styles.revenueTileWide, borderGlow]}
      className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}
    >
      <View style={styles.tileHeaderRow}>
        <Ionicons
          name={accent === 'green' ? 'trending-up' : 'analytics'}
          size={18}
          color={accent === 'green' ? theme.colors.success : theme.colors.primaryBright}
        />
        <Text style={styles.tileTitle} numberOfLines={3}>
          {title}
        </Text>
      </View>
      <Text style={[styles.tileAmount, accent === 'green' && styles.tileAmountGreen]}>{amountLabel}</Text>
      <Text style={styles.tileSubtitle}>{subtitle}</Text>
      <View style={styles.miniSparkRow} accessibilityLabel="Biểu đồ minh họa (mock)">
        {MASTER_PROFIT_MOCK.revenueTrend7d.map((h, i) => (
          <View key={`spark-${i.toString()}`} style={styles.miniSparkWrap}>
            <View style={[styles.miniSparkBar, { height: 8 + Math.round(h * 22) }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

type BarChartPlaceholderProps = {
  readonly title: string;
  readonly values: readonly number[];
  readonly barColor: string;
};

function BarChartPlaceholder({ title, values, barColor }: BarChartPlaceholderProps) {
  const max = Math.max(...values, 1e-6);
  return (
    <View style={styles.chartCard} className={applyWebStyles('kn-glass')}>
      <Text style={styles.chartTitle}>{title}</Text>
      <Text style={styles.chartHint}>Placeholder — dữ liệu mock</Text>
      <View style={styles.barRow}>
        {values.map((v, i) => (
          <View key={`bar-${i.toString()}`} style={styles.barCol}>
            <View style={[styles.barFill, { height: `${Math.round((v / max) * 100)}%`, backgroundColor: barColor }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function AdminProfitDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const isWide = width >= 1040;
  const isMedium = width >= 640;

  const tileBasisStyle = useMemo((): ViewStyle => {
    if (isWide) {
      return { flexBasis: '31%', maxWidth: '32%' };
    }
    if (isMedium) {
      return { flexBasis: '47%', maxWidth: '48%' };
    }
    return { flexBasis: '100%', maxWidth: '100%' };
  }, [isMedium, isWide]);

  const totalStreamsEur = useMemo(() => {
    return (
      MASTER_PROFIT_MOCK.mrrEur +
      MASTER_PROFIT_MOCK.aiTelecomEur +
      MASTER_PROFIT_MOCK.wholesaleCommissionEur +
      MASTER_PROFIT_MOCK.sponsoredAdsBurnEur +
      MASTER_PROFIT_MOCK.stripeMarkupEur
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          CFO / Treasury
        </Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero} className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}>
          <Text style={styles.heroTitle}>💰 TỔNG LÃNH SỰ TÀI CHÍNH (MASTER PROFIT DASHBOARD)</Text>
          <Text style={styles.heroSub}>
            Theo dõi đa luồng doanh thu · SaaS định kỳ · Viễn thông AI · Hoa hồng sỉ · Ads · Stripe — cập nhật mock
            real-time.
          </Text>
          <View style={styles.heroKpiRow}>
            <View style={styles.heroKpiPill} className={applyWebStyles('kn-glass')}>
              <Text style={styles.heroKpiLabel}>Tổng 5 luồng (mock)</Text>
              <Text style={styles.heroKpiValue}>{formatEurInteger(totalStreamsEur)}</Text>
            </View>
            <View style={[styles.heroKpiPill, styles.heroKpiPillGreen]} className={applyWebStyles('kn-glass')}>
              <Text style={styles.heroKpiLabel}>Biên gộp</Text>
              <Text style={[styles.heroKpiValue, styles.heroKpiValueGreen]}>
                {MASTER_PROFIT_MOCK.grossMarginPct.toFixed(1)}% 🚀
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.widgetGrid, isWide && styles.widgetGridWide]}>
          <View style={tileBasisStyle}>
            <RevenueTile
              title="Tổng Doanh Thu Định Kỳ (MRR)"
              amountLabel={`${formatEurInteger(MASTER_PROFIT_MOCK.mrrEur)}/tháng`}
              subtitle="Pro / Power subscriptions (ledger + display blend — mock)."
              accent="gold"
              isWideTile={isWide}
            />
          </View>
          <View style={tileBasisStyle}>
            <RevenueTile
              title="Tiền Lãi AI & Viễn Thông"
              amountLabel={formatEurInteger(MASTER_PROFIT_MOCK.aiTelecomEur)}
              subtitle="Virtual DID lease + 0,50 EUR/min voice overages (mock)."
              accent="green"
              isWideTile={isWide}
            />
          </View>
          <View style={tileBasisStyle}>
            <RevenueTile
              title="Hoa Hồng Chốt Đơn Sỉ (1%)"
              amountLabel={formatEurInteger(MASTER_PROFIT_MOCK.wholesaleCommissionEur)}
              subtitle="AI-closed wholesale GMV take-rate (mock)."
              accent="green"
              isWideTile={isWide}
            />
          </View>
          <View style={tileBasisStyle}>
            <RevenueTile
              title="Tiền Đốt Đấu Thầu Quảng Cáo"
              amountLabel={formatEurInteger(MASTER_PROFIT_MOCK.sponsoredAdsBurnEur)}
              subtitle="Sponsored listings — daily burn (mock)."
              accent="gold"
              isWideTile={isWide}
            />
          </View>
          <View style={tileBasisStyle}>
            <RevenueTile
              title="Lãi Ròng Chênh Lệch Cổng Thanh Toán (1.0%)"
              amountLabel={formatEurInteger(MASTER_PROFIT_MOCK.stripeMarkupEur)}
              subtitle="Stripe variable mark-up + micro-txn cover (mock)."
              accent="green"
              isWideTile={isWide}
            />
          </View>
        </View>

        <View style={styles.bleedPanel} className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}>
          <View style={styles.bleedTitleRow}>
            <Ionicons name="pulse" size={22} color={theme.colors.RouteError} />
            <Text style={styles.bleedTitle}>THE &quot;BLEEDING&quot; ALERT — COGS vs Doanh thu</Text>
          </View>
          <Text style={styles.bleedBody}>
            OpenAI (LLM + Realtime + Vision):{' '}
            <Text style={styles.bleedEm}>{formatEurInteger(MASTER_PROFIT_MOCK.openAiCostEur)}</Text>
            {' · '}
            Twilio (SMS + Voice trunk): <Text style={styles.bleedEm}>{formatEurInteger(MASTER_PROFIT_MOCK.twilioCostEur)}</Text>
          </Text>
          <View style={styles.marginHero}>
            <Text style={styles.marginHeroLabel}>Tỷ suất lợi nhuận Gộp (Gross Margin)</Text>
            <Text style={styles.marginHeroValue}>
              {MASTER_PROFIT_MOCK.grossMarginPct.toFixed(1)}% 🚀
            </Text>
            <Text style={styles.marginHeroHint}>(Revenue − biến phí OpenAI/Twilio) ÷ Revenue — mock CFO lens.</Text>
          </View>
          <View style={styles.cohortBars}>
            <View style={styles.cohortBarTrack}>
              <View style={[styles.cohortBarFill, { width: '76%', backgroundColor: 'rgba(0,255,102,0.35)' }]} />
            </View>
            <Text style={styles.cohortCaption}>Doanh thu định danh (mock fill)</Text>
            <View style={styles.cohortBarTrack}>
              <View style={[styles.cohortBarFill, { width: '11.5%', backgroundColor: 'rgba(229,115,115,0.55)' }]} />
            </View>
            <Text style={styles.cohortCaption}>COGS viễn thông + AI (mock fill)</Text>
          </View>
        </View>

        <View style={[styles.chartsRow, isMedium && styles.chartsRowWide]}>
          <View style={[styles.chartCol, isMedium && styles.chartColHalf]}>
            <BarChartPlaceholder
              title="Doanh thu gộp 7 ngày (mock)"
              values={[62, 71, 58, 84, 79, 91, 88]}
              barColor="rgba(197, 160, 89, 0.85)"
            />
          </View>
          <View style={[styles.chartCol, isMedium && styles.chartColHalf]}>
            <BarChartPlaceholder
              title="Biên lợi nhuận gộp — 7 ngày (mock)"
              values={MASTER_PROFIT_MOCK.marginTrend7d.map((t) => Math.round((t - 0.8) * 500))}
              barColor="rgba(0, 255, 102, 0.75)"
            />
          </View>
        </View>

        <View style={styles.footerNote} className={applyWebStyles('kn-glass')}>
          <Text style={styles.footerNoteText}>
            Dữ liệu minh họa nội bộ — không dùng cho báo cáo kiểm toán. Kết nối BigQuery / Stripe Sigma trong phase kế
            tiếp.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  backBtn: { padding: 8 },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  topBarSpacer: { width: 40 },
  scroll: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl * 2,
    gap: theme.spacing.md,
  },
  scrollWide: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(12, 24, 44, 0.55)',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  heroTitle: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  heroSub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  heroKpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  heroKpiPill: {
    flexGrow: 1,
    minWidth: 140,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 4,
  },
  heroKpiPillGreen: {
    borderColor: 'rgba(0, 255, 102, 0.35)',
  },
  heroKpiLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
  },
  heroKpiValue: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
  },
  heroKpiValueGreen: {
    color: theme.colors.success,
  },
  widgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'flex-start',
  },
  widgetGridWide: {
    columnGap: theme.spacing.md,
  },
  revenueTile: {
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(8, 18, 32, 0.55)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
    width: '100%',
  },
  revenueTileWide: {
    minHeight: 168,
  },
  tileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tileTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
    lineHeight: 18,
  },
  tileAmount: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
  },
  tileAmountGreen: {
    color: theme.colors.success,
  },
  tileSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.tertiary,
    lineHeight: 16,
  },
  miniSparkRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 4,
    height: 34,
  },
  miniSparkWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  miniSparkBar: {
    width: '70%',
    borderRadius: 4,
    backgroundColor: 'rgba(197, 160, 89, 0.55)',
  },
  bleedPanel: {
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: 'rgba(229, 115, 115, 0.55)',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(40, 12, 16, 0.35)',
  },
  bleedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bleedTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.RouteError,
    letterSpacing: 0.3,
  },
  bleedBody: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  bleedEm: {
    fontFamily: FontFamily.bold,
    color: theme.colors.PendingAmber,
  },
  marginHero: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(0, 255, 102, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 102, 0.35)',
    gap: 4,
  },
  marginHeroLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.secondary,
  },
  marginHeroValue: {
    fontSize: 28,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.success,
  },
  marginHeroHint: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.tertiary,
    lineHeight: 16,
  },
  cohortBars: {
    marginTop: theme.spacing.md,
    gap: 6,
  },
  cohortBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  cohortBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  cohortCaption: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.tertiary,
  },
  chartsRow: {
    gap: theme.spacing.md,
  },
  chartsRowWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  chartCol: {
    width: '100%',
  },
  chartColHalf: {
    flex: 1,
    minWidth: 0,
  },
  chartCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
    minHeight: 160,
  },
  chartTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  chartHint: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.tertiary,
  },
  barRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    minHeight: 100,
    marginTop: theme.spacing.sm,
  },
  barCol: {
    flex: 1,
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '78%',
    minHeight: 4,
    borderRadius: 6,
  },
  footerNote: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  footerNoteText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
});
