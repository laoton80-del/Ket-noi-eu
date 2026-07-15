/**
 * Pack40D2 — trusted merchant execution-principal resolver (dormant; no runtime wiring).
 *
 * Distinct from Pack40C status principal. Resolves current MerchantProfile authority inside a
 * transaction from a bounded trusted-trigger envelope only — never from client tenant/profile/scope.
 */

import {
  VionaRequestExecutionTriggerType,
  type Prisma,
} from '@prisma/client';

export const VIONA_REQUEST_EXECUTION_APPROVED_TRIGGER_TYPES = [
  VionaRequestExecutionTriggerType.signedMerchantWebhook,
  VionaRequestExecutionTriggerType.internalAuthenticatedController,
  VionaRequestExecutionTriggerType.approvedInternalDispatch,
] as const;

export type VionaRequestExecutionApprovedTriggerType =
  (typeof VIONA_REQUEST_EXECUTION_APPROVED_TRIGGER_TYPES)[number];

/**
 * Trusted server-side trigger descriptor. Pack40D3 will authenticate and construct this.
 * Pack40D2 only validates shape and recomputes current merchant authority.
 */
export type TrustedExecutionTrigger = Readonly<{
  triggerType: VionaRequestExecutionApprovedTriggerType;
  triggeringUserId: string;
  requestId: string;
  correlationId: string;
}>;

export type VionaRequestExecutionPrincipalContext = Readonly<{
  principalType: 'merchantService';
  triggerType: VionaRequestExecutionApprovedTriggerType;
  triggeringUserId: string;
  requestId: string;
  correlationId: string;
  merchantProfile: Readonly<{
    id: string;
    ownerUserId: string;
    tenantId: string;
    isActive: boolean;
  }>;
}>;

const MERCHANT_PROFILE_EXECUTION_SELECT = {
  id: true,
  ownerUserId: true,
  tenantId: true,
  isActive: true,
} as const;

export type ExecutionPrincipalMerchantProfileClient = Pick<
  Prisma.TransactionClient,
  'merchantProfile'
>;

export type ResolveVionaRequestExecutionPrincipalContextResult =
  | Readonly<{ ok: true; principal: VionaRequestExecutionPrincipalContext }>
  | Readonly<{
      ok: false;
      code: 'invalid_trusted_trigger' | 'merchant_execution_not_authorized';
    }>;

const APPROVED_TRIGGER_SET = new Set<string>(VIONA_REQUEST_EXECUTION_APPROVED_TRIGGER_TYPES);

function isApprovedTriggerType(
  value: string,
): value is VionaRequestExecutionApprovedTriggerType {
  return APPROVED_TRIGGER_SET.has(value);
}

/**
 * Validate trusted-trigger shape without DB access. Does not accept tenant/profile/scope/owner as authority.
 */
export function validateTrustedExecutionTrigger(
  trigger: TrustedExecutionTrigger,
): { ok: true; trigger: TrustedExecutionTrigger } | { ok: false; code: 'invalid_trusted_trigger' } {
  if (trigger == null || typeof trigger !== 'object') {
    return { ok: false, code: 'invalid_trusted_trigger' };
  }
  if (!isApprovedTriggerType(trigger.triggerType)) {
    return { ok: false, code: 'invalid_trusted_trigger' };
  }
  const triggeringUserId =
    typeof trigger.triggeringUserId === 'string' ? trigger.triggeringUserId.trim() : '';
  const requestId = typeof trigger.requestId === 'string' ? trigger.requestId.trim() : '';
  const correlationId =
    typeof trigger.correlationId === 'string' ? trigger.correlationId.trim() : '';
  if (triggeringUserId.length === 0 || requestId.length === 0 || correlationId.length === 0) {
    return { ok: false, code: 'invalid_trusted_trigger' };
  }
  return {
    ok: true,
    trigger: {
      triggerType: trigger.triggerType,
      triggeringUserId,
      requestId,
      correlationId,
    },
  };
}

/**
 * Resolve merchant execution principal inside an interactive transaction.
 * Loads MerchantProfile by trusted owner identity on the supplied tx client only.
 */
export async function resolveVionaRequestExecutionPrincipalContext(
  trigger: TrustedExecutionTrigger,
  tx: ExecutionPrincipalMerchantProfileClient,
): Promise<ResolveVionaRequestExecutionPrincipalContextResult> {
  const validated = validateTrustedExecutionTrigger(trigger);
  if (!validated.ok) {
    return validated;
  }

  const profile = await tx.merchantProfile.findUnique({
    where: { ownerUserId: validated.trigger.triggeringUserId },
    select: MERCHANT_PROFILE_EXECUTION_SELECT,
  });

  if (profile == null) {
    return { ok: false, code: 'merchant_execution_not_authorized' };
  }

  return {
    ok: true,
    principal: {
      principalType: 'merchantService',
      triggerType: validated.trigger.triggerType,
      triggeringUserId: validated.trigger.triggeringUserId,
      requestId: validated.trigger.requestId,
      correlationId: validated.trigger.correlationId,
      merchantProfile: profile,
    },
  };
}
