import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState, type ReactElement } from 'react';
import * as Clipboard from 'expo-clipboard';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getFeatureFlags } from '../../core/feature-flags/featureFlags';
import { getVioPointsLabel } from '../../core/monetization/vioDisplayLabels';
import type { RootStackParamList } from '../../navigation/routes';
import { buildBrokerOnboardDeepLink, isValidUuid } from '../../services/broker/V7AttributionService';
import { generateViralFlyer } from '../../services/marketing/FlyerCannonService';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type MerchantPulseRow = Readonly<{
  id: string;
  name: string;
  district: string;
  lastActivityLabel: string;
  vibe: 'hot' | 'steady' | 'new';
}>;

const MOCK_MERCHANTS: readonly MerchantPulseRow[] = [
  { id: '1', name: 'Phở Minh Gold', district: 'Q1 · HCMC', lastActivityLabel: '2 bookings today', vibe: 'hot' },
  { id: '2', name: 'Lotus Homestay', district: 'Đà Nẵng', lastActivityLabel: 'QR scanned 18×', vibe: 'steady' },
  { id: '3', name: 'Biển Xanh Taxi Co-op', district: 'Nha Trang', lastActivityLabel: 'New · setup done', vibe: 'new' },
];

const MOCK_LIVE_COMMISSION_VIG = 18427.55;

/** Dev builds, or production when `EXPO_PUBLIC_SENTRY_RADAR_TEST_BUTTON=1` (CEO verification). */
const SHOW_RADAR_PANIC =
  __DEV__ || process.env.EXPO_PUBLIC_SENTRY_RADAR_TEST_BUTTON?.trim() === '1';

function vibeColor(vibe: MerchantPulseRow['vibe']): string {
  if (vibe === 'hot') return '#22FFC9';
  if (vibe === 'steady') return '#FFD36E';
  return '#A8B7FF';
}

function BrokerMerchantRow({ item }: { item: MerchantPulseRow }): ReactElement {
  return (
    <View style={styles.merchantCard}>
      <View style={[styles.vibeDot, { backgroundColor: vibeColor(item.vibe) }]} />
      <View style={styles.merchantMeta}>
        <Text style={styles.merchantName}>{item.name}</Text>
        <Text style={styles.merchantSub}>{item.district}</Text>
        <Text style={styles.merchantPulse}>{item.lastActivityLabel}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />
    </View>
  );
}

