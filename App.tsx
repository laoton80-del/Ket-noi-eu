import './src/i18n';
import { applyStoredLanguage } from './src/i18n/persistLanguage';
import { AppQueryProvider } from './src/providers/AppQueryProvider';
import { initProductAnalytics } from './src/services/AnalyticsService';
import * as Sentry from '@sentry/react-native';
import { initMonitoringRadar } from './src/config/sentryConfig';

initMonitoringRadar();

import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  useFonts as useMontserratFonts,
} from '@expo-google-fonts/montserrat';
import {
  NavigationContainer,
  ThemeProvider,
  createNavigationContainerRef,
  type LinkingOptions,
} from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppStateView } from './src/components/ui/AppStateView';
import { IntentEntryModal } from './src/components/IntentEntryModal';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import {
  isAdminDebugSurfaceEnabled,
} from './src/config/adminDebugGate';
import { APP_BRAND } from './src/config/appBrand';
import type { GuidedIntentId } from './src/onboarding/guidedOnboardingStorage';
import { resolveRootStackRoute } from './src/navigation/AppNavigator';
import { MainTabNavigator } from './src/navigation/MainTabNavigator';
import type { RootStackParamList } from './src/navigation/routes';
import { CaNhanScreen } from './src/screens/CaNhanScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { LeonaCallScreen } from './src/screens/LeonaCallScreen';
import { CallScreen } from './src/screens/comms/CallScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { OtpScreen } from './src/screens/OtpScreen';
import { RoleSelectionScreen } from './src/screens/auth/RoleSelectionScreen';
import { SetupProfileScreen } from './src/screens/SetupProfileScreen';
import { AiEyeScreen } from './src/screens/AiEyeScreen';
import { AdminDashboardScreen } from './src/screens/AdminDashboardScreen';
import { AdminProfitDashboardScreen } from './src/screens/admin/AdminProfitDashboardScreen';
import { AdContentFactoryScreen } from './src/screens/admin/AdContentFactoryScreen';
import { SalesLeadCRM } from './src/screens/admin/SalesLeadCRM';
import { OutboundCampaignScreen } from './src/screens/admin/OutboundCampaignScreen';
import { FacebookWarRoomScreen } from './src/screens/admin/FacebookWarRoomScreen';
import { MarketingApprovalScreen } from './src/screens/admin/MarketingApprovalScreen';
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
import { VietnamHubScreen } from './src/screens/b2c/VietnamHubScreen';
import { TourismBookingConfirmedScreen } from './src/screens/b2c/TourismBookingConfirmedScreen';
import { ViralWrapScreen } from './src/screens/b2c/ViralWrapScreen';
import { TourismCheckoutScreen } from './src/screens/b2c/TourismCheckoutScreen';
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
import { SuperAppUserStoreSync } from './src/store/SuperAppUserStoreSync';
import { theme } from './src/theme/theme';
import { useAppStartupOrchestration } from './src/app/bootstrap/useAppStartupOrchestration';
import { AppModeProvider, useAppMode } from './src/context/AppModeContext';
import { HubThemeProvider } from './src/context/HubThemeContext';
import { ConditionalStripeProvider } from './src/providers/ConditionalStripeProvider';
import { B2BPaywallScreen } from './src/screens/b2b/B2BPaywallScreen';
import { PartnerOnboardingScreen } from './src/screens/commercial/PartnerOnboardingScreen';
import { MerchantDashboardScreen } from './src/screens/b2b/MerchantDashboardScreen';
import { AiReceptionistSetupChecklistScreen } from './src/screens/b2b/AiReceptionistSetupChecklistScreen';
import { AiReceptionistDemoSimulatorScreen } from './src/screens/b2b/AiReceptionistDemoSimulatorScreen';
import { AiReceptionistPilotRequestScreen } from './src/screens/b2b/AiReceptionistPilotRequestScreen';
import { SmartCalendarScreen } from './src/screens/b2b/SmartCalendarScreen';
import { WalletB2BScreen } from './src/screens/b2b/WalletB2BScreen';
import { OrdersScreen } from './src/screens/b2b/OrdersScreen';
import { InternalTradeMarketScreen } from './src/screens/b2b/InternalTradeMarketScreen';
import { AdBiddingScreen } from './src/screens/b2b/AdBiddingScreen';
import { MerchantDetailScreen } from './src/screens/b2c/MerchantDetailScreen';
import { MerchantStorefrontScreen } from './src/screens/b2c/MerchantStorefrontScreen';
import { PromoToolsScreen } from './src/screens/b2b/PromoToolsScreen';
import { B2BPromotionSettings } from './src/screens/b2b/B2BPromotionSettings';
import { SponsoredAdsScreen } from './src/screens/b2b/SponsoredAdsScreen';
import { KOLPartnerDashboard } from './src/screens/commercial/KOLPartnerDashboard';
import { DailyRewardScreen } from './src/screens/b2c/DailyRewardScreen';
import { LoyaltyRewardsScreen } from './src/screens/b2c/LoyaltyRewardsScreen';
import { InboundQueueScreen } from './src/screens/b2b/InboundQueueScreen';
import { LiveAiTeacherScreen } from './src/screens/academy/LiveAiTeacherScreen';
import { DemoTourOverlay } from './src/components/onboarding/DemoTourOverlay';
import { V7NavigationSurfaceProvider, useNavigationThemeForHub } from './src/context/V7NavigationSurfaceContext';
import { b2bTheme } from './src/theme/appModeThemes';
import { hasB2BWorkspaceAccess } from './src/utils/b2bAccess';
import { getFeatureFlags, type FeatureFlags } from './src/core/feature-flags/featureFlags';
import {
  mvpGateByFlag,
  MVP_ACADEMY_LITE_OFF_MSG,
  MVP_B2B_AI_RECEPTIONIST_PRODUCTION_OFF_MSG,
  MVP_B2B_AUTO_BILL_PRINT_OFF_MSG,
  MVP_B2B_AUTO_BOOKING_OFF_MSG,
  MVP_B2B_AUTO_INVENTORY_OFF_MSG,
  MVP_B2B_AUTO_PAYMENT_OFF_MSG,
  MVP_B2B_AI_RECEPTIONIST_DEMO_OFF_MSG,
  MVP_LEONA_LITE_OFF_MSG,
  MVP_LIVE_PAYMENT_OFF_MSG,
  MVP_OMNI_DEMO_OFF_MSG,
  MVP_TOKEN_ECONOMY_OFF_MSG,
  MVP_TRAVEL_LITE_OFF_MSG,
  MvpSurfaceDisabledScreen,
} from './src/navigation/mvpSurfaceGate';

