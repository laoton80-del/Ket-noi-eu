/**
 * Pack A2 — Local provider eligibility B2C read + Role.ADMIN ops controllers.
 */
import type { Request, Response } from 'express';

import { listSelectableLocalProviders } from '../services/local/localProviderEligibilityListService';
import {
  activateLocalProviderEligibility,
  patchLocalProviderEligibility,
  registerLocalProviderEligibility,
  retireLocalProviderEligibility,
  suspendLocalProviderEligibility,
} from '../services/local/localProviderEligibilityOpsService';
import {
  validateLocalProviderListQuery,
  validatePatchLocalProviderBody,
  validateRegisterLocalProviderBody,
  validateTransitionReasonBody,
} from '../services/local/localProviderEligibilityValidation';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

function readAuthUserId(req: Request): string | null {
  const id = req.authUserId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function readBusinessIdParam(req: Request): string | null {
  const id = req.params.businessId;
  return typeof id === 'string' && id.trim().length > 0 ? id.trim() : null;
}

/** GET /api/local/providers — authenticated B2C selectable provider list. */
export async function getLocalProviders(req: Request, res: Response): Promise<void> {
  try {
    if (!readAuthUserId(req)) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const query = validateLocalProviderListQuery(req.query);
    if (!query.ok) {
      jsonFail(res, 'Invalid provider list query', 400);
      return;
    }

    const data = await listSelectableLocalProviders({
      limit: query.limit,
      skip: query.skip,
      ...(query.serviceType ? { serviceType: query.serviceType } : {}),
    });
    jsonOk(res, data, 200);
  } catch (err) {
    console.error('[getLocalProviders]', err);
    jsonFail(res, 'Internal server error', 500);
  }
}

/** POST /api/local/ops/providers — register eligibility (Role.ADMIN). */
export async function postRegisterLocalProvider(req: Request, res: Response): Promise<void> {
  try {
    const actorUserId = readAuthUserId(req);
    if (!actorUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const body = validateRegisterLocalProviderBody(req.body);
    if (!body.ok) {
      jsonFail(res, 'Invalid provider registration body', 400);
      return;
    }

    const result = await registerLocalProviderEligibility({
      actorUserId,
      businessId: body.businessId,
      supportedServiceTypes: body.supportedServiceTypes,
      publicB2cVisible: body.publicB2cVisible,
    });

    if (!result.ok) {
      const statusMap = {
        invalid_input: 400,
        forbidden: 403,
        business_not_found: 404,
      } as const;
      const messageMap = {
        invalid_input: 'Invalid provider registration',
        forbidden: 'Forbidden',
        business_not_found: 'Business not found',
      } as const;
      jsonFail(res, messageMap[result.reason], statusMap[result.reason]);
      return;
    }

    jsonOk(res, { provider: result.provider }, result.created ? 201 : 200);
  } catch (err) {
    console.error('[postRegisterLocalProvider]', err);
    jsonFail(res, 'Internal server error', 500);
  }
}

/** PATCH /api/local/ops/providers/:businessId */
export async function patchLocalProvider(req: Request, res: Response): Promise<void> {
  try {
    const actorUserId = readAuthUserId(req);
    if (!actorUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const businessId = readBusinessIdParam(req);
    if (!businessId) {
      jsonFail(res, 'Business id is required', 400);
      return;
    }

    const body = validatePatchLocalProviderBody(req.body);
    if (!body.ok) {
      jsonFail(res, 'Invalid provider configuration body', 400);
      return;
    }

    const result = await patchLocalProviderEligibility({
      actorUserId,
      businessId,
      ...(body.supportedServiceTypes !== undefined
        ? { supportedServiceTypes: body.supportedServiceTypes }
        : {}),
      ...(body.publicB2cVisible !== undefined
        ? { publicB2cVisible: body.publicB2cVisible }
        : {}),
    });

    if (!result.ok) {
      const statusMap = {
        invalid_input: 400,
        forbidden: 403,
        not_found: 404,
        conflict: 409,
      } as const;
      const messageMap = {
        invalid_input: 'Invalid provider configuration',
        forbidden: 'Forbidden',
        not_found: 'Provider eligibility not found',
        conflict: 'Provider configuration conflict',
      } as const;
      jsonFail(res, messageMap[result.reason], statusMap[result.reason]);
      return;
    }

    jsonOk(res, { provider: result.provider }, 200);
  } catch (err) {
    console.error('[patchLocalProvider]', err);
    jsonFail(res, 'Internal server error', 500);
  }
}

/** POST /api/local/ops/providers/:businessId/activate */
export async function postActivateLocalProvider(req: Request, res: Response): Promise<void> {
  try {
    const actorUserId = readAuthUserId(req);
    if (!actorUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const businessId = readBusinessIdParam(req);
    if (!businessId) {
      jsonFail(res, 'Business id is required', 400);
      return;
    }

    if (req.body != null && typeof req.body === 'object' && Object.keys(req.body as object).length > 0) {
      jsonFail(res, 'Activate does not accept a body', 400);
      return;
    }

    const result = await activateLocalProviderEligibility({ actorUserId, businessId });
    if (!result.ok) {
      const statusMap = {
        invalid_input: 400,
        forbidden: 403,
        not_found: 404,
        conflict: 409,
      } as const;
      const messageMap = {
        invalid_input: 'Invalid activate request',
        forbidden: 'Forbidden',
        not_found: 'Provider eligibility not found',
        conflict: 'Invalid provider transition',
      } as const;
      jsonFail(res, messageMap[result.reason], statusMap[result.reason]);
      return;
    }

    jsonOk(res, { provider: result.provider }, 200);
  } catch (err) {
    console.error('[postActivateLocalProvider]', err);
    jsonFail(res, 'Internal server error', 500);
  }
}

async function postTransitionWithOptionalReason(
  req: Request,
  res: Response,
  kind: 'suspend' | 'retire'
): Promise<void> {
  const actorUserId = readAuthUserId(req);
  if (!actorUserId) {
    jsonFail(res, 'Unauthorized', 401);
    return;
  }

  const businessId = readBusinessIdParam(req);
  if (!businessId) {
    jsonFail(res, 'Business id is required', 400);
    return;
  }

  const body = validateTransitionReasonBody(req.body);
  if (!body.ok) {
    jsonFail(res, `Invalid ${kind} body`, 400);
    return;
  }

  const result =
    kind === 'suspend'
      ? await suspendLocalProviderEligibility({
          actorUserId,
          businessId,
          reason: body.reason,
        })
      : await retireLocalProviderEligibility({
          actorUserId,
          businessId,
          reason: body.reason,
        });

  if (!result.ok) {
    const statusMap = {
      invalid_input: 400,
      forbidden: 403,
      not_found: 404,
      conflict: 409,
    } as const;
    const messageMap = {
      invalid_input: `Invalid ${kind} request`,
      forbidden: 'Forbidden',
      not_found: 'Provider eligibility not found',
      conflict: 'Invalid provider transition',
    } as const;
    jsonFail(res, messageMap[result.reason], statusMap[result.reason]);
    return;
  }

  jsonOk(res, { provider: result.provider }, 200);
}

/** POST /api/local/ops/providers/:businessId/suspend */
export async function postSuspendLocalProvider(req: Request, res: Response): Promise<void> {
  try {
    await postTransitionWithOptionalReason(req, res, 'suspend');
  } catch (err) {
    console.error('[postSuspendLocalProvider]', err);
    jsonFail(res, 'Internal server error', 500);
  }
}

/** POST /api/local/ops/providers/:businessId/retire */
export async function postRetireLocalProvider(req: Request, res: Response): Promise<void> {
  try {
    await postTransitionWithOptionalReason(req, res, 'retire');
  } catch (err) {
    console.error('[postRetireLocalProvider]', err);
    jsonFail(res, 'Internal server error', 500);
  }
}
