/**
 * Staging-only pilot account provisioning for Local manual walkthrough.
 *
 * Creates/updates: User A, User B, Merchant M, Merchant N, Business M, Business N.
 * Does NOT create LocalServiceRequest rows or wallet mutations.
 *
 * Run: npx tsx scripts/provision-local-pilot-accounts-staging.ts
 *
 * Required env: DATABASE_URL, DIRECT_URL, JWT_SECRET, EXPO_PUBLIC_REST_API_BASE
 * Staging ref: euqbfanilcssjiwwtcby (must appear in DATABASE_URL or DIRECT_URL)
 * PIN: VIONA_PILOT_PIN (min 6) or per-role VIONA_PILOT_*_PIN vars (never logged)
 */
import 'dotenv/config';

import bcrypt from 'bcryptjs';

import { BizType, Role } from '@prisma/client';

import { disconnectPrisma, getPrisma } from '../src/lib/prisma';

const STAGING_PROJECT_REF = 'euqbfanilcssjiwwtcby';

const LABEL_USER_A = 'viona-local-user-a';
const LABEL_USER_B = 'viona-local-user-b';
const LABEL_MERCHANT_M = 'viona-local-merchant-m';
const LABEL_MERCHANT_N = 'viona-local-merchant-n';

const BUSINESS_M_NAME = 'VIONA Local Pilot Business M';
const BUSINESS_N_NAME = 'VIONA Local Pilot Business N';

const DEFAULT_USER_A_PHONE = '+420910000001';
const DEFAULT_USER_B_PHONE = '+420910000002';
const DEFAULT_MERCHANT_M_PHONE = '+420920000001';
const DEFAULT_MERCHANT_N_PHONE = '+420920000002';

const PRODUCTION_HOST_PATTERNS = [
  /\.prod\./i,
  /production/i,
  /viona\.app$/i,
  /api\.viona/i,
  /railway\.app$/i,
  /render\.com$/i,
  /fly\.dev$/i,
  /vercel\.app$/i,
] as const;

type ApiBaseClassification = 'local_dev' | 'lan_local_dev' | 'rejected';

function fail(message: string): never {
  console.error(`[provision-local-pilot-staging] ERROR: ${message}`);
  process.exit(1);
}

function envTrim(name: string): string {
  return process.env[name]?.trim() ?? '';
}

function requireEnv(name: string): string {
  const v = envTrim(name);
  if (v.length === 0) fail(`${name} is not set.`);
  return v;
}

function assertStagingDatabaseRef(): void {
  const db = envTrim('DATABASE_URL');
  const direct = envTrim('DIRECT_URL');
  const haystack = `${db}\n${direct}`;
  if (!haystack.includes(STAGING_PROJECT_REF)) {
    fail(
      `DATABASE_URL or DIRECT_URL must identify staging project ref ${STAGING_PROJECT_REF}. Refusing to run.`
    );
  }
}

function isPrivateLanHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  return false;
}

function classifyApiBase(raw: string): ApiBaseClassification {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    fail('EXPO_PUBLIC_REST_API_BASE is not a valid URL.');
  }

  const host = url.hostname.toLowerCase();
  for (const pattern of PRODUCTION_HOST_PATTERNS) {
    if (pattern.test(host) || pattern.test(raw)) {
      return 'rejected';
    }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'rejected';
  }

  if (host === '127.0.0.1' || host === 'localhost') {
    return 'local_dev';
  }

  if (isPrivateLanHost(host)) {
    if (envTrim('VIONA_PILOT_ALLOW_LAN_API') === '1') {
      return 'lan_local_dev';
    }
    fail(
      'LAN API host detected. Set VIONA_PILOT_ALLOW_LAN_API=1 in operator .env.local to confirm intentional LAN local-dev.'
    );
  }

  if (url.protocol === 'https:' && !host.includes('staging') && !host.includes('127.0.0.1')) {
    return 'rejected';
  }

  return 'rejected';
}

function assertMerchantPhoneNonVn(phone: string, label: string): void {
  const normalized = phone.replace(/\s+/g, '');
  if (normalized.startsWith('+84')) {
    fail(`${label} phone must not use +84 (merchant diaspora policy).`);
  }
}

function resolvePin(envKey: string, fallbackKey: string): string {
  const specific = envTrim(envKey);
  if (specific.length >= 6) return specific;
  const shared = envTrim(fallbackKey);
  if (shared.length >= 6) return shared;
  fail(
    `Set ${envKey} or ${fallbackKey} (min 6 chars) in operator .env.local. PIN values are never printed.`
  );
}

