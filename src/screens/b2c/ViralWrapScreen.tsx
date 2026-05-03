import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppImage } from '../../components/ui/AppImage';
import type { RootStackParamList } from '../../navigation/routes';
import { fetchViralWrap, type ViralWrapPayloadDto } from '../../services/tourismViralWrapApi';
import { formatNetworkFailureMessage, isRestApiConfigured } from '../../services/apiClient';
import { APP_BRAND } from '../../config/appBrand';
import { CREDIT_EXCHANGE_RATE_USD } from '../../config/pricingConfig';
import { FontFamily } from '../../theme/typography';

const CONFETTI_URI = 'https://assets10.lottiefiles.com/packages/lf20_jbrw3hcz.json';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: WIN_W, height: WIN_H } = Dimensions.get('window');

const MOCK_WRAP: ViralWrapPayloadDto = {
  bookingId: 'preview',
  tripVigSpent: 4800,
  completedTourismBookings: 4,
  estimatedMoneySavedUsd: 52.4,
  aiVoiceTranslationSessions: 9,
  destinationLabel: 'Lan Ha Bay · Boutique Junk Cruise',
  tripStartIso: new Date().toISOString(),
  tripEndIso: new Date().toISOString(),
  languageCode: 'en',
  viralTagline: 'You survived Hanoi traffic and still made the sunset cruise. ViGlobal energy: unstoppable.',
  downloadUrl: 'https://ketnoiglobal.com/download',
};

function formatVig(v: number): string {
  return `${Math.round(v).toLocaleString('en-US')} VIG`;
}

function formatUsd(n: number): string {
  return `≈ $${n.toFixed(2)}`;
}

