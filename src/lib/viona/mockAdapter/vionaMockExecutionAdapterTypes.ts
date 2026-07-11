/**
 * Pack30A — Mock execution adapter contract types (mock-only, no real provider wiring).
 * No DB writes, no UI wiring, no env/network access, no real execution.
 */

import type { VionaExecutionPlan } from '../executionPlan/vionaExecutionPlanTypes';

export const VIONA_MOCK_ADAPTER_SAFETY = {
  providerCalled: false,
  mockOnly: true,
  externalExecutionBlocked: true,
  persistentAuditWritten: false,
  notProductionReady: true,
} as const;

export type VionaMockAdapterSafety = typeof VIONA_MOCK_ADAPTER_SAFETY;

export type VionaMockAdapterInvocationInput = Readonly<{
  plan: VionaExecutionPlan;
  invokedAt: string;
}>;

export type VionaMockAdapterResult = Readonly<{
  mockExecutionId: string;
  requestId: string;
  actionId: string;
  planId: string;
  invoked: boolean;
  replay: boolean;
  safety: VionaMockAdapterSafety;
  invokedAt: string;
  operatorMessage: string;
  userFacingMessage: string;
}>;

/**
 * Idempotency placeholder store — explicitly non-persistent (in-memory only, process-local).
 * Not a real replay-protection ledger; caller must not assume durability across processes.
 */
export type VionaMockIdempotencyStore = Readonly<{
  get(key: string): VionaMockAdapterResult | undefined;
  set(key: string, result: VionaMockAdapterResult): void;
}>;
