module.exports = () => {
  const stripeMerchantIdentifier = process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER?.trim() ?? '';
  const plugins = [
    '@react-native-firebase/app',
    '@react-native-firebase/app-check',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        backgroundColor: '#0B2A66',
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
        faceIDPermission: 'Ứng dụng cần Face ID để bảo vệ Ví Combo và thanh toán an toàn.',
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
    'expo-font',
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
    name: 'ket-noi-eu',
    slug: 'ket-noi-eu',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'ketnoieu',
    newArchEnabled: true,
    ios: {
      icon: './assets/images/icon.png',
      supportsTablet: true,
      bundleIdentifier: 'com.ahojbuono.ketnoieu',
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
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#0B2A66',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.USE_BIOMETRIC',
        'android.permission.USE_FINGERPRINT',
      ],
      package: 'com.ahojbuono.ketnoieu',
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    },
    web: {
      favicon: './assets/images/favicon.png',
    },
    plugins,
    extra: {
      eas: {
        projectId: 'cf62c186-ccc8-4f06-83d8-c15ec1e6efbe',
      },
    },
  }};
};

