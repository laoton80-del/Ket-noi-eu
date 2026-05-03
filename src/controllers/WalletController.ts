import type { Request, Response } from 'express';

import {
  getWalletBalanceByUserId,
  transferVIG,
  WalletServiceError,
} from '../services/WalletService';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

/**
 * Future: Stripe top-up webhook / fiat→VIG conversion
 *
 * WARNING: Ensure fiat-to-VIG conversion includes a 3.5% markup to cover payment gateway fees
 * to prevent platform deficit. Without this margin, card/network costs can exceed perceived revenue.
 */

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

export async function getBalance(req: Request, res: Response): Promise<void> {
  try {
    const userId = readAuthUserId(req);
    if (!userId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const row = await getWalletBalanceByUserId(userId);
    if (!row) {
      jsonFail(res, 'Wallet not found', 404);
      return;
    }

    jsonOk(res, {
      balanceVIG: row.balanceVIG,
      lockedBalanceVIG: row.lockedBalanceVIG,
      walletId: row.walletId,
    });
  } catch {
    jsonFail(res, 'Unexpected error', 500);
  }
}

export async function postTransfer(req: Request, res: Response): Promise<void> {
  try {
    const fromUserId = readAuthUserId(req);
    if (!fromUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const body: unknown = req.body;
    if (typeof body !== 'object' || body === null) {
      jsonFail(res, 'Invalid JSON body', 400);
      return;
    }

    const toUserId = readString((body as { toUserId?: unknown }).toUserId);
    const amountVIG = readFiniteNumber((body as { amountVIG?: unknown }).amountVIG);
    const feeRaw = (body as { feeVIG?: unknown }).feeVIG;

    let feeVIG: number | undefined;
    if (feeRaw !== undefined) {
      const parsed = readFiniteNumber(feeRaw);
      if (parsed === null || parsed < 0) {
        jsonFail(res, 'feeVIG must be a finite number >= 0 when provided', 400);
        return;
      }
      feeVIG = parsed;
    }

    if (!toUserId || amountVIG === null || amountVIG <= 0) {
      jsonFail(res, 'toUserId and positive amountVIG are required', 400);
      return;
    }

    if (amountVIG < 1.0) {
      jsonFail(res, 'Minimum transfer is 1.0 VIG', 400);
      return;
    }

    const out = await transferVIG({
      fromUserId,
      toUserId,
      amountVIG,
      feeVIG,
    });

    jsonOk(res, out);
  } catch (err: unknown) {
    if (err instanceof WalletServiceError) {
      const e = err;
      const map: Record<WalletServiceError['code'], { status: number; msg: string }> = {
        invalid_input: { status: 400, msg: e.message },
        invalid_amount: { status: 400, msg: e.message },
        self_transfer_not_allowed: { status: 400, msg: e.message },
        wallet_not_found: { status: 404, msg: e.message },
        insufficient_funds: { status: 409, msg: e.message },
        concurrency_conflict: { status: 409, msg: e.message },
      };
      const m = map[e.code];
      jsonFail(res, m.msg, m.status);
      return;
    }
    jsonFail(res, 'Unexpected error', 500);
  }
}
