require('dotenv').config();

module.exports = () => {
  const stripeMerchantIdentifier = process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER?.trim() ?? '';
  // TODO(brand): `./assets/icon.png`, `./assets/splash.png`, `./assets/favicon.png` may still be legacy art until VIONA asset pack lands.
  const plugins = [
    'react-native-compressor',
    '@react-native-firebase/app',
    '@react-native-firebase/app-check',
    [
      'expo-splash-screen',
      {
        image: './assets/splash.png',
        resizeMode: 'contain',
        imageWidth: 240,
        backgroundColor: '#050B14',
        dark: {
          image: './assets/splash.png',
          resizeMode: 'contain',
          backgroundColor: '#050B14',
        },
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          kotlinVersion: '2.1.0',
          minSdkVersion: 24,
          compileSdkVersion: 36,
          targetSdkVersion: 35,
          buildToolsVersion: '35.0.0',
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
    '@rnmapbox/maps',
    'expo-live-activity',
    'expo-font',
    '@sentry/react-native',
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
    orientation: 'portrait',
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#050B14',
    },
    userInterfaceStyle: 'light',
    scheme: 'ketnoiglobal',
    newArchEnabled: true,
    ios: {
      icon: './assets/icon.png',
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
        foregroundImage: './assets/icon.png',
        backgroundColor: '#050B14',
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
      favicon: './assets/favicon.png',
      themeColor: '#050B14',
      backgroundColor: '#050B14',
      display: 'standalone',
    },
    plugins,
    extra: {
      eas: {
        projectId: '2c3531a4-61e9-4c5c-aaeb-3086543ecdc6',
      },
      /** Injected at build time from root `.env` (see `src/config/env.ts`). Safe for client. */
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY?.trim() ?? '',
      /** Mapbox public token (CEO: `EXPO_PUBLIC_MAPBOX_KEY`); legacy name still supported. */
      mapboxKey:
        process.env.EXPO_PUBLIC_MAPBOX_KEY?.trim() ??
        process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ??
        '',
      mapboxAccessToken:
        process.env.EXPO_PUBLIC_MAPBOX_KEY?.trim() ??
        process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ??
        '',
    },
  }};
};

