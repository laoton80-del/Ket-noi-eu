import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resolveCurrencyForRegion } from '../../../config/globalLocalization';
import { useAuth } from '../../../context/AuthContext';
import { filterHospitalityMerchantsForDestinationQuery } from '../../../data/kngTravelHospitality';
import type { RootStackParamList } from '../../../navigation/routes';
import { searchFlights, type FlightOffer } from '../../../services/travel/FlightApiService';
import { theme } from '../../../theme/theme';
import { FontFamily } from '../../../theme/typography';
import { applyWebStyles } from '../../../utils/applyWebStyles';
import { formatCurrency } from '../../../utils/currencyFormatter';
import { HomestayCrossSellWidget } from './HomestayCrossSellWidget';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function titleCaseDestination(raw: string): string {
  const t = raw.trim();
  if (t.length === 0) return '';
  return t
    .split(/\s+/)
    .map((w) => (w.length === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');
}

export function FlightSearchScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const displayCurrency = resolveCurrencyForRegion(user?.country);

  const [origin, setOrigin] = useState('PRG');
  const [dest, setDest] = useState('Paris');
  const [departureDate, setDepartureDate] = useState('2026-06-12');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<readonly FlightOffer[] | null>(null);
  const [lastSearchedDest, setLastSearchedDest] = useState('');
  const [confirmed, setConfirmed] = useState<FlightOffer | null>(null);

  const destinationTitle = useMemo(() => titleCaseDestination(lastSearchedDest), [lastSearchedDest]);

  const crossSellListings = useMemo(
    () => filterHospitalityMerchantsForDestinationQuery(lastSearchedDest),
    [lastSearchedDest]
  );

  const onSearch = useCallback(() => {
    setError(null);
    setConfirmed(null);
    if (!DATE_RE.test(departureDate.trim())) {
      setError('Ngày đi: dùng định dạng YYYY-MM-DD.');
      return;
    }
    if (returnDate.trim().length > 0 && !DATE_RE.test(returnDate.trim())) {
      setError('Ngày về: để trống (một chiều) hoặc YYYY-MM-DD.');
      return;
    }
    setLoading(true);
    void (async () => {
      try {
        const list = await searchFlights(origin.trim(), dest.trim(), departureDate.trim(), passengers, {
          returnDate: returnDate.trim().length > 0 ? returnDate.trim() : null,
          priceCurrency: displayCurrency,
        });
        setOffers(list);
        setLastSearchedDest(dest.trim());
      } catch {
        setError('Không tải được giá vé (mock). Thử lại sau giây lát.');
        setOffers(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [departureDate, dest, displayCurrency, origin, passengers, returnDate]);

  const onBook = useCallback((offer: FlightOffer) => {
    setConfirmed(offer);
    Alert.alert(
      'VIONA Travel Lite',
      `Đã ghi nhận yêu cầu đặt vé (demo) — ${offer.airline}. Đội ngũ sẽ liên hệ qua kênh thanh toán affiliate khi tích hợp Duffel / Skyscanner hoàn tất.`,
      [{ text: 'Đã hiểu' }]
    );
  }, []);

  const navigateMerchant = useCallback(
    (m: (typeof crossSellListings)[number]) => {
      navigation.navigate('MerchantDetail', {
        merchantId: m.id,
        merchantName: m.name,
        industry: m.industryType,
      });
    },
    [navigation]
  );

  const bumpPassengers = useCallback((delta: number) => {
    setPassengers((p) => Math.min(9, Math.max(1, p + delta)));
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back} accessibilityRole="button">
          <Ionicons name="chevron-back" size={24} color={theme.hybrid.panelCoolText} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerKicker}>VIONA Travel Lite</Text>
          <Text style={styles.headerTitle}>✈️ Vé máy bay</Text>
        </View>
        <View style={styles.backSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.widget} className={applyWebStyles('kn-glass')}>
          <Text style={styles.widgetTitle}>Tìm chuyến</Text>
          <Text style={styles.label}>Từ</Text>
          <TextInput
            value={origin}
            onChangeText={setOrigin}
            placeholder="VD: PRG, Berlin, SGN…"
            placeholderTextColor={theme.hybrid.panelCoolTextMuted}
            style={styles.input}
            autoCapitalize="characters"
          />
          <Text style={styles.label}>Đến</Text>
          <TextInput
            value={dest}
            onChangeText={setDest}
            placeholder="VD: Paris, Amsterdam…"
            placeholderTextColor={theme.hybrid.panelCoolTextMuted}
            style={styles.input}
          />
          <Text style={styles.label}>Ngày đi (YYYY-MM-DD)</Text>
          <TextInput
            value={departureDate}
            onChangeText={setDepartureDate}
            placeholder="2026-06-12"
            placeholderTextColor={theme.hybrid.panelCoolTextMuted}
            style={styles.input}
            keyboardType="numbers-and-punctuation"
          />
          <Text style={styles.label}>Ngày về (tuỳ chọn)</Text>
          <TextInput
            value={returnDate}
            onChangeText={setReturnDate}
            placeholder="Để trống nếu một chiều"
            placeholderTextColor={theme.hybrid.panelCoolTextMuted}
            style={styles.input}
            keyboardType="numbers-and-punctuation"
          />
          <Text style={styles.label}>Số khách</Text>
          <View style={styles.paxRow}>
            <Pressable onPress={() => bumpPassengers(-1)} style={styles.paxBtn}>
              <Ionicons name="remove" size={22} color={theme.hybrid.signalStrong} />
            </Pressable>
            <Text style={styles.paxVal}>{passengers}</Text>
            <Pressable onPress={() => bumpPassengers(1)} style={styles.paxBtn}>
              <Ionicons name="add" size={22} color={theme.hybrid.signalStrong} />
            </Pressable>
          </View>
          <Pressable
            onPress={onSearch}
            disabled={loading}
            style={({ pressed }) => [styles.searchCta, (pressed || loading) && { opacity: 0.88 }]}
          >
            {loading ? <ActivityIndicator color="#0A1628" /> : <Text style={styles.searchCtaText}>Tìm chuyến bay</Text>}
          </Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        {offers !== null && offers.length > 0 ? (
          <>
            <Text style={styles.resultsTitle}>Kết quả ({displayCurrency})</Text>
            {offers.map((offer) => (
              <View key={offer.id} style={styles.resultCard} className={applyWebStyles('kn-glass')}>
                <View style={styles.resultTop}>
                  <Text style={styles.airline}>{offer.airline}</Text>
                  <Text style={styles.price}>
                    {formatCurrency(offer.priceTotal, offer.priceCurrency)} · {offer.passengers} khách
                  </Text>
                </View>
                <Text style={styles.routeLine}>
                  {offer.outbound.depAirport} → {offer.outbound.arrAirport} · {offer.outbound.depLocal} –{' '}
                  {offer.outbound.arrLocal}
                </Text>
                <Text style={styles.metaLine}>
                  {offer.stops === 0 ? 'Bay thẳng' : `${offer.stops} điểm dừng`} · {offer.cabin}
                </Text>
                {offer.inbound ? (
                  <Text style={styles.metaLine}>
                    Chiều về: {offer.inbound.depLocal} – {offer.inbound.arrLocal} ({offer.returnDate})
                  </Text>
                ) : (
                  <Text style={styles.metaLine}>Một chiều · ngày đi {offer.departureDate}</Text>
                )}
                <Pressable
                  onPress={() => onBook(offer)}
                  style={({ pressed }) => [styles.bookBtn, pressed && { opacity: 0.9 }]}
                >
                  <Text style={styles.bookBtnText}>Đặt Vé Ngay</Text>
                </Pressable>
              </View>
            ))}

            {lastSearchedDest.trim().length >= 2 ? (
              <HomestayCrossSellWidget
                destinationDisplay={destinationTitle || lastSearchedDest}
                listings={crossSellListings}
                onSelectListing={(m) => navigateMerchant(m)}
                onOpenInterpreter={() =>
                  navigation.navigate('LiveInterpreter', { scenario: 'travel', guidedEntry: true })
                }
                onBrowseHomestays={() => navigation.navigate('TravelHospitality')}
              />
            ) : null}
          </>
        ) : null}

        {confirmed ? (
          <View style={styles.confirmBlock} className={applyWebStyles('kn-glass')}>
            <Text style={styles.confirmTitle}>Xác nhận đặt vé (demo)</Text>
            <Text style={styles.confirmBody}>
              {confirmed.airline} · {confirmed.origin} → {confirmed.dest} ·{' '}
              {formatCurrency(confirmed.priceTotal, confirmed.priceCurrency)}
            </Text>
            {lastSearchedDest.trim().length >= 2 ? (
              <HomestayCrossSellWidget
                destinationDisplay={destinationTitle || lastSearchedDest}
                listings={crossSellListings}
                onSelectListing={(m) => navigateMerchant(m)}
                onOpenInterpreter={() =>
                  navigation.navigate('LiveInterpreter', { scenario: 'travel', guidedEntry: true })
                }
                onBrowseHomestays={() => navigation.navigate('TravelHospitality')}
              />
            ) : null}
            <Pressable onPress={() => setConfirmed(null)} style={styles.dismissConfirm}>
              <Text style={styles.dismissConfirmText}>Đóng bản xác nhận</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.hybrid.panelCool,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.hybrid.panelCoolBorder,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: { width: 44 },
  headerText: { flex: 1, alignItems: 'center' },
  headerKicker: {
    fontSize: 11,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 20,
    color: theme.hybrid.panelCoolText,
    fontFamily: FontFamily.extrabold,
  },
  scroll: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  widget: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: '#FFFFFF',
  },
  widgetTitle: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: theme.hybrid.panelCoolText,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 12,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.semibold,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    paddingHorizontal: 12,
    fontSize: 16,
    color: theme.hybrid.panelCoolText,
    fontFamily: FontFamily.medium,
    backgroundColor: theme.hybrid.panelCool,
  },
  paxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
    marginBottom: theme.spacing.md,
  },
  paxBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  paxVal: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: theme.hybrid.panelCoolText,
    minWidth: 32,
    textAlign: 'center',
  },
  searchCta: {
    minHeight: 50,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCtaText: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.onAccent,
  },
  error: {
    marginTop: 10,
    fontSize: 13,
    color: theme.colors.RouteError,
    fontFamily: FontFamily.medium,
  },
  resultsTitle: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: theme.hybrid.panelCoolText,
    marginBottom: theme.spacing.md,
  },
  resultCard: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: '#FFFFFF',
  },
  resultTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  airline: {
    flex: 1,
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: theme.hybrid.panelCoolText,
  },
  price: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.hybrid.signalStrong,
  },
  routeLine: {
    fontSize: 14,
    color: theme.hybrid.panelCoolText,
    fontFamily: FontFamily.semibold,
    marginBottom: 4,
  },
  metaLine: {
    fontSize: 13,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.regular,
    marginBottom: 4,
  },
  bookBtn: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: theme.radius.md,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnText: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: theme.hybrid.onSignal,
  },
  confirmBlock: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: '#FFFFFF',
  },
  confirmTitle: {
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: theme.hybrid.panelCoolText,
    marginBottom: 8,
  },
  confirmBody: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.regular,
    marginBottom: theme.spacing.md,
  },
  dismissConfirm: {
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  dismissConfirmText: {
    fontSize: 14,
    color: theme.hybrid.signalStrong,
    fontFamily: FontFamily.semibold,
  },
});
