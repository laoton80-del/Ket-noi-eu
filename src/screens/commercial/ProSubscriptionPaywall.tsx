import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useMemo, useState } from 'react';
import {
  B2B_ADDITIONAL_BRANCH_EUR,
  B2B_PAY_PER_BOOKING_EUR,
  B2B_POS_CASH_REGISTER_MONTHLY_EUR,
  B2B_POWER_TIER_EUR,
  B2B_PRO_TIER_EUR,
  GEO_PRICING_BASELINE_REGION,
  PRICING_BASELINE_CURRENCY,
  REGION_MULTIPLIERS,
} from '../../config/pricingConfig';
import { resolveCurrencyForRegion } from '../../config/globalLocalization';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/routes';
import { b2cTheme } from '../../theme/appModeThemes';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { DiasporaRestrictionModal } from '../../components/modals/DiasporaRestrictionModal';
import { evaluateMerchantSurfaceAccess } from '../../services/auth/merchantSurfaceEntry';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { formatCurrency } from '../../utils/currencyFormatter';

/** B2C-safe palette for this screen (light shell; avoids default app dark chrome). */
const B2C = {
  background: b2cTheme.colors.background,
  card: b2cTheme.colors.card,
  text: b2cTheme.colors.text,
  border: b2cTheme.colors.border,
  primary: b2cTheme.colors.primary,
  onPrimary: '#FFFFFF',
  textMuted: 'rgba(11, 22, 40, 0.58)',
} as const;

type Nav = NativeStackNavigationProp<RootStackParamList>;

type TierCard = {
  id: 'basic' | 'pro' | 'power';
  title: string;
  subtitle: string;
  priceLine: string;
  detail: string;
  cta: string;
  ctaSub?: string;
  highlight?: boolean;
};

function TierCardView({ card, onCta, isDesktopWeb }: { card: TierCard; onCta: () => void; isDesktopWeb: boolean }) {
  return (
    <View
      style={[styles.card, isDesktopWeb && styles.cardDesktop, card.highlight && styles.cardHighlight]}
      className={applyWebStyles(card.highlight ? 'kn-glass kn-neon-b2b' : 'kn-glass')}
    >
      <Text style={styles.cardKicker}>{card.subtitle}</Text>
      <Text style={styles.cardTitle}>{card.title}</Text>
      <Text style={styles.cardPrice}>{card.priceLine}</Text>
      <Text style={styles.cardDetail}>{card.detail}</Text>
      <Pressable onPress={onCta} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88 }]}>
        <Text style={styles.ctaText}>{card.cta}</Text>
      </Pressable>
      {card.ctaSub ? <Text style={styles.ctaSub}>{card.ctaSub}</Text> : null}
    </View>
  );
}

function formatRegionMultiplierDisclosure(): string {
  const keys = Object.keys(REGION_MULTIPLIERS) as (keyof typeof REGION_MULTIPLIERS)[];
  return keys.map((k) => `${String(k)} ×${REGION_MULTIPLIERS[k]}`).join(' · ');
}

