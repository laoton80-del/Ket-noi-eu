import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PartnerDealCard } from '../../components/commercial/PartnerDealCard';
import { AdaptiveContainer } from '../../components/layout/AdaptiveContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { useDeviceLayout } from '../../hooks/useDeviceLayout';
import { openPartnerDeal } from '../../services/commercial/affiliateTracker';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type PartnerDeal = {
  id: string;
  title: string;
  partnerLabel: string;
  discountBadge: string;
  partnerUrl: string;
};

const DEALS: PartnerDeal[] = [
  {
    id: 'deal_b2b_spa_chair',
    title: 'Nhập sỉ ghế Spa cao cấp - Hoa hồng 5%',
    partnerLabel: 'SupplyNailPro B2B',
    discountBadge: 'B2B 5% hoa hồng',
    partnerUrl: 'https://example.com/spa-chair-wholesale',
  },
  {
    id: 'deal_b2c_vn_airline',
    title: 'Vé máy bay khứ hồi VN Airlines - Giảm $120',
    partnerLabel: 'VN Airlines',
    discountBadge: 'Giảm trực tiếp $120',
    partnerUrl: 'https://example.com/vn-air-roundtrip',
  },
];

export function PartnerDealsScreen() {
  const [loading, setLoading] = useState(true);
  const { isLandscape, isWeb, isTablet } = useDeviceLayout();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const useGrid = isLandscape || isWeb || isTablet;
  const cardWidth = useGrid ? '48%' : '100%';

  return (
    <SafeAreaView style={styles.container}>
      <AdaptiveContainer contentStyle={styles.content}>
        <Text style={styles.title}>Chợ ưu đãi liên kết</Text>
        <Text style={styles.subtitle}>Ưu đãi đối tác giúp bạn tiết kiệm, đồng thời tạo doanh thu trung gian cho nền tảng.</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.grid, !useGrid && styles.list]}>
            {loading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <View key={`skeleton-${idx}`} style={[styles.card, { width: cardWidth }]}>
                    <Skeleton height={18} width="62%" />
                    <Skeleton height={14} width="100%" />
                    <Skeleton height={14} width="86%" />
                    <Skeleton height={40} width="100%" borderRadius={theme.radius.md} />
                  </View>
                ))
              : DEALS.map((deal) => (
                  <View key={deal.id} style={{ width: cardWidth }}>
                    <PartnerDealCard
                      title={deal.title}
                      partnerLabel={deal.partnerLabel}
                      discountBadge={deal.discountBadge}
                      onPress={() => void openPartnerDeal(deal.id, deal.partnerUrl)}
                    />
                  </View>
                ))}
          </View>
        </ScrollView>
      </AdaptiveContainer>
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
  },
  title: {
    ...theme.typeScale.h2,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  list: {
    flexDirection: 'column',
  },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    minHeight: 154,
  },
});
