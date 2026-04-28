import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  BeVietnamPro_800ExtraBold,
  useFonts as useBeVietnamFonts,
} from '@expo-google-fonts/be-vietnam-pro';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer, createNavigationContainerRef, useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect, useMemo, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthPaywallModal } from './src/components/AuthPaywallModal';
import { AppStateView } from './src/components/ui/AppStateView';
import { IntentEntryModal } from './src/components/IntentEntryModal';
import { SOSHeaderButton } from './src/components/emergency/SOSHeaderButton';
import { AuthProvider, useAuth, type RedirectTarget } from './src/context/AuthContext';
import {
  isAdminDebugSurfaceEnabled,
} from './src/config/adminDebugGate';
import { APP_BRAND } from './src/config/appBrand';
import { getStrings } from './src/i18n/strings';
import type { RootStackParamList, RootTabParamList } from './src/navigation/routes';
import { CaNhanScreen } from './src/screens/CaNhanScreen';
import { GlobalWalletScreen } from './src/screens/GlobalWalletScreen';
import { CongDongScreen } from './src/screens/CongDongScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { AcademyScreen } from './src/screens/AcademyScreen';
import { ConciergeScreen } from './src/screens/ConciergeScreen';
import { LeonaCallScreen } from './src/screens/LeonaCallScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { OtpScreen } from './src/screens/OtpScreen';
import { SetupProfileScreen } from './src/screens/SetupProfileScreen';
import { ServicesScreen } from './src/screens/ServicesScreen';
import { DiscoverScreen } from './src/screens/DiscoverScreen';
import { AiEyeScreen } from './src/screens/AiEyeScreen';
import { AdminDashboardScreen } from './src/screens/AdminDashboardScreen';
import { VaultScreen } from './src/screens/VaultScreen';
import { RadarDiscoveryScreen } from './src/screens/RadarDiscoveryScreen';
import { LifeOSDashboard } from './src/screens/LifeOSDashboard';
import { TravelCompanionScreen } from './src/screens/TravelCompanionScreen';
import { FlightSearchAssistantScreen } from './src/screens/FlightSearchAssistantScreen';
import { KetNoiYeuThuongScreen } from './src/screens/KetNoiYeuThuongScreen';
import { LiveInterpreterScreen } from './src/screens/LiveInterpreterScreen';
import { EmergencySOSScreen } from './src/screens/EmergencySOSScreen';
import { AdultLearningHome } from './src/screens/learning/AdultLearningHome';
import { KidsLearningHome } from './src/screens/learning/KidsLearningHome';
import { LiveAiTeacherScreen } from './src/screens/academy/LiveAiTeacherScreen';
import { AssistantChatScreen } from './src/screens/AssistantChatScreen';
import { InboundQueueScreen } from './src/screens/b2b/InboundQueueScreen';
import { SmartCalendarScreen } from './src/screens/b2b/SmartCalendarScreen';
import { useAssistantSettings } from './src/state/assistantSettings';
import { theme } from './src/theme/theme';
import { FontFamily } from './src/theme/typography';
import { useAppStartupOrchestration } from './src/app/bootstrap/useAppStartupOrchestration';
import {
  LAUNCH_PILOT_CONFIG,
  PILOT_LEONA_SERVICES_FALLBACK_PREFILL,
  resolvePilotAwareRedirectTarget,
} from './src/config/launchPilot';
import { ConditionalStripeProvider } from './src/providers/ConditionalStripeProvider';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
const STRIPE_MERCHANT_IDENTIFIER = process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER || undefined;
const STRIPE_URL_SCHEME = process.env.EXPO_PUBLIC_STRIPE_URL_SCHEME ?? 'ketnoiglobal';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function iconByRoute(routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap {
  if (routeName === 'Discover') return focused ? 'apps' : 'apps-outline';
  if (routeName === 'Services') return focused ? 'grid' : 'grid-outline';
  if (routeName === 'Academy') return focused ? 'school' : 'school-outline';
  if (routeName === 'CongDong') return focused ? 'people' : 'people-outline';
  if (routeName === 'Concierge') return focused ? 'headset' : 'headset-outline';
  if (routeName === 'CaNhan') return focused ? 'person' : 'person-outline';
  return 'ellipse';
}

function MainTabs() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, pendingRedirect, setPendingRedirect } = useAuth();
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const [paywallTarget, setPaywallTarget] = useState<RedirectTarget | null>(null);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compactTabs = width <= 375;
  const tabSizing = useMemo(
    () => ({
      tabBarBaseHeight: compactTabs ? 52 : 56,
      iconSize: compactTabs ? 22 : 24,
      labelSize: compactTabs ? 10 : 11,
    }),
    [compactTabs]
  );

  const openPaywall = (target: RedirectTarget) => {
    setPendingRedirect(target);
    setPaywallTarget(target);
  };

  useEffect(() => {
    if (!user || !pendingRedirect) return;
    if (pendingRedirect === 'Academy' || pendingRedirect === 'Concierge') {
      navigation.navigate('Tabs', { screen: pendingRedirect });
      setPendingRedirect(null);
      return;
    }
    if (pendingRedirect === 'LiveInterpreter') {
      navigation.navigate('LiveInterpreter', { guidedEntry: true, scenario: 'general' });
      setPendingRedirect(null);
      return;
    }
    if (pendingRedirect === 'RadarDiscovery') {
      setPendingRedirect(null);
      const next = resolvePilotAwareRedirectTarget('RadarDiscovery');
      if (next === 'LeonaCall') {
        navigation.navigate('LeonaCall', {
          prefillRequest: PILOT_LEONA_SERVICES_FALLBACK_PREFILL,
          autoSubmit: false,
        });
      } else {
        navigation.navigate('RadarDiscovery');
      }
      return;
    }
    if (pendingRedirect === 'Wallet' || pendingRedirect === 'AiEye' || pendingRedirect === 'LeonaCall' || pendingRedirect === 'Vault') {
      navigation.navigate(pendingRedirect);
      setPendingRedirect(null);
    }
  }, [navigation, pendingRedirect, setPendingRedirect, user]);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          // Solid bar only (tabBarStyle). Do not use tabBarBackground + BlurView: web crashes if BlurView is not imported.
          headerShown: true,
          headerRight: () => <SOSHeaderButton />,
          tabBarActiveTintColor: theme.hybrid.signalStrong,
          tabBarInactiveTintColor: theme.hybrid.panelCoolTextMuted,
          tabBarLabelStyle: [styles.tabLabel, { fontSize: tabSizing.labelSize }],
          tabBarItemStyle: styles.tabItem,
          tabBarStyle: [
            styles.tabBar,
            {
              height: tabSizing.tabBarBaseHeight + insets.bottom,
              paddingBottom: Math.max(insets.bottom, 10),
              paddingTop: 8,
            },
          ],
          sceneStyle: styles.scene,
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={iconByRoute(route.name, focused)}
              size={tabSizing.iconSize}
              color={focused ? theme.hybrid.signalStrong : theme.hybrid.panelCoolTextMuted}
            />
          ),
        })}
      >
        <Tab.Screen name="Discover" component={DiscoverScreen} options={{ title: strings.nav.discoverTab }} />
        <Tab.Screen name="Services" component={ServicesScreen} options={{ title: strings.nav.servicesTab }} />
        <Tab.Screen
          name="Academy"
          component={AcademyScreen}
          options={{ title: strings.nav.academyTab }}
          listeners={{
            tabPress: (e) => {
              if (!user) {
                e.preventDefault();
                openPaywall('Academy');
              }
            },
          }}
        />
        {LAUNCH_PILOT_CONFIG.enableCommunitySurface ? (
          <Tab.Screen name="CongDong" component={CongDongScreen} options={{ title: strings.nav.communityTab }} />
        ) : null}
        <Tab.Screen
          name="Concierge"
          component={ConciergeScreen}
          options={{ title: strings.nav.conciergeTab }}
          listeners={{
            tabPress: (e) => {
              if (!user) {
                e.preventDefault();
                openPaywall('Concierge');
              }
            },
          }}
        />
        <Tab.Screen name="CaNhan" component={CaNhanScreen} options={{ title: strings.nav.profileTab }} />
      </Tab.Navigator>
      <AuthPaywallModal
        visible={!!paywallTarget}
        title="Tính năng hỗ trợ & dịch vụ"
        description="Học viện, Trợ lý Minh Khang và gọi hỗ trợ Leona cần đăng nhập. Vui lòng xác thực số điện thoại để tiếp tục."
        onClose={() => setPaywallTarget(null)}
        onContinue={() => {
          const redirect = paywallTarget ?? undefined;
          setPaywallTarget(null);
          if (redirect) setPendingRedirect(redirect);
          navigation.navigate('Login', { redirectTo: redirect });
        }}
      />
    </>
  );
}

