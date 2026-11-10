/**
 * Opt-in Safe Full UI Preview. Set in the process environment before Expo
 * starts, together with EXPO_NO_DOTENV=1. This file cannot unload secrets
 * that Expo CLI already read through @expo/env.
 */
const isVionaUiPreview = process.env.VIONA_UI_PREVIEW_ONLY === '1';

if (isVionaUiPreview) {
  const expoNoDotenv = (process.env.EXPO_NO_DOTENV ?? '').trim().toLowerCase();
  const expoDotenvDisabled = expoNoDotenv === '1' || expoNoDotenv === 'true';
  if (!expoDotenvDisabled) {
    throw new Error(
      'VIONA_UI_PREVIEW_ONLY=1 requires EXPO_NO_DOTENV=1 (or true) before Expo CLI starts. Refusing preview because @expo/env may already have loaded .env.'
    );
  }
} else {
  require('dotenv').config();
}

module.exports = () => {
  const stripeMerchantIdentifier = isVionaUiPreview
    ? ''
    : (process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER?.trim() ?? '');
  const stripePublishableKey = isVionaUiPreview
    ? ''
    : (process.env.STRIPE_PUBLISHABLE_KEY?.trim() ?? '');
  const mapboxPublicToken = isVionaUiPreview
    ? ''
    : (process.env.EXPO_PUBLIC_MAPBOX_KEY?.trim() ??
      process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ??
      '');
  const plugins = [
    'react-native-compressor',
    '@react-native-firebase/app',
    '@react-native-firebase/app-check',
    [
      'expo-splash-screen',
      {
        image: './assets/brand/viona/splash.png',
        resizeMode: 'contain',
        imageWidth: 240,
        backgroundColor: '#0A1A33',
        dark: {
          image: './assets/brand/viona/splash.png',
          resizeMode: 'contain',
          backgroundColor: '#0A1A33',
        },
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          kotlinVersion: '2.1.20',
          minSdkVersion: 24,
          compileSdkVersion: 36,
          targetSdkVersion: 35,
          buildToolsVersion: '35.0.0',
          extraMavenRepos: ['https://api.mapbox.com/downloads/v2/releases/maven'],
        },
      },
    ],
    [
      'expo-av',
      {
        microphonePermission: 'Ứng dụng cần micro để luyện nói với Leona và hỏi AI LOAN.',
      },
    ],
    [
      'expo-local-authentication',
      {
        faceIDPermission:
          'Ứng dụng cần Face ID để bảo vệ ví VIONA và VIO Credits trong app, cùng thanh toán an toàn.',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'Ứng dụng cần quyền Camera để quét giấy tờ và bài tập.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'Ứng dụng cần vị trí để hỗ trợ SOS và tiện ích gần bạn.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#0B2A66',
      },
    ],
    [
      '@rnmapbox/maps',
      {
        RNMapboxMapsVersion: '11.18.2',
      },
    ],
    'expo-live-activity',
    'expo-localization',
    'expo-font',
    '@sentry/react-native',
    '@config-plugins/react-native-webrtc',
  ];

  // Only enable Stripe config plugin when merchant identifier is provided.
  // Prevents Expo plugin crashes from undefined/empty merchantIdentifier.
  if (stripeMerchantIdentifier) {
    plugins.push([
      '@stripe/stripe-react-native',
      {
        merchantIdentifier: stripeMerchantIdentifier,
        enableGooglePay: true,
      },
    ]);
  }

  return { expo: {
    name: 'VIONA',
    slug: 'ket-noi-global',
    version: '1.0.0',
    orientation: 'default',
    icon: './assets/brand/viona/app-icon.png',
    splash: {
      image: './assets/brand/viona/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0A1A33',
    },
    userInterfaceStyle: 'light',
    scheme: 'ketnoiglobal',
    newArchEnabled: true,
    ios: {
      icon: './assets/brand/viona/app-icon.png',
      supportsTablet: true,
      bundleIdentifier: 'com.ketnoiglobal.app',
      googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST ?? './GoogleService-Info.plist',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: 'Ứng dụng cần quyền Camera để quét giấy tờ và bài tập.',
        NSLocationWhenInUseUsageDescription: 'Ứng dụng cần vị trí để hỗ trợ SOS và tiện ích gần bạn.',
        NSMicrophoneUsageDescription: 'Ứng dụng cần micro để luyện nói với Leona và hỏi AI LOAN.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/brand/viona/adaptive-icon.png',
        backgroundColor: '#0A1A33',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.USE_BIOMETRIC',
        'android.permission.USE_FINGERPRINT',
        'android.permission.READ_MEDIA_IMAGES',
      ],
      package: 'com.ketnoiglobal.app',
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    },
    web: {
      shortName: 'VIONA',
      name: 'VIONA',
      favicon: './assets/brand/viona/web/favicon-48.png',
      themeColor: '#0A1A33',
      backgroundColor: '#0A1A33',
      display: 'standalone',
    },
    plugins,
    extra: {
      eas: {
        projectId: '2c3531a4-61e9-4c5c-aaeb-3086543ecdc6',
      },
      /** True only when the Expo process was started with VIONA_UI_PREVIEW_ONLY=1. */
      vionaUiPreviewOnly: isVionaUiPreview,
      /** Injected at build time from root `.env` (see `src/config/env.ts`). Safe for client. Empty in Safe Full UI Preview. */
      stripePublishableKey,
      /** Mapbox public token (CEO: `EXPO_PUBLIC_MAPBOX_KEY`); legacy name still supported. Empty in Safe Full UI Preview. */
      mapboxKey: mapboxPublicToken,
      mapboxAccessToken: mapboxPublicToken,
    },
  }};
};

