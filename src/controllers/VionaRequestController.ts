import type { Request, Response } from 'express';

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
