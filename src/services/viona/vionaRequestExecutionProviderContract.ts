/**
 * Pack40D3A — bounded provider operation contract and adapter surface (dormant).
 *
 * Limited to the smallest approved POC operation (`twilio_test_sms` / `send`).
 * Does not import live Twilio adapters, escrow, or credentials.
 */

export const VIONA_PACK40D3A_PROVIDER_NAME = 'twilio_test_sms' as const;

export const VIONA_PACK40D3A_OPERATION_CATEGORIES = ['send'] as const;

export type VionaPack40D3AOperationCategory =
  (typeof VIONA_PACK40D3A_OPERATION_CATEGORIES)[number];

export type VionaPack40D3AProviderName = typeof VIONA_PACK40D3A_PROVIDER_NAME;

const OPERATION_SET = new Set<string>(VIONA_PACK40D3A_OPERATION_CATEGORIES);

export function isVionaPack40D3AOperationCategory(
  value: string,
): value is VionaPack40D3AOperationCategory {
  return OPERATION_SET.has(value);
}

/**
 * Stable attempt-scoped provider idempotency key.
 * Format: `{provider}:{requestId}:{executionAttemptId}:{operationCategory}`
 */
export function buildVionaRequestProviderIdempotencyKey(input: {
  providerName: VionaPack40D3AProviderName;
  requestId: string;
  executionAttemptId: string;
  operationCategory: VionaPack40D3AOperationCategory;
}): string {
  return `${input.providerName}:${input.requestId}:${input.executionAttemptId}:${input.operationCategory}`;
}

export type VionaExecutionProviderAdapterInput = Readonly<{
  providerName: VionaPack40D3AProviderName;
  operationCategory: VionaPack40D3AOperationCategory;
  providerIdempotencyKey: string;
  correlationId: string;
  requestId: string;
  attemptId: string;
}>;

export type VionaExecutionProviderAdapterSucceeded = Readonly<{
  kind: 'succeeded';
  resultDigest: string;
  externalReferenceDigest?: string | null;
}>;

export type VionaExecutionProviderAdapterFailed = Readonly<{
  kind: 'failed';
  failureClass: string;
  failureReasonDigest: string;
}>;

export type VionaExecutionProviderAdapterUncertain = Readonly<{
  kind: 'uncertain';
  uncertaintyClass: 'timeout' | 'response_loss' | 'malformed_after_submit' | 'local_record_risk';
  failureReasonDigest?: string | null;
}>;

export type VionaExecutionProviderAdapterResult =
  | VionaExecutionProviderAdapterSucceeded
  | VionaExecutionProviderAdapterFailed
  | VionaExecutionProviderAdapterUncertain;

/**
 * Injected provider adapter. Pack40D3A tests supply fakes only.
 * Must not receive tenant/profile authority or credentials from public input.
 */
export type VionaExecutionProviderAdapter = Readonly<{
  invoke(
    input: VionaExecutionProviderAdapterInput,
  ): Promise<VionaExecutionProviderAdapterResult>;
}>;

/**
 * Optional future escrow-preparation hook type for Pack40D3B.
 * Pack40D3A must not invoke any live escrow implementation.
 */
export type VionaExecutionEscrowPreparationHook = Readonly<{
  prepareHold?(input: {
    attemptId: string;
    requestId: string;
    providerIdempotencyKey: string;
  }): Promise<{ ok: boolean }>;
}>;
