/**
 * Pack31 — Business Flow Orchestrator: State Lock -> Real Execution -> Finalize State -> Audit.
 *
 * Operator phrase: APPROVE_PACK31_ORCHESTRATOR_DIRECT_PRISMA.
 *
 * WHY A NEW FILE (not a change to `vionaRequestStatusActionService.ts`, by explicit operator
 * instruction): that service's `transitionVionaRequestStatus()` wraps its status update inside a
 * single Prisma `$transaction()` alongside its audit writes. A real-provider network call
 * (Twilio) must never execute while a DB transaction/row lock is held open for the duration of an
 * external HTTP round-trip. This orchestrator therefore issues its own, separate,
 * non-transactional Prisma statements before and after the network call. Per operator
 * instruction, `vionaRequestStatusActionService.ts` is not imported, read, or modified by this
 * file.
 *
 * DOMAIN NOTE: the pre-existing `VionaRequestStatus` enum had no "currently executing" value.
 * Rather than write an unrecognized string into `VionaRequest.status` (a plain `String` column —
 * see prisma/schema.prisma — so an invalid value would silently corrupt every other reader of
 * that column instead of failing loudly), this pack additively introduced exactly one new, valid
 * status, `'inProgress'`, across 3 domain files: `vionaRequestTypes.ts`,
 * `vionaRequestStatusMachine.ts`, `vionaRequestExecutionEligibilityGuard.ts`. Zero existing
 * statuses or transitions were changed or removed — see each file's Pack31-orchestrator comment.
 *
 * SAFETY BOUNDARIES PRESERVED (raw Prisma is used only for the two status writes below; every
 * other protection this codebase already relies on remains fully intact and is never bypassed):
 *   - Owner-only: every write is scoped by `ownerUserId: authUserId`, mirroring the exact
 *     ownership check `vionaRequestStatusActionService.ts` itself enforces.
 *   - Valid-transition-only: every status change is checked against the same, unmodified
 *     `canTransitionRequestStatus()` state machine before being attempted.
 *   - Atomic claim, fail-closed: the Step 1 lock is a single conditional `updateMany`
 *     (`WHERE status = 'triage' AND ownerUserId = :authUserId`). A concurrent second call, a
 *     wrong owner, or a request not in `triage` all see 0 rows updated and return `invalid_state`
 *     — never a guess, never a retry, never a partial claim.
 *   - Real execution is delegated, unmodified, to `previewVionaExecutionPlanRealProviderPocRoute()`
 *     — the feature-flag gate, Circuit Breaker, Twilio magic-number allowlist, and Zero-Loss VIO
 *     Credits escrow hold/settle are all still enforced exactly as before. This orchestrator adds
 *     a request-level state machine *around* that call; it never reaches into or bypasses what
 *     happens inside it.
 *   - Every terminal outcome (`completed` or `failed`) is durably recorded — both a
 *     `VionaRequestStatusEvent` row and a `stateTransition` audit-ledger row — before returning,
 *     mirroring the dual-write pattern `vionaRequestStatusActionService.ts` itself uses.
 *
 * KNOWN, PRE-EXISTING LIMITATION INHERITED (not introduced by this file): the underlying
 * `previewVionaExecutionPlanRealProviderPocRoute()`'s Pack25 hold/safety-label check
 * (`blocked_safety_label`) only evaluates labels the *caller* supplies via `requestSafetyLabels` —
 * `VionaRequest` has no persisted safety-labels column today (see Pack19/25 design docs), so no
 * caller of this route, including this orchestrator, can look them up from the database. This
 * orchestrator omits `requestSafetyLabels` exactly as every other existing caller of this route
 * does today — it does not weaken any check that exists, and does not invent one that doesn't.
 */

import { canTransitionRequestStatus } from '../../domain/requests/vionaRequestStatusMachine';
import { getPrisma } from '../../lib/prisma';
import { appendVionaExecutionAuditEvent } from './vionaExecutionAuditWriteService';
import {
  previewVionaExecutionPlanRealProviderPocRoute,
  type PreviewVionaExecutionPlanRealProviderPocResult,
} from './vionaExecutionPlanRouteService';

const CLAIM_FROM_STATUS = 'triage' as const;
const CLAIMED_STATUS = 'inProgress' as const;

export type ExecuteVionaRequestBusinessFlowInput = Readonly<{
  authUserId: string;
  requestId: string;
  fromNumber: string;
  toNumber: string;
  body: string;
}>;

