import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/routes';
import {
  calculateTourismQuote,
  confirmTourismBooking,
  isInsufficientVigError,
  type TourismQuote,
} from '../../services/api/paymentApi';
import { isRestApiConfigured } from '../../services/apiClient';
import { FontFamily } from '../../theme/typography';
import { formatVigTokenNumber } from '../../utils/currency';
import { useTranslation } from '../../utils/i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const NAVY = '#050B14';
const GOLD = '#D4AF37';
const CARD = 'rgba(18, 28, 48, 0.95)';

export function TourismCheckoutScreen(): ReactElement {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const params = route.params as RootStackParamList['TourismCheckout'];

  const [quote, setQuote] = useState<TourismQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);

  const loadQuote = useCallback(async () => {
    if (!isRestApiConfigured()) {
      setQuoteError(t('checkout.configError'));
      setQuoteLoading(false);
      setQuote(null);
      return;
    }
    setQuoteLoading(true);
    setQuoteError(null);
    const r = await calculateTourismQuote({
      businessId: params.businessId,
      serviceId: params.serviceId,
      startDate: params.startDate,
      endDate: params.endDate,
      guestCount: params.guestCount,
    });
    if (r.ok) {
      setQuote(r.data.quote);
    } else {
      setQuoteError(r.error);
      setQuote(null);
    }
    setQuoteLoading(false);
  }, [
    params.businessId,
    params.endDate,
    params.guestCount,
    params.serviceId,
    params.startDate,
    t,
  ]);

  useEffect(() => {
    void loadQuote();
  }, [loadQuote]);

  const onPay = useCallback(async () => {
    if (!quote) return;
    setPayLoading(true);
    const r = await confirmTourismBooking({
      businessId: params.businessId,
      serviceId: params.serviceId,
      startDate: params.startDate,
      endDate: params.endDate,
      guestCount: params.guestCount,
    });
    setPayLoading(false);
    if (r.ok) {
      navigation.replace('TourismBookingConfirmed', {
        bookingId: r.data.booking.id,
        totalPaidVIG: r.data.booking.totalPaidVIG,
        businessName: params.businessName,
        serviceTitle: params.serviceTitle,
      });
      return;
    }
    if (r.status === 409 && isInsufficientVigError(r.error)) {
      setTopUpOpen(true);
      return;
    }
    setQuoteError(r.error);
  }, [navigation, params, quote]);

  const totalLabel = quote
    ? formatVigTokenNumber(quote.totalVIG, i18n.language)
    : '—';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel={t('checkout.back')}
        >
          <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}>
          {t('checkout.title')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.serviceName} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.78}>
          {params.serviceTitle}
        </Text>
        <Text style={styles.bizName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82}>
          {params.businessName}
        </Text>

        <View style={styles.receipt}>
          {quoteLoading ? (
            <View style={styles.skeleton}>
              <ActivityIndicator color={GOLD} size="large" />
              <Text style={styles.skeletonText} numberOfLines={2}>
                {t('checkout.loadingQuote')}
              </Text>
            </View>
          ) : quoteError && !quote ? (
            <Text style={styles.err} numberOfLines={6} adjustsFontSizeToFit>
              {quoteError}
            </Text>
          ) : quote ? (
            <>
              <Text style={styles.receiptEyebrow}>{t('checkout.receiptTitle')}</Text>
              <ReceiptRow
                label={t('checkout.basePrice')}
                value={formatVigTokenNumber(quote.basePriceVIG, i18n.language)}
              />
              <ReceiptRow
                label={t('checkout.trustShieldFee', {
                  pct: Math.round(quote.trustFeeRateApplied * 1000) / 10,
                })}
                value={formatVigTokenNumber(quote.touristFeeVIG, i18n.language)}
              />
              <View style={styles.divider} />
              <ReceiptRow
                label={t('checkout.total')}
                value={formatVigTokenNumber(quote.totalVIG, i18n.language)}
                emphasize
              />
              {quote.fx ? (
                <Text style={styles.vndHint} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82}>
                  {t('checkout.vndCashHint', {
                    vnd: quote.fx.indicativeOffRampVnd.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US'),
                  })}
                </Text>
              ) : null}
              <Text style={styles.finePrint} numberOfLines={4} adjustsFontSizeToFit minimumFontScale={0.82}>
                {t('checkout.quoteLegal')}
              </Text>
              <Text style={styles.finePrint} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.82}>
                {t('checkout.vioCreditsFootnote')}
              </Text>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => void onPay()}
          disabled={!quote || quoteLoading || payLoading}
          style={({ pressed }) => [
            styles.payBtn,
            (!quote || payLoading) && styles.payBtnDisabled,
            pressed && quote && !payLoading && { opacity: 0.92 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('checkout.payA11y', { total: totalLabel })}
        >
          {payLoading ? (
            <ActivityIndicator color={NAVY} />
          ) : (
            <Text style={styles.payLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.65}>
              {t('checkout.payNow', { amount: totalLabel })}
            </Text>
          )}
        </Pressable>
      </View>

      <Modal visible={topUpOpen} transparent animationType="fade" onRequestClose={() => setTopUpOpen(false)}>
        <Pressable style={styles.topUpBackdrop} onPress={() => setTopUpOpen(false)}>
          <Pressable style={styles.topUpSheet} onPress={(e) => e.stopPropagation()}>
            <Ionicons name="wallet-outline" size={40} color={GOLD} />
            <Text style={styles.topUpTitle} numberOfLines={3} adjustsFontSizeToFit>
              {t('checkout.topUpTitle')}
            </Text>
            <Text style={styles.topUpBody} numberOfLines={5} adjustsFontSizeToFit>
              {t('checkout.topUpBody')}
            </Text>
            <Pressable
              style={styles.topUpPrimary}
              onPress={() => {
                setTopUpOpen(false);
                navigation.navigate('Wallet');
              }}
            >
              <Text style={styles.topUpPrimaryText}>{t('checkout.topUpCta')}</Text>
            </Pressable>
            <Pressable onPress={() => setTopUpOpen(false)}>
              <Text style={styles.topUpDismiss}>{t('checkout.topUpDismiss')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function ReceiptRow({
  label,
  value,
  emphasize,
}: Readonly<{ label: string; value: string; emphasize?: boolean }>): ReactElement {
  return (
    <View style={styles.row}>
      <Text
        style={[styles.rowLabel, emphasize && styles.rowLabelStrong]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.68}
      >
        {label}
      </Text>
      <Text
        style={[styles.rowValue, emphasize && styles.rowValueStrong]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.68}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  back: { padding: 8 },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: '#F8FAFC',
    textAlign: 'center',
    minWidth: 0,
  },
  scroll: { padding: 18, paddingBottom: 120, gap: 12 },
  serviceName: {
    fontFamily: FontFamily.extrabold,
    fontSize: 22,
    color: '#FEF9C3',
    maxWidth: '100%',
  },
  bizName: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: 'rgba(226,232,240,0.75)',
    maxWidth: '100%',
  },
  receipt: {
    marginTop: 8,
    padding: 18,
    borderRadius: 18,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    gap: 12,
    maxWidth: '100%',
  },
  receiptEyebrow: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    letterSpacing: 1,
    color: 'rgba(212, 175, 55, 0.9)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
    maxWidth: '100%',
  },
  rowLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: 'rgba(226,232,240,0.88)',
  },
  rowLabelStrong: { fontFamily: FontFamily.bold, fontSize: 16, color: '#F8FAFC' },
  rowValue: {
    flexShrink: 0,
    maxWidth: '52%',
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: '#E2E8F0',
    textAlign: 'right',
  },
  rowValueStrong: { fontFamily: FontFamily.bold, fontSize: 17, color: '#FBBF24' },
  divider: { height: 1, backgroundColor: 'rgba(148,163,184,0.25)', marginVertical: 4 },
  vndHint: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: 'rgba(167, 243, 208, 0.95)',
    marginTop: 2,
    lineHeight: 17,
  },
  finePrint: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: 'rgba(148,163,184,0.85)',
    marginTop: 4,
    lineHeight: 16,
  },
  skeleton: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  skeletonText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: 'rgba(226,232,240,0.7)',
    textAlign: 'center',
  },
  err: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: '#FCA5A5',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    paddingBottom: 28,
    backgroundColor: 'rgba(5,11,20,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,175,55,0.25)',
  },
  payBtn: {
    backgroundColor: GOLD,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  payBtnDisabled: { opacity: 0.45 },
  payLabel: {
    fontFamily: FontFamily.extrabold,
    fontSize: 16,
    color: NAVY,
    textAlign: 'center',
    paddingHorizontal: 8,
    maxWidth: '100%',
  },
  topUpBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  topUpSheet: {
    backgroundColor: '#0f172a',
    padding: 22,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    alignItems: 'center',
    gap: 12,
  },
  topUpTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: '#F8FAFC',
    textAlign: 'center',
  },
  topUpBody: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: 'rgba(226,232,240,0.85)',
    textAlign: 'center',
    lineHeight: 21,
  },
  topUpPrimary: {
    backgroundColor: GOLD,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  topUpPrimaryText: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: NAVY,
  },
  topUpDismiss: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: 'rgba(148,163,184,0.95)',
    paddingVertical: 8,
  },
});
