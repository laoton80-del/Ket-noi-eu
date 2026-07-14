/**
 * Pack36A — Staging Deployment & Webhook QA: live staging smoke test.
 *
 * Operator phrase: APPROVE_PACK36A_STAGING_DEPLOY_AND_QA_EXECUTION.
 * Proves — with a real HTTP call to the LIVE staging URL and an independent, direct staging-DB
 * read (never a mock) — that Pack35's deployed webhook endpoint accepts a correctly-signed
 * message and produces the expected `webhookMessageAccepted` audit trail. See
 * docs/product/VIONA_PACK36A_STAGING_DEPLOY_AND_QA_PLAN.md §5.
 *
 * Reuses the existing, unmodified `buildVionaWebhookSignatureHeader()`
 * (`vionaWebhookSignatureVerificationService.ts`) verbatim — never reimplements HMAC construction.
 *
 * Prerequisite: `npx tsx scripts/provision-staging-webhook-test-channel.ts` must have run at least
 * once against the same DATABASE_URL this script uses — this script reads the channel's signing
 * secret directly from that row (plaintext-stored by design, see that script's module header), so
 * no secret needs to be copy/pasted between the two scripts.
 *
 * Modes:
 *   default              — health check + signed happy-path webhook call + DB audit-event verify
 *   --check-idempotency   — additionally re-sends the identical signed request and asserts a
 *                           replay (`idempotentReplay: true`, no second audit row)
 *   --check-negative      — additionally sends a deliberately mis-signed request and asserts 401
 *
 * Usage:
 *   npx tsx scripts/test-viona-pack36a-staging-webhook-qa.ts
 *   npx tsx scripts/test-viona-pack36a-staging-webhook-qa.ts --check-idempotency --check-negative
 *
 * Env overrides (all optional — defaults match the provisioning script's own fixed values):
 *   STAGING_PUBLIC_API_BASE, PACK36A_QA_CHANNEL_TYPE, PACK36A_QA_CHANNEL_EXTERNAL_ID
 */

import { config } from 'dotenv';

import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import { readVionaDeploymentStage } from '../src/lib/viona/realProviderAdapter/vionaRealProviderExecutionFlag';
import { buildVionaWebhookSignatureHeader } from '../src/services/viona/vionaWebhookSignatureVerificationService';

config({ path: '.env.local' });
config({ path: '.env' });

const STAGING_DEFAULT = 'https://viona-api-staging-eu.fly.dev';
const DEFAULT_CHANNEL_TYPE = 'custom_client';
const DEFAULT_CHANNEL_EXTERNAL_ID = 'pack36a-qa-channel';
const WEBHOOK_PATH = '/api/viona/webhooks/merchant-agent';
const SIGNATURE_HEADER_NAME = 'x-viona-webhook-signature';

const base = (process.env.STAGING_PUBLIC_API_BASE ?? STAGING_DEFAULT).trim().replace(/\/+$/, '');
const channelType = (process.env.PACK36A_QA_CHANNEL_TYPE ?? DEFAULT_CHANNEL_TYPE).trim();
const channelExternalId = (process.env.PACK36A_QA_CHANNEL_EXTERNAL_ID ?? DEFAULT_CHANNEL_EXTERNAL_ID).trim();

const checkIdempotency = process.argv.includes('--check-idempotency');
const checkNegative = process.argv.includes('--check-negative');

let failures = 0;

function log(stage: string, detail?: string): void {
  console.log(detail ? `[pack36a-qa] ${stage}: ${detail}` : `[pack36a-qa] ${stage}`);
}

function fail(stage: string, detail: string): void {
  failures += 1;
  console.error(`[pack36a-qa] FAIL ${stage}: ${detail}`);
}

function pass(stage: string, detail: string): void {
  console.log(`[pack36a-qa] PASS ${stage}: ${detail}`);
}

type WebhookPayload = Readonly<{
  channelType: string;
  channelExternalId: string;
  externalMessageId: string;
  fromExternalContactId: string;
  messageText: string;
  receivedAtIso: string;
}>;

