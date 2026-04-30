import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  useFonts as useMontserratFonts,
} from '@expo-google-fonts/montserrat';
import { Ionicons } from '@expo/vector-icons';
import {
  NavigationContainer,
  ThemeProvider,
  createNavigationContainerRef,
  useNavigation,
  type LinkingOptions,
} from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthPaywallModal } from './src/components/AuthPaywallModal';
import { AppStateView } from './src/components/ui/AppStateView';
import { IntentEntryModal } from './src/components/IntentEntryModal';
import { AuthProvider, useAuth, type RedirectTarget } from './src/context/AuthContext';
import {
  isAdminDebugSurfaceEnabled,
} from './src/config/adminDebugGate';
import { APP_BRAND } from './src/config/appBrand';
import { getStrings } from './src/i18n/strings';
import type { RootStackParamList, RootTabParamList } from './src/navigation/routes';
import { CaNhanScreen } from './src/screens/CaNhanScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { CongDongScreen } from './src/screens/CongDongScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { HocTapScreen } from './src/screens/HocTapScreen';
import { LeTanScreen } from './src/screens/LeTanScreen';
import { LeonaCallScreen } from './src/screens/LeonaCallScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { OtpScreen } from './src/screens/OtpScreen';
import { RoleSelectionScreen } from './src/screens/auth/RoleSelectionScreen';
import { SetupProfileScreen } from './src/screens/SetupProfileScreen';
import { ServiceHubScreen } from './src/screens/ServiceHubScreen';
import { AiEyeScreen } from './src/screens/AiEyeScreen';
import { AdminDashboardScreen } from './src/screens/AdminDashboardScreen';
import { AdminProfitDashboardScreen } from './src/screens/admin/AdminProfitDashboardScreen';
import { AdContentFactoryScreen } from './src/screens/admin/AdContentFactoryScreen';
import { SalesLeadCRM } from './src/screens/admin/SalesLeadCRM';
import { OutboundCampaignScreen } from './src/screens/admin/OutboundCampaignScreen';
import { FacebookWarRoomScreen } from './src/screens/admin/FacebookWarRoomScreen';
import { VaultScreen } from './src/screens/VaultScreen';
import { ReferralRewardScreen } from './src/screens/ReferralRewardScreen';
import { CashOutScreen } from './src/screens/b2c/CashOutScreen';
import { RadarDiscoveryScreen } from './src/screens/RadarDiscoveryScreen';
import { LifeOSDashboard } from './src/screens/LifeOSDashboard';
import { TravelCompanionScreen } from './src/screens/TravelCompanionScreen';
import { TravelHospitalityScreen } from './src/screens/b2c/TravelHospitalityScreen';
import { FlightSearchScreen } from './src/screens/b2c/travel/FlightSearchScreen';
import { TravelHubScreen } from './src/screens/b2c/travel/TravelHubScreen';
import { LocalScreen } from './src/screens/b2c/LocalScreen';
import { TravelSosHubScreen } from './src/screens/b2c/travel/TravelSosHubScreen';
import { LocalFixerScreen } from './src/screens/b2c/travel/LocalFixerScreen';
import { LocalFixerCheckoutScreen } from './src/screens/b2c/travel/LocalFixerCheckoutScreen';
import { FixerEarningsScreen } from './src/screens/b2c/travel/FixerEarningsScreen';
import { FlightSearchAssistantScreen } from './src/screens/FlightSearchAssistantScreen';
import { KetNoiYeuThuongScreen } from './src/screens/KetNoiYeuThuongScreen';
import { LiveInterpreterScreen } from './src/screens/LiveInterpreterScreen';
import { EmergencySOSScreen } from './src/screens/EmergencySOSScreen';
import { AdultLearningHome } from './src/screens/learning/AdultLearningHome';
import { KidsLearningHome } from './src/screens/learning/KidsLearningHome';
import { VietKidsScreen } from './src/screens/b2c/academy/VietKidsScreen';
import { KidsLeaderboardScreen } from './src/screens/b2c/academy/KidsLeaderboardScreen';
import { useAssistantSettings } from './src/state/assistantSettings';
import { theme } from './src/theme/theme';
import { FontFamily } from './src/theme/typography';
import { useAppStartupOrchestration } from './src/app/bootstrap/useAppStartupOrchestration';
import { AppModeProvider, useAppMode } from './src/context/AppModeContext';
import {
  LAUNCH_PILOT_CONFIG,
  PILOT_LEONA_SERVICES_FALLBACK_PREFILL,
  resolvePilotAwareRedirectTarget,
} from './src/config/launchPilot';
import { ConditionalStripeProvider } from './src/providers/ConditionalStripeProvider';
import { ProSubscriptionPaywall } from './src/screens/commercial/ProSubscriptionPaywall';
import { PartnerOnboardingScreen } from './src/screens/commercial/PartnerOnboardingScreen';
import { MerchantDashboardScreen } from './src/screens/b2b/MerchantDashboardScreen';
import { SmartCalendarScreen } from './src/screens/b2b/SmartCalendarScreen';
import { WalletB2BScreen } from './src/screens/b2b/WalletB2BScreen';
import { OrdersScreen } from './src/screens/b2b/OrdersScreen';
import { InternalTradeMarketScreen } from './src/screens/b2b/InternalTradeMarketScreen';
import { AdBiddingScreen } from './src/screens/b2b/AdBiddingScreen';
import { MerchantDetailScreen } from './src/screens/b2c/MerchantDetailScreen';
import { MerchantStorefrontScreen } from './src/screens/b2c/MerchantStorefrontScreen';
import { PromoToolsScreen } from './src/screens/b2b/PromoToolsScreen';
import { SponsoredAdsScreen } from './src/screens/b2b/SponsoredAdsScreen';
import { KOLPartnerDashboard } from './src/screens/commercial/KOLPartnerDashboard';
import { DailyRewardScreen } from './src/screens/b2c/DailyRewardScreen';
import { LoyaltyRewardsScreen } from './src/screens/b2c/LoyaltyRewardsScreen';
import { InboundQueueScreen } from './src/screens/b2b/InboundQueueScreen';
import { LiveAiTeacherScreen } from './src/screens/academy/LiveAiTeacherScreen';
import { b2bTheme, b2cTheme } from './src/theme/appModeThemes';
import {
  DIASPORA_RESTRICTION_MODAL_MESSAGE,
  DIASPORA_RESTRICTION_MODAL_TITLE,
} from './src/components/modals/DiasporaRestrictionModal';
import { evaluateMerchantSurfaceAccess } from './src/services/auth/merchantSurfaceEntry';
import { hasB2BWorkspaceAccess } from './src/utils/b2bAccess';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const rootLinking: LinkingOptions<RootStackParamList> = {
  prefixes: ['/'],
  config: {
    screens: {
      Tabs: '',
      B2BPaywall: 'B2BPaywall',
      MerchantDashboard: 'MerchantDashboard',
      WalletB2B: 'WalletB2B',
      Orders: 'Orders',
      InternalTradeMarket: 'InternalTradeMarket',
      AdBidding: 'AdBidding',
      PromoTools: 'PromoTools',
      SponsoredAds: 'SponsoredAds',
      KOLPartnerDashboard: 'KOLPartnerDashboard',
      PartnerOnboarding: 'PartnerOnboarding',
      LifeOSDashboard: 'LifeOSDashboard',
      TravelCompanion: 'TravelCompanion',
      TravelHub: 'TravelHub',
      LocalUniverse: 'LocalUniverse',
      TravelSosHub: 'TravelSosHub',
      LocalFixer: 'LocalFixer',
      LocalFixerCheckout: 'LocalFixerCheckout',
      FixerEarnings: 'FixerEarnings',
      TravelFlightSearch: 'TravelFlightSearch',
      TravelHospitality: 'TravelHospitality',
      FlightSearchAssistant: 'FlightSearchAssistant',
      KetNoiYeuThuong: 'KetNoiYeuThuong',
      EmergencySOS: 'EmergencySOS',
      AdultLearningHome: 'AdultLearningHome',
      KidsLearningHome: 'KidsLearningHome',
      VietKids: 'VietKids',
      KidsLeaderboard: 'KidsLeaderboard',
      Wallet: 'Wallet',
      MerchantStorefront: 'MerchantStorefront',
      ReferralReward: 'ReferralReward',
      CashOut: 'CashOut',
      DailyReward: 'DailyReward',
      LoyaltyRewards: 'LoyaltyRewards',
      AiEye: 'AiEye',
      Vault: 'Vault',
      RadarDiscovery: 'RadarDiscovery',
      LiveInterpreter: 'LiveInterpreter',
      LeonaCall: 'LeonaCall',
      AdminDashboard: 'AdminDashboard',
      AdminProfitDashboard: 'AdminProfitDashboard',
      SalesLeadCRM: 'SalesLeadCRM',
      AdContentFactory: 'AdContentFactory',
      OutboundCampaign: 'OutboundCampaign',
      FacebookWarRoom: 'FacebookWarRoom',
      Login: 'Login',
      Otp: 'Otp',
      RoleSelection: 'RoleSelection',
      SetupProfile: 'SetupProfile',
    },
  },
};

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
const STRIPE_MERCHANT_IDENTIFIER = process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER || undefined;
const STRIPE_URL_SCHEME = process.env.EXPO_PUBLIC_STRIPE_URL_SCHEME ?? 'ketnoieu';

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
  if (routeName === 'QuocGia') return focused ? 'apps' : 'apps-outline';
  if (routeName === 'TienIch') return focused ? 'grid' : 'grid-outline';
  if (routeName === 'HocTap') return focused ? 'school' : 'school-outline';
  if (routeName === 'CongDong') return focused ? 'people' : 'people-outline';
  if (routeName === 'LeTan') return focused ? 'headset' : 'headset-outline';
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
  const isDesktopWeb = Platform.OS === 'web' && width > 768;
  const compactTabs = width <= 375;
  const tabSizing = useMemo(
    () => ({
      tabBarBaseHeight: compactTabs ? 52 : 56,
      labelSize: compactTabs ? 10 : 11,
      iconSize: compactTabs ? 22 : 24,
    }),
    [compactTabs]
  );

  const openPaywall = (target: RedirectTarget) => {
    setPendingRedirect(target);
    setPaywallTarget(target);
  };

  useEffect(() => {
    if (!user || !pendingRedirect) return;
    if (pendingRedirect === 'HocTap' || pendingRedirect === 'LeTan') {
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
    if (pendingRedirect === 'B2BPaywall') {
      setPendingRedirect(null);
      void (async () => {
        const access = await evaluateMerchantSurfaceAccess(user?.phone);
        if (access.denied && access.kind === 'vn_dial') {
          Alert.alert(DIASPORA_RESTRICTION_MODAL_TITLE, DIASPORA_RESTRICTION_MODAL_MESSAGE);
          navigation.navigate('Tabs');
          return;
        }
        if (access.denied && access.kind === 'gps_vn') {
          Alert.alert('Kết Nối Global', access.message);
          navigation.navigate('Tabs');
          return;
        }
        navigation.navigate('B2BPaywall');
      })();
      return;
    }
    if (
      pendingRedirect === 'Wallet' ||
      pendingRedirect === 'AiEye' ||
      pendingRedirect === 'LeonaCall' ||
      pendingRedirect === 'Vault'
    ) {
      navigation.navigate(pendingRedirect);
      setPendingRedirect(null);
    }
  }, [navigation, pendingRedirect, setPendingRedirect, user]);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          // Solid bar only (tabBarStyle). Do not use tabBarBackground + BlurView: web crashes if BlurView is not imported.
          headerShown: false,
          tabBarPosition: isDesktopWeb ? 'left' : 'bottom',
          tabBarActiveTintColor: theme.hybrid.signalStrong,
          tabBarInactiveTintColor: theme.hybrid.panelCoolTextMuted,
          tabBarLabelStyle: [styles.tabLabel, { fontSize: tabSizing.labelSize }],
          tabBarItemStyle: [styles.tabItem, isDesktopWeb && styles.tabItemDesktop],
          tabBarStyle: [
            styles.tabBar,
            isDesktopWeb
              ? {
                  width: 250,
                  height: '100%',
                  paddingTop: insets.top + 16,
                  paddingBottom: Math.max(insets.bottom, 16),
                }
              : {
                  height: tabSizing.tabBarBaseHeight + insets.bottom,
                  paddingBottom: Math.max(insets.bottom, 10),
                  paddingTop: 8,
                },
            isDesktopWeb && styles.tabBarDesktop,
          ],
          sceneStyle: [styles.scene, isDesktopWeb && styles.sceneDesktop],
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={iconByRoute(route.name, focused)}
              size={tabSizing.iconSize}
              color={focused ? theme.hybrid.signalStrong : theme.hybrid.panelCoolTextMuted}
            />
          ),
        })}
      >
        <Tab.Screen name="QuocGia" component={HomeScreen} options={{ title: strings.nav.countryTab }} />
        <Tab.Screen name="TienIch" component={ServiceHubScreen} options={{ title: strings.nav.utilityTab }} />
        <Tab.Screen
          name="HocTap"
          component={HocTapScreen}
          options={{ title: strings.nav.learningTab }}
          listeners={{
            tabPress: (e) => {
              if (!user) {
                e.preventDefault();
                openPaywall('HocTap');
              }
            },
          }}
        />
        {LAUNCH_PILOT_CONFIG.enableCommunitySurface ? (
          <Tab.Screen name="CongDong" component={CongDongScreen} options={{ title: strings.nav.communityTab }} />
        ) : null}
        <Tab.Screen
          name="LeTan"
          component={LeTanScreen}
          options={{ title: strings.nav.receptionTab }}
          listeners={{
            tabPress: (e) => {
              if (!user) {
                e.preventDefault();
                openPaywall('LeTan');
              }
            },
          }}
        />
        <Tab.Screen name="CaNhan" component={CaNhanScreen} options={{ title: strings.nav.profileTab }} />
      </Tab.Navigator>
      <AuthPaywallModal
        visible={!!paywallTarget}
        title="Tính năng hỗ trợ & gọi"
        description="Học tập, Lễ tân Minh Khang và gọi hỗ trợ Leona cần đăng nhập. Vui lòng xác thực số điện thoại để tiếp tục."
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
  const { width } = useWindowDimensions();
  const isLargeScreen = Platform.OS === 'web' && width > 768;
  const { isHydrating, user, setPendingRedirect } = useAuth();
  const { mode, transitionKey } = useAppMode();
  const [isOnline, setIsOnline] = useState(true);
  const transitionAnim = useRef(new Animated.Value(0)).current;
  const [fontsLoaded] = useMontserratFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
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

  useEffect(() => {
    transitionAnim.setValue(0);
    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [transitionAnim, transitionKey]);

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

  const navigationTheme = b2cTheme;

  return (
    <View style={{ flex: 1, width: '100%', maxWidth: isLargeScreen ? '100%' : 600, alignSelf: 'center' }}>
      <ThemeProvider value={navigationTheme}>
      <NavigationContainer ref={navigationRef} linking={rootLinking} theme={navigationTheme}>
        <StatusBar style="dark" />
        <IntentEntryModal visible={showIntentModal} onSelectIntent={onGuidedIntent} onSkip={onSkipGuidedIntent} />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Group>
            <Stack.Screen name="Tabs" component={MainTabs} />
            <Stack.Screen name="LifeOSDashboard" component={LifeOSDashboard} />
            <Stack.Screen name="TravelCompanion" component={TravelCompanionScreen} />
            <Stack.Screen
              name="TravelHub"
              component={TravelHubScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_right',
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="LocalUniverse"
              component={LocalScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_right',
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="TravelSosHub"
              component={TravelSosHubScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_right',
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="LocalFixer"
              component={LocalFixerScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_right',
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="LocalFixerCheckout"
              component={LocalFixerCheckoutScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_right',
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="FixerEarnings"
              component={FixerEarningsScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_right',
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="TravelFlightSearch"
              component={FlightSearchScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_right',
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen name="TravelHospitality" component={TravelHospitalityScreen} />
            <Stack.Screen name="FlightSearchAssistant" component={FlightSearchAssistantScreen} />
            <Stack.Screen name="KetNoiYeuThuong" component={KetNoiYeuThuongScreen} />
            <Stack.Screen name="EmergencySOS" component={EmergencySOSScreen} />
            <Stack.Screen name="LeonaCall" component={LeonaCallScreen} />
            <Stack.Screen name="LiveInterpreter" component={LiveInterpreterScreen} />
          </Stack.Group>

          <Stack.Group>
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="MerchantDetail" component={MerchantDetailScreen} />
            <Stack.Screen name="MerchantStorefront" component={MerchantStorefrontScreen} />
            <Stack.Screen name="ReferralReward" component={ReferralRewardScreen} />
            <Stack.Screen name="CashOut" component={CashOutScreen} />
            <Stack.Screen name="DailyReward" component={DailyRewardScreen} />
            <Stack.Screen
              name="LoyaltyRewards"
              component={LoyaltyRewardsScreen}
              options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'transparentModal' }}
            />
            <Stack.Screen name="Vault" component={VaultScreen} />
            <Stack.Screen name="AiEye" component={AiEyeScreen} />
          </Stack.Group>

          <Stack.Group>
            <Stack.Screen name="AdultLearningHome" component={AdultLearningHome} />
            <Stack.Screen name="KidsLearningHome" component={KidsLearningHome} />
            <Stack.Screen name="VietKids" component={VietKidsScreen} />
            <Stack.Screen name="KidsLeaderboard" component={KidsLeaderboardScreen} />
            <Stack.Screen name="LiveAiTeacher" component={LiveAiTeacherScreen} />
          </Stack.Group>

          <Stack.Group>
            <Stack.Screen name="B2BPaywall" component={ProSubscriptionPaywall} />
            <Stack.Screen name="MerchantDashboard" component={GatedMerchantDashboardScreen} />
            <Stack.Screen name="InboundQueue" component={GatedInboundQueueScreen} />
            <Stack.Screen name="SmartCalendar" component={GatedSmartCalendarScreen} />
            <Stack.Screen name="WalletB2B" component={GatedWalletB2BScreen} />
            <Stack.Screen name="Orders" component={GatedOrdersScreen} />
            <Stack.Screen name="InternalTradeMarket" component={GatedInternalTradeMarketScreen} />
            <Stack.Screen name="AdBidding" component={GatedAdBiddingScreen} />
            <Stack.Screen name="PromoTools" component={GatedPromoToolsScreen} />
            <Stack.Screen name="SponsoredAds" component={GatedSponsoredAdsScreen} />
            <Stack.Screen name="KOLPartnerDashboard" component={GatedKOLPartnerDashboardScreen} />
            <Stack.Screen name="PartnerOnboarding" component={PartnerOnboardingScreen} />
          </Stack.Group>

          {/* Radar: mock preview when enableRadarSurface; otherwise auto-replace → Leona (see screen). */}
          <Stack.Screen name="RadarDiscovery" component={RadarDiscoveryScreen} />
          {isAdminDebugSurfaceEnabled() ? (
            <>
              <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
              <Stack.Screen name="AdminProfitDashboard" component={AdminProfitDashboardScreen} />
              <Stack.Screen name="SalesLeadCRM" component={SalesLeadCRM} />
              <Stack.Screen name="AdContentFactory" component={AdContentFactoryScreen} />
              <Stack.Screen name="OutboundCampaign" component={OutboundCampaignScreen} />
              <Stack.Screen name="FacebookWarRoom" component={FacebookWarRoomScreen} />
            </>
          ) : null}
          <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Otp" component={OtpScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} options={{ presentation: 'modal' }} />
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
          <Text style={styles.brandIcon}>{APP_BRAND.icon}</Text>
        </View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.modeTransitionOverlay,
            {
              opacity: transitionAnim.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0] }),
              transform: [{ scale: transitionAnim.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) }],
              backgroundColor: mode === 'B2B_MODE' ? 'rgba(0, 255, 102, 0.22)' : 'rgba(85, 144, 224, 0.18)',
            },
          ]}
        />
      </NavigationContainer>
      </ThemeProvider>
    </View>
  );
}

