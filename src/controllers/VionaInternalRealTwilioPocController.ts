import type { Request, Response } from 'express';

import {
  VIONA_INTERNAL_REAL_TWILIO_POC_FORCED_MAGIC_NUMBER,
  VIONA_INTERNAL_REAL_TWILIO_POC_ROUTE_SAFETY,
} from '../lib/viona/internalRoute/vionaInternalRealTwilioPocRouteGate';
import {
  previewVionaExecutionPlanRealProviderPocRoute,
  type PreviewVionaExecutionPlanRealProviderPocResult,
} from '../services/viona/vionaExecutionPlanRouteService';
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
  routeExecutor?: typeof previewVionaExecutionPlanRealProviderPocRoute;
}>;

/**
 * Pack30D-8 — Internal HTTP wiring for `previewVionaExecutionPlanRealProviderPocRoute()`.
 *
 * `POST /api/internal/viona/trigger-real-twilio-poc` — staging/local only (see gate middleware),
 * authenticated, magic-number-only (`+15005550006`), delegates to the existing Pack30D-4/31 service
 * chain (plan → hold → executeReal → settle) without bypassing feature-flag or circuit-breaker
 * gates inside `executeVionaTwilioTestPocReal()`.
 *
 * Operator authorization: `APPROVE_PACK30D_8_STAGING_WIRING_INTERNAL_ROUTE`.
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

    const routeExecutor = deps.routeExecutor ?? previewVionaExecutionPlanRealProviderPocRoute;
    const result: PreviewVionaExecutionPlanRealProviderPocResult = await routeExecutor({
      authUserId,
      requestId,
      actionId: readOptionalTrimmedBody(body.actionId),
      operatorApprovalGranted: true,
      userConsentGranted: true,
      idempotencyKey: readOptionalTrimmedBody(body.idempotencyKey),
      fromNumber: VIONA_INTERNAL_REAL_TWILIO_POC_FORCED_MAGIC_NUMBER,
      toNumber: VIONA_INTERNAL_REAL_TWILIO_POC_FORCED_MAGIC_NUMBER,
      body: messageBody,
    });

    if (!result.ok) {
      const statusMap: Record<typeof result.reason, number> = {
        invalid_input: 400,
        request_not_found: 404,
      };
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid internal real Twilio POC request',
        request_not_found: 'Request not found',
      };
      jsonFail(res, msgMap[result.reason], statusMap[result.reason]);
      return;
    }

    jsonOk(res, {
      requestId: result.requestId,
      actionId: result.actionId,
      planAllowed: result.planAllowed,
      denialReason: result.denialReason,
      escrow: result.escrow,
      realProviderResult: result.realProviderResult,
      safety: VIONA_INTERNAL_REAL_TWILIO_POC_ROUTE_SAFETY,
    });
  } catch {
    jsonFail(res, 'Internal server error', 500);
  }
}
