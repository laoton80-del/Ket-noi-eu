/**
 * Pack30A — Mock execution adapter (mock-only). Never calls a real provider, network, or DB.
 * No fetch/axios/network/database imports permitted in this module.
 */

import {
  VIONA_MOCK_ADAPTER_SAFETY,
  type VionaMockAdapterInvocationInput,
  type VionaMockAdapterResult,
  type VionaMockIdempotencyStore,
} from './vionaMockExecutionAdapterTypes';

/** Non-persistent, in-memory idempotency placeholder store — process-local only. */
export function createInMemoryVionaMockIdempotencyStore(): VionaMockIdempotencyStore {
  const store = new Map<string, VionaMockAdapterResult>();
  return Object.freeze({
    get(key: string): VionaMockAdapterResult | undefined {
      return store.get(key);
    },
    set(key: string, result: VionaMockAdapterResult): void {
      store.set(key, result);
    },
  });
}

function buildBlockedResult(input: VionaMockAdapterInvocationInput): VionaMockAdapterResult {
  return Object.freeze({
    mockExecutionId: `mock-blocked-${input.plan.planId}`,
    requestId: input.plan.requestId,
    actionId: input.plan.actionId,
    planId: input.plan.planId,
    invoked: false,
    replay: false,
    safety: VIONA_MOCK_ADAPTER_SAFETY,
    invokedAt: input.invokedAt,
    operatorMessage: 'Pack30A execution plan denied — mock adapter not invoked.',
    userFacingMessage: input.plan.userFacingMessage,
  });
}

function buildInvokedResult(
  input: VionaMockAdapterInvocationInput,
  replay: boolean,
): VionaMockAdapterResult {
  return Object.freeze({
    mockExecutionId: `mock-${input.plan.requestId}-${input.plan.actionId}-${input.plan.planId}`,
    requestId: input.plan.requestId,
    actionId: input.plan.actionId,
    planId: input.plan.planId,
    invoked: true,
    replay,
    safety: VIONA_MOCK_ADAPTER_SAFETY,
    invokedAt: input.invokedAt,
    operatorMessage: replay
      ? 'Pack30A mock adapter replay — idempotency placeholder returned cached mock result, no duplicate work.'
      : 'Pack30A mock adapter invoked — mock-only, no external provider called.',
    userFacingMessage: 'Mock-only preview — no automated action.',
  });
}

/**
 * Invoke the Pack30A mock execution adapter — mock-only, deterministic, no external provider calls.
 * If the plan is denied, the adapter is not invoked and a blocked result is returned.
 * If an idempotency key + store are provided and a prior result exists, returns the cached
 * (replayed) result instead of doing duplicate mock work.
 */
export function invokeVionaMockExecutionAdapter(
  input: VionaMockAdapterInvocationInput,
  idempotencyStore?: VionaMockIdempotencyStore,
): VionaMockAdapterResult {
  if (input.plan.mockAdapterInstruction === 'do_not_invoke' || !input.plan.allowed) {
    return buildBlockedResult(input);
  }

  const idempotencyKey = input.plan.idempotencyKey;

  if (idempotencyKey && idempotencyStore) {
    const cached = idempotencyStore.get(idempotencyKey);
    if (cached) {
      return buildInvokedResult(input, true);
    }
  }

  const result = buildInvokedResult(input, false);

  if (idempotencyKey && idempotencyStore) {
    idempotencyStore.set(idempotencyKey, result);
  }

  return result;
}