const Stack = createNativeStackNavigator<RootStackParamList>();

const TravelCompanionScreenGated = mvpGateByFlag(
  'travelLiteEnabled',
  'Travel Lite',
  MVP_TRAVEL_LITE_OFF_MSG,
  TravelCompanionScreen
);
const TravelHubStackScreenGated = mvpGateByFlag(
  'travelLiteEnabled',
  'Travel Lite',
  MVP_TRAVEL_LITE_OFF_MSG,
  TravelHubScreen
);
const VietnamHubScreenGated = mvpGateByFlag(
  'travelLiteEnabled',
  'Travel Lite',
  MVP_TRAVEL_LITE_OFF_MSG,
  VietnamHubScreen
);
const TourismCheckoutScreenGated = mvpGateByFlag(
  'travelLiteEnabled',
  'Travel Lite',
  MVP_TRAVEL_LITE_OFF_MSG,
  mvpGateByFlag('liveStripePaymentEnabled', 'Live payments', MVP_LIVE_PAYMENT_OFF_MSG, TourismCheckoutScreen)
);
const TourismBookingConfirmedScreenGated = mvpGateByFlag(
  'travelLiteEnabled',
  'Travel Lite',
  MVP_TRAVEL_LITE_OFF_MSG,
  mvpGateByFlag(
    'liveStripePaymentEnabled',
    'Live payments',
    MVP_LIVE_PAYMENT_OFF_MSG,
    TourismBookingConfirmedScreen
  )
);
const ViralWrapScreenGated = mvpGateByFlag(
  'travelLiteEnabled',
  'Travel Lite',
  MVP_TRAVEL_LITE_OFF_MSG,
  ViralWrapScreen
);
const TravelSosHubScreenGated = mvpGateByFlag(
  'travelLiteEnabled',
  'Travel Lite',
  MVP_TRAVEL_LITE_OFF_MSG,
  TravelSosHubScreen
);
const LocalFixerScreenGated = mvpGateByFlag(
  'travelLiteEnabled',
  'Travel Lite',
  MVP_TRAVEL_LITE_OFF_MSG,
  LocalFixerScreen
);
const LocalFixerCheckoutScreenGated = mvpGateByFlag(
  'travelLiteEnabled',
  'Travel Lite',
  MVP_TRAVEL_LITE_OFF_MSG,
  mvpGateByFlag('liveStripePaymentEnabled', 'Live payments', MVP_LIVE_PAYMENT_OFF_MSG, LocalFixerCheckoutScreen)
);
const FixerEarningsScreenGated = mvpGateByFlag(
  'travelLiteEnabled',
  'Travel Lite',
  MVP_TRAVEL_LITE_OFF_MSG,
  mvpGateByFlag('liveStripePaymentEnabled', 'Live payments', MVP_LIVE_PAYMENT_OFF_MSG, FixerEarningsScreen)
);
const FlightSearchScreenGated = mvpGateByFlag(
  'travelLiteEnabled',
  'Travel Lite',
  MVP_TRAVEL_LITE_OFF_MSG,
  mvpGateByFlag('liveStripePaymentEnabled', 'Live payments', MVP_LIVE_PAYMENT_OFF_MSG, FlightSearchScreen)
);
const TravelHospitalityScreenGated = mvpGateByFlag(
  'travelLiteEnabled',
  'Travel Lite',
  MVP_TRAVEL_LITE_OFF_MSG,
  mvpGateByFlag('liveStripePaymentEnabled', 'Live payments', MVP_LIVE_PAYMENT_OFF_MSG, TravelHospitalityScreen)
);
const FlightSearchAssistantScreenGated = mvpGateByFlag(
  'travelLiteEnabled',
  'Travel Lite',
  MVP_TRAVEL_LITE_OFF_MSG,
  mvpGateByFlag('liveStripePaymentEnabled', 'Live payments', MVP_LIVE_PAYMENT_OFF_MSG, FlightSearchAssistantScreen)
);

