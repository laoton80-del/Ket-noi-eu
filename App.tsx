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
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
import { ComboWalletScreen } from './src/screens/ComboWalletScreen';
import { CongDongScreen } from './src/screens/CongDongScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { HocTapScreen } from './src/screens/HocTapScreen';
import { LeTanScreen } from './src/screens/LeTanScreen';
import { LeonaCallScreen } from './src/screens/LeonaCallScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { OtpScreen } from './src/screens/OtpScreen';
import { SetupProfileScreen } from './src/screens/SetupProfileScreen';
import { TienIchScreen } from './src/screens/TienIchScreen';
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
import { useAssistantSettings } from './src/state/assistantSettings';
import { Colors } from './src/theme/colors';
import { gradients } from './src/theme/gradients';
import { theme } from './src/theme/theme';
import { FontFamily } from './src/theme/typography';
import { useAppStartupOrchestration } from './src/app/bootstrap/useAppStartupOrchestration';
import {
  LAUNCH_PILOT_CONFIG,
  PILOT_LEONA_SERVICES_FALLBACK_PREFILL,
  resolvePilotAwareRedirectTarget,
} from './src/config/launchPilot';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

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

function TabOrb({
  routeName,
  focused,
  wrapSize,
  orbSize,
  iconSize,
}: {
  routeName: string;
  focused: boolean;
  wrapSize: number;
  orbSize: number;
  iconSize: number;
}) {
  const iconName = iconByRoute(routeName, focused);
  return (
    <View style={[styles.orbWrap, { width: wrapSize, height: wrapSize }]}>
      <LinearGradient
        colors={focused ? gradients.tabOrbActive : gradients.tabOrbIdle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.orb, { width: orbSize, height: orbSize }, focused && styles.orbFocused]}
      >
        <Ionicons
          name={iconName}
          size={iconSize}
          color={focused ? theme.colors.onAccent : theme.colors.primaryBright}
        />
      </LinearGradient>
      <Text style={styles.leafMark}>❦</Text>
    </View>
  );
}

function MainTabs() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, pendingRedirect, setPendingRedirect } = useAuth();
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const [paywallTarget, setPaywallTarget] = useState<RedirectTarget | null>(null);
  const { width } = useWindowDimensions();
  const compactTabs = width <= 375;
  const tabSizing = useMemo(
    () => ({
      tabBarHeight: compactTabs ? 72 : 80,
      tabBarPaddingBottom: compactTabs ? 8 : 10,
      tabBarPaddingTop: compactTabs ? 6 : 8,
      labelSize: compactTabs ? 9 : 10,
      wrapSize: compactTabs ? 36 : 40,
      orbSize: compactTabs ? 30 : 34,
      iconSize: compactTabs ? 15 : 17,
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
    if (pendingRedirect === 'Wallet' || pendingRedirect === 'AiEye' || pendingRedirect === 'LeonaCall' || pendingRedirect === 'Vault') {
      navigation.navigate(pendingRedirect);
      setPendingRedirect(null);
    }
  }, [navigation, pendingRedirect, setPendingRedirect, user]);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primaryBright,
          tabBarInactiveTintColor: 'rgba(244, 241, 234, 0.4)',
          tabBarLabelStyle: [styles.tabLabel, { fontSize: tabSizing.labelSize }],
          tabBarItemStyle: styles.tabItem,
          tabBarStyle: [
            styles.tabBar,
            {
              height: tabSizing.tabBarHeight,
              paddingBottom: tabSizing.tabBarPaddingBottom,
              paddingTop: tabSizing.tabBarPaddingTop,
            },
          ],
          tabBarBackground: () => <View style={styles.glassBg} />,
          sceneStyle: styles.scene,
          tabBarIcon: ({ focused }) => (
            <TabOrb
              routeName={route.name}
              focused={focused}
              wrapSize={tabSizing.wrapSize}
              orbSize={tabSizing.orbSize}
              iconSize={tabSizing.iconSize}
            />
          ),
        })}
      >
        <Tab.Screen name="QuocGia" component={HomeScreen} options={{ title: strings.nav.countryTab }} />
        <Tab.Screen name="TienIch" component={TienIchScreen} options={{ title: strings.nav.utilityTab }} />
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
      <StatusBar style="light" />
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
        <Stack.Screen name="Wallet" component={ComboWalletScreen} />
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
      <View style={styles.brandBadge}>
        <Text style={styles.brandIcon}>{APP_BRAND.icon}</Text>
      </View>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier={STRIPE_MERCHANT_IDENTIFIER}
      urlScheme={STRIPE_URL_SCHEME}
    >
      <AuthProvider>
        <AppRoot />
      </AuthProvider>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    height: 80,
    paddingBottom: 10,
    paddingTop: 8,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  scene: {
    backgroundColor: Colors.background,
  },
  glassBg: {
    flex: 1,
    backgroundColor: Colors.tabBarBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  tabItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    marginTop: 2,
    color: 'rgba(244, 241, 234, 0.55)',
  },
  orbWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  orbFocused: {
    transform: [{ translateY: -1 }],
    shadowOpacity: 0.28,
  },
  leafMark: {
    position: 'absolute',
    top: -2,
    right: -1,
    fontSize: 10,
    color: theme.colors.primaryBright,
  },
  brandBadge: {
    position: 'absolute',
    right: 14,
    top: 48,
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.executive.card,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
  },
  brandIcon: {
    fontSize: 20,
  },
});