export function ProSubscriptionPaywall() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width > 768;
  const { user } = useAuth();
  const [diasporaRestrictionOpen, setDiasporaRestrictionOpen] = useState(false);
  const displayCurrency = resolveCurrencyForRegion(user?.country);

  const tierCards = useMemo((): TierCard[] => {
    const ledger = PRICING_BASELINE_CURRENCY;
    const fmt = (amount: number, code: string) => formatCurrency(amount, code);
    return [
      {
        id: 'basic',
        title: 'GÓI CƠ BẢN',
        subtitle: 'Pay-as-you-go',
        priceLine: `${fmt(0, displayCurrency)} / tháng`,
        detail: `Chỉ ${fmt(B2B_PAY_PER_BOOKING_EUR, ledger)} / 1 lịch hẹn thành công. Phù hợp tiệm quy mô nhỏ.`,
        cta: 'Bắt đầu miễn phí',
      },
      {
        id: 'pro',
        title: 'GÓI PRO',
        subtitle: 'Phổ biến nhất',
        priceLine: `${fmt(B2B_PRO_TIER_EUR, ledger)} / tháng`,
        detail: `Miễn phí hoàn toàn cước đặt lịch. Quản lý 1 cơ sở (+${fmt(B2B_ADDITIONAL_BRANCH_EUR, ledger)}/tháng cho mỗi cơ sở thêm). Mở khóa Báo cáo và Dark Mode.`,
        cta: `Dùng thử 14 ngày chỉ ${fmt(1, ledger)}`,
        ctaSub: 'Hủy bất cứ lúc nào',
        highlight: true,
      },
      {
        id: 'power',
        title: 'GÓI POWER',
        subtitle: 'Tự động hóa AI',
        priceLine: `${fmt(B2B_POWER_TIER_EUR, ledger)} / tháng`,
        detail: 'Mọi tính năng PRO + Lễ tân AI nghe gọi và chốt lịch 24/7.',
        cta: 'Nâng cấp Power',
      },
    ];
  }, [displayCurrency]);

  const onCta = (id: TierCard['id']) => {
    if (id === 'basic') {
      navigation.navigate('Tabs');
      return;
    }
    navigation.navigate('Wallet');
  };

  const openMerchantDashboard = useCallback(() => {
    void (async () => {
      const access = await evaluateMerchantSurfaceAccess(user?.phone);
      if (access.denied && access.kind === 'vn_dial') {
        setDiasporaRestrictionOpen(true);
        return;
      }
      if (access.denied && access.kind === 'gps_vn') {
        Alert.alert('VIONA', access.message);
        return;
      }
      navigation.navigate('MerchantDashboard');
    })();
  }, [navigation, user?.phone]);

  return (
    <View style={[styles.shell, { backgroundColor: B2C.background }]} className={applyWebStyles('kn-glass kn-neon-b2b')}>
      <SafeAreaView style={[styles.safe, Platform.OS === 'web' && styles.safeWeb, isDesktopWeb && styles.safeDesktop]} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.75 }]}>
          <Ionicons name="chevron-back" size={22} color={B2C.text} />
        </Pressable>
        <Text style={styles.screenTitle}>VIONA — Doanh nghiệp</Text>
        <View style={styles.backSpacer} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, isDesktopWeb && styles.scrollDesktop]} showsVerticalScrollIndicator={false}>
        <Text style={styles.hero}>Bảng giá SaaS B2B</Text>
        <Text style={styles.heroSub}>Chọn gói phù hợp quy mô — nâng cấp Pro hoặc Power để mở đầy đủ không gian làm việc.</Text>

        <Pressable
          onPress={openMerchantDashboard}
          style={({ pressed }) => [styles.merchantHubRow, pressed && { opacity: 0.88 }]}
          className={applyWebStyles('kn-glass kn-neon-b2b')}
          accessibilityRole="button"
          accessibilityLabel="Bảng điều khiển Merchant"
        >
          <View style={styles.merchantHubIcon}>
            <Ionicons name="speedometer-outline" size={22} color={B2C.primary} />
          </View>
          <View style={styles.merchantHubMeta}>
            <Text style={styles.merchantHubTitle}>Bảng điều khiển Merchant</Text>
            <Text style={styles.merchantHubHint}>Flash Sale địa phương, phát sóng ưu đãi tới khách lân cận.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={B2C.textMuted} />
        </Pressable>

        <View style={[styles.grid, isDesktopWeb && styles.gridDesktop]}>
          {tierCards.map((card) => (
            <TierCardView key={card.id} card={card} onCta={() => onCta(card.id)} isDesktopWeb={isDesktopWeb} />
          ))}
        </View>

        <View style={styles.chainBanner}>
          <Text style={styles.chainBannerText}>
            MÔ HÌNH CHUỖI (Từ 3 cơ sở trở lên): Hệ thống quản lý Master Dashboard. Liên hệ để có giá ưu đãi.
          </Text>
        </View>

        <View style={styles.posAddonCard} className={applyWebStyles('kn-glass kn-neon-b2b')}>
          <View style={styles.posAddonHeaderRow}>
            <Text style={styles.posAddonSectionLabel}>ENTERPRISE — Add-on</Text>
            <View style={styles.posSoonBadge}>
              <Text style={styles.posSoonBadgeText}>Sắp ra mắt</Text>
            </View>
          </View>
          <Text style={styles.posAddonEnLine}>
            POS Integration · +{formatCurrency(B2B_POS_CASH_REGISTER_MONTHLY_EUR, PRICING_BASELINE_CURRENCY)}/mo
          </Text>
          <View style={styles.posAddonRow}>
            <View style={styles.posAddonIcon}>
              <Ionicons name="hardware-chip-outline" size={24} color={B2C.primary} />
            </View>
            <View style={styles.posAddonMeta}>
              <Text style={styles.posAddonTitle}>Cổng kết nối POS / Máy tính tiền (API Integration)</Text>
              <Text style={styles.posAddonPrice}>
                +{formatCurrency(B2B_POS_CASH_REGISTER_MONTHLY_EUR, PRICING_BASELINE_CURRENCY)}/tháng
              </Text>
              <Text style={styles.posAddonDetail}>
                Đồng bộ tự động lịch hẹn với hệ thống máy tính tiền chuẩn TSE (Đức) / EET.
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          * Giá cước được tự động tối ưu dựa trên mức sống tại quốc gia của bạn (Geo-Pricing).
        </Text>
        <Text style={[styles.disclaimer, styles.disclaimerFollow]}>
          Đa địa điểm (Multi-location): mỗi cơ sở thêm +{formatCurrency(B2B_ADDITIONAL_BRANCH_EUR, PRICING_BASELINE_CURRENCY)}/tháng ngoài gói. Hệ số vùng:{' '}
          {formatRegionMultiplierDisclosure()} (neo: {GEO_PRICING_BASELINE_REGION}) — áp dụng khi thanh toán.
        </Text>
      </ScrollView>
      </SafeAreaView>
      <DiasporaRestrictionModal
        visible={diasporaRestrictionOpen}
        onClose={() => setDiasporaRestrictionOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: B2C.background,
  },
  safeWeb: {
    backgroundColor: 'transparent',
  },
  safeDesktop: {
    alignSelf: 'stretch',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: B2C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: {
    width: 40,
  },
  screenTitle: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: B2C.textMuted,
    flex: 1,
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    paddingTop: theme.spacing.md,
  },
  scrollDesktop: {
    paddingHorizontal: theme.spacing.xxl,
  },
  hero: {
    ...theme.typeScale.h1,
    fontFamily: FontFamily.extrabold,
    color: B2C.text,
    marginBottom: theme.spacing.xs,
  },
  heroSub: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: B2C.textMuted,
    marginBottom: theme.spacing.md,
  },
  merchantHubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: B2C.border,
    backgroundColor: B2C.card,
  },
  merchantHubIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(42, 103, 209, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(42, 103, 209, 0.22)',
  },
  merchantHubMeta: {
    flex: 1,
    gap: 4,
  },
  merchantHubTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: B2C.text,
  },
  merchantHubHint: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
    color: B2C.textMuted,
  },
  grid: {
    gap: theme.spacing.md,
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: B2C.border,
    backgroundColor: B2C.card,
    padding: theme.spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  cardDesktop: {
    width: '31.5%',
    minWidth: 280,
    flexGrow: 1,
  },
  cardHighlight: {
    borderColor: B2C.primary,
    borderWidth: 2,
    backgroundColor: 'rgba(42, 103, 209, 0.04)',
  },
  cardKicker: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    color: B2C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  cardTitle: {
    ...theme.typeScale.h2,
    fontFamily: FontFamily.extrabold,
    color: B2C.text,
    marginBottom: theme.spacing.xs,
  },
  cardPrice: {
    ...theme.typeScale.h1,
    fontFamily: FontFamily.bold,
    color: B2C.primary,
    marginBottom: theme.spacing.sm,
  },
  cardDetail: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: B2C.textMuted,
    marginBottom: theme.spacing.sm,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  cta: {
    minHeight: theme.components.button.height.lg,
    borderRadius: theme.radius.md,
    backgroundColor: B2C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  ctaText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: B2C.onPrimary,
  },
  ctaSub: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: B2C.textMuted,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  chainBanner: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(42, 103, 209, 0.06)',
    borderWidth: 1,
    borderColor: B2C.border,
    gap: theme.spacing.sm,
  },
  chainBannerText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.semibold,
    color: B2C.text,
    lineHeight: theme.typeScale.body.lineHeight * 1.35,
  },
  posAddonCard: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: B2C.card,
    borderWidth: 1.5,
    borderColor: 'rgba(42, 103, 209, 0.35)',
    borderLeftWidth: 4,
    borderLeftColor: B2C.primary,
    gap: theme.spacing.sm,
  },
  posAddonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  posSoonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(217, 164, 65, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.45)',
  },
  posSoonBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: B2C.text,
    letterSpacing: 0.3,
  },
  posAddonEnLine: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: B2C.textMuted,
    marginTop: -4,
    marginBottom: 2,
  },
  posAddonSectionLabel: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.bold,
    color: B2C.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    flex: 1,
  },
  posAddonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  posAddonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(42, 103, 209, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(42, 103, 209, 0.2)',
  },
  posAddonMeta: {
    flex: 1,
    gap: 6,
  },
  posAddonTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: B2C.text,
    lineHeight: 21,
  },
  posAddonPrice: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: B2C.primary,
  },
  posAddonDetail: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: B2C.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  disclaimer: {
    marginTop: theme.spacing.xl,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: B2C.textMuted,
    opacity: 0.92,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  disclaimerFollow: {
    marginTop: theme.spacing.sm,
  },
});