function B2BWorkspaceGate({ children }: { children: ReactElement }) {
  const { user } = useAuth();
  if (!hasB2BWorkspaceAccess(user)) return <ProSubscriptionPaywall />;
  return <ThemeProvider value={b2bTheme}>{children}</ThemeProvider>;
}

function GatedMerchantDashboardScreen() {
  return (
    <B2BWorkspaceGate>
      <MerchantDashboardScreen />
    </B2BWorkspaceGate>
  );
}

function GatedInboundQueueScreen() {
  return (
    <B2BWorkspaceGate>
      <InboundQueueScreen />
    </B2BWorkspaceGate>
  );
}

function GatedSmartCalendarScreen() {
  return (
    <B2BWorkspaceGate>
      <SmartCalendarScreen />
    </B2BWorkspaceGate>
  );
}

function GatedWalletB2BScreen() {
  return (
    <B2BWorkspaceGate>
      <WalletB2BScreen />
    </B2BWorkspaceGate>
  );
}

function GatedOrdersScreen() {
  return (
    <B2BWorkspaceGate>
      <OrdersScreen />
    </B2BWorkspaceGate>
  );
}

function GatedInternalTradeMarketScreen() {
  return (
    <B2BWorkspaceGate>
      <InternalTradeMarketScreen />
    </B2BWorkspaceGate>
  );
}

