import type { Request, Response } from 'express';

import { VIONA_INTERNAL_RECOVERY_ROUTE_SAFETY } from '../lib/viona/internalRoute/vionaInternalRecoveryRouteGate';
import {
  createVionaRecoveryCorrelationId,
  recoverVionaExecutionAttempt,
  type RecoverVionaExecutionAttemptDeps,
  type RecoverVionaExecutionAttemptResult,
} from '../services/viona/vionaRequestExecutionRecoveryCoordinator';
import { createVionaRequestSystemRecoveryPrincipal } from '../services/viona/vionaRequestSystemRecoveryPrincipal';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

function readAuthUserId(req: Request): string | null {
  const id = req.authUserId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function readAttemptIdParam(req: Request): string | null {
  const raw = req.params.attemptId;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readOptionalTrimmedBody(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export type PostVionaInternalExecutionAttemptRecoveryDeps = Readonly<{
  coordinator?: (
    input: Parameters<typeof recoverVionaExecutionAttempt>[0],
    deps?: RecoverVionaExecutionAttemptDeps,
  ) => Promise<RecoverVionaExecutionAttemptResult>;
  coordinatorDeps?: RecoverVionaExecutionAttemptDeps;
  createCorrelationId?: () => string;
}>;

/**
 * Pack40DR3B — operator-invoked internal recovery for one exact execution attempt.
 *
 * `POST /api/internal/viona/execution-attempts/:attemptId/recovery`
 *
 * Operator authorization: JWT auth + `Role.ADMIN` (`superAdminMiddleware`).
 * Recovery principal is constructed from authenticated operator identity only.
 */
export async function postVionaInternalExecutionAttemptRecovery(
  req: Request,
  res: Response,
  deps: PostVionaInternalExecutionAttemptRecoveryDeps = {},
): Promise<void> {
  try {
    const authUserId = readAuthUserId(req);
    if (!authUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const attemptId = readAttemptIdParam(req);
    if (!attemptId) {
      jsonFail(res, 'attemptId is required', 400);
      return;
    }

    const body =
      req.body != null && typeof req.body === 'object' && !Array.isArray(req.body)
        ? (req.body as Record<string, unknown>)
        : {};

    // Authority spoof fields are ignored/rejected for recovery binding.
    void body.triggeringUserId;
    void body.tenantId;
    void body.merchantProfileId;
    void body.scopeKind;
    void body.ownerUserId;
    void body.leaseOwner;
    void body.leaseGeneration;
    void body.providerExternalReference;
    void body.providerOutcome;
    void body.requestId;

    const action = readOptionalTrimmedBody(body.action) ?? 'reconcile';
    if (action !== 'reconcile') {
      jsonFail(res, 'Unsupported recovery action', 400);
      return;
    }

    void readOptionalTrimmedBody(body.operatorReason);

    const correlationId = (deps.createCorrelationId ?? createVionaRecoveryCorrelationId)();
    const recoveryPrincipal = createVionaRequestSystemRecoveryPrincipal({
      triggeringUserId: authUserId,
      correlationId,
    });

    const coordinator = deps.coordinator ?? recoverVionaExecutionAttempt;
    const result = await coordinator(
      { attemptId, recoveryPrincipal, mode: 'reconcile' },
      deps.coordinatorDeps,
    );

    if (!result.ok) {
      if (result.category === 'invalid_input') {
        jsonFail(res, 'Invalid recovery request', 400);
        return;
      }
      if (result.category === 'not_found') {
        jsonFail(res, 'Recovery target not found', 404);
        return;
      }
      if (result.category === 'recovery_conflict') {
        jsonFail(res, 'Recovery conflict', 409);
        return;
      }
      jsonFail(res, 'Recovery unavailable', 503);
      return;
    }

    jsonOk(res, {
      attemptId: result.attemptId,
      requestId: result.requestId,
      category: result.category,
      ...(result.operatorReviewReason != null
        ? { operatorReviewReason: result.operatorReviewReason }
        : {}),
      safety: VIONA_INTERNAL_RECOVERY_ROUTE_SAFETY,
      pack40dr3b: {
        triggerType: 'operatorInternalRecovery',
        mode: 'reconcile',
      },
    });
  } catch {
    jsonFail(res, 'Internal server error', 500);
  }
}
