import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdaptiveContainer } from '../layout/AdaptiveContainer';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type MiniAppBridgeMessage = {
  type: 'WALLET_PAYMENT_REQUEST';
  payload?: {
    amount?: number;
    currency?: string;
    note?: string;
  };
};

type MiniAppContainerProps = {
  visible: boolean;
  miniAppUrl: string;
  onClose: () => void;
  onPaymentRequest?: (payload: MiniAppBridgeMessage['payload']) => void;
};

const MINI_APP_BRIDGE_SCRIPT = `
  window.KNGBridge = {
    requestWalletPayment: function(payload) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'WALLET_PAYMENT_REQUEST',
        payload: payload || {}
      }));
    }
  };
  true;
`;

export function MiniAppContainer({
  visible,
  miniAppUrl,
  onClose,
  onPaymentRequest,
}: MiniAppContainerProps) {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      progress.value = 0;
      progress.value = withTiming(0.92, { duration: 1200 });
    }
  }, [progress, visible]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progress.value * 100)}%` as `${number}%`,
  }));

  const title = useMemo(() => 'Mini App', []);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as MiniAppBridgeMessage;
      if (data.type === 'WALLET_PAYMENT_REQUEST') {
        onPaymentRequest?.(data.payload);
      }
    } catch {
      // Ignore malformed bridge messages silently.
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <AdaptiveContainer style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + theme.spacing.xs }]}>
          <View style={styles.headerLeft}>
            <Ionicons name="apps-outline" size={18} color={theme.colors.text.primary} />
            <Text style={styles.headerTitle}>{title}</Text>
          </View>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
            <Ionicons name="close" size={18} color={theme.colors.text.primary} />
          </Pressable>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={StyleSheet.flatten([styles.progressFill, progressStyle])} />
        </View>

        <View style={styles.webviewWrap}>
          <WebView
            source={{ uri: miniAppUrl }}
            onLoadProgress={(e) => {
              progress.value = e.nativeEvent.progress;
            }}
            onLoadEnd={() => {
              progress.value = withTiming(1, { duration: 180 });
            }}
            injectedJavaScript={MINI_APP_BRIDGE_SCRIPT}
            onMessage={onMessage}
            javaScriptEnabled
            domStorageEnabled
            style={styles.webview}
          />
        </View>
      </AdaptiveContainer>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  },
  header: {
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.glass.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  headerTitle: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.executive.panelMuted,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: theme.colors.executive.panelMuted,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.hybrid.signalStrong,
  },
  webviewWrap: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: theme.colors.backgroundDeep,
  },
  webview: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDeep,
  },
  pressed: {
    opacity: 0.84,
  },
});
