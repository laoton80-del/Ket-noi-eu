import type { NavigatorScreenParams } from '@react-navigation/native';
import type { InterpreterScenario } from '../config/aiPrompts';
import type { AiPersonaId } from '../config/aiPersonaCapabilities';
import type { RedirectTarget } from '../context/AuthContext';

/**
 * Super-app bottom tabs: route names are **role-partitioned** — only the active role’s four routes are mounted.
 * Legacy names (`QuocGia`, `LeTan`, …) removed; use navigation helpers / `MAIN_TAB` constants.
 */
export type RootTabParamList = {
  TabHome: undefined;
  TabLocal: undefined;
  TabTravel: undefined;
  TabAi:
    | {
        proactiveQuestion?: string;
        autoSimulate?: boolean;
        aiMode?: 'roleplay';
        scenario?: string;
        initialPrompt?: string;
      }
    | undefined;
  TabMerchant: undefined;
  TabCatalog: undefined;
  TabOrders: undefined;
  TabEarnings: undefined;
  TabRadar: undefined;
  /** Broker — acquired merchant portfolio (field / KOL pipeline). */
  TabBrokerMerchants: undefined;
  TabQr: undefined;
  TabCommissions: undefined;
  /** Broker shell — VIG wallet & payouts (same stack pattern as consumer Wallet). */
  TabBrokerWallet: undefined;
  /** Super-admin Command Center (single-tab deck; `serverRole === 'ADMIN'` only). */
  TabCommandCenter: undefined;
};

export const MAIN_TAB = {
  B2C: {
    home: 'TabHome',
    local: 'TabLocal',
    travel: 'TabTravel',
    ai: 'TabAi',
  },
  B2B: {
    merchant: 'TabMerchant',
    catalog: 'TabCatalog',
    orders: 'TabOrders',
    earnings: 'TabEarnings',
  },
  BROKER: {
    radar: 'TabRadar',
    merchants: 'TabBrokerMerchants',
    qr: 'TabQr',
    commissions: 'TabCommissions',
    wallet: 'TabBrokerWallet',
  },
  ADMIN: {
    deck: 'TabCommandCenter',
  },
} as const satisfies Readonly<{
  B2C: Record<string, keyof RootTabParamList>;
  B2B: Record<string, keyof RootTabParamList>;
  BROKER: Record<string, keyof RootTabParamList>;
  ADMIN: Record<string, keyof RootTabParamList>;
}>;

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList> | undefined;
  /** Full account hub (wallet, language, legal) — opened from Profile Switcher / merchant-broker headers. */
  PersonalHub: undefined;
  LifeOSDashboard: undefined;
  /** AF.UI.2 — isolated dashboard grid review (`/dashboard-preview`). */
  DashboardB2CPreview: undefined;
  /** Phase 4: travel hub — scenarios + quick links (no booking automation). */
  TravelCompanion: undefined;
  /** KNG Travel — dedicated premium travel mini-app (concierge, homestay, interpreter). */
  TravelHub: { destinationQuery?: string } | undefined;
  /** B2C Local universe — elite services bento + classifieds (V6.2). */
  LocalUniverse: undefined;
  /** V6.3 Vietnam inbound tourism hub — +84 merchants ↔ tourists / expats. */
  VietnamHub: undefined;
  /** B2C VIG checkout — quote from `/api/tourism/quote`, pay via `/api/tourism/book`. */
  TourismCheckout: Readonly<{
    businessId: string;
    serviceId: string;
    businessName: string;
    serviceTitle: string;
    startDate: string;
    endDate: string;
    guestCount: number;
  }>;
  /** Post-payment celebration; booking is already on merchant radar server-side. */
  TourismBookingConfirmed: Readonly<{
    bookingId: string;
    totalPaidVIG: number;
    businessName: string;
    serviceTitle: string;
  }>;
  /** AI “Trip Wrapped” viral share card — Story-style recap (`GET /api/tourism/wrap/:bookingId`). */
  ViralWrap: Readonly<{ bookingId?: string }> | undefined;
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
  /** SOS Plus — consent & local stub entitlement (AF.SOS.2); not billing-backed yet. */
  SosPlusProfile: undefined;
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
  /** B2B merchant-approved Leona promo rules (no AI-invented discounts). */
  B2BPromotionSettings: undefined;
  /** B2B sponsored listings — daily bid for TOP 1 in B2C search (deep link: `/SponsoredAds`). */
  SponsoredAds: undefined;
  /** B2B AI Receptionist setup + cutover checklist (read-only safety surface). */
  AiReceptionistSetupChecklist: undefined;
  /** B2B AI Receptionist simulated demo (local-only, no backend side effects). */
  AiReceptionistDemoSimulator: undefined;
  /** B2B AI Receptionist pilot request (local-only draft form). */
  AiReceptionistPilotRequest: undefined;
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
  /** In-app VoIP — WebRTC P2P audio; signaling via Socket.IO (same host as API). */
  P2PVoiceCall: Readonly<{
    /** Canonical room `vg|<idLow>|<idHigh>` — use `buildP2PSignalingRoomId` (`p2pSignalingRoom.ts`); JWT required for signaling. */
    roomId: string;
    role: 'tourist' | 'merchant';
    peerDisplayName?: string;
    /** Tourist typically creates the SDP offer. */
    isOfferer: boolean;
  }>;
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
  /** Cô Giáo / gia sư AI (Academy). Optional cues are learner-visible only — not wired into the stream until product defines it. */
  LiveAiTeacher: { practiceFocus?: string; scenarioLabel?: string } | undefined;
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
  /** AI marketing drafts — human approve before Meta publish (admin debug). */
  MarketingApproval: undefined;
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
