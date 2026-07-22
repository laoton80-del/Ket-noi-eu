import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { LocalServiceRequestStatus } from '@prisma/client';

import {
  findDangerousLocalRequestCreateBodyKeys,
  parseBizType,
  parseIsoDate,
  parseLocalRequestSource,
  parseLocalServiceType,
  parseMetadataJson,
} from '../services/local/localRequestCreateValidation';
import { confirmMerchantLocalServiceRequest } from '../services/local/localMerchantRequestConfirmService';
import { rejectMerchantLocalServiceRequest } from '../services/local/localMerchantRequestRejectService';
import { cancelUserLocalServiceRequest } from '../services/local/localUserRequestCancelService';
import { cancelOpsLocalServiceRequest } from '../services/local/localOpsRequestCancelService';
import { readLocalRequestAuditEventsForOps } from '../services/local/localRequestAuditReadService';
import {
  getOpsLocalServiceRequestById,
  listOpsLocalServiceRequests,
} from '../services/local/localOpsRequestListService';
import { readLocalUserRequestTimeline } from '../services/local/localUserRequestTimelineService';
import { normalizeLocalOpsCancelReason } from '../services/local/localOpsRequestCancelPolicy';
import { createLocalServiceRequest } from '../services/local/localRequestCreateService';
import { listMerchantLocalServiceRequests } from '../services/local/localMerchantRequestInboxService';
import { listUserLocalServiceRequests } from '../services/local/localUserRequestListService';
import {
  localCreateInvalidInputFailure,
  mapLocalCreateDomainFailureToPublic,
} from '../domain/local/localCreateFailureCodes';
import { jsonFail, jsonLocalCreateFail, jsonOk } from '../utils/apiEnvelope';

function readAuthUserId(req: Request): string | null {
  const id = req.authUserId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function readLocalServiceRequestStatusQuery(raw: unknown): LocalServiceRequestStatus | undefined {
  if (typeof raw !== 'string' || raw.trim().length === 0) return undefined;
  const value = raw.trim().toUpperCase();
  if (value in LocalServiceRequestStatus) {
    return LocalServiceRequestStatus[value as keyof typeof LocalServiceRequestStatus];
  }
  return undefined;
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

/** `POST /api/local/merchant/requests/:id/confirm` — merchant ACK (no wallet side effects). */
export async function postConfirmMerchantLocalServiceRequest(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const merchantUserId = readAuthUserId(req);
    if (!merchantUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const requestId = readString(req.params.id);
    if (!requestId || requestId.trim().length === 0) {
      jsonFail(res, 'Request id is required', 400);
      return;
    }

    const result = await confirmMerchantLocalServiceRequest({
      merchantUserId,
      requestId: requestId.trim(),
    });

    if (!result.ok) {
      const statusMap: Record<typeof result.reason, number> = {
        invalid_input: 400,
        request_not_found: 404,
        invalid_status: 409,
        invalid_wallet_mode: 409,
        invalid_wallet_phase: 409,
      };
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid confirm request',
        request_not_found: 'Request not found',
        invalid_status: 'Request cannot be confirmed in its current status',
        invalid_wallet_mode: 'Confirm is not available for this wallet mode',
        invalid_wallet_phase: 'Confirm is not available while wallet phase is not NONE',
      };
      jsonFail(res, msgMap[result.reason], statusMap[result.reason]);
      return;
    }

    jsonOk(res, result.request, 200);
  } catch {
    jsonFail(res, 'Internal server error', 500);
  }
}

/** `POST /api/local/merchant/requests/:id/reject` — merchant decline (no wallet side effects). */
export async function postRejectMerchantLocalServiceRequest(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const merchantUserId = readAuthUserId(req);
    if (!merchantUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const requestId = readString(req.params.id);
    if (!requestId || requestId.trim().length === 0) {
      jsonFail(res, 'Request id is required', 400);
      return;
    }

    const result = await rejectMerchantLocalServiceRequest({
      merchantUserId,
      requestId: requestId.trim(),
    });

    if (!result.ok) {
      const statusMap: Record<typeof result.reason, number> = {
        invalid_input: 400,
        request_not_found: 404,
        invalid_status: 409,
        invalid_wallet_mode: 409,
        invalid_wallet_phase: 409,
      };
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid reject request',
        request_not_found: 'Request not found',
        invalid_status: 'Request cannot be rejected in its current status',
        invalid_wallet_mode: 'Reject is not available for this wallet mode',
        invalid_wallet_phase: 'Reject is not available while wallet phase is not NONE',
      };
      jsonFail(res, msgMap[result.reason], statusMap[result.reason]);
      return;
    }

    jsonOk(res, result.request, 200);
  } catch {
    jsonFail(res, 'Internal server error', 500);
  }
}

