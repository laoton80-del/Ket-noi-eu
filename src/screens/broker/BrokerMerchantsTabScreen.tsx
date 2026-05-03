import { Ionicons } from '@expo/vector-icons';
import type { ReactElement } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Row = Readonly<{ id: string; name: string; zone: string; pulse: string }>;

const DATA: readonly Row[] = [
  { id: '1', name: 'Phở Minh Gold', zone: 'Q1 · HCMC', pulse: '2 bookings today' },
  { id: '2', name: 'Lotus Homestay', zone: 'Đà Nẵng', pulse: 'QR scans ↑ 18%' },
  { id: '3', name: 'Biển Xanh Taxi', zone: 'Nha Trang', pulse: 'Onboarded · Day 3' },
];

export function BrokerMerchantsTabScreen(): ReactElement {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Acquired merchants</Text>
      <Text style={styles.sub}>Live pulse from your Mica placements</Text>
      <FlatList
        data={[...DATA]}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Ionicons name="storefront" size={22} color="#F5D286" />
            <View style={styles.meta}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.zone}>{item.zone}</Text>
              <Text style={styles.pulse}>{item.pulse}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(245,210,134,0.35)" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#050508' },
  title: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', paddingHorizontal: 18 },
  sub: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  list: { paddingHorizontal: 18, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 210, 134, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(245, 210, 134, 0.14)',
  },
  meta: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  zone: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.42)' },
  pulse: { fontSize: 13, fontWeight: '700', color: '#C9A74A' },
});