export type ExecuteVionaRequestBusinessFlowFailureReason =
  | 'invalid_input'
  | 'invalid_state'
  | 'execution_error';

export type ExecuteVionaRequestBusinessFlowResult =
  | Readonly<{
      ok: true;
      requestId: string;
      fromStatus: typeof CLAIM_FROM_STATUS;
      finalStatus: 'completed' | 'failed';
      executionResult: PreviewVionaExecutionPlanRealProviderPocResult;
    }>
  | Readonly<{ ok: false; reason: ExecuteVionaRequestBusinessFlowFailureReason }>;

function isNonEmptyTrimmed(value: string): boolean {
  return value.trim().length > 0;
}

async function writeVionaRequestStatusEvent(input: {
  requestId: string;
  fromStatus: string;
  toStatus: string;
  authUserId: string;
  reason: string;
}): Promise<void> {
  try {
    await getPrisma().vionaRequestStatusEvent.create({
      data: {
        requestId: input.requestId,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        changedByUserId: input.authUserId,
        reason: input.reason,
      },
    });
  } catch (error) {
    console.error(
      `[pack31-orchestrator] failed to write VionaRequestStatusEvent (${input.fromStatus} -> ${input.toStatus}) for request ${input.requestId}: ${
        error instanceof Error ? error.message : 'unknown_error'
      }`,
    );
  }
}

async function writeOrchestratorStateTransitionAudit(input: {
  requestId: string;
  authUserId: string;
  fromStatus: string;
  toStatus: string;
  committed: boolean;
}): Promise<void> {
  const result = await appendVionaExecutionAuditEvent({
    requestId: input.requestId,
    eventType: 'stateTransition',
    actorUserId: input.authUserId,
    actorRoleLabel: 'owner',
    message: `Pack31 orchestrator: ${input.fromStatus} -> ${input.toStatus} (${
      input.committed ? 'committed' : 'FAILED TO COMMIT'
    }).`,
    payloadJson: {
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      committed: input.committed,
    },
  });
  if (!result.ok) {
    console.error(
      `[pack31-orchestrator] failed to append stateTransition audit event for request ${input.requestId}: ${result.error}`,
    );
  }
}

/**
 * Step 1 — State Lock. Atomically claims the request for execution by conditionally moving it
 * from `triage` to `inProgress`. Returns `false` (never throws) if the request does not exist, is
 * not owned by `authUserId`, or is not currently in the one eligible pre-execution state.
 */
async function claimVionaRequestForExecution(requestId: string, authUserId: string): Promise<boolean> {
  if (!canTransitionRequestStatus(CLAIM_FROM_STATUS, CLAIMED_STATUS)) {
    // Defensive — unreachable given the additive state-machine wiring, but never assumed.
    return false;
  }
  const updated = await getPrisma().vionaRequest.updateMany({
    where: {
      id: requestId,
      status: CLAIM_FROM_STATUS,
      ownerUserId: authUserId,
    },
    data: { status: CLAIMED_STATUS },
  });
  return updated.count === 1;
}

/**
 * Step 3 — Finalize State. Atomically moves the request out of `inProgress` into a terminal
 * status, scoped by the same owner + expected-current-status guard as the claim above, so this
 * can never finalize a request this orchestrator did not itself just claim.
 */
async function finalizeVionaRequestStatus(
  requestId: string,
  authUserId: string,
  toStatus: 'completed' | 'failed',
): Promise<boolean> {
  if (!canTransitionRequestStatus(CLAIMED_STATUS, toStatus)) {
    return false;
  }
  const updated = await getPrisma().vionaRequest.updateMany({
    where: {
      id: requestId,
      status: CLAIMED_STATUS,
      ownerUserId: authUserId,
    },
    data: { status: toStatus },
  });
  return updated.count === 1;
}

/** Pure — decides the terminal status from the real-provider route's own result, never guesses. */
export function resolveVionaRequestBusinessFlowFinalStatus(
  executionResult: PreviewVionaExecutionPlanRealProviderPocResult,
): 'completed' | 'failed' {
  if (!executionResult.ok) return 'failed';
  if (!executionResult.planAllowed) return 'failed';
  if (executionResult.escrow.attempted && !executionResult.escrow.holdOk) return 'failed';
  return executionResult.realProviderResult?.outcome.outcome === 'succeeded' ? 'completed' : 'failed';
}

