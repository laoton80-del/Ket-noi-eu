import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/routes';
import { Colors } from '../theme/colors';
import { FontFamily } from '../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function OtpScreen() {
  const navigation = useNavigation<Nav>();
  const [otp, setOtp] = useState(['', '', '', '']);
  const refs = useRef<(TextInput | null)[]>([]);

  const update = (index: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = v;
    setOtp(next);
    if (v && index < 3) refs.current[index + 1]?.focus();
  };

  const canContinue = otp.every((x) => x.length === 1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Nhập OTP</Text>
        <Text style={styles.sub}>Nhập 4 số xác thực (demo: bất kỳ 4 số).</Text>
        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(r) => {
                refs.current[idx] = r;
              }}
              value={digit}
              onChangeText={(v) => update(idx, v)}
              keyboardType="number-pad"
              maxLength={1}
              style={styles.otpBox}
            />
          ))}
        </View>
        <Pressable
          onPress={() => navigation.navigate('SetupProfile')}
          disabled={!canContinue}
          style={({ pressed }) => [styles.cta, !canContinue && styles.ctaDisabled, pressed && { opacity: 0.82 }]}
        >
          <Text style={styles.ctaText}>Xác thực</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F6F0', justifyContent: 'center', paddingHorizontal: 18 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 16,
    shadowColor: '#8B7355',
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  title: { fontSize: 27, color: Colors.text, fontFamily: FontFamily.extrabold, marginBottom: 6 },
  sub: { fontSize: 13, lineHeight: 20, color: Colors.textSoft, fontFamily: FontFamily.regular, marginBottom: 12 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  otpBox: {
    width: 62,
    height: 62,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    backgroundColor: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    fontSize: 24,
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  cta: {
    height: 46,
    borderRadius: 12,
    marginTop: 14,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: '#FFE9D2', fontFamily: FontFamily.bold, fontSize: 15 },
});
