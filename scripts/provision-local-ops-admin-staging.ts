/**
 * Staging-only: bcrypt re-hash for roster-approved Local ops ADMIN (no new user creation).
 *
 * Run: npx tsx scripts/provision-local-ops-admin-staging.ts
 *
 * Required env: DATABASE_URL, DIRECT_URL (staging ref euqbfanilcssjiwwtcby)
 * Phone: VIONA_PILOT_OPS_ADMIN_PHONE (from operator .env.local — never printed)
 * PIN: VIONA_PILOT_OPS_ADMIN_PIN if set, else VIONA_PILOT_PIN (min 6 — never printed)
 */
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

import bcrypt from 'bcryptjs';

import { Role } from '@prisma/client';

import { disconnectPrisma, getPrisma } from '../src/lib/prisma';

const STAGING_PROJECT_REF = 'euqbfanilcssjiwwtcby';

function fail(message: string): never {
  console.error(`[provision-local-ops-admin-staging] ERROR: ${message}`);
  process.exit(1);
}

function envTrim(name: string): string {
  return process.env[name]?.trim() ?? '';
}

function assertStagingDatabaseRef(): void {
  const haystack = `${envTrim('DATABASE_URL')}\n${envTrim('DIRECT_URL')}`;
  if (!haystack.includes(STAGING_PROJECT_REF)) {
    fail(
      `DATABASE_URL or DIRECT_URL must identify staging project ref ${STAGING_PROJECT_REF}. Refusing to run.`
    );
  }
}

function resolveOpsPlainPin(): string {
  const dedicated = envTrim('VIONA_PILOT_OPS_ADMIN_PIN');
  if (dedicated.length >= 6) return dedicated;
  const shared = envTrim('VIONA_PILOT_PIN');
  if (shared.length >= 6) return shared;
  fail('Set VIONA_PILOT_OPS_ADMIN_PIN or VIONA_PILOT_PIN (min 6 chars). PIN never printed.');
}

async function run(): Promise<void> {
  if (!envTrim('DATABASE_URL')) {
    fail('DATABASE_URL is not set.');
  }
  assertStagingDatabaseRef();

  const phone = envTrim('VIONA_PILOT_OPS_ADMIN_PHONE');
  if (phone.length < 8) {
    fail('VIONA_PILOT_OPS_ADMIN_PHONE is not set or too short.');
  }

  const plainPin = resolveOpsPlainPin();
  const pinHash = await bcrypt.hash(plainPin, 10);

  const prisma = getPrisma();
  const txBefore = await prisma.transaction.count();

  const existing = await prisma.user.findUnique({
    where: { phoneNumber: phone },
    select: { id: true, role: true, phoneNumber: true, pinCode: true },
  });

  if (!existing) {
    fail(
      'Ops ADMIN user not found for VIONA_PILOT_OPS_ADMIN_PHONE. Provision roster ADMIN first; this script does not create users.'
    );
  }

  if (existing.role !== Role.ADMIN) {
    fail(`User exists but role is ${existing.role}, not ADMIN. Refusing to update pinCode.`);
  }

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: { pinCode: pinHash },
    select: { id: true, role: true, phoneNumber: true, pinCode: true },
  });

  const txAfter = await prisma.transaction.count();
  if (txAfter !== txBefore) {
    fail('Unexpected Transaction row delta during pin rehash.');
  }

  const pinLooksBcrypt = updated.pinCode.startsWith('$2');
  const pinMatches = await bcrypt.compare(plainPin, updated.pinCode);

  if (!pinLooksBcrypt || updated.pinCode.length < 50) {
    fail('Post-update verification failed: pinCode does not look like bcrypt.');
  }
  if (!pinMatches) {
    fail('Post-update verification failed: bcrypt.compare with env PIN failed.');
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        userId: updated.id,
        role: updated.role,
        phoneLength: updated.phoneNumber.length,
        pinStorageLooksBcrypt: pinLooksBcrypt,
        pinCodeFieldLength: updated.pinCode.length,
        pinMatchesEnvPin: pinMatches,
        transactionDelta: 0,
      },
      null,
      2
    )
  );
}

run()
  .catch((e: unknown) => {
    fail(e instanceof Error ? e.message : String(e));
  })
  .finally(() => disconnectPrisma());