/** `POST /api/local/requests/:id/cancel` — requester cancel (no wallet side effects). */
export async function postCancelUserLocalServiceRequest(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const requesterUserId = readAuthUserId(req);
    if (!requesterUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const requestId = readString(req.params.id);
    if (!requestId || requestId.trim().length === 0) {
      jsonFail(res, 'Request id is required', 400);
      return;
    }

    const result = await cancelUserLocalServiceRequest({
      requesterUserId,
      requestId: requestId.trim(),
    });

    if (!result.ok) {
      const statusMap: Record<typeof result.reason, number> = {
        invalid_input: 400,
        request_not_found: 404,
        invalid_status: 409,
        invalid_wallet_mode: 409,
        invalid_wallet_phase: 409,
      };
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid cancel request',
        request_not_found: 'Request not found',
        invalid_status: 'Request cannot be cancelled in its current status',
        invalid_wallet_mode: 'Cancel is not available for this wallet mode',
        invalid_wallet_phase: 'Cancel is not available while wallet phase is not NONE',
      };
      jsonFail(res, msgMap[result.reason], statusMap[result.reason]);
      return;
    }

    jsonOk(res, result.request, 200);
  } catch {
    jsonFail(res, 'Internal server error', 500);
  }
}

/** `GET /api/local/requests` — requester read-only list of own Local requests. */
export async function getUserLocalServiceRequests(req: Request, res: Response): Promise<void> {
  try {
    const requesterUserId = readAuthUserId(req);
    if (!requesterUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const status = readLocalServiceRequestStatusQuery(req.query.status);
    if (req.query.status != null && status === undefined) {
      jsonFail(res, 'Invalid status filter', 400);
      return;
    }

    const data = await listUserLocalServiceRequests({
      requesterUserId,
      status,
      limit: readOptionalLimitQuery(req.query.limit),
      skip: readOptionalSkipQuery(req.query.skip),
    });

    jsonOk(res, data);
  } catch {
    jsonFail(res, 'Internal server error', 500);
  }
}

/** `GET /api/local/requests/:id/timeline` — requester read-only safe public timeline. */
export async function getUserLocalRequestTimeline(req: Request, res: Response): Promise<void> {
  try {
    const requesterUserId = readAuthUserId(req);
    if (!requesterUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const requestId = readString(req.params.id);
    if (!requestId || requestId.trim().length === 0) {
      jsonFail(res, 'Request id is required', 400);
      return;
    }

    const result = await readLocalUserRequestTimeline({
      requesterUserId,
      requestId: requestId.trim(),
    });

    if (!result.ok) {
      const statusMap: Record<typeof result.reason, number> = {
        invalid_input: 400,
        request_not_found: 404,
      };
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid timeline request',
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

/** `GET /api/local/ops/requests` — super-admin read-only paginated Local request audit list. */
export async function getOpsLocalServiceRequests(req: Request, res: Response): Promise<void> {
  try {
    const adminUserId = readAuthUserId(req);
    if (!adminUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const status = readLocalServiceRequestStatusQuery(req.query.status);
    if (req.query.status != null && status === undefined) {
      jsonFail(res, 'Invalid status filter', 400);
      return;
    }

    const businessIdRaw = readString(req.query.businessId);
    const businessId =
      businessIdRaw != null && businessIdRaw.trim().length > 0
        ? businessIdRaw.trim()
        : undefined;

    const result = await listOpsLocalServiceRequests({
      adminUserId,
      status,
      businessId,
      limit: readOptionalLimitQuery(req.query.limit),
      skip: readOptionalSkipQuery(req.query.skip),
    });

    if (!result.ok) {
      const statusMap: Record<typeof result.reason, number> = {
        invalid_input: 400,
        forbidden: 403,
      };
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid ops list request',
        forbidden: 'Forbidden: super-admin role required',
      };
      jsonFail(res, msgMap[result.reason], statusMap[result.reason]);
      return;
    }

    jsonOk(res, result.data, 200);
  } catch {
    jsonFail(res, 'Internal server error', 500);
  }
}

/** `GET /api/local/ops/requests/:id` — super-admin read-only Local request detail. */
export async function getOpsLocalServiceRequestDetail(req: Request, res: Response): Promise<void> {
  try {
    const adminUserId = readAuthUserId(req);
    if (!adminUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const requestId = readString(req.params.id);
    if (!requestId || requestId.trim().length === 0) {
      jsonFail(res, 'Request id is required', 400);
      return;
    }

    const result = await getOpsLocalServiceRequestById({
      adminUserId,
      requestId: requestId.trim(),
    });

    if (!result.ok) {
      const statusMap: Record<typeof result.reason, number> = {
        invalid_input: 400,
        forbidden: 403,
        request_not_found: 404,
      };
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid ops detail request',
        forbidden: 'Forbidden: super-admin role required',
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

/** `GET /api/local/ops/requests/:id/audit-events` — ops read-only audit trail (no mutations). */
export async function getOpsLocalRequestAuditEvents(req: Request, res: Response): Promise<void> {
  try {
    const adminUserId = readAuthUserId(req);
    if (!adminUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const requestId = readString(req.params.id);
    if (!requestId || requestId.trim().length === 0) {
      jsonFail(res, 'Request id is required', 400);
      return;
    }

    const result = await readLocalRequestAuditEventsForOps({
      adminUserId,
      requestId: requestId.trim(),
    });

    if (!result.ok) {
      const statusMap: Record<typeof result.reason, number> = {
        invalid_input: 400,
        forbidden: 403,
        request_not_found: 404,
      };
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid audit read request',
        forbidden: 'Forbidden: super-admin role required',
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

/** `POST /api/local/ops/requests/:id/cancel` — super-admin cancel (no wallet side effects). */
export async function postOpsCancelLocalServiceRequest(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const adminUserId = readAuthUserId(req);
    if (!adminUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const requestId = readString(req.params.id);
    if (!requestId || requestId.trim().length === 0) {
      jsonFail(res, 'Request id is required', 400);
      return;
    }

    const body: unknown = req.body;
    const cancelReasonRaw =
      typeof body === 'object' && body !== null
        ? readString((body as { cancelReason?: unknown }).cancelReason)
        : null;

    const reasonCheck = normalizeLocalOpsCancelReason(cancelReasonRaw ?? undefined);
    if (typeof reasonCheck !== 'string') {
      jsonFail(res, reasonCheck.message, 400);
      return;
    }

    const result = await cancelOpsLocalServiceRequest({
      adminUserId,
      requestId: requestId.trim(),
      cancelReason: reasonCheck,
    });

    if (!result.ok) {
      const statusMap: Record<typeof result.reason, number> = {
        invalid_input: 400,
        request_not_found: 404,
        forbidden: 403,
        invalid_status: 409,
        invalid_wallet_mode: 409,
        invalid_wallet_phase: 409,
      };
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid ops cancel request',
        request_not_found: 'Request not found',
        forbidden: 'Forbidden: super-admin role required',
        invalid_status: 'Request cannot be ops-cancelled in its current status',
        invalid_wallet_mode: 'Ops cancel is not available for this wallet mode',
        invalid_wallet_phase: 'Ops cancel is not available while wallet phase is not NONE',
      };
      jsonFail(res, msgMap[result.reason], statusMap[result.reason]);
      return;
    }

    jsonOk(res, result.request, 200);
  } catch {
    jsonFail(res, 'Internal server error', 500);
  }
}

/** `GET /api/local/merchant/requests` — read-only inbox for business owner. */
export async function getMerchantLocalServiceRequests(req: Request, res: Response): Promise<void> {
  try {
    const merchantUserId = readAuthUserId(req);
    if (!merchantUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const status = readLocalServiceRequestStatusQuery(req.query.status);
    if (req.query.status != null && status === undefined) {
      jsonFail(res, 'Invalid status filter', 400);
      return;
    }

    const businessIdRaw = readString(req.query.businessId);
    const businessId =
      businessIdRaw != null && businessIdRaw.trim().length > 0
        ? businessIdRaw.trim()
        : undefined;

    const data = await listMerchantLocalServiceRequests({
      merchantUserId,
      status,
      businessId,
      limit: readOptionalLimitQuery(req.query.limit),
      skip: readOptionalSkipQuery(req.query.skip),
    });

    jsonOk(res, data);
  } catch {
    jsonFail(res, 'Internal server error', 500);
  }
}

export async function postCreateLocalServiceRequest(req: Request, res: Response): Promise<void> {
  try {
    const requesterUserId = readAuthUserId(req);
    if (!requesterUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const body: unknown = req.body;
    if (typeof body !== 'object' || body === null) {
      const fail = localCreateInvalidInputFailure('Invalid JSON body');
      jsonLocalCreateFail(res, fail.status, fail.code, fail.error);
      return;
    }

    const dangerousKeys = findDangerousLocalRequestCreateBodyKeys(body);
    if (dangerousKeys.length > 0) {
      const fail = localCreateInvalidInputFailure(
        `Request-only create does not accept: ${dangerousKeys.join(', ')}`
      );
      jsonLocalCreateFail(res, fail.status, fail.code, fail.error);
      return;
    }

    const businessId = readString((body as { businessId?: unknown }).businessId);
    const serviceType = parseLocalServiceType((body as { serviceType?: unknown }).serviceType);
    const title = readString((body as { title?: unknown }).title);
    const source = parseLocalRequestSource((body as { source?: unknown }).source);

    if (!businessId || !serviceType || !title || title.trim().length === 0) {
      const fail = localCreateInvalidInputFailure(
        'businessId, serviceType, and title are required'
      );
      jsonLocalCreateFail(res, fail.status, fail.code, fail.error);
      return;
    }

    if (source == null) {
      const fail = localCreateInvalidInputFailure('Invalid source');
      jsonLocalCreateFail(res, fail.status, fail.code, fail.error);
      return;
    }

    const category = parseBizType((body as { category?: unknown }).category);
    if (category === null) {
      const fail = localCreateInvalidInputFailure('Invalid category');
      jsonLocalCreateFail(res, fail.status, fail.code, fail.error);
      return;
    }

    const metadata = parseMetadataJson((body as { metadata?: unknown }).metadata);
    if (metadata === null) {
      const fail = localCreateInvalidInputFailure('metadata must be a JSON object');
      jsonLocalCreateFail(res, fail.status, fail.code, fail.error);
      return;
    }

    const scheduledStartAt = parseIsoDate((body as { scheduledStartAt?: unknown }).scheduledStartAt);
    if (scheduledStartAt === null) {
      const fail = localCreateInvalidInputFailure(
        'scheduledStartAt must be a valid ISO-8601 instant'
      );
      jsonLocalCreateFail(res, fail.status, fail.code, fail.error);
      return;
    }

    const scheduledEndAt = parseIsoDate((body as { scheduledEndAt?: unknown }).scheduledEndAt);
    if (scheduledEndAt === null) {
      const fail = localCreateInvalidInputFailure(
        'scheduledEndAt must be a valid ISO-8601 instant'
      );
      jsonLocalCreateFail(res, fail.status, fail.code, fail.error);
      return;
    }

    const serviceIdRaw = readString((body as { serviceId?: unknown }).serviceId);
    const serviceId =
      serviceIdRaw != null && serviceIdRaw.trim().length > 0 ? serviceIdRaw.trim() : undefined;

    const result = await createLocalServiceRequest({
      requesterUserId,
      businessId: businessId.trim(),
      serviceType,
      title: title.trim(),
      source,
      ...(serviceId ? { serviceId } : {}),
      ...(readString((body as { fixerProfileKey?: unknown }).fixerProfileKey)?.trim()
        ? {
            fixerProfileKey: readString(
              (body as { fixerProfileKey?: unknown }).fixerProfileKey
            )!.trim(),
          }
        : {}),
      ...(category != null ? { category } : {}),
      ...(readString((body as { description?: unknown }).description)?.trim()
        ? { description: readString((body as { description?: unknown }).description)!.trim() }
        : {}),
      ...(readString((body as { locationText?: unknown }).locationText)?.trim()
        ? { locationText: readString((body as { locationText?: unknown }).locationText)!.trim() }
        : {}),
      ...(readString((body as { city?: unknown }).city)?.trim()
        ? { city: readString((body as { city?: unknown }).city)!.trim() }
        : {}),
      ...(readString((body as { countryCode?: unknown }).countryCode)?.trim()
        ? {
            countryCode: readString((body as { countryCode?: unknown }).countryCode)!.trim(),
          }
        : {}),
      ...(scheduledStartAt != null ? { scheduledStartAt } : {}),
      ...(scheduledEndAt != null ? { scheduledEndAt } : {}),
      ...(metadata != null ? { metadata: metadata as Prisma.InputJsonValue } : {}),
    });

    if (!result.ok) {
      const fail = mapLocalCreateDomainFailureToPublic(result.reason);
      jsonLocalCreateFail(res, fail.status, fail.code, fail.error);
      return;
    }

    jsonOk(res, result.request, 201);
  } catch {
    jsonFail(res, 'Internal server error', 500);
  }
}
