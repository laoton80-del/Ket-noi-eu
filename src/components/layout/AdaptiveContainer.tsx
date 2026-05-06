import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useDeviceLayout } from '../../hooks/useDeviceLayout';
import { theme } from '../../theme/theme';
import { NetworkBanner } from './NetworkBanner';

type AdaptiveContainerProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function AdaptiveContainer({ children, style, contentStyle }: AdaptiveContainerProps) {
  const { isTablet, isWeb, isLandscape, isMobile, screenWidth } = useDeviceLayout();
  const useWideLayout = (isTablet || isWeb) && isLandscape;
  const useDesktopFrame = isWeb || screenWidth > 1024;

  return (
    <View style={[styles.root, style]}>
      <NetworkBanner />
      <View
        style={[
          styles.contentBase,
          useDesktopFrame && styles.contentDesktopFrame,
          useWideLayout && styles.contentWide,
          isMobile && styles.contentMobile,
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
  },
  contentBase: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    flexDirection: 'column',
  },
  contentDesktopFrame: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    marginHorizontal: 'auto',
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bgPrimary,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  contentWide: {
    maxWidth: 1200,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  contentMobile: {
    width: '100%',
    flexDirection: 'column',
  },
});
