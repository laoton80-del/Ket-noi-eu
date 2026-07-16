/**
 * Pack40DR2 — injected attempt-scoped escrow recontract (fake adapters in tests only).
 *
 * Recovery services must not import live escrow implementations.
 */

export type VionaRecoveryEscrowHoldView = Readonly<{
  holdId: string;
  requestId: string;
  idempotencyKey: string;
  status: 'HELD' | 'SETTLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'FAILED';
  heldAmountVIO: number;
}>;

export type VionaRecoveryEscrowMutationResult = Readonly<{
  ok: boolean;
  status: VionaRecoveryEscrowHoldView['status'];
  deduplicated: boolean;
  uncertainty?: boolean;
}>;

export type VionaRecoveryEscrowAdapter = Readonly<{
  inspectExactHold(input: {
    requestId: string;
    executionAttemptId: string;
    operationCategory: string;
  }): Promise<VionaRecoveryEscrowHoldView | null>;

  settleExactHoldIdempotently(input: {
    holdId: string;
    requestId: string;
    executionAttemptId: string;
    operationCategory: string;
  }): Promise<VionaRecoveryEscrowMutationResult>;

  releaseOrRefundExactHoldIdempotently(input: {
    holdId: string;
    requestId: string;
    executionAttemptId: string;
    operationCategory: string;
  }): Promise<VionaRecoveryEscrowMutationResult>;
}>;
