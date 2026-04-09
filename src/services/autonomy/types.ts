import type { SellResume } from '../selling/sellingTypes';

export type AutonomousActionType = 'auto_visa_booking';

export type AutonomousTriggerType =
  | 'visa_expiry_threshold'
  | 'upcoming_appointment_confirmation'
  | 'failed_booking_retry'
  | 'post_interpreter_followup'
  | 'low_credit_warning'
  | 'merchant_rule';

export type AllowedHours = {
  startHourLocal: number;
  endHourLocal: number;
};

export type B2CAutonomousConsent = {
  allowAutoVisaBooking: boolean;
  allowAutoAppointmentConfirmation: boolean;
  allowAutoOutboundCalls: boolean;
  maxCreditsPerAction: number;
  maxCreditsPerDay: number;
  allowedHours: AllowedHours;
  requireConfirmationAboveCredits: number;
};

export type B2BMerchantAutonomousRule = {
  merchantId: string;
  enabled: boolean;
  maxCreditsPerAction?: number;
  maxCreditsPerDay?: number;
};

export type AutonomousConsentEnvelope = {
  userId: string;
  b2c: B2CAutonomousConsent;
  b2b?: {
    merchantRules?: B2BMerchantAutonomousRule[];
  };
  updatedAt: string;
};

export type AutonomousUserState = {
  userId: string;
  userCountry?: string;
  visaExpiry: string | null;
  daysToExpiry: number | null;
  recentActions: { action: string; at: number }[];
  learningProgress: number;
  creditBalance: number;
  upcomingEvents: { type: string; date: string; daysLeft?: number }[];
};

export type AutonomousActionTrigger = {
  type: AutonomousTriggerType;
  source: 'lifeos' | 'vault' | 'startup' | 'system';
  data?: Record<string, unknown>;
};

export type PolicyDecisionStatus = 'allowed' | 'blocked' | 'require_confirmation';

export type PolicyDecision = {
  status: PolicyDecisionStatus;
  reason:
    | 'consent_missing'
    | 'outside_allowed_hours'
    | 'insufficient_credits'
    | 'action_cap_exceeded'
    | 'daily_cap_exceeded'
    | 'cooldown_active'
    | 'missing_required_data'
    | 'requires_confirmation'
    | 'ok';
  details?: string;
};

export type EvaluateAutonomousActionInput = {
  trigger: AutonomousActionTrigger;
  userState: AutonomousUserState;
  consent: AutonomousConsentEnvelope | null;
  credits: {
    actionCost: number;
    dailySpent: number;
  };
  currentTime: Date;
  cooldown: {
    isActive: boolean;
  };
  requiredData: {
    hasPhone: boolean;
    hasVisaExpiry: boolean;
  };
};

export type AutonomousAuditLog = {
  id: string;
  triggerType: AutonomousTriggerType;
  actionType: AutonomousActionType;
  userId: string;
  allowedByPolicy: boolean;
  creditsReserved: number;
  startedAt: string;
  completedAt: string | null;
  outcome: 'policy_blocked' | 'policy_require_confirmation' | 'started' | 'success' | 'failed';
  failureReason?: string;
  relatedBookingId?: string;
  relatedCallSessionId?: string;
};

export type AutonomousOrchestratorResult = {
  decision: PolicyDecision;
  audit: AutonomousAuditLog;
  resumeAction?: SellResume;
  emittedEvent?: {
    type: 'autonomy_action_executed' | 'autonomy_action_blocked';
    message: string;
  };
};
