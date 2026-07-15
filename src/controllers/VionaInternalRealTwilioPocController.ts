import type { Request, Response } from 'express';

import {
  VIONA_INTERNAL_REAL_TWILIO_POC_FORCED_MAGIC_NUMBER,
  VIONA_INTERNAL_REAL_TWILIO_POC_ROUTE_SAFETY,
} from '../lib/viona/internalRoute/vionaInternalRealTwilioPocRouteGate';
import {
  executeVionaRequestBusinessFlow,
  type ExecuteVionaRequestBusinessFlowDeps,
  type ExecuteVionaRequestBusinessFlowResult,
} from '../services/viona/vionaRequestExecutionOrchestrator';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

function readAuthUserId(req: Request): string | null {
  const id = req.authUserId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function readOptionalTrimmedBody(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readRequiredRequestIdBody(body: Record<string, unknown>): string | null {
  const raw = body.requestId;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export type PostVionaInternalTriggerRealTwilioPocDeps = Readonly<{
  /** Pack40D3B — coordinator injection for local tests. */
  coordinator?: (
    input: {
      authUserId: string;
      requestId: string;
      fromNumber: string;
      toNumber: string;
      body: string;
    },
    deps?: ExecuteVionaRequestBusinessFlowDeps,
  ) => Promise<ExecuteVionaRequestBusinessFlowResult>;
  coordinatorDeps?: ExecuteVionaRequestBusinessFlowDeps;
}>;

/**
 * Pack40D3B — sole enabled Pack40D runtime trigger (`internalAuthenticatedController`).
 *
 * `POST /api/internal/viona/trigger-real-twilio-poc` — staging/local gate + JWT auth unchanged.
 * Routes through the Pack40D coordinator (claim → escrow → gateway → finalize).
 * Does not call Twilio or the legacy real-provider POC route directly.
 *
 * Operator authorization: `APPROVE_PACK40D3B_CONTROLLED_RUNTIME_WIRING_AND_BYPASS_CLOSURE`.
 */
export async function postVionaInternalTriggerRealTwilioPoc(
  req: Request,
  res: Response,
  deps: PostVionaInternalTriggerRealTwilioPocDeps = {},
): Promise<void> {
  try {
    const authUserId = readAuthUserId(req);
    if (!authUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const body =
      req.body != null && typeof req.body === 'object' && !Array.isArray(req.body)
        ? (req.body as Record<string, unknown>)
        : {};

    // Envelope/spoof fields are ignored for authority.
    void body.tenantId;
    void body.merchantProfileId;
    void body.scopeKind;
    void body.ownerUserId;

    const requestId = readRequiredRequestIdBody(body);
    if (!requestId) {
      jsonFail(res, 'requestId is required', 400);
      return;
    }

    if (body.operatorApprovalGranted !== true || body.userConsentGranted !== true) {
      jsonFail(res, 'operatorApprovalGranted and userConsentGranted must both be true', 400);
      return;
    }

    const messageBody =
      readOptionalTrimmedBody(body.messageBody) ??
      `VIONA internal real Twilio POC ${new Date().toISOString()} (Test Credentials, magic numbers only).`;

    const coordinator = deps.coordinator ?? executeVionaRequestBusinessFlow;
    const result = await coordinator(
      {
        authUserId,
        requestId,
        fromNumber: VIONA_INTERNAL_REAL_TWILIO_POC_FORCED_MAGIC_NUMBER,
        toNumber: VIONA_INTERNAL_REAL_TWILIO_POC_FORCED_MAGIC_NUMBER,
        body: messageBody,
      },
      deps.coordinatorDeps,
    );

    if (!result.ok) {
      if (result.reason === 'invalid_input') {
        jsonFail(res, 'Invalid internal real Twilio POC request', 400);
        return;
      }
      if (result.reason === 'invalid_state') {
        // Safe not-found / unavailable — do not reveal tenant/profile/lease details.
        jsonFail(res, 'Request not found', 404);
        return;
      }
      if (result.reason === 'provider_uncertain' || result.reason === 'reconciliation_required') {
        jsonFail(res, 'Execution requires reconciliation', 409);
        return;
      }
      jsonFail(res, 'Execution unavailable', 503);
      return;
    }

    jsonOk(res, {
      requestId: result.requestId,
      attemptId: result.attemptId,
      finalStatus: result.finalStatus,
      providerInvoked: result.providerInvoked,
      safety: VIONA_INTERNAL_REAL_TWILIO_POC_ROUTE_SAFETY,
      pack40d: {
        triggerType: 'internalAuthenticatedController',
        coordinator: true,
      },
    });
  } catch {
    jsonFail(res, 'Internal server error', 500);
  }
}
