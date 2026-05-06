import type { FeatureFlagKey } from '../feature-flags/featureFlags';
import type { ToolGatewayDomain, ToolGatewayRiskTier } from './toolGatewayTypes';

export type ReceptionistPolicyEnvironment = 'demo' | 'pilot' | 'production';

export type ReceptionistPolicyCapability =
  | 'read_calendar'
  | 'create_booking_hold'
  | 'confirm_booking'
  | 'reserve_inventory'
  | 'print_bill'
  | 'capture_payment'
  | 'send_customer_notification';

export type ReceptionistPolicySubject = Readonly<{
  merchantId: string;
  locationId?: string;
  role: 'owner' | 'manager' | 'staff' | 'system';
  environment: ReceptionistPolicyEnvironment;
}>;

export type ReceptionistPolicyRule = Readonly<{
  id: string;
  capability: ReceptionistPolicyCapability;
  domain: ToolGatewayDomain;
  maxRiskTier: ToolGatewayRiskTier;
  /** Every flag listed here must be true to allow live execution. */
  requiredFlags: readonly FeatureFlagKey[];
  /** Optional deny reason to preserve explicit safety messaging. */
  denyMessage?: string;
}>;

export type ReceptionistPolicyEvaluationRequest = Readonly<{
  subject: ReceptionistPolicySubject;
  capability: ReceptionistPolicyCapability;
  requestedRiskTier: ToolGatewayRiskTier;
}>;

export type ReceptionistPolicyDecision = Readonly<{
  allow: boolean;
  environment: ReceptionistPolicyEnvironment;
  capability: ReceptionistPolicyCapability;
  requiredFlags: readonly FeatureFlagKey[];
  missingFlags: readonly FeatureFlagKey[];
  reason:
    | 'allowed'
    | 'capability_not_found'
    | 'risk_tier_exceeded'
    | 'flags_not_satisfied'
    | 'environment_denied';
  message: string;
}>;