const AdultLearningHomeGated = mvpGateByFlag(
  'academyLiteEnabled',
  'Academy Lite',
  MVP_ACADEMY_LITE_OFF_MSG,
  AdultLearningHome
);
const KidsLearningHomeGated = mvpGateByFlag(
  'academyLiteEnabled',
  'Academy Lite',
  MVP_ACADEMY_LITE_OFF_MSG,
  KidsLearningHome
);
const VietKidsScreenGated = mvpGateByFlag(
  'academyLiteEnabled',
  'Academy Lite',
  MVP_ACADEMY_LITE_OFF_MSG,
  VietKidsScreen
);
const KidsLeaderboardScreenGated = mvpGateByFlag(
  'academyLiteEnabled',
  'Academy Lite',
  MVP_ACADEMY_LITE_OFF_MSG,
  KidsLeaderboardScreen
);
const LiveAiTeacherScreenGated = mvpGateByFlag(
  'academyLiteEnabled',
  'Academy Lite',
  MVP_ACADEMY_LITE_OFF_MSG,
  LiveAiTeacherScreen
);

const LeonaCallScreenGated = mvpGateByFlag(
  'leonaAssistantEnabled',
  'Leona Assistant Lite',
  MVP_LEONA_LITE_OFF_MSG,
  LeonaCallScreen
);
const LiveInterpreterScreenGated = mvpGateByFlag(
  'leonaAssistantEnabled',
  'Live Interpreter',
  MVP_LEONA_LITE_OFF_MSG,
  LiveInterpreterScreen
);
const RadarDiscoveryScreenGated = mvpGateByFlag(
  'leonaAssistantEnabled',
  'Radar & Discovery',
  MVP_LEONA_LITE_OFF_MSG,
  RadarDiscoveryScreen
);
const AiEyeScreenGated = mvpGateByFlag(
  'b2bAiReceptionistDemoEnabled',
  'B2B AI Receptionist (demo)',
  MVP_B2B_AI_RECEPTIONIST_DEMO_OFF_MSG,
  AiEyeScreen
);

const CashOutScreenGated = mvpGateByFlag(
  'vigTokenEconomyEnabled',
  'Cash out',
  MVP_TOKEN_ECONOMY_OFF_MSG,
  CashOutScreen
);
const VaultScreenGated = mvpGateByFlag(
  'vigTokenEconomyEnabled',
  'Vault',
  MVP_TOKEN_ECONOMY_OFF_MSG,
  VaultScreen
);

