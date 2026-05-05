import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { Alert, Animated, Easing, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';
import type { AutoPilotMarketingConfig } from '../../services/marketing/AutoTriggerService';
import { runOmniBrainDemoScenarios } from '../../services/marketing/AutoPilotBrain';
import {
  B2C_GACHA_GLOBAL_PUSH_LOCAL_HOUR,
  getAutoPilotMarketingConfig,
  setAutoPilotStrategy,
} from '../../services/marketing/AutoTriggerService';
import type { OmniActivityLogEntry, OmniChannelMasterSwitches } from '../../services/marketing/OmniChannelService';
import {
  getOmniChannelActivityLog,
  getOmniChannelMasterSwitches,
  seedOmniChannelDemoLogIfEmpty,
  setOmniChannelMasterSwitches,
} from '../../services/marketing/OmniChannelService';
import { getAiFintechScannerTelemetry, getFraudLockedAccounts } from '../../services/admin/AutoFraudEngine';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  adjustUserCredits,
  adminPricingContext,
  approvePayout,
  computeNetProfitMajorUsd,
  getAdminDashboardDataset,
  launchCampaign,
  launchGlobalFlashSale,
  sendRescueCredits,
  type AdminDashboardDataset,
  type AffiliateLedgerEntry,
  type OverageAccount,
  type UserOpsRow,
  type VipWhitelistRow,
} from '../../services/admin/AdminFinanceService';
import type { RootStackParamList } from '../../navigation/routes';
import { PRICING_BASELINE_CURRENCY } from '../../config/pricingConfig';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles, mergeWebClassNames } from '../../utils/applyWebStyles';
import { formatCurrency } from '../../utils/currencyFormatter';
import { fetchAdminTourismStats, type AdminTourismStatsPayload } from '../../services/viGlobalAdminApi';
import { formatNetworkFailureMessage, isRestApiConfigured } from '../../services/apiClient';

const COMMAND_NAVY = '#050B14';
const NEON_CYAN = '#22d3ee';
const NEON_MAGENTA = '#e879f9';

function formatVigCompact(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

const vnRadarStyles = StyleSheet.create({
  section: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    backgroundColor: COMMAND_NAVY,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.45)',
    gap: theme.spacing.md,
    shadowColor: NEON_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  sectionTitle: {
    fontFamily: FontFamily.extrabold,
    fontSize: 16,
    color: NEON_CYAN,
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: 'rgba(226, 232, 240, 0.72)',
    lineHeight: 18,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flexGrow: 1,
    minWidth: 140,
    flexBasis: '45%',
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 28, 52, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(232, 121, 249, 0.35)',
    gap: 6,
  },
  kpiLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: 'rgba(148, 163, 184, 0.95)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  kpiValue: {
    fontFamily: FontFamily.extrabold,
    fontSize: 20,
    color: '#f8fafc',
  },
  kpiHint: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: 'rgba(34, 211, 238, 0.85)',
  },
  heatRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 4,
    minHeight: 78,
  },
  heatBarWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  heatBar: {
    width: '100%',
    borderRadius: 6,
    backgroundColor: 'rgba(34, 211, 238, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.55)',
    minHeight: 8,
  },
  heatLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: 'rgba(226,232,240,0.75)',
  },
  heatCount: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: NEON_CYAN,
  },
  heatTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: 'rgba(248, 250, 252, 0.9)',
    marginBottom: 4,
  },
  topList: {
    gap: 8,
    marginTop: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderLeftWidth: 3,
    borderLeftColor: NEON_MAGENTA,
  },
  topRank: {
    fontFamily: FontFamily.extrabold,
    fontSize: 14,
    color: NEON_MAGENTA,
    minWidth: 22,
  },
  topBody: { flex: 1 },
  topTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#f1f5f9',
  },
  topMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: 'rgba(148,163,184,0.9)',
    marginTop: 2,
  },
  topBookings: {
    fontFamily: FontFamily.extrabold,
    fontSize: 13,
    color: NEON_CYAN,
  },
  errText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#fca5a5',
    lineHeight: 18,
  },
  skeletonWrap: { gap: 12 },
  skeletonBar: {
    height: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 211, 238, 0.22)',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skeletonCard: {
    width: '47%',
    flexGrow: 1,
    minHeight: 72,
    borderRadius: 14,
    backgroundColor: 'rgba(232, 121, 249, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232, 121, 249, 0.25)',
  },
});

