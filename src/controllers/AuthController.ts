import type { Request, Response } from 'express';

import { loginWithPhoneAndPin } from '../services/api/AuthService';
import { requestEmailOtp, verifyEmailOtp } from '../services/auth/EmailOtpService';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export async function postLogin(req: Request, res: Response): Promise<void> {
  try {
    const body: unknown = req.body;
    const phoneNumber =
      typeof body === 'object' && body !== null && 'phoneNumber' in body
        ? readString((body as { phoneNumber?: unknown }).phoneNumber)
        : null;
    const pinCode =
      typeof body === 'object' && body !== null && 'pinCode' in body
        ? readString((body as { pinCode?: unknown }).pinCode)
        : null;

    if (!phoneNumber || !pinCode) {
      jsonFail(res, 'phoneNumber and pinCode are required', 400);
      return;
    }

    const result = await loginWithPhoneAndPin(phoneNumber, pinCode);
    if (!result.ok) {
      if (result.reason === 'server_misconfigured') {
        jsonFail(res, 'Authentication service unavailable', 500);
        return;
      }
      jsonFail(res, 'Invalid phone number or PIN', 401);
      return;
    }

    jsonOk(res, { token: result.token, user: result.user });
  } catch {
    jsonFail(res, 'Unexpected error', 500);
  }
}

export async function postEmailOtpRequest(req: Request, res: Response): Promise<void> {
  try {
    const body: unknown = req.body;
    const email =
      typeof body === 'object' && body !== null && 'email' in body
        ? readString((body as { email?: unknown }).email)
        : null;
    if (!email) {
      jsonFail(res, 'email is required', 400);
      return;
    }
    const r = await requestEmailOtp(email);
    if (!r.ok) {
      if (r.reason === 'smtp_not_configured') {
        jsonFail(res, 'Email delivery is not configured on this server', 503);
        return;
      }
      if (r.reason === 'server_misconfigured') {
        jsonFail(res, 'Authentication service unavailable', 500);
        return;
      }
      if (r.reason === 'rate_limited') {
        jsonFail(res, 'Too many OTP requests for this email. Try again in about 10 minutes.', 429);
        return;
      }
      jsonFail(res, 'Invalid email address', 400);
      return;
    }
    jsonOk(res, { sent: true });
  } catch {
    jsonFail(res, 'Unexpected error', 500);
  }
}

export async function postEmailOtpVerify(req: Request, res: Response): Promise<void> {
  try {
    const body: unknown = req.body;
    const email =
      typeof body === 'object' && body !== null && 'email' in body
        ? readString((body as { email?: unknown }).email)
        : null;
    const code =
      typeof body === 'object' && body !== null && 'code' in body
        ? readString((body as { code?: unknown }).code)
        : null;
    if (!email || !code) {
      jsonFail(res, 'email and code are required', 400);
      return;
    }
    const r = await verifyEmailOtp(email, code);
    if (!r.ok) {
      const msg =
        r.reason === 'expired'
          ? 'Code expired'
          : r.reason === 'too_many_attempts'
            ? 'Too many attempts'
            : r.reason === 'not_found'
              ? 'No active verification for this email'
              : 'Invalid code';
      jsonFail(res, msg, 400);
      return;
    }
    if (r.kind === 'session') {
      jsonOk(res, { token: r.token, user: r.user, flow: 'session' as const });
      return;
    }
    jsonOk(res, { flow: 'pre_auth' as const, preAuthToken: r.preAuthToken, email: r.email });
  } catch {
    jsonFail(res, 'Unexpected error', 500);
  }
}
