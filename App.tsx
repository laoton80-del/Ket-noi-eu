import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts as useInterFonts,
} from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  createNavigationContainerRef,
  useNavigation,
  type LinkingOptions,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthPaywallModal } from './src/components/AuthPaywallModal';
import { AppStateView } from './src/components/ui/AppStateView';
import { IntentEntryModal } from './src/components/IntentEntryModal';
import { SOSHeaderButton } from './src/components/emergency/SOSHeaderButton';
import { AuthProvider, useAuth, type RedirectTarget } from './src/context/AuthContext';
import { AppModeProvider, useAppMode } from './src/context/AppModeContext';
import {
  isAdminDebugSurfaceEnabled,
} from './src/config/adminDebugGate';
import { APP_BRAND } from './src/config/appBrand';
import { getStrings } from './src/i18n/strings';
import type { RootStackParamList, RootTabParamList } from './src/navigation/routes';
import { CaNhanScreen } from './src/screens/CaNhanScreen';
import { GlobalWalletScreen } from './src/screens/commercial/GlobalWalletScreen';
import { PartnerDealsScreen } from './src/screens/commercial/PartnerDealsScreen';
import { ProSubscriptionPaywall } from './src/screens/commercial/ProSubscriptionPaywall';
import { CongDongScreen } from './src/screens/CongDongScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { AcademyScreen } from './src/screens/AcademyScreen';
import { ConciergeScreen } from './src/screens/ConciergeScreen';
import { LeonaCallScreen } from './src/screens/LeonaCallScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { OtpScreen } from './src/screens/OtpScreen';
import { SetupProfileScreen } from './src/screens/SetupProfileScreen';
import { ServicesScreen } from './src/screens/ServicesScreen';
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
import { configurePushNotificationHandler } from './src/services/notifications/pushService';
import { checkForEmergencyUpdates } from './src/services/updateService';
import { TelemetryProvider, useNavigationTelemetry } from './src/services/telemetryService';
import { FeatureFlagProvider } from './src/config/featureFlags';
import { TourProvider } from './src/components/onboarding/TourProvider';
import { ConditionalStripeProvider } from './src/providers/ConditionalStripeProvider';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const b2cTheme: NavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.SoftMineralGrey,
    card: theme.colors.CeolWhite,
    text: theme.colors.textOnLight,
    border: theme.hybrid.panelCoolBorder,
    primary: theme.colors.SignalBlue,
  },
};

const b2bTheme: NavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.DeepInkNavy,
    card: theme.colors.executive.panel,
    text: theme.colors.textOnDark,
    border: theme.colors.glass.borderSoft,
    primary: theme.hybrid.signalStrong,
  },
};

const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? 'pk_test_mock_key_for_now';
const STRIPE_MERCHANT_IDENTIFIER = process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER || undefined;
const STRIPE_URL_SCHEME = process.env.EXPO_PUBLIC_STRIPE_URL_SCHEME ?? 'ketnoiglobal';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['ketnoiglobal://', 'https://ketnoiglobal.com'],
  config: {
    screens: {
      Tabs: {
        screens: {
          Discover: 'discover',
          Services: 'shop/:id',
          Academy: 'academy',
          CongDong: 'community',
          Concierge: 'concierge',
          CaNhan: 'profile',
        },
      },
      Wallet: 'wallet',
      GlobalWallet: 'wallet/global',
      InboundQueue: 'b2b/inbound-queue',
      SmartCalendar: 'b2b/calendar',
      PartnerDeals: 'commercial/partner-deals',
      LiveInterpreter: 'interpreter',
      LeonaCall: 'leona-call',
      RadarDiscovery: 'radar',
      Vault: 'vault',
      AiEye: 'ai-eye',
    },
  },
};