function TourismStatusHeatmap({
  split,
}: Readonly<{
  split: AdminTourismStatsPayload['bookingStatusSplit'];
}>): ReactElement {
  const entries = [
    { key: 'PENDING' as const, label: 'PND' },
    { key: 'CONFIRMED' as const, label: 'CFM' },
    { key: 'COMPLETED' as const, label: 'OK' },
    { key: 'CANCELLED' as const, label: 'X' },
  ];
  const max = Math.max(1, ...entries.map((e) => split[e.key]));
  return (
    <View>
      <Text style={vnRadarStyles.heatTitle}>Booking status pulse</Text>
      <View style={vnRadarStyles.heatRow}>
        {entries.map((e) => {
          const n = split[e.key];
          const h = Math.max(10, Math.round((n / max) * 52));
          return (
            <View key={e.key} style={vnRadarStyles.heatBarWrap}>
              <View style={[vnRadarStyles.heatBar, { height: h }]} />
              <Text style={vnRadarStyles.heatLabel}>{e.label}</Text>
              <Text style={vnRadarStyles.heatCount}>{n}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function VietnamRadarSkeleton(): ReactElement {
  const pulse = useRef(new Animated.Value(0.28)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.85,
          duration: 720,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.28,
          duration: 720,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={vnRadarStyles.skeletonWrap}>
      {[0, 1, 2].map((k) => (
        <Animated.View key={k} style={[vnRadarStyles.skeletonBar, { opacity: pulse }]} />
      ))}
      <View style={vnRadarStyles.skeletonGrid}>
        {[0, 1, 2, 3].map((k) => (
          <Animated.View key={`c${k}`} style={[vnRadarStyles.skeletonCard, { opacity: pulse }]} />
        ))}
      </View>
    </View>
  );
}

function fmtLedger(v: number): string {
  return formatCurrency(v, PRICING_BASELINE_CURRENCY);
}

type AutoPilotStrategyRowProps = {
  isWide: boolean;
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
};

function AutoPilotStrategyRow({ isWide, label, hint, value, onValueChange }: AutoPilotStrategyRowProps) {
  return (
    <View
      style={[styles.autoPilotRow, isWide && styles.autoPilotRowWide, value && styles.autoPilotRowOn]}
      className={mergeWebClassNames('kn-glass', value ? 'kn-neon-b2b' : undefined)}
    >
      <View style={styles.autoPilotRowText}>
        <Text style={styles.autoPilotRowLabel}>{label}</Text>
        <Text style={styles.autoPilotRowHint}>{hint}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

type OmniPulseDotProps = {
  active: boolean;
  variant: 'gold' | 'sos';
};

function OmniPulseDot({ active, variant }: OmniPulseDotProps) {
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    if (!active) {
      opacity.setValue(0.35);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 780,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.38,
          duration: 780,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [active, opacity]);
  const baseColor = variant === 'gold' ? theme.colors.primary : theme.colors.RouteError;
  return (
    <Animated.View
      style={[styles.omniPulseDot, { backgroundColor: baseColor, opacity }]}
      className={mergeWebClassNames(
        active && variant === 'gold' ? 'kn-neon-b2b' : undefined,
        active && variant === 'sos' ? 'kn-neon-sos' : undefined
      )}
    />
  );
}

function formatOmniLogTime(timestampMs: number): string {
  const d = new Date(timestampMs);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function AdminDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width, height } = useWindowDimensions();
  const isWide = width >= 1080;
  const isShortViewport = height < 700;
  const [autoPilot, setAutoPilot] = useState<AutoPilotMarketingConfig>(() => getAutoPilotMarketingConfig());
  const [omni, setOmni] = useState<OmniChannelMasterSwitches>(() => getOmniChannelMasterSwitches());
  const [omniLog, setOmniLog] = useState<readonly OmniActivityLogEntry[]>(() => getOmniChannelActivityLog());
  const [fraudScanTick, setFraudScanTick] = useState(0);
  const [dataset, setDataset] = useState<AdminDashboardDataset | null>(null);
  const [flashSaleOn, setFlashSaleOn] = useState(false);
  const [campaignGoal, setCampaignGoal] = useState('Tăng khách B2B mới tại Đức');
  const [adCopy, setAdCopy] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [vipUserId, setVipUserId] = useState('');
  const [vipMode, setVipMode] = useState<'FREE' | 'AT-COST'>('FREE');
  const [loading, setLoading] = useState(true);
  const [tourismStats, setTourismStats] = useState<AdminTourismStatsPayload | null>(null);
  const [tourismLoading, setTourismLoading] = useState(true);
  const [tourismError, setTourismError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      if (!isRestApiConfigured()) {
        setTourismError('Chưa cấu hình EXPO_PUBLIC_REST_API_BASE.');
        setTourismLoading(false);
        return;
      }
      setTourismLoading(true);
      setTourismError(null);
      try {
        const r = await fetchAdminTourismStats();
        if (r.ok) {
          setTourismStats(r.data);
        } else {
          setTourismError(r.error);
        }
      } catch (e) {
        setTourismError(formatNetworkFailureMessage(e));
      } finally {
        setTourismLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      const data = await getAdminDashboardDataset();
      setDataset(data);
      setAdCopy(`Kết Nối Global AI Ads: ${campaignGoal}. Ưu đãi 24h cho cộng đồng kiều bào.`);
      setLoading(false);
    })();
  }, [campaignGoal]);

  useEffect(() => {
    seedOmniChannelDemoLogIfEmpty();
    setOmniLog(getOmniChannelActivityLog());
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setOmniLog(getOmniChannelActivityLog());
      setFraudScanTick((n) => n + 1);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setFraudScanTick((n) => n + 1);
    }, [])
  );

  const aiFintechScanner = useMemo(() => getAiFintechScannerTelemetry(), [fraudScanTick]);
  const fraudLockedSnapshot = useMemo(() => [...getFraudLockedAccounts()], [fraudScanTick]);

  const syncOmni = (patch: Partial<OmniChannelMasterSwitches>): void => {
    setOmni(setOmniChannelMasterSwitches(patch));
    setOmniLog([...getOmniChannelActivityLog()]);
  };

  const netProfit = useMemo(() => {
    if (!dataset) return 0;
    return computeNetProfitMajorUsd(dataset.revenue, dataset.costs);
  }, [dataset]);

  if (loading || !dataset) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <Text style={styles.title}>Grand Admin Dashboard</Text>
          <Text style={styles.subtitle}>Đang tải CFO command center...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredUsers = dataset.userOps.filter((u) =>
    `${u.userId} ${u.displayName}`.toLowerCase().includes(userQuery.trim().toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isWide && styles.contentWide,
          isShortViewport && styles.contentCompactHeight,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header} className={applyWebStyles('kn-glass kn-neon-b2b')}>
          <Text style={styles.title}>Grand Admin Dashboard</Text>
          <Text style={styles.subtitle}>CFO + CPO Control Tower · Ultimate Master Blueprint</Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate('AdminProfitDashboard')}
          style={({ pressed }) => [styles.profitDashNav, pressed && { opacity: 0.9 }]}
          className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}
          accessibilityRole="button"
          accessibilityLabel="Master Profit Dashboard — CFO theo dõi đa luồng doanh thu"
        >
          <Ionicons name="cash" size={24} color={theme.colors.primaryBright} />
          <View style={styles.profitDashNavTextCol}>
            <Text style={styles.profitDashNavTitle}>💰 MASTER PROFIT DASHBOARD</Text>
            <Text style={styles.profitDashNavSub}>MRR · AI Viễn thông · Hoa hồng sỉ · Ads · Stripe + Gross Margin</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={theme.colors.primaryBright} />
        </Pressable>

        <View style={vnRadarStyles.section}>
          <Text style={vnRadarStyles.sectionTitle}>🇻🇳 Vietnam Inbound Radar</Text>
          <Text style={vnRadarStyles.sectionSub}>
            Live telemetry · +84 hospitality graph · Inbound tourism bookings (super-admin API).
          </Text>

          {tourismLoading ? <VietnamRadarSkeleton /> : null}

          {!tourismLoading && tourismError ? (
            <Text style={vnRadarStyles.errText}>
              {tourismError}
              {'\n'}
              Requires REST JWT for a user with Role.ADMIN on the server.
            </Text>
          ) : null}

          {!tourismLoading && !tourismError && tourismStats ? (
            <>
              <View style={vnRadarStyles.kpiRow}>
                <View style={vnRadarStyles.kpiCard}>
                  <Text style={vnRadarStyles.kpiLabel}>GBV (lifetime)</Text>
                  <Text style={vnRadarStyles.kpiValue}>
                    {formatVigCompact(tourismStats.totalTourismRevenueVIG)} VIG
                  </Text>
                  <Text style={vnRadarStyles.kpiHint}>Σ TourismBooking.totalPaidVIG (excl. cancelled)</Text>
                </View>
                <View style={vnRadarStyles.kpiCard}>
                  <Text style={vnRadarStyles.kpiLabel}>ViGlobal revenue cut</Text>
                  <Text style={[vnRadarStyles.kpiValue, { color: NEON_MAGENTA }]}>
                    {formatVigCompact(tourismStats.platformRevenueCutVIG)} VIG
                  </Text>
                  <Text style={vnRadarStyles.kpiHint}>Σ providerFee + touristFee (dual split)</Text>
                </View>
                <View style={vnRadarStyles.kpiCard}>
                  <Text style={vnRadarStyles.kpiLabel}>Active VN partners</Text>
                  <Text style={vnRadarStyles.kpiValue}>{tourismStats.activeVNBusinesses}</Text>
                  <Text style={vnRadarStyles.kpiHint}>Owner +84 · tourism BizType</Text>
                </View>
              </View>

              <TourismStatusHeatmap split={tourismStats.bookingStatusSplit} />

              <Text style={vnRadarStyles.heatTitle}>Top booked SKUs</Text>
              <View style={vnRadarStyles.topList}>
                {tourismStats.topPerformingServices.length === 0 ? (
                  <Text style={vnRadarStyles.sectionSub}>No tourism bookings yet.</Text>
                ) : (
                  tourismStats.topPerformingServices.map((row, idx) => {
                    const vertical =
                      row.businessCategory === 'HOTEL' || row.businessCategory === 'HOMESTAY'
                        ? 'Hotel'
                        : row.businessCategory === 'TOUR_OPERATOR'
                          ? 'Tour'
                          : row.businessCategory;
                    return (
                      <View key={row.serviceId} style={vnRadarStyles.topRow}>
                        <Text style={vnRadarStyles.topRank}>{idx + 1}</Text>
                        <View style={vnRadarStyles.topBody}>
                          <Text style={vnRadarStyles.topTitle} numberOfLines={2}>
                            {row.title}
                          </Text>
                          <Text style={vnRadarStyles.topMeta} numberOfLines={2}>
                            {row.businessName} · {vertical}
                          </Text>
                        </View>
                        <Text style={vnRadarStyles.topBookings}>{row.bookingCount}</Text>
                      </View>
                    );
                  })
                )}
              </View>
            </>
          ) : null}
        </View>

        <Pressable
          onPress={() => navigation.navigate('FacebookWarRoom')}
          style={({ pressed }) => [styles.fbWarRoomNav, pressed && { opacity: 0.92 }]}
          className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}
          accessibilityRole="button"
          accessibilityLabel="Phòng tác chiến Facebook"
        >
          <Ionicons name="flash" size={22} color={theme.colors.primaryBright} />
          <View style={styles.fbWarRoomNavTextCol}>
            <Text style={styles.fbWarRoomNavTitle}>💥 PHÒNG TÁC CHIẾN FACEBOOK</Text>
            <Text style={styles.fbWarRoomNavSub}>KOL link · AI seeding · Radar lắng nghe</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={theme.colors.primaryBright} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('MarketingApproval')}
          style={({ pressed }) => [styles.fbWarRoomNav, { marginTop: theme.spacing.sm }, pressed && { opacity: 0.92 }]}
          className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}
          accessibilityRole="button"
          accessibilityLabel="AI Social Media Desk duyệt bài Facebook"
        >
          <Ionicons name="create" size={22} color={theme.colors.SoftEmerald} />
          <View style={styles.fbWarRoomNavTextCol}>
            <Text style={styles.fbWarRoomNavTitle}>✍️ AI SOCIAL MEDIA DESK</Text>
            <Text style={styles.fbWarRoomNavSub}>Bản nháp AI · chỉnh sửa · duyệt đăng Facebook</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={theme.colors.SoftEmerald} />
        </Pressable>

        <View
          style={[styles.marketCampaignCard, isWide && styles.marketCampaignCardWide]}
          className={applyWebStyles('kn-glass')}
        >
          <Text style={styles.marketCampaignTitle}>CHIẾN DỊCH TẤN CÔNG THỊ TRƯỜNG</Text>
          <Text style={styles.marketCampaignSub}>
            Hai mũi nhọn: CRM telesale thủ công + Xưởng nội dung quảng cáo AI (mock MarTech).
          </Text>
          <View style={[styles.marketNavRow, isWide && styles.marketNavRowWide]}>
            <Pressable
              onPress={() => navigation.navigate('SalesLeadCRM')}
              style={({ pressed }) => [styles.marketNavBtn, pressed && { opacity: 0.9 }]}
              className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}
              accessibilityRole="button"
              accessibilityLabel="Quản lý telesale CRM"
            >
              <Text style={styles.marketNavBtnTitle}>🎯 Quản Lý Telesale (CRM)</Text>
              <Text style={styles.marketNavBtnSub}>Lead B2B · Shock Demo · Freemium 7 ngày</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('AdContentFactory')}
              style={({ pressed }) => [styles.marketNavBtn, pressed && { opacity: 0.9 }]}
              className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}
              accessibilityRole="button"
              accessibilityLabel="Xưởng nội dung quảng cáo AI"
            >
              <Text style={styles.marketNavBtnTitle}>📢 Xưởng Nội Dung Quảng Cáo</Text>
              <Text style={styles.marketNavBtnSub}>Facebook / Google · FOMO · RSA (mock)</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('OutboundCampaign')}
              style={({ pressed }) => [styles.marketNavBtn, pressed && { opacity: 0.9 }]}
              className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}
              accessibilityRole="button"
              accessibilityLabel="Outbound AI sales campaign"
            >
              <Text style={styles.marketNavBtnTitle}>📞 Outbound AI Sales</Text>
              <Text style={styles.marketNavBtnSub}>Twilio + Realtime / Gemini · CSV dialer (mock)</Text>
            </Pressable>
          </View>
        </View>

        <View
          style={[styles.autoPilotCard, isWide && styles.autoPilotCardWide]}
          className={applyWebStyles('kn-glass')}
        >
          <Text style={styles.autoPilotMasterTitle}>HỆ THỐNG MARKETING TỰ LÁI (AUTO-PILOT)</Text>
          <Text style={styles.autoPilotMasterSub}>
            Bật từng kênh để mô phỏng trigger tự động (QR · Ads · KOL · Gacha). Khi BẬT, viền vàng (web: kn-neon-b2b) báo hiệu máy đang kiếm tiền 24/7.
          </Text>
          <View style={[styles.autoPilotGrid, isWide && styles.autoPilotGridWide]}>
            <AutoPilotStrategyRow
              isWide={isWide}
              label="Tự động nhắc nhở B2B (QR)"
              hint="Popup nếu merchant chưa tải gói QR cửa hàng."
              value={autoPilot.b2bQrReminders}
              onValueChange={(v) => setAutoPilot(setAutoPilotStrategy('b2bQrReminders', v))}
            />
            <AutoPilotStrategyRow
              isWide={isWide}
              label="Tự động SOS khi mất rank Ads"
              hint="Push khẩn khi bị outbid trên Sponsored."
              value={autoPilot.b2bRankDropAlerts}
              onValueChange={(v) => setAutoPilot(setAutoPilotStrategy('b2bRankDropAlerts', v))}
            />
            <AutoPilotStrategyRow
              isWide={isWide}
              label="Tự động thông báo hoa hồng KOL"
              hint="Push dopamine khi có thu nhập thụ động mới."
              value={autoPilot.kolCommissionAlerts}
              onValueChange={(v) => setAutoPilot(setAutoPilotStrategy('kolCommissionAlerts', v))}
            />
            <AutoPilotStrategyRow
              isWide={isWide}
              label={`Tự động gửi thông báo ${B2C_GACHA_GLOBAL_PUSH_LOCAL_HOUR}h tối (Gacha B2C)`}
              hint="Push toàn cục nhắc điểm danh / vòng quay hàng ngày."
              value={autoPilot.b2cDailyGacha8pm}
              onValueChange={(v) => setAutoPilot(setAutoPilotStrategy('b2cDailyGacha8pm', v))}
            />
          </View>
        </View>

        <View
          style={[styles.omniCommandCard, isWide && styles.omniCommandCardWide]}
          className={mergeWebClassNames(
            'kn-glass',
            omni.appPushEnabled || omni.socialEnabled ? 'kn-neon-b2b' : undefined,
            omni.smsEnabled ? 'kn-neon-sos' : undefined
          )}
        >
          <View style={[styles.omniCommandHeader, isWide && styles.omniCommandHeaderWide]}>
            <View style={styles.omniCommandTitleBlock}>
              <Text style={styles.omniCommandTitle}>MASTER COMMAND: OMNI-CHANNEL AUTO-PILOT</Text>
              <Text style={styles.omniCommandSub}>
                Marketing Net: Auto-Pilot Brain × Push × Zalo/Social × SMS. Bật kênh để mock provider ghi log thời gian thực.
              </Text>
            </View>
            <View style={styles.omniPulseLegend}>
              <View style={styles.omniPulseLegendItem}>
                <OmniPulseDot active={omni.appPushEnabled || omni.socialEnabled} variant="gold" />
                <Text style={styles.omniPulseLegendText}>Vàng · Push/Social</Text>
              </View>
              <View style={styles.omniPulseLegendItem}>
                <OmniPulseDot active={omni.smsEnabled} variant="sos" />
                <Text style={styles.omniPulseLegendText}>Đỏ · SMS (chi phí)</Text>
              </View>
            </View>
          </View>

          <View style={[styles.omniSwitchGrid, isWide && styles.omniSwitchGridWide]}>
            <View style={[styles.omniSwitchRow, isWide && styles.omniSwitchRowWide]}>
              <View style={styles.omniSwitchText}>
                <Text style={styles.omniSwitchLabel}>Auto-Push</Text>
                <Text style={styles.omniSwitchHint}>Bật thông báo App (FCM / Expo mock)</Text>
              </View>
              <Switch value={omni.appPushEnabled} onValueChange={(v) => syncOmni({ appPushEnabled: v })} />
            </View>
            <View style={[styles.omniSwitchRow, isWide && styles.omniSwitchRowWide]}>
              <View style={styles.omniSwitchText}>
                <Text style={styles.omniSwitchLabel}>Auto-Zalo / Social</Text>
                <Text style={styles.omniSwitchHint}>Bật kết nối Social (Zalo / WA / Messenger mock)</Text>
              </View>
              <Switch value={omni.socialEnabled} onValueChange={(v) => syncOmni({ socialEnabled: v })} />
            </View>
            <View style={[styles.omniSwitchRow, isWide && styles.omniSwitchRowWide]}>
              <View style={styles.omniSwitchText}>
                <Text style={styles.omniSwitchLabel}>Auto-SMS</Text>
                <Text style={styles.omniSwitchHint}>Bật tin nhắn viễn thông — cảnh báo chi phí cao (Twilio mock)</Text>
              </View>
              <Switch value={omni.smsEnabled} onValueChange={(v) => syncOmni({ smsEnabled: v })} />
            </View>
          </View>

          <Pressable
            onPress={() => {
              runOmniBrainDemoScenarios();
              setOmniLog([...getOmniChannelActivityLog()]);
              Alert.alert('Omni-Brain', 'Đã chạy gói demo 4 chiến dịch (log cập nhật).');
            }}
            style={({ pressed }) => [styles.omniDemoBtn, pressed && { opacity: 0.88 }]}
          >
            <Text style={styles.omniDemoBtnText}>Chạy demo 4 chiến dịch (QR / Rank / KOL / B2C)</Text>
          </Pressable>

          <Text style={styles.omniLogTitle}>Live Activity Log (mock)</Text>
          <View style={styles.omniLogBox}>
            {omniLog.slice(0, 16).map((line, idx) => (
              <Text key={`${line.timestampMs}-${idx}-${line.channel}`} style={styles.omniLogLine}>
                [{formatOmniLogTime(line.timestampMs)}] {line.channel.toUpperCase()} · {line.summary}
              </Text>
            ))}
          </View>
        </View>

        <View
          style={[styles.aiScannerCard, isWide && styles.aiScannerCardWide]}
          className={mergeWebClassNames('kn-glass', 'kn-neon-b2b')}
        >
          <Text style={styles.aiScannerTitle}>AI FINTECH SCANNER</Text>
          <Text style={styles.aiScannerSub}>Cash-Out · Auto-Fraud Engine · Treasury guardrails (mock).</Text>
          <Text style={styles.aiScannerCritical}>Hệ thống AI Kiểm Toán: ĐANG HOẠT ĐỘNG (Auto-Pilot)</Text>
          <Text style={styles.aiScannerKpi}>
            Đã duyệt tự động hôm nay:{' '}
            {aiFintechScanner.autoApprovedTodayMajorUsd.toLocaleString('vi-VN')} {PRICING_BASELINE_CURRENCY}
          </Text>
          <Text style={styles.aiScannerAlert}>
            Báo Động Đỏ (Giam tiền chờ xử lý): {aiFintechScanner.fraudLockedAccountCount} tài khoản gian lận
          </Text>
          <Pressable
            onPress={() => {
              const lines = fraudLockedSnapshot.map(
                (r, idx) =>
                  `${idx + 1}. ${r.userId} · ${fmtLedger(r.amountMajorUsd)} · risk ${r.riskScore} · ${r.factorSummary}`
              );
              Alert.alert(
                'Rà soát tài khoản bị khóa',
                lines.length > 0 ? lines.join('\n\n') : 'Không có bản ghi (mock).'
              );
            }}
            style={({ pressed }) => [styles.aiScannerReviewBtn, pressed && { opacity: 0.9 }]}
          >
            <Ionicons name="eye-outline" size={18} color={theme.colors.onAccent} />
            <Text style={styles.aiScannerReviewBtnText}>Xem chi tiết tài khoản bị giữ / gian lận</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          <View style={styles.card} className={applyWebStyles('kn-glass kn-neon-b2b')}>
            <Text style={styles.cardTitle}>Financial & Traffic Engine</Text>
            <Text style={styles.kpi}>B2B Revenue (Display/Ledger): {fmtLedger(dataset.revenue.b2bDisplayMajorUsd)} / {fmtLedger(dataset.revenue.b2bLedgerMajorUsd)}</Text>
            <Text style={styles.kpi}>B2C Revenue (Display/Ledger): {fmtLedger(dataset.revenue.b2cDisplayMajorUsd)} / {fmtLedger(dataset.revenue.b2cLedgerMajorUsd)}</Text>
            <Text style={styles.kpi}>DAU / WAU / MAU: {dataset.traffic.dau} / {dataset.traffic.wau} / {dataset.traffic.mau}</Text>
            <Text style={styles.kpi}>Net Profit: {fmtLedger(netProfit)} (after gateway + Apple + infra + commissions)</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Global 24h Flash Sale</Text>
              <Switch
                value={flashSaleOn}
                onValueChange={(v) => {
                  setFlashSaleOn(v);
                  void launchGlobalFlashSale(v);
                }}
              />
            </View>
            <Text style={styles.kpi}>Power Promo Target: {flashSaleOn ? 'ACTIVE · -15% for 24h' : 'OFF'}</Text>
          </View>

          <View style={styles.card} className={applyWebStyles('kn-glass kn-neon-b2b')}>
            <Text style={styles.cardTitle}>Monetization Tier Enforcement</Text>
            {dataset.packages.map((pkg) => (
              <Text key={pkg.packageName} style={styles.kpi}>
                {pkg.packageName}: {fmtLedger(pkg.displayPriceMajorUsd)} (display) / {fmtLedger(pkg.ledgerPriceMajorUsd)} (ledger)
              </Text>
            ))}
            <Text style={styles.sectionLabel}>Overage Fee Monitor</Text>
            {dataset.overageAccounts.map((acc: OverageAccount) => (
              <Text key={acc.accountId} style={styles.warnLine}>
                {acc.businessName} · {acc.quotaUsedPct}% quota · Priority Fee {fmtLedger(acc.priorityFeeMajorUsd)}
              </Text>
            ))}
          </View>

          <View style={styles.card} className={applyWebStyles('kn-glass kn-neon-b2b')}>
            <Text style={styles.cardTitle}>Passive Income & Payout Manager</Text>
            <Text style={styles.kpi}>
              Commission Rates: Intermediary {Math.round(dataset.commissions.intermediaryRate * 100)}% · Referral {Math.round(dataset.commissions.directReferralRate * 100)}%
            </Text>
            <Text style={styles.kpi}>
              Passive Split: Partner {Math.round(dataset.commissions.passivePartnerRate * 100)}% · Platform {Math.round(dataset.commissions.passivePlatformRate * 100)}%
            </Text>
            {dataset.affiliateLedger.map((row: AffiliateLedgerEntry) => (
              <View key={row.intermediaryId} style={styles.inlineRow}>
                <Text style={styles.kpi}>{row.intermediaryName} · Owed {fmtLedger(row.owedMajorUsd)} · {row.status}</Text>
                <Pressable
                  onPress={() => {
                    void approvePayout(row.intermediaryId);
                    Alert.alert('Duyệt chi trả', `Đã duyệt chi trả cho ${row.intermediaryName}.`);
                  }}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionBtnText}>Duyệt chi trả</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.card} className={applyWebStyles('kn-glass kn-neon-b2b')}>
            <Text style={styles.cardTitle}>Marketing & AI Ads Radar</Text>
            <TextInput value={campaignGoal} onChangeText={setCampaignGoal} style={styles.input} placeholder="Campaign goal" placeholderTextColor={theme.colors.text.secondary} />
            <Pressable
              onPress={() => {
                const next = `AI Copy: ${campaignGoal} · Thu hút khách mới, ưu đãi giới hạn, CTA mạnh.`;
                setAdCopy(next);
              }}
              style={styles.actionBtn}
            >
              <Text style={styles.actionBtnText}>Generate AI Ad Copy</Text>
            </Pressable>
            <Text style={styles.kpi}>{adCopy}</Text>
            <Pressable
              onPress={() => {
                void launchCampaign(campaignGoal);
                Alert.alert('Launch Campaign', 'Mock API launched successfully.');
              }}
              style={styles.actionBtn}
            >
              <Text style={styles.actionBtnText}>Launch Campaign</Text>
            </Pressable>
            <Text style={styles.kpi}>ROI: Spend {fmtLedger(dataset.roi.adSpendMajorUsd)} · Promo Uses {dataset.roi.promoRedemptions} · Promo Revenue {fmtLedger(dataset.roi.revenueFromPromoMajorUsd)}</Text>
          </View>

          <View style={styles.card} className={applyWebStyles('kn-glass kn-neon-b2b')}>
            <Text style={styles.cardTitle}>Operations & Anti-Churn</Text>
            <TextInput value={userQuery} onChangeText={setUserQuery} style={styles.input} placeholder="Search users..." placeholderTextColor={theme.colors.text.secondary} />
            {filteredUsers.map((u: UserOpsRow) => (
              <View key={u.userId} style={styles.inlineRow}>
                <Text style={styles.kpi}>{u.displayName} ({u.userId}) · {u.credits} Xu · Queue {u.supportQueueState}</Text>
                <Pressable
                  onPress={() => {
                    void adjustUserCredits(u.userId, 100);
                    Alert.alert('Credits Updated', `+100 Xu for ${u.displayName}`);
                  }}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionBtnText}>+100 Xu</Text>
                </Pressable>
              </View>
            ))}
            <Text style={styles.sectionLabel}>At-Risk Radar (&gt;7 inactive days)</Text>
            {dataset.atRiskAccounts.map((r) => (
              <View key={r.accountId} style={styles.inlineRow}>
                <Text style={styles.warnLine}>{r.businessName} · {r.inactiveDays} days inactive</Text>
                <Pressable
                  onPress={() => {
                    void sendRescueCredits(r.accountId, r.suggestedRescueCredits);
                    Alert.alert('Rescue Sent', `Sent ${r.suggestedRescueCredits} rescue credits.`);
                  }}
                  style={styles.sosBtn}
                  className={applyWebStyles('kn-neon-sos')}
                >
                  <Text style={styles.sosBtnText}>Send Rescue Credits</Text>
                </Pressable>
              </View>
            ))}
            <Text style={styles.kpi}>
              AI Arbitrage Heatmap: Voice {fmtLedger(dataset.aiArbitrage.voiceAiCostPerUnitMajorUsd)} vs Text {fmtLedger(dataset.aiArbitrage.textTranslationCostPerUnitMajorUsd)} · Margin {dataset.aiArbitrage.marginPct.toFixed(1)}%
            </Text>
          </View>

          <View style={styles.card} className={applyWebStyles('kn-glass kn-neon-b2b')}>
            <Text style={styles.cardTitle}>VIP & Family Whitelist</Text>
            <Text style={styles.kpi}>{'Label enforced: "Người nhà Tổng Tư Lệnh"'}</Text>
            {dataset.vipWhitelist.map((row: VipWhitelistRow) => (
              <Text key={row.userId} style={styles.kpi}>{row.userId} · [{row.label}] · Người nhà Tổng Tư Lệnh</Text>
            ))}
            <View style={styles.inlineRow}>
              <TextInput
                value={vipUserId}
                onChangeText={setVipUserId}
                style={[styles.input, styles.inputCompact]}
                placeholder="User ID"
                placeholderTextColor={theme.colors.text.secondary}
              />
              <Pressable onPress={() => setVipMode((prev) => (prev === 'FREE' ? 'AT-COST' : 'FREE'))} style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>{vipMode}</Text>
              </Pressable>
              <Pressable
                onPress={() => Alert.alert('Whitelist Updated', `${vipUserId || 'N/A'} => [${vipMode}] Người nhà Tổng Tư Lệnh`)}
                style={styles.actionBtn}
              >
                <Text style={styles.actionBtnText}>Assign</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.footerCard} className={applyWebStyles('kn-glass')}>
          <Text style={styles.footerText}>
            B2C Credit model: 1 Xu = {adminPricingContext.b2cCreditToMajorUsd} {PRICING_BASELINE_CURRENCY} · Leona call unit ≈ {fmtLedger(adminPricingContext.b2cLeonaCallCostMajorUsd)} · AI Teacher Premium {fmtLedger(adminPricingContext.b2cAiTeacherMajorUsd)}.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 12,
  },
  contentWide: {
    maxWidth: 1260,
    width: '100%',
    alignSelf: 'center',
  },
  contentCompactHeight: {
    paddingBottom: 72,
  },
  autoPilotCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  autoPilotCardWide: {
    paddingHorizontal: theme.spacing.xl,
  },
  autoPilotMasterTitle: {
    fontSize: 15,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.3,
  },
  autoPilotMasterSub: {
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
  },
  autoPilotGrid: {
    gap: theme.spacing.sm,
  },
  autoPilotGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: theme.spacing.md,
    columnGap: theme.spacing.md,
  },
  autoPilotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    width: '100%',
  },
  autoPilotRowWide: {
    width: '48%',
    flexGrow: 1,
    minWidth: 280,
  },
  autoPilotRowOn: {
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  autoPilotRowText: {
    flex: 1,
    gap: theme.spacing.xs,
    paddingRight: theme.spacing.sm,
  },
  autoPilotRowLabel: {
    fontSize: 13,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  autoPilotRowHint: {
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.text.tertiary,
    fontFamily: FontFamily.regular,
  },
  omniCommandCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.panel,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  omniCommandCardWide: {
    paddingHorizontal: theme.spacing.xl,
  },
  omniCommandHeader: {
    gap: theme.spacing.md,
  },
  omniCommandHeaderWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.xl,
  },
  omniCommandTitleBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  omniCommandTitle: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.4,
  },
  omniCommandSub: {
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
  },
  omniPulseLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
    alignItems: 'center',
  },
  omniPulseLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  omniPulseLegendText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
  },
  omniPulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  omniSwitchGrid: {
    gap: theme.spacing.sm,
  },
  omniSwitchGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: theme.spacing.md,
    rowGap: theme.spacing.sm,
  },
  omniSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  omniSwitchRowWide: {
    flexBasis: '31%',
    flexGrow: 1,
    minWidth: 260,
  },
  omniSwitchText: {
    flex: 1,
    gap: 4,
    paddingRight: theme.spacing.sm,
  },
  omniSwitchLabel: {
    fontSize: 13,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  omniSwitchHint: {
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.text.tertiary,
    fontFamily: FontFamily.regular,
  },
  omniDemoBtn: {
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.18)',
  },
  omniDemoBtnText: {
    fontSize: 12,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.bold,
  },
  omniLogTitle: {
    fontSize: 12,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.semibold,
    marginTop: theme.spacing.xs,
  },
  omniLogBox: {
    maxHeight: 220,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(5, 11, 20, 0.65)',
    padding: theme.spacing.md,
    gap: 6,
  },
  omniLogLine: {
    fontSize: 11,
    lineHeight: 17,
    color: 'rgba(244, 241, 234, 0.88)',
    fontFamily: FontFamily.regular,
  },
  aiScannerCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(12, 24, 44, 0.92)',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  aiScannerCardWide: {
    paddingHorizontal: theme.spacing.xl,
  },
  aiScannerTitle: {
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
    letterSpacing: 0.4,
  },
  aiScannerSub: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
  aiScannerCritical: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.colors.SoftEmerald,
    marginTop: theme.spacing.xs,
  },
  aiScannerKpi: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
  },
  aiScannerAlert: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: theme.colors.RouteError,
  },
  aiScannerReviewBtn: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.components.button.variant.primary.background,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
  },
  aiScannerReviewBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: theme.components.button.variant.primary.text,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  header: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 14,
    gap: 6,
  },
  title: {
    fontSize: 24,
    color: '#F4F1EA',
    fontFamily: FontFamily.extrabold,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(244,241,234,0.75)',
    fontFamily: FontFamily.medium,
  },
  profitDashNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.2)',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 10,
  },
  profitDashNavTextCol: {
    flex: 1,
    gap: 4,
  },
  profitDashNavTitle: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
    letterSpacing: 0.35,
  },
  profitDashNavSub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
  marketCampaignCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  marketCampaignCardWide: {
    paddingHorizontal: theme.spacing.xl,
  },
  marketCampaignTitle: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
    letterSpacing: 0.35,
  },
  marketCampaignSub: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
  marketNavRow: {
    gap: theme.spacing.md,
  },
  marketNavRowWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  marketNavBtn: {
    flexGrow: 1,
    minWidth: 160,
    flexBasis: '47%',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
    gap: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  marketNavBtnTitle: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
  },
  marketNavBtnSub: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  fbWarRoomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fbWarRoomNavTextCol: {
    flex: 1,
    gap: 4,
  },
  fbWarRoomNavTitle: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
    letterSpacing: 0.3,
  },
  fbWarRoomNavSub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
  grid: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  sectionLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#E8D5A3',
    fontFamily: FontFamily.semibold,
  },
  kpi: {
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(244,241,234,0.9)',
    fontFamily: FontFamily.regular,
  },
  warnLine: {
    fontSize: 12,
    lineHeight: 18,
    color: '#FFB000',
    fontFamily: FontFamily.semibold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: FontFamily.medium,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  input: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: '#FFFFFF',
    paddingHorizontal: 10,
    fontFamily: FontFamily.regular,
    flex: 1,
  },
  inputCompact: {
    minWidth: 140,
  },
  actionBtn: {
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,255,102,0.55)',
    backgroundColor: 'rgba(0,255,102,0.18)',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    color: '#EFFFF7',
    fontFamily: FontFamily.semibold,
  },
  sosBtn: {
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,51,51,0.65)',
    backgroundColor: '#7E121A',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  footerCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 12,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(244,241,234,0.86)',
    fontFamily: FontFamily.medium,
  },
});

