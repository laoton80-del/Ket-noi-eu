import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getVioPointsLabel } from '../../core/monetization/vioDisplayLabels';
import type { RootStackParamList } from '../../navigation/routes';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MOCK_TOTAL = 18427.55;

export function BrokerCommissionsTabScreen(): ReactElement {
  const navigation = useNavigation<Nav>();
  const pointsLabel = getVioPointsLabel();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Commissions</Text>
      <Text style={styles.sub}>
        {`${pointsLabel} (demo) — preview when inbound tourists settle; not a bank payout.`}
      </Text>

      <LinearGradient colors={['#2a1810', '#050508']} style={styles.hero}>
        <Text style={styles.heroEyebrow}>ALL-TIME EARNED</Text>
        <Text style={styles.heroAmt}>
          {`${MOCK_TOTAL.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} ${pointsLabel} (demo)`}
        </Text>
        <Pressable
          onPress={() => navigation.navigate('Wallet')}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.ctaLabel}>Open wallet</Text>
          <Ionicons name="wallet-outline" size={20} color="#1a0f08" />
        </Pressable>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>Recent</Text>
        {[
          `+128 ${pointsLabel} (demo) · Phở Minh`,
          `+64 ${pointsLabel} (demo) · Lotus Homestay`,
          `+32 ${pointsLabel} (demo) · Biển Xanh`,
        ].map((line) => (
          <View key={line} style={styles.line}>
            <Ionicons name="ellipse" size={8} color="#F5D286" />
            <Text style={styles.lineText}>{line}</Text>
          </View>
        ))}
      </ScrollView>
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
    marginBottom: 16,
  },
  hero: {
    marginHorizontal: 18,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 210, 134, 0.28)',
    gap: 10,
    marginBottom: 18,
  },
  heroEyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, color: 'rgba(245,210,134,0.85)' },
  heroAmt: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: 6,
    backgroundColor: '#F5D286',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  ctaLabel: { fontSize: 15, fontWeight: '900', color: '#1a0f08' },
  scroll: { paddingHorizontal: 18, gap: 10 },
  section: { fontSize: 13, fontWeight: '900', color: 'rgba(255,255,255,0.45)', marginBottom: 4 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  lineText: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.82)' },
});
