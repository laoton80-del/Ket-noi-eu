import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { runAppPreflight } from '../services/trust/preflight';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

type PreflightStatus = 'booting' | 'passed' | 'failed';

export function TrustPreflightGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PreflightStatus>('booting');
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setStatus('booting');
      setErrorCode(null);
      const result = await runAppPreflight();
      if (!active) return;
      if (result.ok) {
        setStatus('passed');
        return;
      }
      setStatus('failed');
      setErrorCode(result.error ?? 'unknown_preflight_error');
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  const onRetry = async () => {
    setStatus('booting');
    setErrorCode(null);
    const result = await runAppPreflight();
    if (result.ok) {
      setStatus('passed');
      return;
    }
    setStatus('failed');
    setErrorCode(result.error ?? 'unknown_preflight_error');
  };

  if (status === 'booting') {
    return (
      <SafeAreaView style={styles.bootContainer}>
        <View style={styles.centerWrap}>
          <ActivityIndicator color={theme.colors.SignatureGold} size="large" />
          <Text style={styles.bootText}>Kết Nối Global - Đang bảo mật kết nối...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'failed') {
    return (
      <SafeAreaView style={styles.failContainer}>
        <View style={styles.failContent}>
          <Text style={styles.failTitle}>Kiểm tra bảo mật thất bại</Text>
          <Text style={styles.failBody}>Mã lỗi: {errorCode ?? 'unknown_preflight_error'}</Text>
          <Pressable onPress={() => void onRetry()} style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]}>
            <Text style={styles.retryBtnText}>Thử kết nối lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  bootContainer: {
    flex: 1,
    backgroundColor: theme.colors.DeepInkNavy,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  bootText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  failContainer: {
    flex: 1,
    backgroundColor: theme.colors.DeepInkNavy,
  },
  failContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  failTitle: {
    ...theme.typeScale.h2,
    fontFamily: FontFamily.bold,
    color: theme.colors.RouteError,
    textAlign: 'center',
  },
  failBody: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  retryBtn: {
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
    backgroundColor: theme.components.button.variant.primary.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  retryBtnText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.components.button.variant.primary.text,
  },
});
