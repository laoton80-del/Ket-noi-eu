import type { EvaluateAutonomousActionInput, PolicyDecision } from './types';

function withinAllowedHours(now: Date, startHour: number, endHour: number): boolean {
  const h = now.getHours();
  if (startHour === endHour) return true;
  if (startHour < endHour) return h >= startHour && h < endHour;
  return h >= startHour || h < endHour;
}

export function evaluateAutonomousAction(input: EvaluateAutonomousActionInput): PolicyDecision {
  const consent = input.consent?.b2c;
  if (!consent) {
    return { status: 'blocked', reason: 'consent_missing', details: 'No autonomy consent profile found.' };
  }

  if (input.trigger.type === 'visa_expiry_threshold' && !consent.allowAutoVisaBooking) {
    return { status: 'blocked', reason: 'consent_missing', details: 'Auto visa booking is not enabled by user.' };
  }

  if (!withinAllowedHours(input.currentTime, consent.allowedHours.startHourLocal, consent.allowedHours.endHourLocal)) {
    return { status: 'blocked', reason: 'outside_allowed_hours' };
  }

  if (!input.requiredData.hasPhone || !input.requiredData.hasVisaExpiry) {
    return { status: 'blocked', reason: 'missing_required_data' };
  }

  if (input.cooldown.isActive) {
    return { status: 'blocked', reason: 'cooldown_active' };
  }

  if (input.credits.actionCost > consent.maxCreditsPerAction) {
    return { status: 'blocked', reason: 'action_cap_exceeded' };
  }

  if (input.credits.dailySpent + input.credits.actionCost > consent.maxCreditsPerDay) {
    return { status: 'blocked', reason: 'daily_cap_exceeded' };
  }

  if (input.userState.creditBalance < input.credits.actionCost) {
    return { status: 'blocked', reason: 'insufficient_credits' };
  }

  if (input.credits.actionCost >= consent.requireConfirmationAboveCredits) {
    return { status: 'require_confirmation', reason: 'requires_confirmation' };
  }

  return { status: 'allowed', reason: 'ok' };
}
