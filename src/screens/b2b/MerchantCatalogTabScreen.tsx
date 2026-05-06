import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Row = Readonly<{ id: string; title: string; price: string }>;

const ROWS: readonly Row[] = [
  { id: '1', title: 'Heritage tour · EN guide', price: '€45 / guest' },
  { id: '2', title: 'Family room · balcony', price: '2.4M / night' },
  { id: '3', title: 'Chef tasting · 6 courses', price: '890k / set' },
];

export function MerchantCatalogTabScreen(): ReactElement {
  const [aiTranslate, setAiTranslate] = useState(true);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.head}>
        <Text style={styles.title}>Menu manager</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Auto-translate · AI</Text>
          <Switch
            value={aiTranslate}
            onValueChange={setAiTranslate}
            trackColor={{ false: '#2A3444', true: '#2E7D4A' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {ROWS.map((r) => (
          <View key={r.id} style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="pricetag-outline" size={18} color="#D4AF37" />
            </View>
            <View style={styles.rowMeta}>
              <Text style={styles.rowTitle}>{r.title}</Text>
              <Text style={styles.rowPrice}>{r.price}</Text>
              <Text style={styles.rowAi}>{aiTranslate ? 'Live EN/KR/JP blurbs on' : 'Vietnamese only'}</Text>
            </View>
            <Ionicons name="create-outline" size={20} color="rgba(212,175,55,0.6)" />
          </View>
        ))}
        <Pressable style={({ pressed }) => [styles.add, pressed && { opacity: 0.88 }]}>
          <Ionicons name="add-circle-outline" size={22} color="#D4AF37" />
          <Text style={styles.addLabel}>Add item</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const BG = '#07140F';
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  head: { paddingHorizontal: 18, paddingBottom: 12, gap: 12 },
  title: { fontSize: 24, fontWeight: '900', color: '#F4F7EC' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
  },
  toggleLabel: { fontSize: 14, fontWeight: '800', color: '#D4AF37' },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  rowMeta: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '800', color: '#F4F7EC' },
  rowPrice: { fontSize: 13, fontWeight: '600', color: 'rgba(244,247,236,0.55)' },
  rowAi: { fontSize: 11, fontWeight: '700', color: 'rgba(212, 175, 55, 0.85)' },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addLabel: { fontSize: 15, fontWeight: '800', color: '#D4AF37' },
});
