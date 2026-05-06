import type { Request, Response } from 'express';
import { Role, TxType } from '@prisma/client';

import { GLOBAL_MAX_LIST_ITEMS } from '../constants/globalPerformance';
import { getPrisma } from '../lib/prisma';
import { fetchEurVndSpot } from '../services/payment/VigVndFxService';
import { generateMerchantVietQrPng } from '../services/payment/VietQRService';
import {
  QrMerchantPaymentError,
  routeVigQrMerchantPaymentInternal,
} from '../services/payment/WalletService';
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

function normalizePhone(raw: string): string {
  return raw.trim().replace(/\s+/g, '');
}

/**
 * POST `/api/pay/qr-merchant` — tourist (JWT) pays a KYC-approved `B2B_VN` merchant; platform fee → treasury.
 */
export async function postQrMerchant(req: Request, res: Response): Promise<void> {
  try {
    const payerUserId = readAuthUserId(req);
    if (!payerUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const body: unknown = req.body;
    if (typeof body !== 'object' || body === null) {
      jsonFail(res, 'Invalid JSON body', 400);
      return;
    }

    const merchantUserIdRaw = readString((body as { merchantUserId?: unknown }).merchantUserId);
    const merchantPhoneRaw = readString((body as { merchantPhone?: unknown }).merchantPhone);
    const amountVIG = readFiniteNumber((body as { amountVIG?: unknown }).amountVIG);
    const feePercentRaw = (body as { feePercent?: unknown }).feePercent;
    const feePercent = feePercentRaw === undefined ? undefined : readFiniteNumber(feePercentRaw);

    if (amountVIG === null || amountVIG <= 0) {
      jsonFail(res, 'amountVIG must be a positive number', 400);
      return;
    }

    let merchantUserId = merchantUserIdRaw?.trim() ?? '';
    if (merchantUserId.length === 0 && merchantPhoneRaw) {
      const phone = normalizePhone(merchantPhoneRaw);
      if (phone.length < 8) {
        jsonFail(res, 'merchantPhone is invalid', 400);
        return;
      }
      const row = await getPrisma().user.findUnique({ where: { phoneNumber: phone } });
      if (!row) {
        jsonFail(res, 'Merchant not found for phone', 404);
        return;
      }
      merchantUserId = row.id;
    }

    if (merchantUserId.length === 0) {
      jsonFail(res, 'merchantUserId or merchantPhone is required', 400);
      return;
    }

    const out = await routeVigQrMerchantPaymentInternal({
      payerUserId,
      merchantUserId,
      grossAmountVIG: amountVIG,
      feePercent: feePercent ?? undefined,
    });

    jsonOk(res, out);
  } catch (err: unknown) {
    if (err instanceof QrMerchantPaymentError) {
      const e = err;
      const map: Record<QrMerchantPaymentError['code'], { status: number; msg: string }> = {
        invalid_input: { status: 400, msg: e.message },
        invalid_amount: { status: 400, msg: e.message },
        merchant_not_found: { status: 404, msg: e.message },
        merchant_not_eligible: { status: 403, msg: e.message },
        treasury_not_configured: { status: 500, msg: e.message },
        treasury_wallet_missing: { status: 500, msg: e.message },
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

/**
 * GET `/api/pay/merchant-ledger` — incoming QR_MERCHANT credits for the authenticated VN merchant.
 */
/**
 * GET `/api/pay/viet-qr?amountVig=100` — B2B_VN merchant: offline VietQR (local bank) for cash / Napas apps (no Stripe).
 */
export async function getMerchantVietQr(req: Request, res: Response): Promise<void> {
  try {
    const userId = readAuthUserId(req);
    if (!userId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const user = await getPrisma().user.findUnique({ where: { id: userId } });
    if (!user || user.role !== Role.B2B_VN) {
      jsonFail(res, 'VietQR is only available for Vietnam merchant (B2B_VN) accounts', 403);
      return;
    }

    const raw = req.query.amountVig;
    const amountVig =
      typeof raw === 'string' && raw.trim().length > 0
        ? Number(raw)
        : typeof raw === 'number'
          ? raw
          : NaN;
    if (!Number.isFinite(amountVig) || amountVig <= 0) {
      jsonFail(res, 'Query amountVig must be a positive number', 400);
      return;
    }

    const business = await getPrisma().business.findFirst({
      where: { ownerId: userId },
      orderBy: { joinedAt: 'asc' },
    });
    const bin = business?.vietQrBankBin?.trim() ?? '';
    const acct = business?.vietQrAccountNumber?.trim() ?? '';
    if (bin.length !== 6 || acct.length < 4) {
      jsonFail(
        res,
        'Set vietQrBankBin (6 digits) and vietQrAccountNumber on your business profile to generate VietQR.',
        400
      );
      return;
    }

    const fx = await fetchEurVndSpot();
    const purpose = business?.name ? `ViGlobal ${business.name}`.slice(0, 120) : 'ViGlobal';
    const qr = await generateMerchantVietQrPng({
      bank: {
        bankBin: bin,
        accountNumber: acct,
        accountName: business?.vietQrAccountName?.trim() || undefined,
      },
      vigAmount: amountVig,
      eurVndRate: fx.eurVnd,
      purpose,
    });

    jsonOk(res, {
      pngDataUrl: qr.pngDataUrl,
      emvPayload: qr.emvPayload,
      amountVnd: qr.amountVnd,
      purpose: qr.purpose,
      vigAmount: amountVig,
      fx: { eurVnd: fx.eurVnd, asOfIso: fx.asOfIso, source: fx.source },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'vietqr_error';
    if (msg.includes('vietqr_')) {
      jsonFail(res, 'Invalid VietQR parameters', 400);
      return;
    }
    jsonFail(res, 'Unexpected error', 500);
  }
}

export async function getMerchantLedger(req: Request, res: Response): Promise<void> {
  try {
    const userId = readAuthUserId(req);
    if (!userId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const user = await getPrisma().user.findUnique({ where: { id: userId } });
    if (!user || user.role !== Role.B2B_VN) {
      jsonFail(res, 'Merchant ledger is only available for B2B_VN accounts', 403);
      return;
    }

    const wallet = await getPrisma().wallet.findUnique({ where: { userId } });
    if (!wallet) {
      jsonFail(res, 'Wallet not found', 404);
      return;
    }

    const rawPage = Number(req.query['page']);
    const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
    const take = GLOBAL_MAX_LIST_ITEMS;
    const skip = (page - 1) * take;

    const rows = await getPrisma().transaction.findMany({
      where: {
        walletId: wallet.id,
        type: TxType.QR_MERCHANT,
        receiverId: userId,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        senderId: true,
        amountVIG: true,
        feeAmount: true,
        createdAt: true,
      },
    });

    jsonOk(res, { items: rows, page, limit: take });
  } catch {
    jsonFail(res, 'Unexpected error', 500);
  }
}