function buildMockPayload(externalMessageId: string): WebhookPayload {
  return {
    channelType,
    channelExternalId,
    externalMessageId,
    fromExternalContactId: 'pack36a-qa-synthetic-contact',
    messageText: 'What are your opening hours today?',
    receivedAtIso: new Date().toISOString(),
  };
}

async function sendSignedWebhookRequest(
  payload: WebhookPayload,
  signingSecret: string,
  opts: { badSignature?: boolean } = {},
): Promise<{ status: number; json: Record<string, unknown> | null; text: string; elapsedMs: number }> {
  const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
  const signatureHeader = opts.badSignature
    ? buildVionaWebhookSignatureHeader(rawBody, `${signingSecret}-deliberately-wrong`)
    : buildVionaWebhookSignatureHeader(rawBody, signingSecret);

  const startedAt = Date.now();
  const res = await fetch(`${base}${WEBHOOK_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [SIGNATURE_HEADER_NAME]: signatureHeader,
    },
    body: rawBody,
  });
  const elapsedMs = Date.now() - startedAt;
  const text = await res.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    json = null;
  }
  return { status: res.status, json, text, elapsedMs };
}

async function main(): Promise<void> {
  const stage = readVionaDeploymentStage();
  log('config', `base=${base}`);
  log('config', `channel=(${channelType}, ${channelExternalId})`);
  log('config', `local script's own VIONA_DEPLOYMENT_STAGE=${stage} (informational — this only gates real-provider flags, not the webhook route)`);

  // Step 0 — health check (liveness gate, mirrors test-staging-ping.ts's own first check).
  log('health', `GET ${base}/health`);
  const health = await fetch(`${base}/health`);
  if (health.status !== 200) {
    fail('health', `expected HTTP 200, got ${health.status} — is the staging app deployed and running?`);
    await finish();
    return;
  }
  pass('health', `HTTP ${health.status}`);

  // Step 1 — read the provisioned channel's row directly from the staging DB (plaintext secret,
  // by design — see this file's module header + provisioning script's module header).
  const prisma = getPrisma();
  const channelRow = await prisma.vionaMerchantWebhookChannel.findUnique({
    where: { channelType_channelExternalId: { channelType, channelExternalId } },
  });
  if (!channelRow) {
    fail(
      'provisioning',
      `no VionaMerchantWebhookChannel found for (${channelType}, ${channelExternalId}) — run ` +
        'npx tsx scripts/provision-staging-webhook-test-channel.ts against the same DATABASE_URL first.',
    );
    await finish();
    return;
  }
  if (!channelRow.isActive) {
    fail('provisioning', `channel ${channelRow.id} is isActive=false — provisioning script should have set this true.`);
    await finish();
    return;
  }
  const merchant = await prisma.merchantProfile.findUnique({ where: { id: channelRow.merchantProfileId } });
  if (!merchant || !merchant.isActive) {
    fail('provisioning', `linked MerchantProfile missing or isActive=false for channel ${channelRow.id}.`);
    await finish();
    return;
  }
  pass('provisioning', `channel ${channelRow.id} + merchant ${merchant.id} (tenantId=${merchant.tenantId}) both isActive=true.`);
  const signingSecret = channelRow.signingSecretHash;

  // Step 2 — (a) construct payload, (b) sign it, (c) POST to the LIVE staging URL, (d) verify.
  const externalMessageId = `pack36a-qa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const payload = buildMockPayload(externalMessageId);
  log('webhook', `POST ${base}${WEBHOOK_PATH} (externalMessageId=${externalMessageId})`);
  const result = await sendSignedWebhookRequest(payload, signingSecret);
  log('webhook', `HTTP ${result.status} in ${result.elapsedMs}ms — body=${result.text.slice(0, 500)}`);

  if (result.status !== 200) {
    fail('webhook', `expected HTTP 200, got ${result.status}.`);
    await finish();
    return;
  }
  if (result.json?.accepted !== true) {
    fail('webhook', `expected accepted:true in response JSON, got ${JSON.stringify(result.json)}.`);
    await finish();
    return;
  }
  if (result.json?.idempotentReplay !== false) {
    fail('webhook', `expected idempotentReplay:false on a fresh externalMessageId, got ${JSON.stringify(result.json?.idempotentReplay)}.`);
    await finish();
    return;
  }
  const requestId = typeof result.json?.requestId === 'string' ? result.json.requestId : null;
  if (!requestId) {
    fail('webhook', `expected a string requestId in response JSON, got ${JSON.stringify(result.json?.requestId)}.`);
    await finish();
    return;
  }
  pass('webhook', `HTTP 200, accepted=true, idempotentReplay=false, requestId=${requestId}, dispatchAccepted=${String(result.json?.dispatchAccepted)}.`);

  // Step 3 — independent DB verification: the webhookMessageAccepted audit event must exist,
  // scoped to this exact requestId + externalMessageId (never trust the HTTP response alone).
  const auditEvent = await prisma.vionaRequestAuditEvent.findFirst({
    where: {
      requestId,
      eventType: 'webhookMessageAccepted',
      payloadJson: { path: ['externalMessageId'], equals: externalMessageId },
    },
  });
  if (!auditEvent) {
    fail(
      'audit-verify',
      `no webhookMessageAccepted VionaRequestAuditEvent found for requestId=${requestId} externalMessageId=${externalMessageId}.`,
    );
    await finish();
    return;
  }
  pass(
    'audit-verify',
    `VionaRequestAuditEvent ${auditEvent.id} (createdAt=${auditEvent.createdAt.toISOString()}) confirms the round trip on the live staging system.`,
  );

  // Step 4 (opt-in) — idempotency replay: identical externalMessageId must short-circuit.
  if (checkIdempotency) {
    log('idempotency', `re-sending identical payload (externalMessageId=${externalMessageId})`);
    const replay = await sendSignedWebhookRequest(payload, signingSecret);
    log('idempotency', `HTTP ${replay.status} — body=${replay.text.slice(0, 500)}`);
    if (replay.status === 200 && replay.json?.idempotentReplay === true && replay.json?.requestId === requestId) {
      const auditCountAfter = await prisma.vionaRequestAuditEvent.count({
        where: {
          eventType: 'webhookMessageAccepted',
          payloadJson: { path: ['externalMessageId'], equals: externalMessageId },
        },
      });
      if (auditCountAfter === 1) {
        pass('idempotency', 'replay short-circuited (idempotentReplay:true), exactly 1 audit row total.');
      } else {
        fail('idempotency', `expected exactly 1 webhookMessageAccepted audit row after replay, found ${auditCountAfter}.`);
      }
    } else {
      fail('idempotency', `expected HTTP 200 + idempotentReplay:true + same requestId, got ${JSON.stringify(replay.json)}.`);
    }
  }

  // Step 5 (opt-in, recommended) — negative control: a mis-signed request must be rejected 401,
  // proving signature verification is actually active on the deployed system.
  if (checkNegative) {
    const negativePayload = buildMockPayload(`pack36a-qa-negative-${Date.now()}`);
    log('negative-control', 'sending deliberately mis-signed request (expect 401)');
    const negative = await sendSignedWebhookRequest(negativePayload, signingSecret, { badSignature: true });
    log('negative-control', `HTTP ${negative.status} — body=${negative.text.slice(0, 300)}`);
    if (negative.status === 401) {
      pass('negative-control', 'mis-signed request correctly rejected with HTTP 401 — signature verification is active.');
    } else {
      fail('negative-control', `expected HTTP 401 for a mis-signed request, got ${negative.status}.`);
    }
  }

  await finish();
}

async function finish(): Promise<void> {
  await disconnectPrisma();
  console.log('');
  if (failures === 0) {
    console.log('[pack36a-qa] ================ ALL CHECKS PASSED ================');
    console.log('[pack36a-qa] Staging webhook endpoint is verified reachable, signature-checked, and audit-logged.');
  } else {
    console.log(`[pack36a-qa] ================ ${failures} CHECK(S) FAILED ================`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[pack36a-qa] FATAL', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
