import { useNetInfo } from '@react-native-community/netinfo';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

export function NetworkBanner() {
  const netInfo = useNetInfo();
  const insets = useSafeAreaInsets();

  if (netInfo.isConnected !== false) return null;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)} style={StyleSheet.flatten([styles.banner, { top: insets.top + theme.spacing.xs }])}>
        <Text style={styles.text}>Đang ngoại tuyến. Vui lòng kiểm tra kết nối mạng.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
  },
  banner: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    minHeight: 36,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    backgroundColor: theme.colors.executive.panelMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 4,
  },
  text: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.colors.warning,
    textAlign: 'center',
  },
});
