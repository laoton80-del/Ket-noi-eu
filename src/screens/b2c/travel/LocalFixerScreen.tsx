import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { resolveCurrencyForRegion } from '../../../config/globalLocalization';
import type { RootStackParamList } from '../../../navigation/routes';
import { LOCAL_FIXER_PROFILES } from '../../../services/travel/localFixerCatalog';
import { convertEurMajorToRegionalDisplay } from '../../../services/travel/regionMoneyFromEur';
import { theme } from '../../../theme/theme';
import { FontFamily } from '../../../theme/typography';
import { formatCurrency } from '../../../utils/currencyFormatter';
import { applyWebStyles } from '../../../utils/applyWebStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function LocalFixerScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const displayCurrency = useMemo(() => resolveCurrencyForRegion(user?.country), [user?.country]);

  const openCheckout = useCallback(
    (fixerId: string, displayName: string, hourlyRateEur: number) => {
      navigation.navigate('LocalFixerCheckout', {
        fixerId,
        fixerDisplayName: displayName,
        hoursBooked: 1,
        hourlyRateEur,
      });
    },
    [navigation]
  );

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0a1628', '#122038', '#1a2848']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.back, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="chevron-back" size={24} color="#F8F4EC" />
          </Pressable>
          <View style={styles.topCenter}>
            <Text style={styles.kicker}>VIONA Travel Lite</Text>
            <Text style={styles.title}>Tìm Thổ Địa Người Việt</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero} className={applyWebStyles('kn-glass kn-neon-b2b')}>
            <Text style={styles.heroTitle}>Chợ Thổ Địa tin cậy</Text>
            <Text style={styles.heroBody}>
              Người Việt bản địa giúp bạn lái xe, phiên dịch, săn deal và xử lý giấy tờ — thanh toán & hợp đồng qua VIONA (xem trước / pilot)
              (demo).
            </Text>
          </View>

          {LOCAL_FIXER_PROFILES.map((p) => {
            const localMajor = convertEurMajorToRegionalDisplay(p.hourlyRateEur, displayCurrency);
            const rateLabel = `${formatCurrency(localMajor, displayCurrency)}/giờ`;
            return (
              <View key={p.id} style={styles.card} className={applyWebStyles('kn-glass')}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{p.displayName.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.name}>{p.displayName}</Text>
                    <Text style={styles.headline}>{p.headlineVi}</Text>
                    <Text style={styles.city}>{p.cityLabel}</Text>
                  </View>
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={14} color="#E8C547" />
                    <Text style={styles.ratingText}>{p.rating.toFixed(2)}</Text>
                  </View>
                </View>
                <View style={styles.skillRow}>
                  {p.skillsVi.map((s) => (
                    <View key={s} style={styles.skillChip}>
                      <Text style={styles.skillText}>{s}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>
                    ⚡ Phản hồi ~{p.responseMinutes} phút · ✅ {p.jobsCompleted} job
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Giá theo vùng của bạn</Text>
                  <Text style={styles.priceValue}>{rateLabel}</Text>
                </View>
                <Pressable
                  onPress={() => openCheckout(p.id, p.displayName, p.hourlyRateEur)}
                  style={({ pressed }) => [styles.cta, pressed && { opacity: 0.92 }]}
                  className={applyWebStyles('kn-neon-b2b')}
                >
                  <Text style={styles.ctaText}>Gửi yêu cầu (pilot)</Text>
                  <Ionicons name="arrow-forward-circle" size={22} color="#1a1420" />
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a1628' },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topCenter: { flex: 1, alignItems: 'center' },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: 'rgba(232, 213, 163, 0.85)',
    fontFamily: FontFamily.extrabold,
  },
  title: { fontSize: 17, color: '#FAF6EE', fontFamily: FontFamily.extrabold },
  scroll: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  hero: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 213, 163, 0.35)',
    backgroundColor: 'rgba(10, 22, 40, 0.5)',
  },
  heroTitle: {
    fontSize: 18,
    color: '#FFF8E8',
    fontFamily: FontFamily.extrabold,
    marginBottom: 8,
  },
  heroBody: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(248,244,236,0.82)',
    fontFamily: FontFamily.regular,
  },
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 213, 163, 0.28)',
    backgroundColor: 'rgba(8, 16, 32, 0.55)',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(197, 160, 89, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(232, 213, 163, 0.5)',
  },
  avatarText: { fontSize: 22, fontFamily: FontFamily.extrabold, color: '#FFF8E8' },
  name: { fontSize: 18, color: '#FAF6EE', fontFamily: FontFamily.extrabold },
  headline: { fontSize: 13, lineHeight: 18, color: 'rgba(248,244,236,0.88)', fontFamily: FontFamily.medium, marginTop: 2 },
  city: { fontSize: 12, color: 'rgba(232, 213, 163, 0.95)', fontFamily: FontFamily.semibold, marginTop: 4 },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  ratingText: { fontSize: 13, color: '#FAF6EE', fontFamily: FontFamily.bold },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  skillChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(124, 255, 178, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 255, 178, 0.35)',
  },
  skillText: { fontSize: 11, color: '#D8FFF0', fontFamily: FontFamily.semibold },
  metaRow: { marginBottom: 10 },
  meta: { fontSize: 12, color: 'rgba(248,244,236,0.7)', fontFamily: FontFamily.regular },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  priceLabel: { fontSize: 12, color: 'rgba(248,244,236,0.65)', fontFamily: FontFamily.semibold },
  priceValue: { fontSize: 16, color: '#E8D5A3', fontFamily: FontFamily.extrabold },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(232, 213, 163, 0.95)',
  },
  ctaText: { fontSize: 16, color: '#1a1420', fontFamily: FontFamily.extrabold },
});
