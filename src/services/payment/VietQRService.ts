/**
 * Offline VietQR EMV payload (NAPAS 247) + PNG for merchant dashboards.
 * Uses `vietnam-qr-pay` — no third-party image API; optional `qrcode` for raster output.
 */

import QRCode from 'qrcode';
import { QRPay } from 'vietnam-qr-pay';

import { vigToVndInteger } from './VigVndFxService';

export type MerchantVietQrBankProfile = Readonly<{
  /** 6-digit NAPAS BIN (acquirer id), e.g. `970415`. */
  bankBin: string;
  accountNumber: string;
  /** Display only — EMV consumer field uses account number + BIN; name shown on bank apps from registry. */
  accountName?: string;
}>;

export type BuildVietQrResult = Readonly<{
  emvPayload: string;
  amountVnd: number;
  purpose: string;
}>;

const VND_MAX = 999_999_999_999;

function sanitizeBin(bin: string): string {
  return bin.replace(/\D/g, '').slice(0, 6);
}

function sanitizeAccount(no: string): string {
  return no.trim().replace(/\s+/g, '');
}

/**
 * Build EMV VietQR string for a fixed VND amount (dynamic QR).
 */
export function buildVietQrPayload(input: Readonly<{
  bank: MerchantVietQrBankProfile;
  amountVnd: number;
  purpose?: string;
}>): BuildVietQrResult {
  const bankBin = sanitizeBin(input.bank.bankBin);
  const bankNumber = sanitizeAccount(input.bank.accountNumber);
  if (bankBin.length !== 6) {
    throw new Error('vietqr_bank_bin_invalid');
  }
  if (bankNumber.length < 4 || bankNumber.length > 32) {
    throw new Error('vietqr_account_invalid');
  }
  const amountVnd = Math.min(
    VND_MAX,
    Math.max(0, Math.floor(Number.isFinite(input.amountVnd) ? input.amountVnd : 0))
  );
  if (amountVnd < 1) {
    throw new Error('vietqr_amount_vnd_invalid');
  }
  const memo = input.purpose?.trim() ?? '';
  const purpose = memo.length > 0 ? memo.slice(0, 120) : 'VIONA';

  const qr = QRPay.initVietQR({
    bankBin,
    bankNumber,
    amount: String(amountVnd),
    purpose,
  });
  const emvPayload = qr.build();
  return { emvPayload, amountVnd, purpose };
}

/**
 * VIG list/cart price → exact VND integer for VietQR, using a locked EUR/VND spot.
 */
export function buildVietQrFromVig(input: Readonly<{
  bank: MerchantVietQrBankProfile;
  vigAmount: number;
  eurVndRate: number;
  purpose?: string;
}>): BuildVietQrResult {
  const amountVnd = vigToVndInteger(input.vigAmount, input.eurVndRate);
  return buildVietQrPayload({
    bank: input.bank,
    amountVnd,
    purpose: input.purpose,
  });
}

/** PNG data URL suitable for `<Image source={{ uri: pngDataUrl }} />`. */
export async function vietQrEmvToPngDataUrl(
  emvPayload: string,
  options?: Readonly<{ width?: number; margin?: number }>
): Promise<string> {
  const width = options?.width ?? 280;
  const margin = options?.margin ?? 2;
  return QRCode.toDataURL(emvPayload, {
    type: 'image/png',
    width,
    margin,
    errorCorrectionLevel: 'M',
  });
}

export async function generateMerchantVietQrPng(input: Readonly<{
  bank: MerchantVietQrBankProfile;
  vigAmount: number;
  eurVndRate: number;
  purpose?: string;
}>): Promise<Readonly<{ pngDataUrl: string } & BuildVietQrResult>> {
  const built = buildVietQrFromVig(input);
  const pngDataUrl = await vietQrEmvToPngDataUrl(built.emvPayload);
  return { ...built, pngDataUrl };
}
