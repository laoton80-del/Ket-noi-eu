/**
 * Pack34 — B2B Merchant Gateway: `MerchantProfile` CRUD/read service.
 *
 * See docs/product/VIONA_PACK34_B2B_MERCHANT_GATEWAY_PLAN.md §3/§8. Idempotent create mirrors
 * `createWalletForUser()`'s exact pattern (`WalletService.ts`): find-or-create by the row's
 * `@unique` owner column, catching a `P2002` race as a benign "already exists" rather than an
 * error.
 *
 * Deliberately does NOT expose any way to flip `isActive` to `true` — the plan's §9 non-goals
 * explicitly defer the activation workflow (who may activate a profile, under what approval) to
 * a future, separately-reviewed increment. Every profile this service creates starts, and stays,
 * `isActive: false` until that future workflow ships.
 */

import { Prisma, type MerchantProfile } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import { findVionaToolRegistryEntry } from '../../lib/viona/dispatcher/vionaToolRegistry';
import type { VionaMerchantAiPersona } from '../../lib/viona/merchant/vionaMerchantAiPersonaTypes';

export type CreateMerchantProfileInput = Readonly<{
  ownerUserId: string;
  tenantId: string;
  displayName: string;
  countryCode?: string;
  defaultLocale?: string;
}>;

export type CreateMerchantProfileResult =
  | Readonly<{ ok: true; merchantProfileId: string; created: boolean }>
  | Readonly<{ ok: false; reason: 'invalid_input' | 'tenant_id_taken' }>;

function isNonEmptyTrimmed(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Idempotent — a second call with the same `ownerUserId` returns the existing row (`created:
 * false`) rather than erroring, exactly like `createWalletForUser()`. Returns `tenant_id_taken`
 * (never throws) if a *different* owner already claimed the requested `tenantId` — `tenantId` is
 * `@unique`, so this is the one condition an idempotent-by-`ownerUserId` create cannot silently
 * resolve on behalf of the caller.
 */
export async function createMerchantProfile(
  input: CreateMerchantProfileInput,
): Promise<CreateMerchantProfileResult> {
  const ownerUserId = input.ownerUserId.trim();
  const tenantId = input.tenantId.trim();
  const displayName = input.displayName.trim();

  if (!isNonEmptyTrimmed(ownerUserId) || !isNonEmptyTrimmed(tenantId) || !isNonEmptyTrimmed(displayName)) {
    return { ok: false, reason: 'invalid_input' };
  }

  const prisma = getPrisma();

  const existingByOwner = await prisma.merchantProfile.findUnique({ where: { ownerUserId } });
  if (existingByOwner) {
    return { ok: true, merchantProfileId: existingByOwner.id, created: false };
  }

  try {
    const created = await prisma.merchantProfile.create({
      data: {
        ownerUserId,
        tenantId,
        displayName,
        countryCode: input.countryCode?.trim() || null,
        defaultLocale: input.defaultLocale?.trim() || null,
      },
    });
    return { ok: true, merchantProfileId: created.id, created: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // Race-safe re-check for the ownerUserId branch (mirrors createWalletForUser()).
      const raced = await prisma.merchantProfile.findUnique({ where: { ownerUserId } });
      if (raced) {
        return { ok: true, merchantProfileId: raced.id, created: false };
      }
      // ownerUserId did not race — the conflict must be the tenantId unique constraint instead.
      return { ok: false, reason: 'tenant_id_taken' };
    }
    throw error;
  }
}

export async function findMerchantProfileByTenantId(tenantId: string): Promise<MerchantProfile | null> {
  const trimmed = tenantId.trim();
  if (!isNonEmptyTrimmed(trimmed)) return null;
  return getPrisma().merchantProfile.findUnique({ where: { tenantId: trimmed } });
}

export async function findMerchantProfileByOwnerUserId(ownerUserId: string): Promise<MerchantProfile | null> {
  const trimmed = ownerUserId.trim();
  if (!isNonEmptyTrimmed(trimmed)) return null;
  return getPrisma().merchantProfile.findUnique({ where: { ownerUserId: trimmed } });
}

/**
 * Pack37 — B2B Dispatcher Realization: additive, id-keyed read lookup (see
 * docs/product/VIONA_PACK37_B2B_DISPATCHER_REALIZATION_PLAN.md §4.4/§8). Added because
 * `ResolvedVionaWebhookChannel` (Pack35) already carries `merchantProfileId` all the way to the
 * dispatcher's input, so a future persona-resolution call site can look the row up directly by id
 * without requiring any change to `vionaWebhookChannelResolutionService.ts`.
 */
export async function findMerchantProfileById(id: string): Promise<MerchantProfile | null> {
  const trimmed = id.trim();
  if (!isNonEmptyTrimmed(trimmed)) return null;
  return getPrisma().merchantProfile.findUnique({ where: { id: trimmed } });
}

export type UpdateMerchantProfileAiPersonaResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: 'not_found' }>;

/** Owner-scoped — the update's `where` requires both `ownerUserId` and the row's `id` to match. */
export async function updateMerchantProfileAiPersona(
  ownerUserId: string,
  aiPersona: VionaMerchantAiPersona,
): Promise<UpdateMerchantProfileAiPersonaResult> {
  const trimmedOwnerUserId = ownerUserId.trim();
  if (!isNonEmptyTrimmed(trimmedOwnerUserId)) {
    return { ok: false, reason: 'not_found' };
  }
  const updated = await getPrisma().merchantProfile.updateMany({
    where: { ownerUserId: trimmedOwnerUserId },
    data: { aiPersona: aiPersona as unknown as Prisma.InputJsonValue },
  });
  return updated.count === 1 ? { ok: true } : { ok: false, reason: 'not_found' };
}

export type UpdateMerchantProfileToolScopeResult =
  | Readonly<{ ok: true; toolScope: readonly string[] }>
  | Readonly<{ ok: false; reason: 'not_found' | 'unknown_tool'; unknownToolName?: string }>;

/**
 * Owner-scoped. Every proposed tool name must resolve against the existing, unmodified
 * `VIONA_TOOL_REGISTRY` (`findVionaToolRegistryEntry()`, exact-match only) — a merchant can never
 * be granted a tool name that does not exist, closing off a trivial typo/hallucination-shaped
 * privilege-escalation path before it can reach any future dispatch call site.
 */
export async function updateMerchantProfileToolScope(
  ownerUserId: string,
  toolScope: readonly string[],
): Promise<UpdateMerchantProfileToolScopeResult> {
  const trimmedOwnerUserId = ownerUserId.trim();
  if (!isNonEmptyTrimmed(trimmedOwnerUserId)) {
    return { ok: false, reason: 'not_found' };
  }

  const normalized = Array.from(new Set(toolScope.map((name) => name.trim()).filter((name) => name.length > 0)));
  for (const toolName of normalized) {
    if (findVionaToolRegistryEntry(toolName) === null) {
      return { ok: false, reason: 'unknown_tool', unknownToolName: toolName };
    }
  }

  const updated = await getPrisma().merchantProfile.updateMany({
    where: { ownerUserId: trimmedOwnerUserId },
    data: { toolScope: normalized },
  });
  return updated.count === 1 ? { ok: true, toolScope: normalized } : { ok: false, reason: 'not_found' };
}
