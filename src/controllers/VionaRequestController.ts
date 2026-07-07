import type { Request, Response } from 'express';

import {
  createVionaRequest,
  screenCreateVionaRequestRawBody,
} from '../services/viona/vionaRequestCreateService';
import { appendVionaRequestNote } from '../services/viona/vionaRequestNoteActionService';
import { transitionVionaRequestStatus } from '../services/viona/vionaRequestStatusActionService';
import {
  getVionaRequestById,
  listVionaRequests,
} from '../services/viona/vionaRequestReadService';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

function readAuthUserId(req: Request): string | null {
  const id = req.authUserId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function readOptionalTrimmedQuery(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readOptionalLimitQuery(raw: unknown): number | undefined {
  if (raw == null) return undefined;
  const n = typeof raw === 'string' ? Number(raw) : typeof raw === 'number' ? raw : NaN;
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return undefined;
  return n;
}

function readOptionalTrimmedBody(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readRequiredNoteBody(body: unknown): string | null {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }
  const record = body as Record<string, unknown>;
  const raw = record.note ?? record.noteText;
  return typeof raw === 'string' ? raw : null;
}

function readRequiredTargetStatusBody(body: unknown): string | null {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }
  const raw = (body as Record<string, unknown>).targetStatus;
  return typeof raw === 'string' ? raw : null;
}
function readOptionalSkipQuery(raw: unknown): number | undefined {
  if (raw == null) return undefined;
  const n = typeof raw === 'string' ? Number(raw) : typeof raw === 'number' ? raw : NaN;
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return undefined;
  return n;
}

function readOptionalIsoDateQuery(raw: unknown): Date | undefined {
  if (typeof raw !== 'string' || raw.trim().length === 0) return undefined;
  const parsed = Date.parse(raw.trim());
  if (Number.isNaN(parsed)) return undefined;
  return new Date(parsed);
}

/** `GET /api/viona/requests` — authenticated read-only list of visible Viona requests. */
export async function getVionaRequests(req: Request, res: Response): Promise<void> {
  try {
    const authUserId = readAuthUserId(req);
    if (!authUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const createdFrom = readOptionalIsoDateQuery(req.query.createdFrom);
    if (req.query.createdFrom != null && createdFrom === undefined) {
      jsonFail(res, 'Invalid createdFrom filter', 400);
      return;
    }

    const createdTo = readOptionalIsoDateQuery(req.query.createdTo);
    if (req.query.createdTo != null && createdTo === undefined) {
      jsonFail(res, 'Invalid createdTo filter', 400);
      return;
    }

    const data = await listVionaRequests({
      authUserId,
      status: readOptionalTrimmedQuery(req.query.status),
      universe: readOptionalTrimmedQuery(req.query.universe),
      createdFrom,
      createdTo,
      limit: readOptionalLimitQuery(req.query.limit),
      skip: readOptionalSkipQuery(req.query.skip),
    });

    jsonOk(res, data, 200);
  } catch {
    jsonFail(res, 'Internal server error', 500);
  }
}

function readRequiredStringBody(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readOptionalStringBody(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readStringArrayBody(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/**
 * `POST /api/viona/requests` — Pack19 R1 bounded create-submit path.
 * Creates exactly one VionaRequest row with initial status `submitted`. No status transition,
 * no note/execution/payment/booking/SOS/AI/merchant/notification/external side effect.
 * Requires auth and the exact Pack19 staging safety labels. Staging-testable only; not production-ready.
 */
export async function postCreateVionaRequest(req: Request, res: Response): Promise<void> {
  try {
    const authUserId = readAuthUserId(req);
    if (!authUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const screenReason = screenCreateVionaRequestRawBody(req.body);
    if (screenReason != null) {
      const screenMsgMap: Record<typeof screenReason, string> = {
        invalid_input: 'Invalid create request',
        unsafe_content: 'Invalid create content',
        unsafe_request_type: 'Unsupported request type',
        unsafe_universe: 'Unsupported source universe',
        missing_safety_labels: 'Required safety labels missing',
        forbidden_labels: 'Forbidden safety labels',
        forbidden_side_effect: 'Side-effect fields are not allowed on create',
        bulk_forbidden: 'Bulk creation is not allowed',
      };
      jsonFail(res, screenMsgMap[screenReason], 400);
      return;
    }

    const body = req.body as Record<string, unknown>;

    const result = await createVionaRequest({
      authUserId,
      tenantId: readRequiredStringBody(body.tenantId),
      sourceUniverse: readRequiredStringBody(body.sourceUniverse),
      requestType: readRequiredStringBody(body.requestType),
      title: readRequiredStringBody(body.title),
      summary: readOptionalStringBody(body.summary),
      locale: readOptionalStringBody(body.locale),
      countryCode: readOptionalStringBody(body.countryCode),
      sourceFeature: readOptionalStringBody(body.sourceFeature),
      safetyLabels: readStringArrayBody(body.safetyLabels),
      idempotencyKey: readOptionalTrimmedBody(body.idempotencyKey),
      clientCorrelationId: readOptionalTrimmedBody(body.clientCorrelationId),
    });

    if (!result.ok) {
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid create request',
        unsafe_content: 'Invalid create content',
        unsafe_request_type: 'Unsupported request type',
        unsafe_universe: 'Unsupported source universe',
        missing_safety_labels: 'Required safety labels missing',
        forbidden_labels: 'Forbidden safety labels',
        forbidden_side_effect: 'Side-effect fields are not allowed on create',
        bulk_forbidden: 'Bulk creation is not allowed',
      };
      jsonFail(res, msgMap[result.reason], 400);
      return;
    }

    jsonOk(
      res,
      {
        ...result.data,
        action: result.action,
        safety: result.safety,
      },
      result.action.idempotentReplay ? 200 : 201
    );
  } catch {
    jsonFail(res, 'Internal server error', 500);
  }
}

/** `GET /api/viona/requests/:id` — authenticated read-only Viona request detail. */
export async function getVionaRequestDetail(req: Request, res: Response): Promise<void> {
  try {
    const authUserId = readAuthUserId(req);
    if (!authUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const requestId = readString(req.params.id);
    if (!requestId || requestId.trim().length === 0) {
      jsonFail(res, 'Request id is required', 400);
      return;
    }

    const result = await getVionaRequestById({
      authUserId,
      requestId: requestId.trim(),
    });

    if (!result.ok) {
      const statusMap: Record<typeof result.reason, number> = {
        invalid_input: 400,
        request_not_found: 404,
      };
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid request',
        request_not_found: 'Request not found',
      };
      jsonFail(res, msgMap[result.reason], statusMap[result.reason]);
      return;
    }

    jsonOk(res, result.data, 200);
  } catch {
    jsonFail(res, 'Internal server error', 500);
  }
}

/** `POST /api/viona/requests/:id/actions/note` — append note audit event only (no status change). */
export async function postVionaRequestNoteAction(req: Request, res: Response): Promise<void> {
  try {
    const authUserId = readAuthUserId(req);
    if (!authUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const requestId = readString(req.params.id);
    if (!requestId || requestId.trim().length === 0) {
      jsonFail(res, 'Request id is required', 400);
      return;
    }

    const note = readRequiredNoteBody(req.body);
    if (note == null) {
      jsonFail(res, 'Note is required', 400);
      return;
    }

    const body =
      req.body != null && typeof req.body === 'object' && !Array.isArray(req.body)
        ? (req.body as Record<string, unknown>)
        : {};

    const result = await appendVionaRequestNote({
      authUserId,
      requestId: requestId.trim(),
      note,
      idempotencyKey: readOptionalTrimmedBody(body.idempotencyKey),
      clientCorrelationId: readOptionalTrimmedBody(body.clientCorrelationId),
    });

    if (!result.ok) {
      const statusMap: Record<typeof result.reason, number> = {
        invalid_input: 400,
        request_not_found: 404,
        unsafe_note: 400,
      };
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid note request',
        request_not_found: 'Request not found',
        unsafe_note: 'Invalid note content',
      };
      jsonFail(res, msgMap[result.reason], statusMap[result.reason]);
      return;
    }

    jsonOk(
      res,
      {
        ...result.data,
        action: result.action,
        safety: result.safety,
      },
      result.action.idempotentReplay ? 200 : 201
    );
  } catch {
    jsonFail(res, 'Internal server error', 500);
  }
}

/** `POST /api/viona/requests/:id/actions/status` — narrow owner-only status transition (Pack25). */
export async function postVionaRequestStatusAction(req: Request, res: Response): Promise<void> {
  try {
    const authUserId = readAuthUserId(req);
    if (!authUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const requestId = readString(req.params.id);
    if (!requestId || requestId.trim().length === 0) {
      jsonFail(res, 'Request id is required', 400);
      return;
    }

    const targetStatus = readRequiredTargetStatusBody(req.body);
    if (targetStatus == null) {
      jsonFail(res, 'targetStatus is required', 400);
      return;
    }

    const body =
      req.body != null && typeof req.body === 'object' && !Array.isArray(req.body)
        ? (req.body as Record<string, unknown>)
        : {};

    const result = await transitionVionaRequestStatus({
      authUserId,
      requestId: requestId.trim(),
      targetStatus,
      reason: typeof body.reason === 'string' ? body.reason : undefined,
      note: typeof body.note === 'string' ? body.note : undefined,
      idempotencyKey: readOptionalTrimmedBody(body.idempotencyKey),
      clientCorrelationId: readOptionalTrimmedBody(body.clientCorrelationId),
    });

    if (!result.ok) {
      const statusMap: Record<typeof result.reason, number> = {
        invalid_input: 400,
        request_not_found: 404,
        invalid_transition: 400,
        unsafe_content: 400,
      };
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid status request',
        request_not_found: 'Request not found',
        invalid_transition: 'Invalid status transition',
        unsafe_content: 'Invalid status content',
      };
      jsonFail(res, msgMap[result.reason], statusMap[result.reason]);
      return;
    }

    jsonOk(
      res,
      {
        ...result.data,
        action: result.action,
        safety: result.safety,
      },
      result.action.idempotentReplay ? 200 : 201
    );
  } catch {
    jsonFail(res, 'Internal server error', 500);
  }
}
