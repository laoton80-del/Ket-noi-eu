/**
 * Pack36A — Staging Deployment & Webhook QA: standalone provisioning script.
 *
 * Idempotently seeds exactly one synthetic, clearly-marked `MerchantProfile` +
 * `VionaMerchantWebhookChannel` row, both flipped `isActive: true`, so Pack35's webhook endpoint
 * (`POST /api/viona/webhooks/merchant-agent`) has a valid target to resolve against on staging.
 * See docs/product/VIONA_PACK36A_STAGING_DEPLOY_AND_QA_PLAN.md §4.
 *
 * Load-bearing fact (see `vionaWebhookChannelResolutionService.ts`'s own field comment):
 * `VionaMerchantWebhookChannel.signingSecretHash` is used VERBATIM as the raw HMAC key by the
 * verifier — never pre-hashed. This script therefore writes (and, on re-run, reads back) a
 * plaintext secret in that column, by design, matching the existing runtime contract exactly.
 *
 * Mirrors `scripts/provision-test-wallet.ts`'s exact shape: fail-closed production guard, masked
 * DB-URL logging, idempotent lookup-or-create, only touches services/rows it explicitly owns.
 * Reuses the existing, unmodified `createMerchantProfile()` / `updateMerchantProfileToolScope()`
 * (Pack34) — never edits either of those files.
 *
 * Usage:
 *   npx tsx scripts/provision-staging-webhook-test-channel.ts
 *   npx tsx scripts/provision-staging-webhook-test-channel.ts --phone=+420910000001
 *   npx tsx scripts/provision-staging-webhook-test-channel.ts --rotate-secret
 */

import { randomBytes } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';

import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import { readVionaDeploymentStage } from '../src/lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag';
import {
  createMerchantProfile,
  updateMerchantProfileToolScope,
} from '../src/services/viona/vionaMerchantProfileService';

const PACK36A_QA_TENANT_ID = 'pack36a-qa-tenant';
const PACK36A_QA_DISPLAY_NAME = 'Pack36A Staging Webhook QA (synthetic test merchant)';
const PACK36A_QA_CHANNEL_TYPE = 'custom_client';
const PACK36A_QA_CHANNEL_EXTERNAL_ID = 'pack36a-qa-channel';
/** Both existing Pack34 read-only tools — matches Pack35's standing-approval guard requirement
 *  that a tool must be present in the merchant's own `toolScope` to ever auto-derive true/true. */
const PACK36A_QA_TOOL_SCOPE = ['merchant_schedule_availability_check', 'merchant_inventory_stock_check'] as const;

type CliArgs = Readonly<{
  phone?: string;
  userId?: string;
  rotateSecret: boolean;
}>;

function parseCliArgs(argv: readonly string[]): CliArgs {
  let phone: string | undefined;
  let userId: string | undefined;
  let rotateSecret = false;

  for (const arg of argv) {
    if (arg.startsWith('--phone=')) {
      phone = arg.slice('--phone='.length).trim();
    } else if (arg.startsWith('--userId=')) {
      userId = arg.slice('--userId='.length).trim();
    } else if (arg === '--rotate-secret') {
      rotateSecret = true;
    }
  }

  return { phone, userId, rotateSecret };
}

function maskDatabaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl) return '(unset)';
  try {
    const url = new URL(rawUrl);
    return `${url.protocol}//${url.hostname}:${url.port || '5432'}${url.pathname}`;
  } catch {
    return '(unparseable DATABASE_URL — not printed for safety)';
  }
}

/** Fail-closed: this script must never run against a real production deployment. */
function assertNotProductionDeployment(): void {
  const stage = readVionaDeploymentStage();
  if (stage === 'production') {
    console.error(
      '[provision-staging-webhook-test-channel] ABORT — VIONA_DEPLOYMENT_STAGE=production. This script never runs against production.',
    );
    process.exit(1);
  }
  console.log(`[provision-staging-webhook-test-channel] Deployment stage: ${stage} (production hard-blocked; proceeding).`);
  console.log(`[provision-staging-webhook-test-channel] Target database: ${maskDatabaseUrl(process.env.DATABASE_URL)}`);
}

async function findOwnerUser(
  prisma: PrismaClient,
  args: CliArgs,
): Promise<{ id: string; phoneNumber: string } | null> {
  if (args.userId) {
    return prisma.user.findUnique({ where: { id: args.userId }, select: { id: true, phoneNumber: true } });
  }

  const phone = args.phone ?? process.env.VIONA_PILOT_PHONE?.trim();
  if (phone) {
    const byPhone = await prisma.user.findUnique({ where: { phoneNumber: phone }, select: { id: true, phoneNumber: true } });
    if (byPhone) return byPhone;
    console.warn(
      `[provision-staging-webhook-test-channel] No user found for phone ${phone} — falling back to first available user.`,
    );
  }

  return prisma.user.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true, phoneNumber: true } });
}

