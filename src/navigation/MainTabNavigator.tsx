import { Ionicons } from '@expo/vector-icons';
import {
  BottomTabBar,
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { Alert, Platform, StyleSheet, View, useWindowDimensions, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileSwitcher, type ProfileSwitcherHandle } from '../components/ProfileSwitcher';
import { SmartTrioLanguageSheet } from '../components/smartTrio/SmartTrioLanguageSheet';
import { HomeCommandProvider, type HomeCommandContextValue } from '../context/HomeCommandContext';
import { AuthPaywallModal } from '../components/AuthPaywallModal';
import {
  DIASPORA_RESTRICTION_MODAL_MESSAGE,
  DIASPORA_RESTRICTION_MODAL_TITLE,
} from '../components/modals/DiasporaRestrictionModal';
import { useAuth, type RedirectTarget } from '../context/AuthContext';
import {
  PILOT_LEONA_SERVICES_FALLBACK_PREFILL,
  resolvePilotAwareRedirectTarget,
} from '../config/launchPilot';
import { useNavigationThemeForHub } from '../context/V7NavigationSurfaceContext';
import { useHubTheme } from '../context/HubThemeContext';
import { evaluateMerchantSurfaceAccess } from '../services/auth/merchantSurfaceEntry';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';
import { hasB2BWorkspaceAccess } from '../utils/b2bAccess';
import { vionaTokens } from '../design';
import { isDemoSandboxActive } from '../services/ux/DemoSandbox';
import { useUserStore, type ActiveRole } from '../store/userStore';
import { getFeatureFlags } from '../core/feature-flags/featureFlags';
import type { RootStackParamList, RootTabParamList } from './routes';
import { useTranslation } from '../i18n';
import { MAIN_TAB } from './routes';
import { MvpSurfaceDisabledScreen } from './mvpSurfaceGate';
import {
  fashionHomeHiddenTabBarStyle,
  isFashionHomeDesktopShell,
  readFocusedTabRouteFromRootState,
} from './fashionHomeDesktopShell';
import { roleTabChrome } from './tabRoleTheme';
import {
  shouldMountSosInTabBarShell,
  shouldShowGlobalLifelineSos,
} from './vionaGlobalSosShellVisibility';

import { HomeScreen } from '../screens/HomeScreen';
import { AcademyScreen } from '../screens/AcademyScreen';
import { LocalScreen } from '../screens/b2c/LocalScreen';
import { TravelHubScreen } from '../screens/b2c/travel/TravelHubScreen';
import { MerchantDashboardScreen } from '../screens/b2b/MerchantDashboardScreen';
import { MerchantCatalogTabScreen } from '../screens/b2b/MerchantCatalogTabScreen';
import { OrdersScreen } from '../screens/b2b/OrdersScreen';
import { WalletB2BScreen } from '../screens/b2b/WalletB2BScreen';
import { B2BPaywallScreen } from '../screens/b2b/B2BPaywallScreen';
import { BrokerDashboardScreen } from '../screens/broker/BrokerDashboardScreen';
import { BrokerQrTabScreen } from '../screens/broker/BrokerQrTabScreen';
import { BrokerCommissionsTabScreen } from '../screens/broker/BrokerCommissionsTabScreen';
import { BrokerMerchantsTabScreen } from '../screens/broker/BrokerMerchantsTabScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { AdminCommandCenter } from '../screens/admin/AdminCommandCenter';
import { VionaGlobalSosShellAction } from '../components/viona/VionaGlobalSosShellAction';
import { VionaShellAccountLanguageActions } from '../components/viona/VionaShellAccountLanguageActions';
import { SOSModal } from '../screens/b2c/SOSModal';
const Tab = createBottomTabNavigator<RootTabParamList>();

type StackNav = NativeStackNavigationProp<RootStackParamList>;

function GatedWalletB2BTab(): ReactElement {
  const { user } = useAuth();
  if (!hasB2BWorkspaceAccess(user)) return <B2BPaywallScreen />;
  return <WalletB2BScreen />;
}

function B2BMvpDisabledSurface(): ReactElement {
  return (
    <MvpSurfaceDisabledScreen
      title="Merchant workspace"
      message="Merchant workspace is not available in this MVP build."
    />
  );
}

function BrokerRoleMvpDisabledSurface(): ReactElement {
  return (
    <MvpSurfaceDisabledScreen
      title="Broker QR"
      message="Broker tools are not available in this MVP build."
    />
  );
}

function B2BMvpMerchantDashboard(): ReactElement {
  const flags = useMemo(() => getFeatureFlags(), []);
  if (!flags.merchantDashboardEnabled) return <B2BMvpDisabledSurface />;
  return <MerchantDashboardScreen />;
}

function B2BMvpCatalog(): ReactElement {
  const flags = useMemo(() => getFeatureFlags(), []);
  if (!flags.merchantDashboardEnabled) return <B2BMvpDisabledSurface />;
  return <MerchantCatalogTabScreen />;
}

function B2BMvpOrders(): ReactElement {
  const { user } = useAuth();
  const flags = useMemo(() => getFeatureFlags(), []);
  if (!flags.merchantDashboardEnabled) return <B2BMvpDisabledSurface />;
  if (!hasB2BWorkspaceAccess(user)) return <B2BPaywallScreen />;
  return <OrdersScreen />;
}

function B2BMvpEarnings(): ReactElement {
  const flags = useMemo(() => getFeatureFlags(), []);
  if (!flags.merchantDashboardEnabled) return <B2BMvpDisabledSurface />;
  return <GatedWalletB2BTab />;
}

function tabIconName(
  route: keyof RootTabParamList,
  role: ActiveRole,
  focused: boolean
): keyof typeof Ionicons.glyphMap {
  if (role === 'ADMIN') {
    if (route === MAIN_TAB.ADMIN.deck) return focused ? 'eye' : 'eye-outline';
    return 'ellipse';
  }
  if (role === 'B2C') {
    if (route === MAIN_TAB.B2C.home) return focused ? 'home' : 'home-outline';
    if (route === MAIN_TAB.B2C.local) return focused ? 'grid' : 'grid-outline';
    if (route === MAIN_TAB.B2C.travel) return focused ? 'airplane' : 'airplane-outline';
    if (route === MAIN_TAB.B2C.ai) return focused ? 'sparkles' : 'sparkles-outline';
  }
  if (role === 'B2B') {
    if (route === MAIN_TAB.B2B.merchant) return focused ? 'analytics' : 'analytics-outline';
    if (route === MAIN_TAB.B2B.catalog) return focused ? 'restaurant' : 'restaurant-outline';
    if (route === MAIN_TAB.B2B.orders) return focused ? 'receipt' : 'receipt-outline';
    if (route === MAIN_TAB.B2B.earnings) return focused ? 'cash' : 'cash-outline';
  }
  if (route === MAIN_TAB.BROKER.radar) return focused ? 'pulse' : 'pulse-outline';
  if (route === MAIN_TAB.BROKER.merchants) return focused ? 'people' : 'people-outline';
  if (route === MAIN_TAB.BROKER.qr) return focused ? 'qr-code' : 'qr-code-outline';
  if (route === MAIN_TAB.BROKER.commissions) return focused ? 'trending-up' : 'trending-up-outline';
  if (route === MAIN_TAB.BROKER.wallet) return focused ? 'wallet' : 'wallet-outline';
  return 'ellipse';
}

function compactDesktopTabLabel(route: keyof RootTabParamList, role: ActiveRole): string {
  if (role === 'B2C') {
    if (route === MAIN_TAB.B2C.home) return 'Hub';
    if (route === MAIN_TAB.B2C.local) return 'Local';
    if (route === MAIN_TAB.B2C.travel) return 'Travel';
    if (route === MAIN_TAB.B2C.ai) return 'Academy';
  }
  if (role === 'B2B') {
    if (route === MAIN_TAB.B2B.merchant) return 'Hub';
    if (route === MAIN_TAB.B2B.catalog) return 'Local';
    if (route === MAIN_TAB.B2B.orders) return 'Travel';
    if (route === MAIN_TAB.B2B.earnings) return 'Wallet';
  }
  if (role === 'BROKER') {
    if (route === MAIN_TAB.BROKER.radar) return 'Hub';
    if (route === MAIN_TAB.BROKER.merchants) return 'Local';
    if (route === MAIN_TAB.BROKER.qr) return 'QR';
    if (route === MAIN_TAB.BROKER.commissions) return 'Travel';
    if (route === MAIN_TAB.BROKER.wallet) return 'Wallet';
  }
  if (role === 'ADMIN') return 'Hub';
  return '';
}

export function MainTabNavigator(): ReactElement {
  const { t } = useTranslation();
  const navigation = useNavigation<StackNav>();
  const { user, pendingRedirect, setPendingRedirect } = useAuth();
  const currentActiveRole = useUserStore((s) => s.currentActiveRole);
  const switchRole = useUserStore((s) => s.switchRole);
  const allowedRoles = useUserStore((s) => s.allowedRoles);
  const showRolePicker = allowedRoles.length > 1;
  const [paywallTarget, setPaywallTarget] = useState<RedirectTarget | null>(null);
  const [sosSheetOpen, setSosSheetOpen] = useState(false);
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);
  const profileSwitcherRef = useRef<ProfileSwitcherHandle | null>(null);

  const onSosHoldComplete = useCallback(() => {
    setSosSheetOpen(true);
  }, []);

  const { setCurrentHub } = useHubTheme();
  const { syncFromMainTab } = useNavigationThemeForHub();

  const focusedTabRoute = useNavigationState(readFocusedTabRouteFromRootState);

  /** V7 “Global Lifeline”: all roles; B2C hides global shell SOS only on Academy tab (voice shell). */
  const showGlobalLifelineSos = shouldShowGlobalLifelineSos(currentActiveRole, focusedTabRoute);

  useEffect(() => {
    syncFromMainTab(currentActiveRole, focusedTabRoute);
  }, [currentActiveRole, focusedTabRoute, syncFromMainTab]);

  useEffect(() => {
    if (currentActiveRole !== 'B2C') {
      setCurrentHub('HUB_SERVICE');
      return;
    }
    if (focusedTabRoute === MAIN_TAB.B2C.travel) {
      setCurrentHub('HUB_TOURISM');
    } else if (focusedTabRoute === MAIN_TAB.B2C.ai) {
      setCurrentHub('HUB_ACADEMY');
    } else {
      setCurrentHub('HUB_SERVICE');
    }
  }, [currentActiveRole, focusedTabRoute, setCurrentHub]);

  useEffect(() => {
    if (!showGlobalLifelineSos) setSosSheetOpen(false);
  }, [showGlobalLifelineSos]);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktopWeb = Platform.OS === 'web' && width > 768;
  const compactTabs = width <= 375;
  const b2cTravelPlatinum =
    currentActiveRole === 'B2C' && focusedTabRoute === MAIN_TAB.B2C.travel;
  const chrome = roleTabChrome(currentActiveRole, { b2cTravelPlatinum });

  const tabSizing = useMemo(
    () => ({
      tabBarBaseHeight: compactTabs ? 52 : 56,
      labelSize: compactTabs ? 10 : 11,
      iconSize: compactTabs ? 22 : 24,
    }),
    [compactTabs]
  );

  const flags = useMemo(() => getFeatureFlags(), []);

  const tabBarLift = tabSizing.tabBarBaseHeight + (isDesktopWeb ? Math.max(insets.bottom, 16) : Math.max(insets.bottom, 10)) + 10;

  const fashionHomeDesktopShell = useMemo(
    () =>
      isFashionHomeDesktopShell({
        platform: Platform.OS,
        windowWidth: width,
        activeRole: currentActiveRole,
        focusedTabRoute,
      }),
    [currentActiveRole, focusedTabRoute, width]
  );

  const mountSosInTabBarShell = shouldMountSosInTabBarShell({
    role: currentActiveRole,
    focusedTabRoute,
    fashionHomeDesktopShell,
  });

  /** Shell language sheet: fashion command bar + tab-chrome account/language hosts. */
  const mountShellLanguageSheet = fashionHomeDesktopShell || mountSosInTabBarShell;

  useEffect(() => {
    if (!mountShellLanguageSheet) setLanguageSheetOpen(false);
  }, [mountShellLanguageSheet]);

  const openShellAccount = useCallback(() => {
    profileSwitcherRef.current?.openPersonalHub();
  }, []);

  const openShellLanguage = useCallback(() => {
    setLanguageSheetOpen(true);
  }, []);

  const openShellRole = useCallback(() => {
    profileSwitcherRef.current?.openRolePicker();
  }, []);

  const b2cDesktopBottomTabs = isDesktopWeb && currentActiveRole === 'B2C' && !fashionHomeDesktopShell;
  const tabBarPosition = b2cDesktopBottomTabs ? 'bottom' : isDesktopWeb ? 'left' : 'bottom';

  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => {
      // Surfaces that own in-screen SOS/account/language (or fashion Home) keep the stock bar.
      if (!mountSosInTabBarShell) {
        return <BottomTabBar {...props} />;
      }

      // Desktop left rail — account/language + SOS in rail chrome (not content-elevated FAB).
      if (tabBarPosition === 'left') {
        return (
          <View
            style={[styles.leftRailHost, { backgroundColor: chrome.barBg, borderRightColor: chrome.barBorder }]}
            testID="viona-sos-left-rail-host"
          >
            <View style={styles.leftRailMain}>
              <BottomTabBar {...props} />
            </View>
            <View
              style={[
                styles.leftRailUtilitySlot,
                {
                  borderTopColor: chrome.barBorder,
                },
              ]}
              testID="viona-shell-account-language-left-rail-slot"
            >
              <VionaShellAccountLanguageActions
                layout="leftRail"
                showRolePicker={showRolePicker}
                onPressAccount={openShellAccount}
                onPressLanguage={openShellLanguage}
                onPressRole={openShellRole}
              />
            </View>
            <View
              style={[
                styles.leftRailSosSlot,
                {
                  paddingBottom: Math.max(props.insets.bottom, 12),
                  borderTopColor: chrome.barBorder,
                },
              ]}
              testID="viona-sos-left-rail-slot"
            >
              <VionaGlobalSosShellAction layout="leftRail" onHoldComplete={onSosHoldComplete} />
            </View>
          </View>
        );
      }

      return (
        <View style={styles.tabBarHost} testID="viona-sos-tab-bar-host">
          <View style={styles.tabBarMain}>
            <BottomTabBar {...props} />
          </View>
          <View
            style={[
              styles.accountLanguageShellSlot,
              {
                paddingBottom: Math.max(props.insets.bottom, 10),
                paddingLeft: Math.max(props.insets.left, 8),
              },
            ]}
            pointerEvents="box-none"
            testID="viona-shell-account-language-bottom-slot"
          >
            <VionaShellAccountLanguageActions
              layout="bottomChip"
              showRolePicker={showRolePicker}
              onPressAccount={openShellAccount}
              onPressLanguage={openShellLanguage}
              onPressRole={openShellRole}
            />
          </View>
          <View
            style={[
              styles.sosShellSlot,
              {
                paddingBottom: Math.max(props.insets.bottom, 10),
                paddingRight: Math.max(props.insets.right, 8),
              },
            ]}
            pointerEvents="box-none"
          >
            <VionaGlobalSosShellAction layout="bottomChip" onHoldComplete={onSosHoldComplete} />
          </View>
        </View>
      );
    },
    [
      chrome.barBg,
      chrome.barBorder,
      mountSosInTabBarShell,
      onSosHoldComplete,
      openShellAccount,
      openShellLanguage,
      openShellRole,
      showRolePicker,
      tabBarPosition,
    ]
  );

  const b2cHomeDesktopScene = fashionHomeDesktopShell;
  const sceneTopPadding = !isDesktopWeb
    ? 0
    : b2cHomeDesktopScene
      ? 0
      : Math.max(100, insets.top + 96);

  const homeCommandValue = useMemo<HomeCommandContextValue>(
    () => ({
      openLanguageSheet: () => setLanguageSheetOpen(true),
      triggerSafetyAssist: onSosHoldComplete,
      openAccount: () => profileSwitcherRef.current?.openPersonalHub(),
      openRolePicker: () => profileSwitcherRef.current?.openRolePicker(),
      showRolePicker,
    }),
    [onSosHoldComplete, showRolePicker]
  );

  const openPaywall = (target: RedirectTarget) => {
    setPendingRedirect(target);
    setPaywallTarget(target);
  };

  useEffect(() => {
    if (!user || !pendingRedirect) return;

    const defaultTabForActiveRole = (): keyof RootTabParamList => {
      switch (currentActiveRole) {
        case 'B2B':
          return MAIN_TAB.B2B.merchant;
        case 'BROKER':
          return MAIN_TAB.BROKER.radar;
        case 'ADMIN':
          return MAIN_TAB.ADMIN.deck;
        default:
          return MAIN_TAB.B2C.home;
      }
    };

    const goB2cHome = () => {
      switchRole('B2C');
      navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.home });
    };
    if (pendingRedirect === 'HocTap') {
      goB2cHome();
      setPendingRedirect(null);
      return;
    }
    if (pendingRedirect === 'Academy') {
      switchRole('B2C');
      navigation.navigate('Tabs', { screen: MAIN_TAB.B2C.ai });
      setPendingRedirect(null);
      return;
    }
    if (pendingRedirect === 'LeTan') {
      setPendingRedirect(null);
      navigation.navigate('AiReceptionistDemoSimulator');
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
          navigation.navigate('Tabs', { screen: defaultTabForActiveRole() });
          return;
        }
        if (access.denied && access.kind === 'gps_vn') {
          Alert.alert('VIONA', access.message);
          navigation.navigate('Tabs', { screen: defaultTabForActiveRole() });
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
  }, [
    currentActiveRole,
    navigation,
    pendingRedirect,
    setPendingRedirect,
    switchRole,
    user,
  ]);

  return (
    <>
      <HomeCommandProvider value={homeCommandValue}>
        <Tab.Navigator
          key={currentActiveRole}
          tabBar={renderTabBar}
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarPosition,
            tabBarActiveTintColor: chrome.active,
            tabBarInactiveTintColor: chrome.inactive,
            tabBarActiveBackgroundColor: tabBarPosition === 'left' ? 'rgba(122, 228, 255, 0.14)' : undefined,
            tabBarLabelStyle: [
              styles.tabLabel,
              {
                fontSize: tabBarPosition === 'left' ? 10 : tabSizing.labelSize,
              },
              tabBarPosition === 'left' && styles.tabLabelDesktop,
            ],
            tabBarItemStyle: [styles.tabItem, tabBarPosition === 'left' && styles.tabItemDesktop],
            tabBarStyle: [
              styles.tabBar,
              {
                backgroundColor: chrome.barBg,
                borderTopColor: chrome.barBorder,
                borderRightColor: chrome.barBorder,
              },
              tabBarPosition === 'left'
                ? {
                    width: 94,
                    // When SOS occupies the rail foot, let the host column size the bar (not full viewport height).
                    height: mountSosInTabBarShell ? undefined : '100%',
                    flex: mountSosInTabBarShell ? 1 : undefined,
                    paddingTop: insets.top + 12,
                    paddingBottom: mountSosInTabBarShell ? 8 : Math.max(insets.bottom, 16),
                    paddingHorizontal: 8,
                  }
                : {
                    height: tabSizing.tabBarBaseHeight + insets.bottom,
                    paddingBottom: Math.max(insets.bottom, 10),
                    paddingTop: 8,
                    paddingLeft:
                      mountSosInTabBarShell && tabBarPosition === 'bottom'
                        ? showRolePicker
                          ? 168
                          : 120
                        : undefined,
                    paddingRight:
                      mountSosInTabBarShell && tabBarPosition === 'bottom' ? 104 : undefined,
                  },
              tabBarPosition === 'bottom' ? TAB_BAR_WEB_GLASS : null,
              tabBarPosition === 'left' && styles.tabBarDesktop,
              fashionHomeDesktopShell && fashionHomeHiddenTabBarStyle,
            ],
            sceneStyle: {
              backgroundColor: fashionHomeDesktopShell ? vionaTokens.fashionTech.canvas : chrome.barBg,
              paddingTop: sceneTopPadding,
            },
            tabBarLabel:
              tabBarPosition === 'left'
                ? compactDesktopTabLabel(route.name as keyof RootTabParamList, currentActiveRole)
                : undefined,
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={tabIconName(route.name as keyof RootTabParamList, currentActiveRole, focused)}
                size={tabSizing.iconSize}
                color={focused ? chrome.active : chrome.inactive}
              />
            ),
          })}
        >
        {currentActiveRole === 'B2C' ? (
          <>
            {flags.hubEnabled ? (
              <Tab.Screen
                name={MAIN_TAB.B2C.home}
                component={HomeScreen}
                options={{
                  title: t('home.tabHub'),
                  tabBarStyle: fashionHomeDesktopShell ? fashionHomeHiddenTabBarStyle : undefined,
                }}
              />
            ) : null}
            {flags.localEnabled ? (
              <Tab.Screen
                name={MAIN_TAB.B2C.local}
                component={LocalScreen}
                options={{ title: t('home.tabLocal') }}
              />
            ) : null}
            {flags.travelLiteEnabled ? (
              <Tab.Screen
                name={MAIN_TAB.B2C.travel}
                component={TravelHubScreen}
                options={{ title: t('home.tabTravel') }}
              />
            ) : null}
            {flags.academyLiteEnabled ? (
              <Tab.Screen
                name={MAIN_TAB.B2C.ai}
                component={AcademyScreen}
                options={{ title: t('home.tabAcademy') }}
                listeners={{
                  tabPress: (e) => {
                    if (!user && !isDemoSandboxActive()) {
                      e.preventDefault();
                      openPaywall('Academy');
                    }
                  },
                }}
              />
            ) : null}
          </>
        ) : null}

        {currentActiveRole === 'B2B' ? (
          <>
            <Tab.Screen name={MAIN_TAB.B2B.merchant} component={B2BMvpMerchantDashboard} options={{ title: 'Dashboard' }} />
            <Tab.Screen name={MAIN_TAB.B2B.catalog} component={B2BMvpCatalog} options={{ title: 'Menu' }} />
            <Tab.Screen name={MAIN_TAB.B2B.orders} component={B2BMvpOrders} options={{ title: 'Orders' }} />
            <Tab.Screen name={MAIN_TAB.B2B.earnings} component={B2BMvpEarnings} options={{ title: 'Wallet' }} />
          </>
        ) : null}

        {currentActiveRole === 'BROKER' ? (
          flags.brokerQrEnabled ? (
            <>
              <Tab.Screen name={MAIN_TAB.BROKER.radar} component={BrokerDashboardScreen} options={{ title: 'Radar' }} />
              <Tab.Screen
                name={MAIN_TAB.BROKER.merchants}
                component={BrokerMerchantsTabScreen}
                options={{ title: 'Merchants' }}
              />
              <Tab.Screen
                name={MAIN_TAB.BROKER.qr}
                component={BrokerQrTabScreen}
                options={{ title: 'QR' }}
              />
              <Tab.Screen
                name={MAIN_TAB.BROKER.commissions}
                component={BrokerCommissionsTabScreen}
                options={{ title: 'Commissions' }}
              />
              <Tab.Screen name={MAIN_TAB.BROKER.wallet} component={WalletScreen} options={{ title: 'Wallet' }} />
            </>
          ) : (
            <Tab.Screen
              name={MAIN_TAB.BROKER.radar}
              component={BrokerRoleMvpDisabledSurface}
              options={{ title: 'Broker' }}
            />
          )
        ) : null}

        {currentActiveRole === 'ADMIN' ? (
          <Tab.Screen
            name={MAIN_TAB.ADMIN.deck}
            component={AdminCommandCenter}
            options={{ title: 'Command Center' }}
          />
        ) : null}
        </Tab.Navigator>
      </HomeCommandProvider>

      <ProfileSwitcher
        ref={profileSwitcherRef}
        tabBarLift={tabBarLift}
        suppressFloatingChrome
      />

      {mountShellLanguageSheet ? (
        <SmartTrioLanguageSheet
          visible={languageSheetOpen}
          onClose={() => setLanguageSheetOpen(false)}
        />
      ) : null}

      {/*
        Canonical consumer SOS modal — mounted once for all tab surfaces (including Academy rail).
        Shell action visibility remains gated; modal ownership stays singular.
      */}
      <SOSModal
        visible={sosSheetOpen}
        onRequestClose={() => {
          setSosSheetOpen(false);
        }}
        stackNavigation={navigation}
      />

      <AuthPaywallModal
        visible={!!paywallTarget}
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