const navigationRef = createNavigationContainerRef<RootStackParamList>();

const rootLinking: LinkingOptions<RootStackParamList> = {
  prefixes: ['/'],
  config: {
    screens: {
      Tabs: {
        path: '',
        screens: {
          TabHome: 'home',
          TabLocal: 'local',
          TabTravel: 'travel',
          TabAi: 'ai',
          TabMerchant: 'm',
          TabCatalog: 'catalog',
          TabOrders: 'orders',
          TabEarnings: 'earnings',
          TabRadar: 'broker',
          TabBrokerMerchants: 'broker-merchants',
          TabQr: 'broker-qr',
          TabCommissions: 'broker-pay',
          TabBrokerWallet: 'broker-wallet',
          TabCommandCenter: 'command-center',
        },
      },
      PersonalHub: 'account',
      B2BPaywall: 'B2BPaywall',
      MerchantDashboard: 'MerchantDashboard',
      AiReceptionistSetupChecklist: 'AiReceptionistSetupChecklist',
      AiReceptionistDemoSimulator: 'AiReceptionistDemoSimulator',
      AiReceptionistPilotRequest: 'AiReceptionistPilotRequest',
      WalletB2B: 'WalletB2B',
      Orders: 'Orders',
      InternalTradeMarket: 'InternalTradeMarket',
      AdBidding: 'AdBidding',
      PromoTools: 'PromoTools',
      B2BPromotionSettings: 'B2BPromotionSettings',
      SponsoredAds: 'SponsoredAds',
      KOLPartnerDashboard: 'KOLPartnerDashboard',
      PartnerOnboarding: 'PartnerOnboarding',
      LifeOSDashboard: 'LifeOSDashboard',
      TravelCompanion: 'TravelCompanion',
      TravelHub: 'TravelHub',
      LocalUniverse: 'LocalUniverse',
      VietnamHub: 'VietnamHub',
      TourismCheckout: 'tourism-checkout',
      TourismBookingConfirmed: 'tourism-booking-confirmed',
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

type AppNavigationShellProps = Readonly<{
  insets: import('react-native-safe-area-context').EdgeInsets;
  isLargeScreen: boolean;
  user: import('./src/context/authTypes').AuthUser | null;
  transitionAnim: Animated.Value;
  mode: import('./src/context/AppModeContext').AppMode;
  showIntentModal: boolean;
  onGuidedIntent: (id: GuidedIntentId) => void;
  onSkipGuidedIntent: () => void;
}>;

function AppNavigationShell({
  insets,
  isLargeScreen,
  user,
  transitionAnim,
  mode,
  showIntentModal,
  onGuidedIntent,
  onSkipGuidedIntent,
}: AppNavigationShellProps): ReactElement {
  const { navigationTheme, statusBarStyle, syncFromRootStackRoute } = useNavigationThemeForHub();
  return (
    <View style={{ flex: 1, width: '100%', maxWidth: isLargeScreen ? '100%' : 600, alignSelf: 'center' }}>
      <ThemeProvider value={navigationTheme}>
        <NavigationContainer
          ref={navigationRef}
          linking={rootLinking}
          theme={navigationTheme}
          onStateChange={(state) => {
            if (!state?.routes?.length) return;
            const idx = state.index ?? 0;
            const r = state.routes[idx];
            if (r?.name) syncFromRootStackRoute(r.name as keyof RootStackParamList);
          }}
        >
          <StatusBar style={statusBarStyle} />
          <SuperAppUserStoreSync />
          <IntentEntryModal visible={showIntentModal} onSelectIntent={onGuidedIntent} onSkip={onSkipGuidedIntent} />
          <Stack.Navigator
            key={`root-${user?.phone ?? 'guest'}`}
            initialRouteName={resolveRootStackRoute(user)}
            screenOptions={{ headerShown: false }}
          >
            <Stack.Group>
              <Stack.Screen name="Tabs" component={MainTabNavigator} />
              <Stack.Screen name="PersonalHub" component={CaNhanScreen} />
              <Stack.Screen name="LifeOSDashboard" component={LifeOSDashboard} />
              <Stack.Screen name="TravelCompanion" component={TravelCompanionScreenGated} />
              <Stack.Screen
                name="TravelHub"
                component={TravelHubStackScreenGated}
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
                name="VietnamHub"
                component={VietnamHubScreenGated}
                options={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  fullScreenGestureEnabled: true,
                }}
              />
              <Stack.Screen
                name="TourismCheckout"
                component={TourismCheckoutScreenGated}
                options={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  fullScreenGestureEnabled: true,
                }}
              />
              <Stack.Screen
                name="TourismBookingConfirmed"
                component={TourismBookingConfirmedScreenGated}
                options={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  fullScreenGestureEnabled: true,
                }}
              />
              <Stack.Screen
                name="ViralWrap"
                component={ViralWrapScreenGated}
                options={{
                  headerShown: false,
                  animation: 'slide_from_bottom',
                  fullScreenGestureEnabled: true,
                }}
              />
              <Stack.Screen
                name="TravelSosHub"
                component={TravelSosHubScreenGated}
                options={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  fullScreenGestureEnabled: true,
                }}
              />
              <Stack.Screen
                name="LocalFixer"
                component={LocalFixerScreenGated}
                options={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  fullScreenGestureEnabled: true,
                }}
              />
              <Stack.Screen
                name="LocalFixerCheckout"
                component={LocalFixerCheckoutScreenGated}
                options={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  fullScreenGestureEnabled: true,
                }}
              />
              <Stack.Screen
                name="FixerEarnings"
                component={FixerEarningsScreenGated}
                options={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  fullScreenGestureEnabled: true,
                }}
              />
              <Stack.Screen
                name="TravelFlightSearch"
                component={FlightSearchScreenGated}
                options={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  fullScreenGestureEnabled: true,
                }}
              />
              <Stack.Screen name="TravelHospitality" component={TravelHospitalityScreenGated} />
              <Stack.Screen name="FlightSearchAssistant" component={FlightSearchAssistantScreenGated} />
              <Stack.Screen name="KetNoiYeuThuong" component={KetNoiYeuThuongScreen} />
              <Stack.Screen name="EmergencySOS" component={EmergencySOSScreen} />
              <Stack.Screen name="LeonaCall" component={LeonaCallScreenGated} />
              <Stack.Screen
                name="P2PVoiceCall"
                component={CallScreen}
                options={{ headerShown: false, animation: 'fade' }}
              />
              <Stack.Screen name="LiveInterpreter" component={LiveInterpreterScreenGated} />
            </Stack.Group>

            <Stack.Group>
              <Stack.Screen name="Wallet" component={WalletScreen} />
              <Stack.Screen name="MerchantDetail" component={MerchantDetailScreen} />
              <Stack.Screen name="MerchantStorefront" component={MerchantStorefrontScreen} />
              <Stack.Screen name="ReferralReward" component={ReferralRewardScreen} />
              <Stack.Screen name="CashOut" component={CashOutScreenGated} />
              <Stack.Screen name="DailyReward" component={DailyRewardScreen} />
              <Stack.Screen
                name="LoyaltyRewards"
                component={LoyaltyRewardsScreen}
                options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'transparentModal' }}
              />
              <Stack.Screen name="Vault" component={VaultScreenGated} />
              <Stack.Screen name="AiEye" component={AiEyeScreenGated} />
            </Stack.Group>

            <Stack.Group>
              <Stack.Screen name="AdultLearningHome" component={AdultLearningHomeGated} />
              <Stack.Screen name="KidsLearningHome" component={KidsLearningHomeGated} />
              <Stack.Screen name="VietKids" component={VietKidsScreenGated} />
              <Stack.Screen name="KidsLeaderboard" component={KidsLeaderboardScreenGated} />
              <Stack.Screen name="LiveAiTeacher" component={LiveAiTeacherScreenGated} />
            </Stack.Group>

            <Stack.Group>
              <Stack.Screen name="B2BPaywall" component={B2BPaywallScreen} />
              <Stack.Screen name="MerchantDashboard" component={GatedMerchantDashboardScreen} />
              <Stack.Screen name="AiReceptionistSetupChecklist" component={GatedAiReceptionistSetupChecklistScreen} />
              <Stack.Screen name="AiReceptionistDemoSimulator" component={GatedAiReceptionistDemoSimulatorScreen} />
              <Stack.Screen name="AiReceptionistPilotRequest" component={GatedAiReceptionistPilotRequestScreen} />
              <Stack.Screen name="InboundQueue" component={GatedInboundQueueScreen} />
              <Stack.Screen name="SmartCalendar" component={GatedSmartCalendarScreen} />
              <Stack.Screen name="WalletB2B" component={GatedWalletB2BScreen} />
              <Stack.Screen name="Orders" component={GatedOrdersScreen} />
              <Stack.Screen name="InternalTradeMarket" component={GatedInternalTradeMarketScreen} />
              <Stack.Screen name="AdBidding" component={GatedAdBiddingScreen} />
              <Stack.Screen name="PromoTools" component={GatedPromoToolsScreen} />
              <Stack.Screen name="B2BPromotionSettings" component={GatedB2BPromotionSettingsScreen} />
              <Stack.Screen name="SponsoredAds" component={GatedSponsoredAdsScreen} />
              <Stack.Screen name="KOLPartnerDashboard" component={GatedKOLPartnerDashboardScreen} />
              <Stack.Screen name="PartnerOnboarding" component={PartnerOnboardingScreen} />
            </Stack.Group>

            <Stack.Screen name="RadarDiscovery" component={RadarDiscoveryScreenGated} />
            {isAdminDebugSurfaceEnabled() && getFeatureFlags().adminDemoMetricsEnabled ? (
              <>
                <Stack.Screen name="AdminDashboard" component={GatedAdminDashboardScreen} />
                <Stack.Screen name="AdminProfitDashboard" component={AdminProfitDashboardScreen} />
                <Stack.Screen name="SalesLeadCRM" component={SalesLeadCRM} />
                <Stack.Screen name="AdContentFactory" component={AdContentFactoryScreen} />
                <Stack.Screen name="OutboundCampaign" component={OutboundCampaignScreen} />
                <Stack.Screen name="FacebookWarRoom" component={FacebookWarRoomScreen} />
                <Stack.Screen name="MarketingApproval" component={MarketingApprovalScreen} />
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
          <DemoTourOverlay />
        </NavigationContainer>
      </ThemeProvider>
    </View>
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
    void applyStoredLanguage();
  }, []);

  useEffect(() => {
    initProductAnalytics();
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
        message="VIONA is temporarily unavailable. We will be back soon."
        detail={`Ops source: ${opsConfig.source}`}
      />
    );
  }

  return (
    <V7NavigationSurfaceProvider>
      <AppNavigationShell
        insets={insets}
        isLargeScreen={isLargeScreen}
        user={user}
        transitionAnim={transitionAnim}
        mode={mode}
        showIntentModal={showIntentModal}
        onGuidedIntent={onGuidedIntent}
        onSkipGuidedIntent={onSkipGuidedIntent}
      />
    </V7NavigationSurfaceProvider>
  );
}