export function ViralWrapScreen(): ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const params = route.params as RootStackParamList['ViralWrap'];
  const bookingId = params?.bookingId;

  const shotRef = useRef<View>(null);
  const [wrap, setWrap] = useState<ViralWrapPayloadDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const display = wrap ?? (!isRestApiConfigured() ? MOCK_WRAP : null);

  const load = useCallback(async (): Promise<void> => {
    if (!bookingId) {
      setWrap(MOCK_WRAP);
      setLoading(false);
      return;
    }
    if (!isRestApiConfigured()) {
      setWrap(MOCK_WRAP);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchViralWrap(bookingId);
      if (!res.ok) {
        setError(res.error);
        setWrap(null);
        return;
      }
      setWrap(res.data);
    } catch (e) {
      setError(formatNetworkFailureMessage(e));
      setWrap(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const shareCaption = useMemo(() => {
    if (!display) return '';
    return `${display.viralTagline}\n\n${display.downloadUrl}\n#ViGlobal #InboundTourism`;
  }, [display]);

  const onShare = async (): Promise<void> => {
    if (!display || sharing) return;
    setSharing(true);
    try {
      await Clipboard.setStringAsync(shareCaption);

      if (Platform.OS === 'web') {
        await Share.share({
          title: `${APP_BRAND.publicName} Trip Wrap`,
          message: shareCaption,
        });
        Alert.alert('Copied', 'Caption copied — paste on Stories / Reels / TikTok with your screenshot.');
        return;
      }

      const target = shotRef.current;
      if (!target) {
        Alert.alert('Share', 'Card not ready — try again.');
        return;
      }

      const uri = await captureRef(target, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        snapshotContentContainer: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `${APP_BRAND.publicName} · Trip Wrapped`,
          UTI: 'public.png',
        });
      } else {
        await Share.share({
          title: `${APP_BRAND.publicName} Trip Wrap`,
          message: shareCaption,
          url: uri,
        });
      }
    } catch (e) {
      Alert.alert('Share', formatNetworkFailureMessage(e));
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#0f172a', '#581c87', '#be123c']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingLabel}>Building your wrap…</Text>
      </View>
    );
  }

  if (error && !display) {
    return (
      <SafeAreaView style={styles.loadingRoot} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.loadingLabel}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={() => void load()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!display) {
    return (
      <View style={styles.loadingRoot}>
        <Text style={styles.loadingLabel}>No data</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#020617', '#4c1d95', '#9f1239']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.85 }]}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          <Text style={styles.topTitle}>TRIP WRAPPED</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View
            ref={shotRef}
            collapsable={false}
            style={[styles.captureCard, { minHeight: Math.min(WIN_H * 0.78, 640) }]}
          >
            <LinearGradient
              colors={['#0c1220', '#312e81', '#be185d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LottieView
              source={{ uri: CONFETTI_URI }}
              autoPlay
              loop
              style={styles.confetti}
            />

            <View style={styles.brandRow}>
              <AppImage
                source={require('../../../assets/branding/logo-horizontal.png')}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="ViGlobal"
              />
            </View>

            <Text style={styles.yearLabel}>VIGLOBAL</Text>
            <Text style={styles.heroHeadline}>YOUR TRIP{'\n'}IN THE WILD</Text>
            <Text style={styles.dest} numberOfLines={3}>
              {display.destinationLabel}
            </Text>

            <Text style={styles.tagline} numberOfLines={6}>
              “{display.viralTagline}”
            </Text>

            <View style={styles.statGrid}>
              <StatBlock label="VIG on this trip" value={formatVig(display.tripVigSpent)} accent />
              <StatBlock
                label="Est. saved vs chaos"
                value={formatUsd(display.estimatedMoneySavedUsd)}
                accent={false}
              />
              <StatBlock label="Tourism trips done" value={`${display.completedTourismBookings}`} accent={false} />
              <StatBlock
                label="AI voice & translate"
                value={`${display.aiVoiceTranslationSessions} sessions`}
                accent
              />
            </View>

            <View style={styles.qrRow}>
              <View style={styles.qrBox}>
                <QRCode
                  value={display.downloadUrl}
                  size={92}
                  color="#0f172a"
                  backgroundColor="#ffffff"
                />
              </View>
              <View style={styles.qrCopy}>
                <Text style={styles.qrKicker}>Scan & join</Text>
                <Text style={styles.qrUrl} numberOfLines={2}>
                  {display.downloadUrl}
                </Text>
                <Text style={styles.qrHint}>
                  {APP_BRAND.publicName} · {formatVig(1)} ≈ ${CREDIT_EXCHANGE_RATE_USD.toFixed(2)} ref
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.microHint}>
            Caption + link copied to clipboard when you share — paste on Instagram Stories, TikTok, or Facebook.
          </Text>

          <Pressable
            onPress={() => void onShare()}
            disabled={sharing}
            style={({ pressed }) => [styles.shareCta, pressed && { opacity: 0.92 }, sharing && { opacity: 0.6 }]}
          >
            {sharing ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <>
                <Ionicons name="share-social" size={22} color="#0f172a" />
                <Text style={styles.shareCtaText}>Share your wrap</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StatBlock(props: Readonly<{ label: string; value: string; accent: boolean }>): ReactElement {
  return (
    <View style={[styles.statCell, props.accent && styles.statCellAccent]}>
      <Text style={styles.statLabel}>{props.label}</Text>
      <Text style={styles.statValue}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020617' },
  safe: { flex: 1 },
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#020617',
  },
  loadingLabel: {
    marginTop: 16,
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  retryText: { fontFamily: FontFamily.bold, color: '#fff', fontSize: 15 },
  backLink: { marginTop: 16 },
  backLinkText: { color: 'rgba(255,255,255,0.7)', fontFamily: FontFamily.medium },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  iconBtn: { padding: 10 },
  topTitle: {
    fontFamily: FontFamily.extrabold,
    fontSize: 13,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.85)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  captureCard: {
    width: Math.min(WIN_W - 32, 420),
    borderRadius: 28,
    overflow: 'hidden',
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  confetti: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    height: 200,
    opacity: 0.45,
    pointerEvents: 'none',
  },
  brandRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 220,
    height: 48,
  },
  yearLabel: {
    fontFamily: FontFamily.extrabold,
    fontSize: 11,
    letterSpacing: 6,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: 4,
  },
  heroHeadline: {
    fontFamily: FontFamily.extrabold,
    fontSize: 36,
    lineHeight: 40,
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  dest: {
    marginTop: 12,
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    lineHeight: 20,
  },
  tagline: {
    marginTop: 16,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
    color: '#fef9c3',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  statCell: {
    width: '47%',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(15,23,42,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statCellAccent: {
    borderColor: 'rgba(250, 204, 21, 0.45)',
    backgroundColor: 'rgba(30,27,75,0.65)',
  },
  statLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    marginTop: 6,
    fontFamily: FontFamily.extrabold,
    fontSize: 16,
    color: '#fff',
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  qrBox: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  qrCopy: { flex: 1, minWidth: 0 },
  qrKicker: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  qrUrl: {
    marginTop: 4,
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
  },
  qrHint: {
    marginTop: 6,
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
  },
  microHint: {
    marginTop: 14,
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    maxWidth: 360,
    lineHeight: 16,
  },
  shareCta: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#facc15',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 999,
    minWidth: 260,
    alignSelf: 'center',
  },
  shareCtaText: {
    fontFamily: FontFamily.extrabold,
    fontSize: 17,
    color: '#0f172a',
  },
});
