import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { getPrisma } from '../../lib/prisma';
import { isEmailConfigured, sendEmail } from '../EmailService';
import { findUserByEmail, issueSessionForUserId, type AuthUserProfile } from '../api/AuthService';

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_SEND_WINDOW_MS = 10 * 60 * 1000;
const MAX_OTP_SENDS_PER_EMAIL_WINDOW = 3;
const MAX_ATTEMPTS = 6;
const CODE_LENGTH = 6;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function getJwtSecret(): string | null {
  const s = process.env.JWT_SECRET?.trim();
  return s && s.length >= 16 ? s : null;
}

function generateNumericOtp(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(CODE_LENGTH, '0');
}

export type EmailOtpRequestResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false;
      reason: 'invalid_email' | 'smtp_not_configured' | 'server_misconfigured' | 'rate_limited';
    }>;

export async function requestEmailOtp(rawEmail: string): Promise<EmailOtpRequestResult> {
  const email = normalizeEmail(rawEmail);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, reason: 'invalid_email' };
  }
  if (!getJwtSecret()) {
    return { ok: false, reason: 'server_misconfigured' };
  }
  if (!isEmailConfigured()) {
    return { ok: false, reason: 'smtp_not_configured' };
  }

  const code = generateNumericOtp();
  const codeHash = await bcrypt.hash(code, 10);
  const prisma = getPrisma();
  await prisma.emailOtpChallenge.deleteMany({ where: { email } });
  await prisma.emailOtpChallenge.create({
    data: {
      email,
      codeHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  const brand = process.env.MAIL_BRAND_NAME?.trim() || 'ViGlobal';
  await sendEmail({
    to: email,
    subject: `${brand} — mã xác minh email`,
    text: `Mã xác minh của bạn: ${code}\n\nMã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.`,
    html: `<p>Mã xác minh của bạn: <strong>${code}</strong></p><p>Mã có hiệu lực trong 10 phút.</p>`,
  });

  await prisma.emailOtpSendLog.create({ data: { email } });

  return { ok: true };
}

export type EmailOtpVerifyResult =
  | Readonly<{ ok: true; kind: 'session'; token: string; user: AuthUserProfile }>
  | Readonly<{ ok: true; kind: 'pre_auth'; preAuthToken: string; email: string }>
  | Readonly<{ ok: false; reason: 'invalid_code' | 'expired' | 'too_many_attempts' | 'server_misconfigured' | 'not_found' }>;

export async function verifyEmailOtp(rawEmail: string, rawCode: string): Promise<EmailOtpVerifyResult> {
  const email = normalizeEmail(rawEmail);
  const code = rawCode.trim().replace(/\D/g, '');
  const secret = getJwtSecret();
  if (!secret) {
    return { ok: false, reason: 'server_misconfigured' };
  }
  if (code.length !== CODE_LENGTH) {
    return { ok: false, reason: 'invalid_code' };
  }

  const prisma = getPrisma();
  const challenge = await prisma.emailOtpChallenge.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  });

  if (!challenge) {
    return { ok: false, reason: 'not_found' };
  }
  if (challenge.expiresAt.getTime() < Date.now()) {
    await prisma.emailOtpChallenge.delete({ where: { id: challenge.id } });
    return { ok: false, reason: 'expired' };
  }
  if (challenge.attemptCount >= MAX_ATTEMPTS) {
    await prisma.emailOtpChallenge.delete({ where: { id: challenge.id } });
    return { ok: false, reason: 'too_many_attempts' };
  }

  const match = await bcrypt.compare(code, challenge.codeHash);
  if (!match) {
    await prisma.emailOtpChallenge.update({
      where: { id: challenge.id },
      data: { attemptCount: { increment: 1 } },
    });
    return { ok: false, reason: 'invalid_code' };
  }

  await prisma.emailOtpChallenge.delete({ where: { id: challenge.id } });

  const existing = await findUserByEmail(email);
  if (existing) {
    const now = new Date();
    if (!existing.emailVerifiedAt) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { email: email, emailVerifiedAt: now },
      });
    }
    const session = await issueSessionForUserId(existing.id);
    if (!session) {
      return { ok: false, reason: 'server_misconfigured' };
    }
    return { ok: true, kind: 'session', token: session.token, user: session.user };
  }

  const preAuthToken = jwt.sign(
    { sub: `email-preauth:${email}`, typ: 'email_otp_pre', email },
    secret,
    { expiresIn: '15m' }
  );
  return { ok: true, kind: 'pre_auth', preAuthToken, email };
}
