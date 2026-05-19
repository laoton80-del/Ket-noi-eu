import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';

import {
  findDangerousLocalRequestCreateBodyKeys,
  parseBizType,
  parseIsoDate,
  parseLocalRequestSource,
  parseLocalServiceType,
  parseMetadataJson,
} from '../services/local/localRequestCreateValidation';
import { createLocalServiceRequest } from '../services/local/localRequestCreateService';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

function readAuthUserId(req: Request): string | null {
  const id = req.authUserId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
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
      jsonFail(res, 'Invalid JSON body', 400);
      return;
    }

    const dangerousKeys = findDangerousLocalRequestCreateBodyKeys(body);
    if (dangerousKeys.length > 0) {
      jsonFail(
        res,
        `Request-only create does not accept: ${dangerousKeys.join(', ')}`,
        400
      );
      return;
    }

    const businessId = readString((body as { businessId?: unknown }).businessId);
    const serviceType = parseLocalServiceType((body as { serviceType?: unknown }).serviceType);
    const title = readString((body as { title?: unknown }).title);
    const source = parseLocalRequestSource((body as { source?: unknown }).source);

    if (!businessId || !serviceType || !title || title.trim().length === 0) {
      jsonFail(res, 'businessId, serviceType, and title are required', 400);
      return;
    }

    if (source == null) {
      jsonFail(res, 'Invalid source', 400);
      return;
    }

    const category = parseBizType((body as { category?: unknown }).category);
    if (category === null) {
      jsonFail(res, 'Invalid category', 400);
      return;
    }

    const metadata = parseMetadataJson((body as { metadata?: unknown }).metadata);
    if (metadata === null) {
      jsonFail(res, 'metadata must be a JSON object', 400);
      return;
    }

    const scheduledStartAt = parseIsoDate((body as { scheduledStartAt?: unknown }).scheduledStartAt);
    if (scheduledStartAt === null) {
      jsonFail(res, 'scheduledStartAt must be a valid ISO-8601 instant', 400);
      return;
    }

    const scheduledEndAt = parseIsoDate((body as { scheduledEndAt?: unknown }).scheduledEndAt);
    if (scheduledEndAt === null) {
      jsonFail(res, 'scheduledEndAt must be a valid ISO-8601 instant', 400);
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
      const statusMap: Record<typeof result.reason, number> = {
        invalid_input: 400,
        business_not_found: 404,
        service_not_found: 404,
        service_business_mismatch: 400,
        self_request_forbidden: 400,
      };
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid local request',
        business_not_found: 'Business not found',
        service_not_found: 'Service not found',
        service_business_mismatch: 'Service does not belong to the given business',
        self_request_forbidden: 'Self-request is prohibited for integrity reasons.',
      };
      jsonFail(res, msgMap[result.reason], statusMap[result.reason]);
      return;
    }

    jsonOk(res, result.request, 201);
  } catch {
    jsonFail(res, 'Internal server error', 500);
  }
}
