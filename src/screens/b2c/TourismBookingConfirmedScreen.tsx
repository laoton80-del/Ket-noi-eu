import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, type ReactElement } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/routes';
import { FontFamily } from '../../theme/typography';
import { formatVigTokenNumber } from '../../utils/currency';
import { useTranslation } from '../../utils/i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const NAVY = '#050B14';
const GOLD = '#D4AF37';

export function TourismBookingConfirmedScreen(): ReactElement {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const params = route.params as RootStackParamList['TourismBookingConfirmed'];

  const scale = useRef(new Animated.Value(0.3)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, scale]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconRing, { opacity: fade, transform: [{ scale }] }]}>
          <Ionicons name="checkmark-circle" size={88} color={GOLD} />
        </Animated.View>
        <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>
          {t('checkout.confirmedTitle')}
        </Text>
        <Text style={styles.sub} numberOfLines={4} adjustsFontSizeToFit minimumFontScale={0.82}>
          {t('checkout.confirmedSub')}
        </Text>
        <Text style={styles.demoNote} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.82}>
          {t('checkout.confirmedDemoNote')}
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel} numberOfLines={2}>
            {params.serviceTitle}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={2}>
            {params.businessName}
          </Text>
          <Text style={styles.cardId} numberOfLines={1} adjustsFontSizeToFit>
            {t('checkout.bookingRef', { id: params.bookingId.slice(0, 8) })}
          </Text>
          <Text style={styles.cardTotal} numberOfLines={2}>
            {formatVigTokenNumber(params.totalPaidVIG, i18n.language)}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.wrapCta, pressed && { opacity: 0.9 }]}
          onPress={() => navigation.navigate('ViralWrap', { bookingId: params.bookingId })}
        >
          <Text style={styles.wrapCtaText}>✨ Trip Wrapped — khoe bạn bè</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
          onPress={() => navigation.navigate('Tabs')}
        >
          <Text style={styles.ctaText}>{t('checkout.confirmedDone')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  iconRing: {
    marginBottom: 8,
    shadowColor: GOLD,
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  title: {
    fontFamily: FontFamily.extrabold,
    fontSize: 26,
    color: '#F8FAFC',
    textAlign: 'center',
    maxWidth: '100%',
  },
  sub: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: 'rgba(226,232,240,0.88)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '100%',
  },
  demoNote: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: 'rgba(148,163,184,0.95)',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(18,28,48,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    gap: 8,
    marginTop: 8,
  },
  cardLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: '#FEF9C3',
  },
  cardMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: 'rgba(226,232,240,0.75)',
  },
  cardId: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: 'rgba(148,163,184,0.95)',
  },
  cardTotal: {
    fontFamily: FontFamily.extrabold,
    fontSize: 20,
    color: '#FBBF24',
    marginTop: 4,
  },
  wrapCta: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.55)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    minWidth: 220,
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  wrapCtaText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#FEF9C3',
  },
  cta: {
    marginTop: 8,
    backgroundColor: GOLD,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    minWidth: 220,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: NAVY,
  },
});
