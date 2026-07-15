/**
 * Pack40D3B — attempt-scoped escrow key helpers (coordination only).
 *
 * Does not call hold/settle/refund. Live escrow remains in vionaRequestEscrowHoldService.
 */

export const VIONA_PACK40D3_ESCROW_ACTION_ID = 'twilio_test_sms' as const;

/** Symbolic POC cost — mirrors Pack31 VIONA_TWILIO_TEST_POC_ESTIMATED_COST_VIO without importing the route. */
export const VIONA_PACK40D3_TWILIO_TEST_ESTIMATED_COST_VIO = 0.01;

/**
 * Attempt-scoped escrow idempotency key.
 * Format: `escrow:{requestId}:{executionAttemptId}:twilio_test_sms`
 */
export function buildVionaPack40D3EscrowIdempotencyKey(input: {
  requestId: string;
  executionAttemptId: string;
}): string {
  return `escrow:${input.requestId}:${input.executionAttemptId}:${VIONA_PACK40D3_ESCROW_ACTION_ID}`;
}