configurePushNotificationHandler();

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
  const { isB2B } = useAppMode();
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
          tabBarInactiveTintColor: isB2B ? theme.colors.textOnDarkMuted : theme.hybrid.panelCoolTextMuted,
          tabBarLabelStyle: [styles.tabLabel, { fontSize: tabSizing.labelSize }],
          tabBarItemStyle: styles.tabItem,
          tabBarStyle: [
            styles.tabBar,
            isB2B ? styles.tabBarB2B : styles.tabBarB2C,
            {
              height: tabSizing.tabBarBaseHeight + insets.bottom,
              paddingBottom: Math.max(insets.bottom, 10),
              paddingTop: 8,
            },
          ],
          sceneStyle: [styles.scene, isB2B ? styles.sceneB2B : styles.sceneB2C],
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={iconByRoute(route.name, focused)}
              size={tabSizing.iconSize}
              color={focused ? theme.hybrid.signalStrong : theme.hybrid.panelCoolTextMuted}
            />
          ),
        })}
      >
        <Tab.Screen name="Discover" component={HomeScreen} options={{ title: 'Trang chủ' }} />
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
  const { mode, isB2B, setMode } = useAppMode();
  const canAccessB2BWorkspace =
    user?.commercialTier === 'pro' || user?.commercialTier === 'power' || user?.commercialTier === 'enterprise';
  const [fontsLoaded] = useInterFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
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
  const { onNavigationReady, onNavigationStateChange } = useNavigationTelemetry(navigationRef);
  const transitionProgress = useSharedValue(0);

  useEffect(() => {
    transitionProgress.value = 1;
    transitionProgress.value = withTiming(0, { duration: 220 });
  }, [mode, transitionProgress]);

  useEffect(() => {
    if (!isB2B) return;
    if (canAccessB2BWorkspace) return;
    setMode('B2C_MODE');
    if (navigationRef.isReady()) {
      navigationRef.navigate('B2BPaywall');
    }
  }, [canAccessB2BWorkspace, isB2B, setMode]);

  const transitionOverlayStyle = useAnimatedStyle(() => ({
    opacity: transitionProgress.value,
    transform: [{ scale: withTiming(1 + transitionProgress.value * 0.015, { duration: 220 }) }],
  }));

  useEffect(() => {
    void checkForEmergencyUpdates();
  }, []);

  if (!fontsLoaded || isHydrating || !intentGateReady || !opsReady) {
    return (
      <AppStateView
        variant="loading"
        title="ĐANG KẾT NỐI"
        message="Đang chuẩn bị phiên làm việc an toàn của bạn…"
      />
    );
  }

  if (opsConfig?.killSwitch) {
    return (
      <AppStateView
        variant="maintenance"
        title="BẢO TRÌ THEO LỊCH"
        message="Kết Nối Global đang tạm gián đoạn để bảo trì. Chúng tôi sẽ quay lại sớm."
        detail={`Ops source: ${opsConfig.source}`}
      />
    );
  }

  return (
    <View style={styles.rootShell}>
      <View
        style={[
          Platform.OS === 'web' ? styles.webMobileFrame : styles.nativeFrame,
          isB2B ? styles.workspaceFrameB2B : styles.workspaceFrameB2C,
        ]}
      >
        <NavigationContainer
          ref={navigationRef}
          linking={linking}
          theme={isB2B ? b2bTheme : b2cTheme}
          onReady={onNavigationReady}
          onStateChange={onNavigationStateChange}
        >
          <StatusBar style="dark" />
          <IntentEntryModal visible={showIntentModal} onSelectIntent={onGuidedIntent} onSkip={onSkipGuidedIntent} />
          <Stack.Navigator screenOptions={{ headerShown: false, headerBackTitle: 'Quay lại' }}>
            <Stack.Group>
              <Stack.Screen name="Tabs" component={MainTabs} />
              <Stack.Screen name="EmergencySOS" component={EmergencySOSScreen} />
              <Stack.Screen name="LeonaCall" component={LeonaCallScreen} />
              <Stack.Screen name="TravelCompanion" component={TravelCompanionScreen} />
              <Stack.Screen name="FlightSearchAssistant" component={FlightSearchAssistantScreen} />
              <Stack.Screen name="LifeOSDashboard" component={LifeOSDashboard} />
              <Stack.Screen name="KetNoiYeuThuong" component={KetNoiYeuThuongScreen} />
              <Stack.Screen name="PartnerDeals" component={PartnerDealsScreen} />
            </Stack.Group>

            <Stack.Group>
              <Stack.Screen name="Wallet" component={GlobalWalletScreen} />
              <Stack.Screen name="GlobalWallet" component={GlobalWalletScreen} />
              <Stack.Screen name="Vault" component={VaultScreen} />
            </Stack.Group>

            <Stack.Group>
              <Stack.Screen name="LiveAiTeacher" component={LiveAiTeacherScreen} />
              <Stack.Screen name="RolePlayScreen" component={AssistantChatScreen} />
              <Stack.Screen name="AdultLearningHome" component={AdultLearningHome} />
              <Stack.Screen name="KidsLearningHome" component={KidsLearningHome} />
              <Stack.Screen name="AssistantChat" component={AssistantChatScreen} />
            </Stack.Group>

            <Stack.Group>
              <Stack.Screen
                name="SmartCalendar"
                component={canAccessB2BWorkspace ? SmartCalendarScreen : ProSubscriptionPaywall}
              />
              <Stack.Screen
                name="InboundQueue"
                component={canAccessB2BWorkspace ? InboundQueueScreen : ProSubscriptionPaywall}
              />
              <Stack.Screen
                name="MerchantDashboard"
                component={canAccessB2BWorkspace ? LifeOSDashboard : ProSubscriptionPaywall}
              />
              <Stack.Screen name="B2BPaywall" component={ProSubscriptionPaywall} />
            </Stack.Group>

            <Stack.Group>
              <Stack.Screen name="AiEye" component={AiEyeScreen} />
            {/* Radar: mock preview when enableRadarSurface; otherwise auto-replace → Leona (see screen). */}
            <Stack.Screen name="RadarDiscovery" component={RadarDiscoveryScreen} />
            <Stack.Screen name="LiveInterpreter" component={LiveInterpreterScreen} />
            </Stack.Group>
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
        <Animated.View pointerEvents="none" style={[styles.modeTransitionOverlay, transitionOverlayStyle]} />
      </View>
    </View>
  );
}

