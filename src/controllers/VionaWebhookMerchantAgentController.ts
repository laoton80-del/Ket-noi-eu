/**
 * Pack35 — B2B Omni-Channel Webhook & Agent Routing: inbound merchant-agent webhook handler.
 *
 * POST `/api/viona/webhooks/merchant-agent` — raw JSON body (see `app.ts`); **no JWT** — channel
 * signature only. See docs/product/VIONA_PACK35_B2B_WEBHOOK_ROUTING_PLAN.md §3/§5.2.
 *
 * Ordering is deliberate and load-bearing (see `vionaWebhookChannelResolutionService.ts` module
 * header): existence lookup -> signature verification -> active/tenant gate -> create -> dispatch.
 */

import type { Request, Response } from 'express';

import { deriveVionaWebhookStandingApprovalFlags } from '../lib/viona/merchant/vionaMerchantWebhookApprovalGate';
import {
  routeVionaDispatchIntent,
  defaultVionaDispatchCallLlm,
  type VionaIntentRouterCallLlm,
} from '../lib/viona/dispatcher/vionaIntentRouter';
import {
  assertVionaWebhookChannelGate,
  resolveVionaWebhookChannel,
  type ResolvedVionaWebhookChannel,
} from '../services/viona/vionaWebhookChannelResolutionService';
import {
  createVionaRequestFromWebhookMessage,
  VIONA_WEBHOOK_INITIAL_STATUS,
} from '../services/viona/vionaRequestCreateFromWebhookService';
import {
  dispatchVionaAutonomousRequest,
  type DispatchVionaAutonomousRequestResult,
} from '../services/viona/vionaAutonomousDispatchService';
import {
  verifyVionaWebhookSignature,
  type VerifyVionaWebhookSignatureResult,
} from '../services/viona/vionaWebhookSignatureVerificationService';

export const VIONA_WEBHOOK_SIGNATURE_HEADER = 'x-viona-webhook-signature';

export type VionaWebhookMerchantAgentRequestBody = Readonly<{
  channelType: string;
  channelExternalId: string;
  externalMessageId: string;
  fromExternalContactId?: string;
  messageText: string;
  receivedAtIso?: string;
}>;

export type VionaWebhookMerchantAgentControllerDeps = Readonly<{
  resolveChannel?: typeof resolveVionaWebhookChannel;
  verifySignature?: (
    rawBody: Buffer,
    signatureHeader: string | undefined,
    signingSecret: string,
    nowMs?: () => number,
  ) => VerifyVionaWebhookSignatureResult;
  assertChannelGate?: typeof assertVionaWebhookChannelGate;
  createFromWebhook?: typeof createVionaRequestFromWebhookMessage;
  routeIntent?: typeof routeVionaDispatchIntent;
  dispatch?: typeof dispatchVionaAutonomousRequest;
  callLlm?: VionaIntentRouterCallLlm;
  nowMs?: () => number;
}>;

function readRawBuffer(req: Request): Buffer {
  const body = req.body;
  if (Buffer.isBuffer(body)) return body;
  if (typeof body === 'string') return Buffer.from(body, 'utf8');
  return Buffer.alloc(0);
}

function readSignatureHeader(req: Request): string | undefined {
  const raw = req.headers[VIONA_WEBHOOK_SIGNATURE_HEADER];
  if (Array.isArray(raw)) return raw[0];
  return typeof raw === 'string' ? raw : undefined;
}

function parseWebhookBody(raw: Buffer): VionaWebhookMerchantAgentRequestBody | null {
  try {
    const parsed = JSON.parse(raw.toString('utf8')) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    const channelType = typeof record.channelType === 'string' ? record.channelType : '';
    const channelExternalId = typeof record.channelExternalId === 'string' ? record.channelExternalId : '';
    const externalMessageId = typeof record.externalMessageId === 'string' ? record.externalMessageId : '';
    const messageText = typeof record.messageText === 'string' ? record.messageText : '';
    const fromExternalContactId =
      typeof record.fromExternalContactId === 'string' ? record.fromExternalContactId : '';
    const receivedAtIso = typeof record.receivedAtIso === 'string' ? record.receivedAtIso : undefined;
    if (
      channelType.trim().length === 0 ||
      channelExternalId.trim().length === 0 ||
      externalMessageId.trim().length === 0 ||
      messageText.trim().length === 0
    ) {
      return null;
    }
    return {
      channelType,
      channelExternalId,
      externalMessageId,
      fromExternalContactId,
      messageText,
      receivedAtIso,
    };
  } catch {
    return null;
  }
}

function resolvePreDispatchToolName(
  decision: Awaited<ReturnType<typeof routeVionaDispatchIntent>>,
): string | null {
  return decision.ok ? decision.toolName : null;
}

/**
 * Core handler — injectable deps for the Pack35 test suite (spy-based fakes, no real network/DB).
 */
