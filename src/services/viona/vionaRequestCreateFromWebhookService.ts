/**
 * Pack35 — B2B Omni-Channel Webhook & Agent Routing: webhook-message `VionaRequest` creation.
 *
 * A new, dedicated creation path — **parallel to, never a modification of**, the existing
 * `createVionaRequest()` (`vionaRequestCreateService.ts`, Pack19). That path's 6 mandatory
 * safety labels and forbidden-body-key list (including `webhook`, `ai`, `merchant`) were designed
 * for an internal, JWT-authenticated QA harness — not real, unattended omni-channel traffic. See
 * docs/product/VIONA_PACK35_B2B_WEBHOOK_ROUTING_PLAN.md §5.2 step 5 / §5.3.
 *
 * `sourceUniverse` uses a new literal, `'viona_omni_channel_webhook'`, that this file never adds
 * to the shared `vionaRequestUniverses` domain array — `VionaRequest.sourceUniverse` is a plain
 * Prisma `String` column (no DB-level enum constraint), and every existing reader
 * (`vionaRequestReadSerializer.ts`'s `isVionaRequestUniverse()` type guard) already falls back
 * gracefully to a generic, non-throwing safety note for any unrecognized value — so this
 * increment needs zero change to that shared domain file.
 *
 * Idempotency mirrors `vionaRequestCreateService.ts`'s existing, live pattern exactly: scan
 * `VionaRequestAuditEvent` for a `webhookMessageAccepted` row whose `payloadJson.externalMessageId`
 * already matches, keyed by the provider's own `externalMessageId` (plan §6.1) instead of a
 * caller-supplied `idempotencyKey` — the same scan shape, a different key name, because a webhook
 * caller can never supply its own idempotency key the way an authenticated API caller can.
 */

import type { Prisma } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';

const MESSAGE_TEXT_MAX_LENGTH = 4000;
const TITLE_MAX_LENGTH = 200;
const EXTERNAL_ID_MAX_LENGTH = 200;

/** New, Pack35-only literal — see module header for why `vionaRequestTypes.ts` is untouched. */
export const VIONA_WEBHOOK_SOURCE_UNIVERSE = 'viona_omni_channel_webhook' as const;
export const VIONA_WEBHOOK_REQUEST_TYPE = 'omni_channel_webhook_message' as const;
export const VIONA_WEBHOOK_INITIAL_STATUS = 'submitted' as const;
export const VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE = 'webhookMessageAccepted' as const;

export type CreateVionaRequestFromWebhookMessageInput = Readonly<{
  tenantId: string;
  merchantOwnerUserId: string;
  channelType: string;
  channelExternalId: string;
  externalMessageId: string;
  fromExternalContactId: string;
  messageText: string;
}>;

export type CreateVionaRequestFromWebhookMessageFailure = 'invalid_input';

export type CreateVionaRequestFromWebhookMessageResult =
  | Readonly<{
      ok: true;
      requestId: string;
      requestStatus: typeof VIONA_WEBHOOK_INITIAL_STATUS;
      idempotentReplay: boolean;
    }>
  | Readonly<{ ok: false; reason: CreateVionaRequestFromWebhookMessageFailure }>;

function isNonEmptyTrimmed(value: string): boolean {
  return value.trim().length > 0;
}

function deriveTitle(messageText: string): string {
  const trimmed = messageText.trim();
  return trimmed.length > TITLE_MAX_LENGTH ? `${trimmed.slice(0, TITLE_MAX_LENGTH - 1)}…` : trimmed;
}

async function findIdempotentWebhookRequest(
  externalMessageId: string,
): Promise<Readonly<{ requestId: string }> | null> {
  const existing = await getPrisma().vionaRequestAuditEvent.findFirst({
    where: {
      eventType: VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE,
      payloadJson: { path: ['externalMessageId'], equals: externalMessageId },
    },
    select: { requestId: true },
  });
  return existing == null ? null : { requestId: existing.requestId };
}

/**
 * Creates exactly one `VionaRequest` row per distinct `externalMessageId` (idempotent — see
 * module header). Performs no dispatch, no status transition beyond the fixed initial
 * `'submitted'`, and no downstream Pack31/Pack32 call of its own; the caller (the webhook
 * controller) is responsible for those, and — critically — must skip them entirely when
 * `idempotentReplay: true` is returned (plan §5.2 step 4 / §6.1: "no duplicate `VionaRequest`, no
 * duplicate dispatch").
 */
export async function createVionaRequestFromWebhookMessage(
  input: CreateVionaRequestFromWebhookMessageInput,
): Promise<CreateVionaRequestFromWebhookMessageResult> {
  const tenantId = input.tenantId.trim();
  const merchantOwnerUserId = input.merchantOwnerUserId.trim();
  const channelType = input.channelType.trim();
  const channelExternalId = input.channelExternalId.trim();
  const externalMessageId = input.externalMessageId.trim();
  const fromExternalContactId = input.fromExternalContactId.trim();
  const messageText = input.messageText.trim();

  if (
    !isNonEmptyTrimmed(tenantId) ||
    !isNonEmptyTrimmed(merchantOwnerUserId) ||
    !isNonEmptyTrimmed(channelType) ||
    !isNonEmptyTrimmed(channelExternalId) ||
    !isNonEmptyTrimmed(externalMessageId) ||
    !isNonEmptyTrimmed(messageText) ||
    externalMessageId.length > EXTERNAL_ID_MAX_LENGTH ||
    messageText.length > MESSAGE_TEXT_MAX_LENGTH
  ) {
    return { ok: false, reason: 'invalid_input' };
  }

  const existing = await findIdempotentWebhookRequest(externalMessageId);
  if (existing != null) {
    return {
      ok: true,
      requestId: existing.requestId,
      requestStatus: VIONA_WEBHOOK_INITIAL_STATUS,
      idempotentReplay: true,
    };
  }

  const metadataJson: Prisma.InputJsonValue = {
    createdVia: 'pack35-webhook-merchant-agent',
    channelType,
    channelExternalId,
    fromExternalContactId: fromExternalContactId.length > 0 ? fromExternalContactId : null,
    externalMessageId,
  };

  const auditPayload: Prisma.InputJsonValue = {
    externalMessageId,
    channelType,
    channelExternalId,
  };

  const created = await getPrisma().$transaction(async (tx) => {
    const request = await tx.vionaRequest.create({
      data: {
        tenantId,
        requesterUserId: merchantOwnerUserId,
        ownerUserId: merchantOwnerUserId,
        sourceUniverse: VIONA_WEBHOOK_SOURCE_UNIVERSE,
        sourceFeature: channelType,
        requestType: VIONA_WEBHOOK_REQUEST_TYPE,
        status: VIONA_WEBHOOK_INITIAL_STATUS,
        title: deriveTitle(messageText),
        summary: messageText,
        metadataJson,
      },
      select: { id: true },
    });

    await tx.vionaRequestAuditEvent.create({
      data: {
        requestId: request.id,
        eventType: VIONA_WEBHOOK_CREATE_AUDIT_EVENT_TYPE,
        actorUserId: merchantOwnerUserId,
        actorRoleLabel: 'merchant-webhook-channel',
        message: 'VionaRequest created from an inbound, signature-verified merchant webhook message.',
        payloadJson: auditPayload,
      },
    });

    return { requestId: request.id };
  });

  return {
    ok: true,
    requestId: created.requestId,
    requestStatus: VIONA_WEBHOOK_INITIAL_STATUS,
    idempotentReplay: false,
  };
}
