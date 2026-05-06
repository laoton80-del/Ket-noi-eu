/**
 * Global pilot safety posture for Lễ Tân AI — client-side documentation only.
 * Does not enable Twilio, payments, booking mutations, or inventory/bill automation.
 */

export type AiReceptionistPilotReadiness = 'manual_ops_pilot_only';

/** Immutable posture applied to every industry playbook in pilot/demo surfaces. */
export type AiReceptionistGlobalPilotPosture = Readonly<{
  pilotReadiness: AiReceptionistPilotReadiness;
  requiresHumanConfirmation: true;
  requiresConsent: true;
  canAutoConfirmBooking: false;
  canTakePayment: false;
  canModifyInventory: false;
  canPrintBill: false;
  manualOpsRequired: true;
}>;

export const AI_RECEPTIONIST_GLOBAL_PILOT_POSTURE: AiReceptionistGlobalPilotPosture = {
  pilotReadiness: 'manual_ops_pilot_only',
  requiresHumanConfirmation: true,
  requiresConsent: true,
  canAutoConfirmBooking: false,
  canTakePayment: false,
  canModifyInventory: false,
  canPrintBill: false,
  manualOpsRequired: true,
};

/** Structured block appended to pilot lead `notes` for manual ops triage (no schema change). */
export function buildPilotLeadStructuredAppendix(
  t: (key: string, options?: Record<string, unknown>) => string,
  smartTrioLine: string
): string {
  return [
    '---',
    t('aiReceptionist.pilot.appendixPostureHeader'),
    t('aiReceptionist.pilot.appendixManualOps'),
    t('aiReceptionist.pilot.appendixHumanConfirm'),
    t('aiReceptionist.pilot.appendixNoAutoBooking'),
    t('aiReceptionist.pilot.appendixNoPayment'),
    t('aiReceptionist.pilot.appendixNoInventory'),
    t('aiReceptionist.pilot.appendixNoBill'),
    t('aiReceptionist.pilot.appendixTrio', { line: smartTrioLine }),
  ].join('\n');
}