export async function postVionaWebhookMerchantAgent(
  req: Request,
  res: Response,
  deps: VionaWebhookMerchantAgentControllerDeps = {},
): Promise<void> {
  const resolveChannelFn = deps.resolveChannel ?? resolveVionaWebhookChannel;
  const verifySignatureFn = deps.verifySignature ?? verifyVionaWebhookSignature;
  const assertChannelGateFn = deps.assertChannelGate ?? assertVionaWebhookChannelGate;
  const createFromWebhookFn = deps.createFromWebhook ?? createVionaRequestFromWebhookMessage;
  const routeIntentFn = deps.routeIntent ?? routeVionaDispatchIntent;
  const dispatchFn = deps.dispatch ?? dispatchVionaAutonomousRequest;
  const nowMs = deps.nowMs ?? Date.now;
  const callLlm: VionaIntentRouterCallLlm = deps.callLlm ?? defaultVionaDispatchCallLlm;

  const raw = readRawBuffer(req);
  const body = parseWebhookBody(raw);
  if (body == null) {
    res.status(400).type('text/plain').send('Invalid webhook payload');
    return;
  }

  const resolved = await resolveChannelFn(body.channelType, body.channelExternalId);
  if (!resolved.ok) {
    res.status(404).type('text/plain').send('Channel not found');
    return;
  }

  const channel: ResolvedVionaWebhookChannel = resolved.channel;
  const signatureCheck = verifySignatureFn(raw, readSignatureHeader(req), channel.signingSecretHash, nowMs);
  if (!signatureCheck.ok) {
    res.status(401).type('text/plain').send('Invalid signature');
    return;
  }

  const gate = assertChannelGateFn(channel);
  if (!gate.ok) {
    res.status(403).type('text/plain').send('Channel not authorized');
    return;
  }

  const created = await createFromWebhookFn({
    tenantId: channel.tenantId,
    merchantOwnerUserId: channel.merchantOwnerUserId,
    channelType: channel.channelType,
    channelExternalId: channel.channelExternalId,
    externalMessageId: body.externalMessageId,
    fromExternalContactId: body.fromExternalContactId ?? '',
    messageText: body.messageText,
  });

  if (!created.ok) {
    res.status(400).type('text/plain').send('Invalid webhook payload');
    return;
  }

  if (created.idempotentReplay) {
    res.status(200).json({ accepted: true, idempotentReplay: true, requestId: created.requestId });
    return;
  }

  const intentDecision = await routeIntentFn(
    {
      requestId: created.requestId,
      requestStatus: created.requestStatus,
      userMessage: body.messageText.trim(),
    },
    { callLlm },
  );

  const approvalFlags = deriveVionaWebhookStandingApprovalFlags({
    standingApprovalForReadOnlyToolsOnly: channel.standingApprovalForReadOnlyToolsOnly,
    resolvedToolName: resolvePreDispatchToolName(intentDecision),
    merchantToolScope: channel.merchantToolScope,
  });

  let dispatchResult: DispatchVionaAutonomousRequestResult;
  try {
    dispatchResult = await dispatchFn(
      {
        authUserId: channel.merchantOwnerUserId,
        requestId: created.requestId,
        requestStatus: VIONA_WEBHOOK_INITIAL_STATUS,
        userMessage: body.messageText.trim(),
        operatorApprovalGranted: approvalFlags.operatorApprovalGranted,
        userConsentGranted: approvalFlags.userConsentGranted,
        idempotencyKey: body.externalMessageId.trim(),
        // Pack37 — required for the 2 merchant-read-only-query tools' own new switch cases
        // (`vionaAutonomousDispatchService.ts`); the pre-existing `twilio_test_sms_poc` case never
        // reads this field, so this is purely additive from that case's point of view.
        merchantContext: { tenantId: channel.tenantId, merchantProfileId: channel.merchantProfileId },
        // Pack39 — reuse the exact decision `routeIntentFn` (above) already computed for this same
        // message instead of letting `dispatchFn` reclassify internally: this is the *only* real
        // classification call for the whole request now, and it eliminates the decision-drift
        // window between the consent flags above and the tool that actually executes (see
        // docs/product/VIONA_PACK39_TECH_DEBT_ERADICATION_PLAN.md §2.1/§4.1).
        precomputedIntentDecision: intentDecision,
      },
      { callLlm },
    );
  } catch {
    res.status(500).type('text/plain').send('Dispatch failed');
    return;
  }

  if (!dispatchResult.ok) {
    res.status(400).type('text/plain').send('Dispatch rejected');
    return;
  }

  // Pack37 — additive, optional field: present only when the accepted tool was a merchant
  // read-only query; `null` for every other path (including `twilio_test_sms_poc` and every
  // rejected dispatch) — see docs/product/VIONA_PACK37_B2B_DISPATCHER_REALIZATION_PLAN.md §6.2.
  const merchantQueryResult =
    dispatchResult.route !== null && dispatchResult.route.kind === 'merchantReadOnlyQuery'
      ? {
          toolName: dispatchResult.route.result.toolName,
          dataAvailable: dispatchResult.route.result.dataAvailable,
          replyText: dispatchResult.route.result.replyText,
        }
      : null;

  res.status(200).json({
    accepted: true,
    idempotentReplay: false,
    requestId: created.requestId,
    dispatchAccepted: dispatchResult.dispatch.accepted === true,
    merchantQueryResult,
  });
}