function AppRoot() {
  const insets = useSafeAreaInsets();
  const { isHydrating, user, setPendingRedirect } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [fontsLoaded] = useBeVietnamFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
  });

  const {
    intentGateReady,
    showIntentModal,
    opsReady,
    opsConfig,
    onGuidedIntent,
    onSkipGuidedIntent,
  } = useAppStartupOrchestration({
    isHydrating,
    user,
    navigationRef,
    setPendingRedirect,
  });

  useEffect(() => {
    const sub = NetInfo.addEventListener((s) => setIsOnline(s.isConnected !== false));
    void NetInfo.fetch().then((s) => setIsOnline(s.isConnected !== false));
    return () => sub();
  }, []);

  if (!isOnline) {
    return (
      <AppStateView
        variant="offline"
        title="CONNECTION LOST"
        message="Please check your network settings and try again."
        onRetry={() => {
          void NetInfo.refresh().then((s) => setIsOnline(s.isConnected !== false));
        }}
      />
    );
  }

  if (!fontsLoaded || isHydrating || !intentGateReady || !opsReady) {
    return (
      <AppStateView
        variant="loading"
        title="CONNECTING"
        message="Preparing your secure session…"
      />
    );
  }

  if (opsConfig?.killSwitch) {
    return (
      <AppStateView
        variant="maintenance"
        title="SCHEDULED MAINTENANCE"
        message="Kết Nối Global is temporarily unavailable. We will be back soon."
        detail={`Ops source: ${opsConfig.source}`}
      />
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="dark" />
      <IntentEntryModal visible={showIntentModal} onSelectIntent={onGuidedIntent} onSkip={onSkipGuidedIntent} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={MainTabs} />
        <Stack.Screen name="LifeOSDashboard" component={LifeOSDashboard} />
        <Stack.Screen name="TravelCompanion" component={TravelCompanionScreen} />
        <Stack.Screen name="FlightSearchAssistant" component={FlightSearchAssistantScreen} />
        <Stack.Screen name="KetNoiYeuThuong" component={KetNoiYeuThuongScreen} />
        <Stack.Screen name="EmergencySOS" component={EmergencySOSScreen} />
        <Stack.Screen name="AdultLearningHome" component={AdultLearningHome} />
        <Stack.Screen name="KidsLearningHome" component={KidsLearningHome} />
        <Stack.Screen name="LiveAiTeacher" component={LiveAiTeacherScreen} />
        <Stack.Screen name="AssistantChat" component={AssistantChatScreen} />
        <Stack.Screen name="InboundQueue" component={InboundQueueScreen} />
        <Stack.Screen name="SmartCalendar" component={SmartCalendarScreen} />
        <Stack.Screen name="Wallet" component={GlobalWalletScreen} />
        <Stack.Screen name="AiEye" component={AiEyeScreen} />
        <Stack.Screen name="Vault" component={VaultScreen} />
        {/* Radar: mock preview when enableRadarSurface; otherwise auto-replace → Leona (see screen). */}
        <Stack.Screen name="RadarDiscovery" component={RadarDiscoveryScreen} />
        <Stack.Screen name="LiveInterpreter" component={LiveInterpreterScreen} />
        <Stack.Screen name="LeonaCall" component={LeonaCallScreen} />
        {isAdminDebugSurfaceEnabled() ? (
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        ) : null}
        <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Otp" component={OtpScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="SetupProfile" component={SetupProfileScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
      <View
        style={[
          styles.brandBadge,
          { top: insets.top + 6, right: insets.right + 12 },
        ]}
        pointerEvents="box-none"
        accessibilityLabel={APP_BRAND.iconLabel}
      >
        <Image source={APP_BRAND.iconAsset} style={styles.brandIconImage} resizeMode="cover" />
      </View>
    </NavigationContainer>
  );
}

export default function App() {
  const appShell = (
    <SafeAreaProvider>
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </SafeAreaProvider>
  );

  // Web: never wrap with Stripe React Native (native-only / codegen). Native keeps ConditionalStripeProvider.
  if (Platform.OS === 'web') {
    return appShell;
  }

  return (
    <ConditionalStripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier={STRIPE_MERCHANT_IDENTIFIER}
      urlScheme={STRIPE_URL_SCHEME}
    >
      {appShell}
    </ConditionalStripeProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 1,
    borderTopColor: theme.hybrid.panelCoolBorder,
    backgroundColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  scene: {
    backgroundColor: '#F8F9FA',
  },
  tabItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontFamily: FontFamily.semibold,
    marginTop: 2,
  },
  brandBadge: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  brandIconImage: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
});
