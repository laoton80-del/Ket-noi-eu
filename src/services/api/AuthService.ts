import type { Profile, Role, User, UserTier } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { getPrisma } from '../../lib/prisma';

export type AuthUserProfile = Readonly<{
  id: string;
  phoneNumber: string;
  role: Role;
  tier: UserTier;
  persona: string;
  isKYCVerified: boolean;
  businessCategory: string | null;
  profile: null | {
    fullName: string;
    avatarUrl: string | null;
    country: string;
    languageCode: string;
  };
}>;

export type AuthLoginSuccess = Readonly<{
  token: string;
  user: AuthUserProfile;
}>;

export type AuthLoginFailureReason = 'invalid_credentials' | 'server_misconfigured';

export type AuthLoginResult =
  | Readonly<{ ok: true } & AuthLoginSuccess>
  | Readonly<{ ok: false; reason: AuthLoginFailureReason }>;

function normalizePhone(raw: string): string {
  return raw.trim().replace(/\s+/g, '');
}

function getJwtSecret(): string | null {
  const s = process.env.JWT_SECRET?.trim();
  return s && s.length >= 16 ? s : null;
}

export function buildPublicProfile(user: User & { profile: Profile | null }): AuthUserProfile {
  const profile = user.profile;
  return {
    id: user.id,
    phoneNumber: user.phoneNumber,
    role: user.role,
    tier: user.tier,
    persona: user.persona === 'TOURIST' ? 'TOURIST' : 'EXPAT',
    isKYCVerified: user.isKYCVerified,
    businessCategory: user.businessCategory ?? null,
    profile: profile
      ? {
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl,
          country: profile.country,
          languageCode: profile.languageCode,
        }
      : null,
  };
}

/** Full session for an existing user (e.g. after email OTP verification). */
export async function issueSessionForUserId(userId: string): Promise<AuthLoginSuccess | null> {
  const secret = getJwtSecret();
  if (!secret) return null;
  const user = await getPrisma().user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) return null;
  const expiresIn = process.env.JWT_EXPIRES_IN?.trim() || '7d';
  const token = jwt.sign({ sub: user.id }, secret, { expiresIn });
  return { token, user: buildPublicProfile(user) };
}

export async function findUserByVerifiedEmail(email: string): Promise<(User & { profile: Profile | null }) | null> {
  const e = email.trim().toLowerCase();
  if (!e) return null;
  return getPrisma().user.findFirst({
    where: { email: e, emailVerifiedAt: { not: null } },
    include: { profile: true },
  });
}

export async function findUserByEmail(email: string): Promise<(User & { profile: Profile | null }) | null> {
  const e = email.trim().toLowerCase();
  if (!e) return null;
  return getPrisma().user.findUnique({
    where: { email: e },
    include: { profile: true },
  });
}

export async function loginWithPhoneAndPin(
  phoneNumber: string,
  pinCode: string
): Promise<AuthLoginResult> {
  const secret = getJwtSecret();
  if (!secret) {
    return { ok: false, reason: 'server_misconfigured' };
  }

  const phone = normalizePhone(phoneNumber);
  const pin = pinCode;
  if (phone.length < 8 || pin.length < 6) {
    return { ok: false, reason: 'invalid_credentials' };
  }

  const user = await getPrisma().user.findUnique({
    where: { phoneNumber: phone },
    include: { profile: true },
  });

  if (!user) {
    return { ok: false, reason: 'invalid_credentials' };
  }

  const pinOk = await bcrypt.compare(pin, user.pinCode);
  if (!pinOk) {
    return { ok: false, reason: 'invalid_credentials' };
  }

  const publicProfile = buildPublicProfile(user);

  const expiresIn = process.env.JWT_EXPIRES_IN?.trim() || '7d';
  const token = jwt.sign({ sub: user.id }, secret, { expiresIn });

  return { ok: true, token, user: publicProfile };
}
