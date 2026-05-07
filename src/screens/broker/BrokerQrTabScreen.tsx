import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Dedicated QR / deep-link minting surface for broker field teams. */
export function BrokerQrTabScreen(): ReactElement {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>QR generator</Text>
      <Text style={styles.sub}>Gold Mica signs encode one universal link per merchant.</Text>

      <LinearGradient colors={['#1a1028', '#050508']} style={styles.card}>
        <View style={styles.qrBox}>
          <Ionicons name="qr-code-outline" size={72} color="#F5D286" />
        </View>
        <Text style={styles.mono}>https://vionaio.com/merchant-storefront?merchantId=…</Text>
        <Text style={styles.hint}>Save merchant in broker console → VIONA mints this QR automatically.</Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#050508', paddingHorizontal: 18 },
  title: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', marginBottom: 6 },
  sub: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.55)', marginBottom: 18 },
  card: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 210, 134, 0.22)',
    gap: 14,
  },
  qrBox: {
    alignSelf: 'center',
    padding: 24,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 210, 134, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 210, 134, 0.35)',
  },
  mono: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C9A74A',
    textAlign: 'center',
    lineHeight: 18,
  },
  hint: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
});
