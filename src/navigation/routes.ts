import type { NavigatorScreenParams } from '@react-navigation/native';
import type { InterpreterScenario } from '../config/aiPrompts';
import type { RedirectTarget } from '../context/AuthContext';

/**
 * Navigation contracts. Pilot **in-scope** stacks: Tabs + LifeOS, TravelCompanion, FlightSearchAssistant, Wallet, Vault,
 * LiveInterpreter, LeonaCall, EmergencySOS, Concierge. Radar is registered but redirects when `LAUNCH_PILOT_CONFIG.enableRadarSurface` is false.
 */
export type RootTabParamList = {
  Discover: undefined;
  Services: undefined;
  Academy: undefined;
  CongDong: undefined;
  Concierge:
    | {
        proactiveQuestion?: string;
        autoSimulate?: boolean;
        aiMode?: 'roleplay';
        scenario?: string;
        initialPrompt?: string;
      }
    | undefined;
  CaNhan: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList> | undefined;
  LifeOSDashboard: undefined;
  /** Phase 4: travel hub — scenarios + quick links (no booking automation). */
  TravelCompanion: undefined;
  /** Phase 4: flight intent + compare/explain framing only (search off-device). */
  FlightSearchAssistant: undefined;
  KetNoiYeuThuong: undefined;
  EmergencySOS: undefined;
  AdultLearningHome: undefined;
  KidsLearningHome: undefined;
  LiveAiTeacher: undefined;
  AssistantChat: undefined;
  InboundQueue: undefined;
  SmartCalendar: undefined;
  MerchantDashboard: undefined;
  RolePlayScreen: undefined;
  B2BPaywall: undefined;
  PartnerDeals: undefined;
  Wallet: undefined;
  GlobalWallet: undefined;
  AiEye: undefined;
  Vault: undefined;
  RadarDiscovery: undefined;
  LiveInterpreter:
    | {
        scenario?: InterpreterScenario;
        /** Skip blocking consent; auto-start session (credits still required). */
        guidedEntry?: boolean;
      }
    | undefined;
  LeonaCall:
    | {
        prefillRequest?: string;
        autoSubmit?: boolean;
        service?: string;
        location?: string;
        time?: string;
        selectedPlace?: string;
      }
    | undefined;
  AdminDashboard: undefined;
  Login: { redirectTo?: RedirectTarget } | undefined;
  Otp: { redirectTo?: RedirectTarget } | undefined;
  SetupProfile:
    | {
        redirectTo?: RedirectTarget;
        mode?: 'onboarding' | 'edit';
      }
    | undefined;
};