export function BrokerDashboardScreen(): ReactElement {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const brokerQrEnabled = useMemo(() => getFeatureFlags().brokerQrEnabled, []);
  const [qrOpen, setQrOpen] = useState(false);

  const brokerOnboardDeepLink = useMemo(() => {
    const id = user?.serverUserId?.trim();
    if (!id || !isValidUuid(id)) return null;
    try {
      return buildBrokerOnboardDeepLink(id);
    } catch {
      return null;
    }
  }, [user?.serverUserId]);

  const formattedCommission = useMemo(
    () =>
      MOCK_LIVE_COMMISSION_VIG.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const openProfileSettings = useCallback(() => {
    navigation.navigate('PersonalHub');
  }, [navigation]);

  const openWallet = useCallback(() => {
    navigation.navigate('Wallet');
  }, [navigation]);

  const onLaunchViralCampaign = useCallback(() => {
    const brokerId = user?.serverUserId?.trim();
    const merchantId = MOCK_MERCHANTS[0]?.id ?? 'demo-merchant';
    if (!brokerId || !isValidUuid(brokerId)) {
      Alert.alert(
        'Flyer Cannon',
        'Broker UUID required for commission tracking. Sign in with a broker-linked VIONA account, then retry.'
      );
      return;
    }
    try {
      const flyer = generateViralFlyer(brokerId, merchantId);
      void Clipboard.setStringAsync(`${flyer.deepLinkUniversal}\n${flyer.shareCardImageUrl}`);
      Alert.alert(
        'Launch Viral Campaign',
        `Tracking: ${flyer.trackingRef}\n\nUniversal link (copied):\n${flyer.deepLinkUniversal}\n\nShare-card (mock):\n${flyer.shareCardImageUrl}`
      );
    } catch (e) {
      Alert.alert('Flyer Cannon', e instanceof Error ? e.message : 'Could not generate flyer.');
    }
  }, [user?.serverUserId]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <View style={styles.topBarTitles}>
          <Text style={styles.kicker}>MICA FIELD CONTROL</Text>
          <Text style={styles.screenTitle}>Broker HQ</Text>
        </View>
        <Pressable
          onPress={openProfileSettings}
          accessibilityRole="button"
          accessibilityLabel="Account and settings"
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="person-circle-outline" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#6D28FF', '#FF3355', '#FFC857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroEyebrow}>LIVE COMMISSION (DEMO)</Text>
          <Text style={styles.heroAmount}>{formattedCommission}</Text>
          <Text style={styles.heroUnit}>
            {`${getVioPointsLabel()} (demo) · ${
              brokerQrEnabled ? 'Preview when tourists settle' : 'Broker QR disabled — not a bank payout'
            }`}
          </Text>
          <Pressable
            onPress={openWallet}
            style={({ pressed }) => [styles.withdrawBtn, pressed && { opacity: 0.92 }]}
            accessibilityRole="button"
            accessibilityLabel="Payout preview to wallet (demo)"
          >
            <Text style={styles.withdrawLabel}>Payout preview</Text>
            <Ionicons name="arrow-forward-circle" size={22} color="#1E063A" />
          </Pressable>
        </LinearGradient>

        <Pressable
          onPress={onLaunchViralCampaign}
          style={({ pressed }) => [styles.flyerCannonBtn, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel="Launch viral campaign with tracked deep link"
        >
          <Text style={styles.flyerCannonTitle}>Launch Viral Campaign</Text>
          <Text style={styles.flyerCannonSub}>
            Flyer Cannon — share-card + Free Tour deep link with your broker UUID (no spend without tracking_ref).
          </Text>
        </Pressable>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>My acquired merchants</Text>
          <Text style={styles.sectionHint}>Gold QR signs you placed · newest pulse first</Text>
        </View>

        <FlatList
          data={[...MOCK_MERCHANTS]}
          keyExtractor={(it) => it.id}
          scrollEnabled={false}
          renderItem={({ item }) => <BrokerMerchantRow item={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />

        {SHOW_RADAR_PANIC ? (
          <Pressable
            onPress={() => {
              throw new Error('CEO Radar Test: Simulated System Crash');
            }}
            style={({ pressed }) => [styles.radarTestBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Test Sentry radar with a simulated crash"
          >
            <Text style={styles.radarTestLabel}>📡 Test Radar Crash</Text>
            <Text style={styles.radarTestHint}>Throws once — verify event in Sentry (dev / flagged prod only)</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Pressable
        onPress={() => setQrOpen(true)}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.97 }] }]}
        accessibilityRole="button"
        accessibilityLabel="Generate unique onboarding QR"
      >
        <LinearGradient colors={['#22FFC9', '#12C4FF']} style={styles.fabInner}>
          <Ionicons name="qr-code" size={28} color="#0B1628" />
        </LinearGradient>
      </Pressable>

      <Modal visible={qrOpen} animationType="fade" transparent>
        <Pressable style={styles.modalBackdrop} onPress={() => setQrOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Onboarding QR</Text>
            <Text style={styles.modalBody}>
              Each merchant gets one dynamic deep link for their Mica sign. After you save the shop in the field tool,
              we mint the QR automatically — share it or print from the VIONA web console.
            </Text>
            <View style={styles.modalQrPlaceholder}>
              <Ionicons name="qr-code-outline" size={56} color="#6D28FF" />
              <Text style={styles.modalMono} selectable>
                {brokerOnboardDeepLink ??
                  'Broker UUID required — sign in with a broker-linked VIONA account, then generate onboarding QR again.'}
              </Text>
            </View>
            <Pressable
              onPress={() => setQrOpen(false)}
              style={({ pressed }) => [styles.modalClose, pressed && { opacity: 0.88 }]}
            >
              <Text style={styles.modalCloseLabel}>Got it</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0420' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  topBarTitles: { flex: 1 },
  kicker: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.55)',
  },
  screenTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF' },
  iconBtn: {
    padding: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  scroll: { paddingHorizontal: 18, paddingBottom: 120, gap: 16 },
  hero: {
    borderRadius: 22,
    padding: 22,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroEyebrow: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.85)', letterSpacing: 1.2 },
  heroAmount: { fontSize: 36, fontWeight: '900', color: '#FFFFFF' },
  heroUnit: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.78)' },
  withdrawBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  withdrawLabel: { fontSize: 16, fontWeight: '800', color: '#1E063A' },
  flyerCannonBtn: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.45)',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    gap: 6,
  },
  flyerCannonTitle: { fontSize: 16, fontWeight: '900', color: '#FFC857' },
  flyerCannonSub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.65)', lineHeight: 17 },
  sectionHead: { marginTop: 8, gap: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  sectionHint: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.55)' },
  merchantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  vibeDot: { width: 10, height: 10, borderRadius: 5 },
  merchantMeta: { flex: 1, gap: 2 },
  merchantName: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  merchantSub: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  merchantPulse: { fontSize: 13, fontWeight: '700', color: '#C9B8FF' },
  radarTestBtn: {
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.45)',
    backgroundColor: 'rgba(255,193,7,0.08)',
    gap: 4,
  },
  radarTestLabel: { fontSize: 14, fontWeight: '800', color: '#FFC857' },
  radarTestHint: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  fabInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#13082F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  modalBody: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.72)', lineHeight: 21 },
  modalQrPlaceholder: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  modalMono: { fontSize: 11, fontWeight: '600', color: '#B794FF', textAlign: 'center', paddingHorizontal: 8 },
  modalClose: {
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#22FFC9',
    alignItems: 'center',
  },
  modalCloseLabel: { fontSize: 16, fontWeight: '800', color: '#0B1628' },
});