async function main(): Promise<void> {
  assertNotProductionDeployment();

  const args = parseCliArgs(process.argv.slice(2));
  const prisma = getPrisma();

  const owner = await findOwnerUser(prisma, args);
  if (!owner) {
    console.error(
      '[provision-staging-webhook-test-channel] ABORT — no matching user found (and no user exists in the database to fall back to). Create a test/pilot user first.',
    );
    process.exitCode = 1;
    return;
  }
  console.log(`[provision-staging-webhook-test-channel] Using owner user ${owner.id} (phone ${owner.phoneNumber}).`);

  // Step 1 — idempotent MerchantProfile create (existing, unmodified Pack34 service).
  const createResult = await createMerchantProfile({
    ownerUserId: owner.id,
    tenantId: PACK36A_QA_TENANT_ID,
    displayName: PACK36A_QA_DISPLAY_NAME,
  });
  if (!createResult.ok) {
    console.error(
      `[provision-staging-webhook-test-channel] ABORT — createMerchantProfile failed: ${createResult.reason}. ` +
        (createResult.reason === 'tenant_id_taken'
          ? `A different owner already claimed tenantId="${PACK36A_QA_TENANT_ID}" — pass a different --userId/--phone that already owns it, or pick a new fixed tenantId in this script.`
          : ''),
    );
    process.exitCode = 1;
    return;
  }
  console.log(
    createResult.created
      ? `[provision-staging-webhook-test-channel] MerchantProfile ${createResult.merchantProfileId} created (tenantId=${PACK36A_QA_TENANT_ID}).`
      : `[provision-staging-webhook-test-channel] MerchantProfile ${createResult.merchantProfileId} already existed (tenantId=${PACK36A_QA_TENANT_ID}).`,
  );

  // Step 2 — explicit, narrowly-scoped activation (createMerchantProfile() never does this itself
  // — Pack34's own fail-closed default; see this script's module header + Pack36A plan §4.2 step 3).
  await prisma.merchantProfile.update({
    where: { id: createResult.merchantProfileId },
    data: { isActive: true },
  });
  console.log(`[provision-staging-webhook-test-channel] MerchantProfile ${createResult.merchantProfileId} isActive=true.`);

  // Step 3 — grant the 2 existing, read-only, merchant-scoped tools (existing, unmodified Pack34
  // service; validates every name against the live Tool Registry, never accepts an unknown tool).
  const toolScopeResult = await updateMerchantProfileToolScope(owner.id, PACK36A_QA_TOOL_SCOPE);
  if (!toolScopeResult.ok) {
    console.error(
      `[provision-staging-webhook-test-channel] ABORT — updateMerchantProfileToolScope failed: ${toolScopeResult.reason}` +
        (toolScopeResult.unknownToolName ? ` (${toolScopeResult.unknownToolName})` : ''),
    );
    process.exitCode = 1;
    return;
  }
  console.log(`[provision-staging-webhook-test-channel] toolScope=${JSON.stringify(toolScopeResult.toolScope)}.`);

  // Step 4 — idempotent upsert of the webhook channel binding. On a fresh create, always generate
  // a new random secret; on an existing row, keep the current secret unless --rotate-secret was
  // passed — either way, isActive/standingApproval are (re-)asserted true on every run.
  const newSecret = randomBytes(32).toString('hex');
  const existingChannel = await prisma.vionaMerchantWebhookChannel.findUnique({
    where: {
      channelType_channelExternalId: {
        channelType: PACK36A_QA_CHANNEL_TYPE,
        channelExternalId: PACK36A_QA_CHANNEL_EXTERNAL_ID,
      },
    },
  });

  const channel = await prisma.vionaMerchantWebhookChannel.upsert({
    where: {
      channelType_channelExternalId: {
        channelType: PACK36A_QA_CHANNEL_TYPE,
        channelExternalId: PACK36A_QA_CHANNEL_EXTERNAL_ID,
      },
    },
    create: {
      merchantProfileId: createResult.merchantProfileId,
      channelType: PACK36A_QA_CHANNEL_TYPE,
      channelExternalId: PACK36A_QA_CHANNEL_EXTERNAL_ID,
      signingSecretHash: newSecret,
      isActive: true,
      standingApprovalForReadOnlyToolsOnly: true,
    },
    update: {
      merchantProfileId: createResult.merchantProfileId,
      isActive: true,
      standingApprovalForReadOnlyToolsOnly: true,
      ...(args.rotateSecret ? { signingSecretHash: newSecret } : {}),
    },
  });

  console.log(
    existingChannel == null
      ? `[provision-staging-webhook-test-channel] VionaMerchantWebhookChannel ${channel.id} created (secret generated).`
      : args.rotateSecret
        ? `[provision-staging-webhook-test-channel] VionaMerchantWebhookChannel ${channel.id} already existed — secret ROTATED (--rotate-secret).`
        : `[provision-staging-webhook-test-channel] VionaMerchantWebhookChannel ${channel.id} already existed — secret unchanged (pass --rotate-secret to rotate).`,
  );

  console.log('\n[provision-staging-webhook-test-channel] DONE — ready for Pack36A webhook QA script.');
  console.log(`  tenantId:            ${PACK36A_QA_TENANT_ID}`);
  console.log(`  merchantProfileId:   ${createResult.merchantProfileId}`);
  console.log(`  ownerUserId:         ${owner.id}`);
  console.log(`  channelType:         ${PACK36A_QA_CHANNEL_TYPE}`);
  console.log(`  channelExternalId:   ${PACK36A_QA_CHANNEL_EXTERNAL_ID}`);
  console.log(`  signingSecretHash:   ${channel.signingSecretHash}`);
  console.log(
    '\n  (The QA script reads this same row directly from the DB — no manual copy/paste of the secret is required.)',
  );
}

main()
  .catch((error) => {
    console.error(
      '[provision-staging-webhook-test-channel] FAILED:',
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