function GatedAdBiddingScreen() {
  return (
    <B2BWorkspaceGate>
      <AdBiddingScreen />
    </B2BWorkspaceGate>
  );
}

function GatedPromoToolsScreen() {
  return (
    <B2BWorkspaceGate>
      <PromoToolsScreen />
    </B2BWorkspaceGate>
  );
}

function GatedSponsoredAdsScreen() {
  return (
    <B2BWorkspaceGate>
      <SponsoredAdsScreen />
    </B2BWorkspaceGate>
  );
}

function GatedKOLPartnerDashboardScreen() {
  return (
    <B2BWorkspaceGate>
      <KOLPartnerDashboard />
    </B2BWorkspaceGate>
  );
}

export default function App() {
  const appShell = (
    <SafeAreaProvider>
      <AuthProvider>
        <AppModeProvider>
          <AppRoot />
        </AppModeProvider>
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
    backgroundColor: b2cTheme.colors.card,
    elevation: 8,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  scene: {
    backgroundColor: b2cTheme.colors.background,
  },
  tabItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItemDesktop: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: FontFamily.semibold,
    marginTop: 2,
  },
  tabBarDesktop: {
    position: 'relative',
    borderTopWidth: 0,
    borderRightWidth: 1,
    borderRightColor: theme.hybrid.panelCoolBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  sceneDesktop: {
    flex: 1,
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
  brandIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  modeTransitionOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
