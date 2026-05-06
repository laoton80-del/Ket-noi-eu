import { BizType } from '@prisma/client';

import type { Request, Response } from 'express';

import {
  BrokerServiceError,
  getBrokerCommissionsSummary,
  registerBrokerMerchantBusiness,
} from '../services/b2b/BrokerService';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

function readAuthUserId(req: Request): string | null {
  const id = req.authUserId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function readFiniteNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

function parseBizType(raw: unknown): BizType | null {
  if (typeof raw !== 'string') return null;
  const allowed = Object.values(BizType) as string[];
  return allowed.includes(raw) ? (raw as BizType) : null;
}

export async function postRegisterBusiness(req: Request, res: Response): Promise<void> {
  try {
    const brokerUserId = readAuthUserId(req);
    if (!brokerUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const body: unknown = req.body;
    if (typeof body !== 'object' || body === null) {
      jsonFail(res, 'Invalid JSON body', 400);
      return;
    }

    const ownerUserId = readString((body as { ownerUserId?: unknown }).ownerUserId);
    const name = readString((body as { name?: unknown }).name);
    const category = parseBizType((body as { category?: unknown }).category);
    const locationLat = readFiniteNumber((body as { locationLat?: unknown }).locationLat);
    const locationLng = readFiniteNumber((body as { locationLng?: unknown }).locationLng);
    const descriptionRaw = readString((body as { description?: unknown }).description);

    if (!ownerUserId || !name || !category || locationLat === null || locationLng === null) {
      jsonFail(
        res,
        'ownerUserId, name, category (BizType), locationLat, and locationLng are required.',
        400
      );
      return;
    }

    try {
      const result = await registerBrokerMerchantBusiness({
        brokerUserId,
        ownerUserId,
        name,
        category,
        locationLat,
        locationLng,
        description: descriptionRaw ?? undefined,
      });
      jsonOk(res, result, 201);
    } catch (e) {
      if (e instanceof BrokerServiceError) {
        const status: Record<BrokerServiceError['code'], number> = {
          invalid_input: 400,
          forbidden: 403,
          owner_not_found: 404,
          owner_invalid_role: 400,
        };
        jsonFail(res, e.message, status[e.code]);
        return;
      }
      throw e;
    }
  } catch {
    jsonFail(res, 'Unexpected error', 500);
  }
}

export async function getCommissions(req: Request, res: Response): Promise<void> {
  try {
    const brokerUserId = readAuthUserId(req);
    if (!brokerUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    try {
      const data = await getBrokerCommissionsSummary(brokerUserId);
      jsonOk(res, data);
    } catch (e) {
      if (e instanceof BrokerServiceError && e.code === 'invalid_input') {
        jsonFail(res, e.message, 400);
        return;
      }
      throw e;
    }
  } catch {
    jsonFail(res, 'Unexpected error', 500);
  }
}
