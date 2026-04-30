import type { NavigatorScreenParams } from '@react-navigation/native';
import type { InterpreterScenario } from '../config/aiPrompts';
import type { AiPersonaId } from '../config/aiPersonaCapabilities';
import type { RedirectTarget } from '../context/AuthContext';

/**
 * Navigation contracts. Pilot **in-scope** stacks: Tabs + LifeOS, TravelCompanion, FlightSearchAssistant, Wallet, Vault,
 * LiveInterpreter, LeonaCall, EmergencySOS, LeTan. Radar is registered but redirects when `LAUNCH_PILOT_CONFIG.enableRadarSurface` is false.
 */
export type RootTabParamList = {
  QuocGia: undefined;
  TienIch: undefined;
  HocTap: undefined;
  CongDong: undefined;
  LeTan:
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
  /** KNG Travel — dedicated premium travel mini-app (concierge, homestay, interpreter). */
  TravelHub: { destinationQuery?: string } | undefined;
  /** B2C Local universe — elite services bento + classifieds (V6.2). */
  LocalUniverse: undefined;
  /** KNG Travel — embassy map + AI TTS quick phrases (medical / police). */
  TravelSosHub: undefined;
  /** KNG Travel — Vietnamese "fixer" marketplace (book via Leona). */
  LocalFixer: undefined;
  /** KNG Travel — Local Fixer checkout (customer receipt + fixer earnings; Stripe Connect plan). */
  LocalFixerCheckout: Readonly<{
    fixerId: string;
    fixerDisplayName: string;
    hoursBooked: number;
    hourlyRateEur: number;
  }>;
  FixerEarnings: Readonly<{
    fixerId: string;
    fixerDisplayName: string;
    baseAmountEur: number;
  }>;
  /** KNG Travel — flight search (aggregator / affiliate lead magnet). */
  TravelFlightSearch: undefined;
  /** Hospitality concierge — GPS Near Me, FX snapshot, Travel Pass (B2C). */
  TravelHospitality: undefined;
  /** Phase 4: flight intent + compare/explain framing only (search off-device). */
  FlightSearchAssistant: undefined;
  KetNoiYeuThuong: undefined;
  EmergencySOS: undefined;
  AdultLearningHome: undefined;
  KidsLearningHome: undefined;
  VietKids: undefined;
  KidsLeaderboard: undefined;
  /** KNG Rewards — Tích điểm Đổi quà (VIP tiers + catalog). */
  LoyaltyRewards: undefined;
  Wallet: undefined;
  ReferralReward: undefined;
  /** B2C referral commission cash-out (deep link: `/CashOut`). */
  CashOut: undefined;
  /** Daily streak + lucky spin gamification (deep link: `/DailyReward`). */
  DailyReward: undefined;
  /** B2B SaaS pricing / upgrade surface (deep link: `/B2BPaywall`). */
  B2BPaywall: undefined;
  /** B2B merchant console — Flash Sale & ops (deep link: `/MerchantDashboard`). */
  MerchantDashboard: undefined;
  /** B2B promo — printable / downloadable QR for B2C acquisition (deep link: `/PromoTools`). */
  PromoTools: undefined;
  /** B2B sponsored listings — daily bid for TOP 1 in B2C search (deep link: `/SponsoredAds`). */
  SponsoredAds: undefined;
  /** KOL / affiliate — passive revenue & VIP tracking link (deep link: `/KOLPartnerDashboard`). */
  KOLPartnerDashboard: undefined;
  /** B2B partner lead capture — Certified Partner funnel (deep link: `/PartnerOnboarding`). */
  PartnerOnboarding: undefined;
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
  AssistantChat: undefined;
  InboundQueue: undefined;
  SmartCalendar: undefined;
  /** B2B wholesale / AI order tickets (Voice AI function-calling mock). */
  Orders: undefined;
  /** B2B internal trade market (verified merchants only). */
  InternalTradeMarket: undefined;
  /** B2B in-app ad bidding (wallet-funded sponsored priority). */
  AdBidding: undefined;
  /** B2B wallet + Voice AI receptionist metering (merchant-billed). */
  WalletB2B: undefined;
  /** B2C storefront — VoIP AI receptionist entry (merchant bears voice COGS). */
  MerchantDetail: { merchantId: string; merchantName: string; industry?: string };
  /** B2C storefront booking page with Smart Trio language switcher. */
  MerchantStorefront: {
    merchantId: string;
    merchantName: string;
    merchantCountryCode?: string;
  };
  LiveAiTeacher: undefined;
  Concierge: undefined;
  Academy: undefined;
  Discover: undefined;
  Services: undefined;
  AdminDashboard: undefined;
  /** CFO master profit — multi-stream revenue mock dashboard (admin debug). */
  AdminProfitDashboard: undefined;
  /** Telesale CRM — B2B leads pipeline (admin debug). */
  SalesLeadCRM: undefined;
  /** AI Ad Factory — Facebook/Google creative templates (admin debug). */
  AdContentFactory: undefined;
  /** Outbound AI sales — Twilio+Realtime dialer campaign (admin debug). */
  OutboundCampaign: undefined;
  /** Facebook growth war room (deep link: `/FacebookWarRoom`). */
  FacebookWarRoom: undefined;
  Login: { redirectTo?: RedirectTarget } | undefined;
  Otp: { redirectTo?: RedirectTarget } | undefined;
  /** Post-OTP: B2C vs B2B intent (+84 auto B2C path). */
  RoleSelection: undefined;
  SetupProfile:
    | {
        redirectTo?: RedirectTarget;
        mode?: 'onboarding' | 'edit';
      }
    | undefined;
};

export const ROUTE_PERSONA_POLICY: Readonly<Partial<Record<keyof RootStackParamList, AiPersonaId>>> = {
  LiveInterpreter: 'minh_khang',
  LiveAiTeacher: 'ai_teacher',
  LeonaCall: 'leona',
  InboundQueue: 'b2b_receptionist',
};
