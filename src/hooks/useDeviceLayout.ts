import { Platform, useWindowDimensions } from 'react-native';

type DeviceLayout = {
  isWeb: boolean;
  isiOS: boolean;
  isAndroid: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  isTablet: boolean;
  isMobile: boolean;
  screenWidth: number;
  screenHeight: number;
};

export function useDeviceLayout(): DeviceLayout {
  const { width, height } = useWindowDimensions();
  const shortestSide = Math.min(width, height);

  const isWeb = Platform.OS === 'web';
  const isiOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';
  const isLandscape = width > height;
  const isPortrait = height >= width;
  const isTablet = shortestSide > 600;
  const isMobile = !isTablet && !isWeb;

  return {
    isWeb,
    isiOS,
    isAndroid,
    isLandscape,
    isPortrait,
    isTablet,
    isMobile,
    screenWidth: width,
    screenHeight: height,
  };
}