async function hashPin(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

async function upsertPilotUser(input: {
  label: string;
  phone: string;
  role: Role;
  pinHash: string;
  fullName: string;
  country: string;
}): Promise<{ id: string; phoneNumber: string; role: Role; created: boolean }> {
  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({ where: { phoneNumber: input.phone } });

  const user = await prisma.user.upsert({
    where: { phoneNumber: input.phone },
    create: {
      phoneNumber: input.phone,
      role: input.role,
      pinCode: input.pinHash,
      userType: input.role === Role.B2C ? 'B2C' : 'B2B',
      persona: 'EXPAT',
    },
    update: {
      role: input.role,
      pinCode: input.pinHash,
      userType: input.role === Role.B2C ? 'B2C' : 'B2B',
    },
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      fullName: input.fullName,
      country: input.country,
      languageCode: 'en',
    },
    update: {
      fullName: input.fullName,
      country: input.country,
    },
  });

  return {
    id: user.id,
    phoneNumber: user.phoneNumber,
    role: user.role,
    created: existing == null,
  };
}

async function upsertPilotBusiness(input: {
  ownerId: string;
  name: string;
  category: BizType;
  locationLat: number;
  locationLng: number;
}): Promise<{ id: string; name: string; category: BizType; created: boolean }> {
  const prisma = getPrisma();
  const existing = await prisma.business.findFirst({
    where: { ownerId: input.ownerId, name: input.name },
    select: { id: true },
  });

  if (existing) {
    const updated = await prisma.business.update({
      where: { id: existing.id },
      data: {
        category: input.category,
        locationLat: input.locationLat,
        locationLng: input.locationLng,
      },
      select: { id: true, name: true, category: true },
    });
    return { id: updated.id, name: updated.name, category: updated.category, created: false };
  }

  const created = await prisma.business.create({
    data: {
      ownerId: input.ownerId,
      name: input.name,
      category: input.category,
      locationLat: input.locationLat,
      locationLng: input.locationLng,
      description: 'Staging Local pilot — request-only / no-charge walkthrough.',
    },
    select: { id: true, name: true, category: true },
  });
  return { id: created.id, name: created.name, category: created.category, created: true };
}

