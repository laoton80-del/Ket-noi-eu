export type GrowthEventName =
  | 'app_install'
  | 'app_open'
  | 'onboarding_complete'
  | 'first_action'
  | 'first_interpreter'
  | 'first_call_attempt'
  | 'successful_credit_topup'
  | 'ocr_success'
  | 'ocr_fail'
  | 'interpreter_used'
  | 'call_used'
  | 'booking_success' // legacy; prefer `successful_booking` for new emissions
  | 'successful_booking'
  | 'credits_spent'
  | 'payment_completed';

export type GrowthTraits = {
  country?: string;
  segment?: 'adult' | 'child';
};

export type GrowthEvent = {
  name: GrowthEventName;
  at: number;
  value?: number;
  traits?: GrowthTraits;
  meta?: Record<string, string | number | boolean | null | undefined>;
};

export type GrowthFunnel = {
  installAt: number | null;
  firstActionAt: number | null;
  firstPaymentAt: number | null;
  repeatUsageAt: number | null;
};

export type GrowthSnapshot = {
  events: GrowthEvent[];
  funnel: GrowthFunnel;
  totals: {
    creditsSpent: number;
    interpreterUsed: number;
    callUsed: number;
    bookingSuccess: number;
  };
};