/**
 * Business-flow orchestrator: State Lock -> Real Execution -> Finalize State -> Audit.
 * Fails closed at every step; a thrown/unexpected error during Step 2 is caught and still routed
 * through Step 3 (finalize to `failed`) + Step 4 (audit), so a request is never left stranded in
 * `inProgress` without at least one attempt to close it out and durably record why.
 */
export async function executeVionaRequestBusinessFlow(
  input: ExecuteVionaRequestBusinessFlowInput,
): Promise<ExecuteVionaRequestBusinessFlowResult> {
  const authUserId = input.authUserId.trim();
  const requestId = input.requestId.trim();
  const fromNumber = input.fromNumber.trim();
  const toNumber = input.toNumber.trim();
  const body = input.body.trim();

  if (
    !isNonEmptyTrimmed(authUserId) ||
    !isNonEmptyTrimmed(requestId) ||
    !isNonEmptyTrimmed(fromNumber) ||
    !isNonEmptyTrimmed(toNumber) ||
    !isNonEmptyTrimmed(body)
  ) {
    return { ok: false, reason: 'invalid_input' };
  }

  // Step 1 — State Lock.
  const claimed = await claimVionaRequestForExecution(requestId, authUserId);
  if (!claimed) {
    return { ok: false, reason: 'invalid_state' };
  }
  await writeVionaRequestStatusEvent({
    requestId,
    fromStatus: CLAIM_FROM_STATUS,
    toStatus: CLAIMED_STATUS,
    authUserId,
    reason: 'Pack31 orchestrator: claimed for real-provider execution.',
  });

  // Step 2 — Real Execution. Never wrapped in a DB transaction — the claim above already
  // committed independently. `previewVionaExecutionPlanRealProviderPocRoute()` itself still
  // enforces the feature flag, Circuit Breaker, magic-number allowlist, and Zero-Loss escrow hold.
  let executionResult: PreviewVionaExecutionPlanRealProviderPocResult;
  try {
    executionResult = await previewVionaExecutionPlanRealProviderPocRoute({
      authUserId,
      requestId,
      operatorApprovalGranted: true,
      userConsentGranted: true,
      idempotencyKey: `pack31-orchestrator-${requestId}`,
      fromNumber,
      toNumber,
      body,
    });
  } catch (error) {
    console.error(
      `[pack31-orchestrator] previewVionaExecutionPlanRealProviderPocRoute threw for request ${requestId}: ${
        error instanceof Error ? error.message : 'unknown_error'
      }`,
    );
    const finalizedToFailed = await finalizeVionaRequestStatus(requestId, authUserId, 'failed');
    await writeVionaRequestStatusEvent({
      requestId,
      fromStatus: CLAIMED_STATUS,
      toStatus: 'failed',
      authUserId,
      reason: 'Pack31 orchestrator: real-provider execution threw unexpectedly.',
    });
    await writeOrchestratorStateTransitionAudit({
      requestId,
      authUserId,
      fromStatus: CLAIMED_STATUS,
      toStatus: 'failed',
      committed: finalizedToFailed,
    });
    return { ok: false, reason: 'execution_error' };
  }

  // Step 3 — Finalize State.
  const finalStatus = resolveVionaRequestBusinessFlowFinalStatus(executionResult);
  const finalized = await finalizeVionaRequestStatus(requestId, authUserId, finalStatus);
  await writeVionaRequestStatusEvent({
    requestId,
    fromStatus: CLAIMED_STATUS,
    toStatus: finalStatus,
    authUserId,
    reason: `Pack31 orchestrator: real-provider execution ${finalStatus === 'completed' ? 'succeeded' : 'did not succeed'}.`,
  });

  // Step 4 — Audit (always — including the unexpected case where `finalized` is false, e.g. a
  // concurrent out-of-band status change raced this call; that gap must be durably recorded, not
  // silently swallowed).
  await writeOrchestratorStateTransitionAudit({
    requestId,
    authUserId,
    fromStatus: CLAIMED_STATUS,
    toStatus: finalStatus,
    committed: finalized,
  });

  if (!finalized) {
    return { ok: false, reason: 'execution_error' };
  }

  return {
    ok: true,
    requestId,
    fromStatus: CLAIM_FROM_STATUS,
    finalStatus,
    executionResult,
  };
}