async function run(): Promise<void> {
  requireEnv('DATABASE_URL');
  requireEnv('DIRECT_URL');
  requireEnv('JWT_SECRET');
  const apiBase = requireEnv('EXPO_PUBLIC_REST_API_BASE');

  assertStagingDatabaseRef();

  const apiClass = classifyApiBase(apiBase.replace(/\/+$/, ''));
  if (apiClass === 'rejected') {
    fail('EXPO_PUBLIC_REST_API_BASE looks like production or an unapproved host. Refusing to run.');
  }

  const userAPhone = envTrim('VIONA_PILOT_USER_A_PHONE') || DEFAULT_USER_A_PHONE;
  const userBPhone = envTrim('VIONA_PILOT_USER_B_PHONE') || DEFAULT_USER_B_PHONE;
  const merchantMPhone = envTrim('VIONA_PILOT_MERCHANT_M_PHONE') || DEFAULT_MERCHANT_M_PHONE;
  const merchantNPhone = envTrim('VIONA_PILOT_MERCHANT_N_PHONE') || DEFAULT_MERCHANT_N_PHONE;

  assertMerchantPhoneNonVn(merchantMPhone, LABEL_MERCHANT_M);
  assertMerchantPhoneNonVn(merchantNPhone, LABEL_MERCHANT_N);

  const pinA = resolvePin('VIONA_PILOT_USER_A_PIN', 'VIONA_PILOT_PIN');
  const pinB = resolvePin('VIONA_PILOT_USER_B_PIN', 'VIONA_PILOT_PIN');
  const pinM = resolvePin('VIONA_PILOT_MERCHANT_M_PIN', 'VIONA_PILOT_PIN');
  const pinN = resolvePin('VIONA_PILOT_MERCHANT_N_PIN', 'VIONA_PILOT_PIN');

  const [hashA, hashB, hashM, hashN] = await Promise.all([
    hashPin(pinA),
    hashPin(pinB),
    hashPin(pinM),
    hashPin(pinN),
  ]);

  const prisma = getPrisma();

  const localRequestsBefore = await prisma.localServiceRequest.count();
  const transactionsBefore = await prisma.transaction.count();
  const walletsBefore = await prisma.wallet.count();

  const userA = await upsertPilotUser({
    label: LABEL_USER_A,
    phone: userAPhone,
    role: Role.B2C,
    pinHash: hashA,
    fullName: 'VIONA Local User A',
    country: 'CZ',
  });

  const userB = await upsertPilotUser({
    label: LABEL_USER_B,
    phone: userBPhone,
    role: Role.B2C,
    pinHash: hashB,
    fullName: 'VIONA Local User B',
    country: 'DE',
  });

  const merchantM = await upsertPilotUser({
    label: LABEL_MERCHANT_M,
    phone: merchantMPhone,
    role: Role.B2B_EU,
    pinHash: hashM,
    fullName: 'VIONA Local Merchant M',
    country: 'CZ',
  });

  const merchantN = await upsertPilotUser({
    label: LABEL_MERCHANT_N,
    phone: merchantNPhone,
    role: Role.B2B_EU,
    pinHash: hashN,
    fullName: 'VIONA Local Merchant N',
    country: 'DE',
  });

  const businessM = await upsertPilotBusiness({
    ownerId: merchantM.id,
    name: BUSINESS_M_NAME,
    category: BizType.LOCAL_EXPERIENCE,
    locationLat: 50.0755,
    locationLng: 14.4378,
  });

  const businessN = await upsertPilotBusiness({
    ownerId: merchantN.id,
    name: BUSINESS_N_NAME,
    category: BizType.RESTAURANT,
    locationLat: 50.0875,
    locationLng: 14.4213,
  });

  const localRequestsAfter = await prisma.localServiceRequest.count();
  const transactionsAfter = await prisma.transaction.count();
  const walletsAfter = await prisma.wallet.count();

  const pilotUsers = await prisma.user.count({
    where: {
      phoneNumber: { in: [userAPhone, userBPhone, merchantMPhone, merchantNPhone] },
    },
  });

  const pilotBusinesses = await prisma.business.count({
    where: { name: { in: [BUSINESS_M_NAME, BUSINESS_N_NAME] } },
  });

  const ownerM = await prisma.business.findUnique({
    where: { id: businessM.id },
    select: { ownerId: true },
  });
  const ownerN = await prisma.business.findUnique({
    where: { id: businessN.id },
    select: { ownerId: true },
  });

  console.log('[provision-local-pilot-staging] env guard: PASS (staging ref present)');
  console.log(`[provision-local-pilot-staging] API base classification: ${apiClass}`);
  console.log('[provision-local-pilot-staging] PIN: stored in local operator note (not printed)');

  console.log(`[provision-local-pilot-staging] ${LABEL_USER_A} userId=${userA.id} created=${userA.created}`);
  console.log(`[provision-local-pilot-staging] ${LABEL_USER_B} userId=${userB.id} created=${userB.created}`);
  console.log(
    `[provision-local-pilot-staging] ${LABEL_MERCHANT_M} userId=${merchantM.id} role=${merchantM.role} created=${merchantM.created}`
  );
  console.log(
    `[provision-local-pilot-staging] ${LABEL_MERCHANT_N} userId=${merchantN.id} role=${merchantN.role} created=${merchantN.created}`
  );
  console.log(
    `[provision-local-pilot-staging] Business M id=${businessM.id} name=${businessM.name} category=${businessM.category} created=${businessM.created}`
  );
  console.log(
    `[provision-local-pilot-staging] Business N id=${businessN.id} name=${businessN.name} category=${businessN.category} created=${businessN.created}`
  );

  console.log('[provision-local-pilot-staging] post-run verification:');
  console.log(`  pilot users in DB (by phone): ${pilotUsers} (expected 4)`);
  console.log(`  pilot businesses in DB (by name): ${pilotBusinesses} (expected 2)`);
  console.log(
    `  Business M owner matches Merchant M: ${ownerM?.ownerId === merchantM.id ? 'PASS' : 'FAIL'}`
  );
  console.log(
    `  Business N owner matches Merchant N: ${ownerN?.ownerId === merchantN.id ? 'PASS' : 'FAIL'}`
  );
  console.log(
    `  Merchant M phone non-+84: ${!merchantMPhone.replace(/\s+/g, '').startsWith('+84') ? 'PASS' : 'FAIL'}`
  );
  console.log(
    `  Merchant N phone non-+84: ${!merchantNPhone.replace(/\s+/g, '').startsWith('+84') ? 'PASS' : 'FAIL'}`
  );
  console.log(
    `  LocalServiceRequest delta: ${localRequestsAfter - localRequestsBefore} (expected 0)`
  );
  console.log(`  Transaction delta: ${transactionsAfter - transactionsBefore} (expected 0)`);
  console.log(`  Wallet row delta: ${walletsAfter - walletsBefore} (expected 0)`);

  if (pilotUsers !== 4 || pilotBusinesses !== 2) {
    fail('Post-run verification failed: expected 4 pilot users and 2 pilot businesses.');
  }
  if (ownerM?.ownerId !== merchantM.id || ownerN?.ownerId !== merchantN.id) {
    fail('Post-run verification failed: business ownership mismatch.');
  }
  if (localRequestsAfter !== localRequestsBefore || transactionsAfter !== transactionsBefore) {
    fail('Post-run verification failed: unexpected Local request or Transaction mutation.');
  }

  console.log('[provision-local-pilot-staging] OK — pilot accounts provisioned (no Local requests).');
}

run()
  .catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    fail(msg);
  })
  .finally(() => disconnectPrisma());