// Web-only frosted backdrop for the bottom tab bar. Combined with a translucent `barBg` (B2C glass
// chrome) this turns the bar into premium frosted glass — content behind the absolute bar blurs
// through. On opaque role chromes (B2B/Broker/Admin) the blur is a visual no-op, and on native the
// property is simply ignored, so this is safe to apply to every bottom bar.
const TAB_BAR_WEB_GLASS: ViewStyle =
  Platform.OS === 'web'
    ? ({
        backdropFilter: 'blur(18px) saturate(135%)',
        WebkitBackdropFilter: 'blur(18px) saturate(135%)',
      } as unknown as ViewStyle)
    : {};

const styles = StyleSheet.create({
  tabBarHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabBarMain: {
    flexGrow: 1,
  },
  accountLanguageShellSlot: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 96,
    minHeight: 44,
  },
  sosShellSlot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 96,
    minHeight: 44,
  },
  /** Desktop left-rail chrome host — column layout; utilities + SOS in rail foot, not over scene content. */
  leftRailHost: {
    width: 94,
    height: '100%',
    flexDirection: 'column',
    borderRightWidth: 1,
  },
  leftRailMain: {
    flex: 1,
    minHeight: 0,
  },
  leftRailUtilitySlot: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  leftRailSosSlot: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  tabBar: {
    position: 'absolute',
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#0B1628',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  tabItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItemDesktop: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
    borderRadius: 14,
  },
  tabLabel: {
    fontFamily: FontFamily.semibold,
    marginTop: 2,
  },
  tabLabelDesktop: {
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 72,
  },
  tabBarDesktop: {
    position: 'relative',
    borderTopWidth: 0,
    borderRightWidth: 1,
    borderRightColor: theme.hybrid.panelCoolBorder,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 2, height: 0 },
    elevation: 2,
  },
});