function B2BWorkspaceGate({ children }: { children: ReactElement }) {
  const { user } = useAuth();
  if (!hasB2BWorkspaceAccess(user)) return <B2BPaywallScreen />;
  return <ThemeProvider value={b2bTheme}>{children}</ThemeProvider>;
}

function GatedMerchantDashboardScreen() {
  return (
    <B2BWorkspaceGate>
      <MerchantDashboardScreen />
    </B2BWorkspaceGate>
  );
}

function GatedAiReceptionistSetupChecklistScreen() {
  const flags = getFeatureFlags();
  if (!flags.b2bAiReceptionistDemoEnabled && !flags.b2bAiReceptionistPilotEnabled) {
    return (
      <MvpSurfaceDisabledScreen
        title="B2B AI Receptionist setup"
        message="Lễ Tân AI setup is unavailable. Enable demo or pilot mode to access this safety checklist surface. Production automation remains locked until cutover approval."
      />
    );
  }
  return (
    <B2BWorkspaceGate>
      <AiReceptionistSetupChecklistScreen />
    </B2BWorkspaceGate>
  );
}

function GatedAiReceptionistDemoSimulatorScreen() {
  const flags = getFeatureFlags();
  if (!flags.b2bAiReceptionistDemoEnabled && !flags.b2bAiReceptionistPilotEnabled) {
    return (
      <MvpSurfaceDisabledScreen
        title="B2B AI Receptionist demo"
        message="Lễ Tân AI simulated demo is unavailable. Enable demo or pilot mode to access this local-only preview surface."
      />
    );
  }
  return (
    <B2BWorkspaceGate>
      <AiReceptionistDemoSimulatorScreen />
    </B2BWorkspaceGate>
  );
}

