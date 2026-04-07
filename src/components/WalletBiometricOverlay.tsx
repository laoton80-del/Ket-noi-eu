import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { FontFamily } from '../theme/typography';
import { theme } from '../theme/theme';

type WalletBiometricOverlayProps = {
  onUnlockPress: () => void;
  onPinPress: () => void;
};

export function WalletBiometricOverlay({ onUnlockPress, onPinPress }: WalletBiometricOverlayProps) {
  const hapticLight = () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  return (
    <View style={styles.wrap} pointerEvents="auto">
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, styles.webBlurFallback]} />
      ) : (
        <BlurView intensity={72} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      <View style={styles.dim} />
      <View style={styles.content}>
        <View style={styles.lockMedallion}>
          <Lock color={theme.colors.surface} size={34} strokeWidth={2.4} />
        </View>
        <Text style={styles.title}>Ví đang khóa</Text>
        <Text style={styles.sub}>Xác thực sinh trắc học hoặc mã PIN để xem số dư và lịch sử.</Text>
        <Pressable
          onPress={() => {
            hapticLight();
            onUnlockPress();
          }}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92 }]}
        >
          <Text style={styles.primaryBtnText}>Chạm để mở khóa</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            hapticLight();
            onPinPress();
          }}
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.88 }]}
        >
          <Text style={styles.secondaryBtnText}>Nhập mã PIN dự phòng</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webBlurFallback: {
    backgroundColor: 'rgba(28, 22, 18, 0.88)',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 16, 12, 0.35)',
  },
  content: {
    paddingHorizontal: 32,
    alignItems: 'center',
    maxWidth: 340,
  },
  lockMedallion: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(212, 175, 55, 0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255, 236, 200, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 14,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.surface,
    marginBottom: 8,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: 'rgba(255, 248, 236, 0.82)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  primaryBtn: {
    width: '100%',
    minHeight: 50,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: '#1A1208',
    shadowOffset: theme.elevation.fab.shadowOffset,
    shadowOpacity: theme.elevation.fab.shadowOpacity,
    shadowRadius: theme.elevation.fab.shadowRadius,
    elevation: theme.elevation.fab.elevation,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: theme.colors.surface,
  },
  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: theme.colors.surface,
    textDecorationLine: 'underline',
  },
});
