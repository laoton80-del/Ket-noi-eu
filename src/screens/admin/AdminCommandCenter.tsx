import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState, type ReactElement } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

const MOCK_FINANCIAL = {
  totalVigVolume: 128_400_522.37,
  dailyRevenueCut: 842_190.12,
  activeConsumers: 184_200,
  activeMerchants: 12_840,
  activeBrokers: 3_102,
};

/**
 * Super-admin “God-Eye” deck — **must** only render for `serverRole === 'ADMIN'`.
 * Mock metrics & actions until backend admin APIs exist.
 */
export function AdminCommandCenter(): ReactElement {
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  const onSuspend = useCallback(() => {
    const q = query.trim();
    if (q.length === 0) {
      Alert.alert('Command Center', 'Enter a user or business id first.');
      return;
    }
    Alert.alert(
      'Suspend account (mock)',
      `This would suspend: "${q}". Requires server confirmation in production.`,
      [{ text: 'OK' }]
    );
  }, [query]);

  const onHistory = useCallback(() => {
    const q = query.trim();
    if (q.length === 0) {
      Alert.alert('Command Center', 'Enter a user or business id first.');
      return;
    }
    Alert.alert('Transaction history (mock)', `Ledger lookup for: ${q}`, [{ text: 'OK' }]);
  }, [query]);

  if (user?.serverRole !== 'ADMIN') {
    return (
      <SafeAreaView style={styles.deniedSafe} edges={['top', 'left', 'right']}>
        <View style={styles.deniedBox}>
          <Ionicons name="lock-closed" size={48} color="#FF3366" />
          <Text style={styles.deniedTitle}>Restricted</Text>
          <Text style={styles.deniedBody}>Command Center requires an authenticated ADMIN session.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#0a0008', '#050510', '#020208']} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>CLASS-5 CLEARANCE</Text>
          </View>
          <Text style={styles.title}>GOD-EYE COMMAND DECK</Text>
          <Text style={styles.sub}>Live telemetry · mock data · privileged session</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>LIVE FINANCIAL RADAR</Text>
          <Text style={styles.metricHuge}>
            {MOCK_FINANCIAL.totalVigVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })} VIG
          </Text>
          <Text style={styles.metricLabel}>Total ecosystem volume (rolling)</Text>
          <View style={styles.divider} />
          <Text style={styles.metricSecondary}>
            Daily revenue cut:{' '}
            <Text style={styles.accentBlue}>
              {MOCK_FINANCIAL.dailyRevenueCut.toLocaleString(undefined, { maximumFractionDigits: 2 })} VIG
            </Text>
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>ECOSYSTEM HEALTH</Text>
          <View style={styles.healthGrid}>
            <HealthTile label="Consumers" value={MOCK_FINANCIAL.activeConsumers} accent="#3B82F6" />
            <HealthTile label="Merchants" value={MOCK_FINANCIAL.activeMerchants} accent="#22C55E" />
            <HealthTile label="Brokers" value={MOCK_FINANCIAL.activeBrokers} accent="#F59E0B" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>GOD-MODE CONTROLS</Text>
          <Text style={styles.hint}>Search any user id, phone, or business id</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search…"
            placeholderTextColor="rgba(255,255,255,0.28)"
            style={styles.search}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.actions}>
            <Pressable onPress={onSuspend} style={({ pressed }) => [styles.btnDanger, pressed && { opacity: 0.9 }]}>
              <Ionicons name="hand-left-outline" size={18} color="#FFFFFF" />
              <Text style={styles.btnDangerText}>Suspend account</Text>
            </Pressable>
            <Pressable onPress={onHistory} style={({ pressed }) => [styles.btnInfo, pressed && { opacity: 0.9 }]}>
              <Ionicons name="receipt-outline" size={18} color="#38BDF8" />
              <Text style={styles.btnInfoText}>Transaction history</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HealthTile({
  label,
  value,
  accent,
}: Readonly<{ label: string; value: number; accent: string }>): ReactElement {
  return (
    <View style={[styles.tile, { borderColor: accent }]}>
      <Text style={[styles.tileValue, { color: accent }]}>{value.toLocaleString()}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020203' },
  deniedSafe: { flex: 1, backgroundColor: '#0a0a0c', justifyContent: 'center', padding: 24 },
  deniedBox: { alignItems: 'center', gap: 12 },
  deniedTitle: { fontSize: 22, fontWeight: '900', color: '#FF3366' },
  deniedBody: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  scroll: { padding: 18, paddingBottom: 120, gap: 16 },
  headerRow: { gap: 8, marginBottom: 4 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.55)',
    backgroundColor: 'rgba(255, 51, 102, 0.12)',
  },
  badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, color: '#FF5C7A' },
  title: { fontSize: 22, fontWeight: '900', color: '#E8F0FF', letterSpacing: 0.5 },
  sub: { fontSize: 13, fontWeight: '600', color: 'rgba(147, 197, 253, 0.65)' },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    backgroundColor: 'rgba(8, 12, 24, 0.92)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    color: 'rgba(248, 113, 113, 0.95)',
    marginBottom: 10,
  },
  metricHuge: { fontSize: 28, fontWeight: '900', color: '#F8FAFC' },
  metricLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(148, 163, 184, 0.85)', marginTop: 4 },
  divider: { height: 1, backgroundColor: 'rgba(148, 163, 184, 0.2)', marginVertical: 12 },
  metricSecondary: { fontSize: 14, fontWeight: '700', color: 'rgba(226, 232, 240, 0.9)' },
  accentBlue: { color: '#38BDF8', fontWeight: '900' },
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    flex: 1,
    minWidth: '28%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  tileValue: { fontSize: 18, fontWeight: '900' },
  tileLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(226, 232, 240, 0.55)', marginTop: 4 },
  hint: { fontSize: 12, fontWeight: '600', color: 'rgba(148, 163, 184, 0.75)', marginBottom: 8 },
  search: {
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '600',
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  btnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.55)',
    flex: 1,
    justifyContent: 'center',
  },
  btnDangerText: { fontSize: 14, fontWeight: '900', color: '#FECACA' },
  btnInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 116, 144, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    flex: 1,
    justifyContent: 'center',
  },
  btnInfoText: { fontSize: 14, fontWeight: '900', color: '#7DD3FC' },
});