export default function App() {
  const appShell = (
    <SafeAreaProvider>
      <FeatureFlagProvider>
        <TourProvider>
          <TelemetryProvider>
            <AuthProvider>
              <AppModeProvider>
                <AppRoot />
              </AppModeProvider>
            </AuthProvider>
          </TelemetryProvider>
        </TourProvider>
      </FeatureFlagProvider>
    </SafeAreaProvider>
  );

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
  rootShell: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? theme.colors.SoftMineralGrey : theme.colors.CeolWhite,
  },
  nativeFrame: {
    flex: 1,
  },
  webMobileFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: theme.colors.CeolWhite,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  tabBar: {
    position: 'absolute',
    borderTopWidth: 1,
    borderTopColor: theme.hybrid.panelCoolBorder,
    backgroundColor: theme.colors.CeolWhite,
    elevation: 8,
    shadowColor: theme.colors.background,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  tabBarB2B: {
    borderTopColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panel,
  },
  tabBarB2C: {
    borderTopColor: theme.hybrid.panelCoolBorder,
    backgroundColor: theme.colors.CeolWhite,
  },
  scene: {
    backgroundColor: theme.colors.SoftMineralGrey,
  },
  sceneB2B: {
    backgroundColor: theme.colors.DeepInkNavy,
  },
  sceneB2C: {
    backgroundColor: theme.colors.SoftMineralGrey,
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
    backgroundColor: theme.colors.CeolWhite,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    shadowColor: theme.colors.background,
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
  workspaceFrameB2B: {
    backgroundColor: theme.colors.DeepInkNavy,
  },
  workspaceFrameB2C: {
    backgroundColor: theme.colors.CeolWhite,
  },
  modeTransitionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 18, 34, 0.14)',
  },
});
