import type { FeatureFlagKey } from '../feature-flags/featureFlags';

export type AiActionRiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type AiActionRiskModelEntry = Readonly<{
  actionId: string;
  actionLabel: string;
  riskLevel: AiActionRiskLevel;
  /** Flags required before the action can be considered for live execution. */
  requiredFlags: readonly FeatureFlagKey[];
  requiresHumanApproval: boolean;
  rollbackRequired: boolean;
  notes: string;
}>;

export const AI_RECEPTIONIST_ACTION_RISK_MODEL: readonly AiActionRiskModelEntry[] = [
  {
    actionId: 'read_calendar_slots',
    actionLabel: 'Read calendar slots',
    riskLevel: 'low',
    requiredFlags: ['b2bAiReceptionistDemoEnabled'],
    requiresHumanApproval: false,
    rollbackRequired: false,
    notes: 'Read-only operation for discovery and availability checks.',
  },
  {
    actionId: 'create_booking_hold',
    actionLabel: 'Create booking hold',
    riskLevel: 'moderate',
    requiredFlags: ['b2bAiReceptionistProductionEnabled', 'b2bAutoBookingEnabled'],
    requiresHumanApproval: true,
    rollbackRequired: true,
    notes: 'Hold can impact slot inventory and customer expectation.',
  },
  {
    actionId: 'confirm_booking',
    actionLabel: 'Confirm booking',
    riskLevel: 'high',
    requiredFlags: ['b2bAiReceptionistProductionEnabled', 'b2bAutoBookingEnabled'],
    requiresHumanApproval: true,
    rollbackRequired: true,
    notes: 'Booking confirmation is customer-facing and may trigger downstream commitments.',
  },
  {
    actionId: 'reserve_inventory',
    actionLabel: 'Reserve inventory',
    riskLevel: 'high',
    requiredFlags: ['b2bAiReceptionistProductionEnabled', 'b2bAutoInventoryEnabled'],
    requiresHumanApproval: true,
    rollbackRequired: true,
    notes: 'Inventory locks can impact orderability for other channels.',
  },
  {
    actionId: 'dispatch_bill_print',
    actionLabel: 'Dispatch bill print',
    riskLevel: 'moderate',
    requiredFlags: ['b2bAiReceptionistProductionEnabled', 'b2bAutoBillPrintEnabled'],
    requiresHumanApproval: true,
    rollbackRequired: true,
    notes: 'Requires operator fallback to avoid duplicate/incorrect printouts.',
  },
  {
    actionId: 'capture_payment',
    actionLabel: 'Capture payment',
    riskLevel: 'critical',
    requiredFlags: ['b2bAiReceptionistProductionEnabled', 'b2bAutoPaymentEnabled'],
    requiresHumanApproval: true,
    rollbackRequired: true,
    notes: 'Financial side effect; must remain disabled until explicit cutover and finance approval.',
  },
];