function GatedAiReceptionistPilotRequestScreen() {
  const flags = getFeatureFlags();
  if (!flags.b2bAiReceptionistDemoEnabled && !flags.b2bAiReceptionistPilotEnabled) {
    return (
      <MvpSurfaceDisabledScreen
        title="B2B AI Receptionist pilot request"
        message="Lễ Tân AI pilot request is unavailable. Enable demo or pilot mode to access this local-only request surface."
      />
    );
  }
  return (
    <B2BWorkspaceGate>
      <AiReceptionistPilotRequestScreen />
    </B2BWorkspaceGate>
  );
}

function GatedInboundQueueScreen() {
  const flags = getFeatureFlags();
  if (!flags.b2bAiReceptionistDemoEnabled && !flags.b2bAiReceptionistPilotEnabled) {
    return (
      <MvpSurfaceDisabledScreen
        title="B2B AI Receptionist"
        message="Inbound queue demo and pilot are not available. Enable the B2B AI Receptionist demo or pilot flag. Production phone automation stays off unless production is explicitly enabled."
      />
    );
  }
  const automationGate = getB2bReceptionistAutomationGate(flags);
  if (automationGate) return automationGate;
  return (
    <B2BWorkspaceGate>
      <InboundQueueScreen />
    </B2BWorkspaceGate>
  );
}

function GatedSmartCalendarScreen() {
  const flags = getFeatureFlags();
  if (!flags.b2bAiReceptionistDemoEnabled && !flags.b2bAiReceptionistPilotEnabled) {
    return (
      <MvpSurfaceDisabledScreen
        title="B2B AI Receptionist"
        message="Smart Calendar demo and pilot are not available. Enable the B2B AI Receptionist demo or pilot flag. Auto booking, inventory, bill print, and auto payment still require their own sub-flags."
      />
    );
  }
  const automationGate = getB2bReceptionistAutomationGate(flags);
  if (automationGate) return automationGate;
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

function GatedB2BPromotionSettingsScreen() {
  return (
    <B2BWorkspaceGate>
      <B2BPromotionSettings />
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
  const flags = getFeatureFlags();
  if (!flags.kolDemoEnabled) {
    return (
      <MvpSurfaceDisabledScreen
        title="KOL Partner"
        message="KOL partner analytics are not available in this MVP build."
      />
    );
  }
  return (
    <B2BWorkspaceGate>
      <KOLPartnerDashboard />
    </B2BWorkspaceGate>
  );
}

function GatedAdminDashboardScreen() {
  const flags = getFeatureFlags();
  if (!flags.omniDemoEnabled) {
    return <MvpSurfaceDisabledScreen title="Omni demo" message={MVP_OMNI_DEMO_OFF_MSG} />;
  }
  return <AdminDashboardScreen />;
}

function getB2bReceptionistAutomationGate(flags: FeatureFlags): ReactElement | null {
  if (!flags.b2bAiReceptionistProductionEnabled) {
    return (
      <MvpSurfaceDisabledScreen
        title="B2B AI Receptionist production"
        message={MVP_B2B_AI_RECEPTIONIST_PRODUCTION_OFF_MSG}
      />
    );
  }
  if (!flags.b2bAutoBookingEnabled) {
    return <MvpSurfaceDisabledScreen title="B2B auto-booking" message={MVP_B2B_AUTO_BOOKING_OFF_MSG} />;
  }
  if (!flags.b2bAutoInventoryEnabled) {
    return <MvpSurfaceDisabledScreen title="B2B auto-inventory" message={MVP_B2B_AUTO_INVENTORY_OFF_MSG} />;
  }
  if (!flags.b2bAutoBillPrintEnabled) {
    return <MvpSurfaceDisabledScreen title="B2B auto bill print" message={MVP_B2B_AUTO_BILL_PRINT_OFF_MSG} />;
  }
  if (!flags.b2bAutoPaymentEnabled) {
    return <MvpSurfaceDisabledScreen title="B2B auto payment" message={MVP_B2B_AUTO_PAYMENT_OFF_MSG} />;
  }
  return null;
}

function App() {
  const appShell = (
    <SafeAreaProvider>
      <AppQueryProvider>
        <AuthProvider>
          <AppModeProvider>
            <HubThemeProvider>
              <AppRoot />
            </HubThemeProvider>
          </AppModeProvider>
        </AuthProvider>
      </AppQueryProvider>
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

export default Sentry.wrap(App);

const styles = StyleSheet.create({
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
