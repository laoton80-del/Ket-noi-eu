/**
 * Pack32 — Agentic Autonomous Dispatcher: orchestrator (mock-only downstream by default; the one
 * real-provider call it can reach — Twilio Test Credentials — is the existing, unmodified
 * Pack30D-4 POC, itself still hard-gated by `PACK30_REAL_PROVIDER_EXECUTION_ENABLED`).
 *
 * Wires exactly the connection flow required by
 * docs/product/VIONA_PACK32_AUTONOMOUS_DISPATCHER_PLAN.md §4:
 *
 *   Intent Router (NEW) -> Tool Registry lookup (NEW) -> buildVionaExecutionPlan() (EXISTING,
 *   reached inside the call below) -> Pack31 hold (EXISTING) -> Pack30D-4 executeReal()
 *   (EXISTING) -> Pack31 settle/refund (EXISTING).
 *
 * This file adds **no** new hold/execute/settle logic of its own — after classification and
 * registry validation, it delegates the entire plan->hold->execute->settle chain to the existing,
 * byte-for-byte-unmodified `previewVionaExecutionPlanRealProviderPocRoute()`
 * (`vionaExecutionPlanRouteService.ts`, Pack30D-4 + Pack31).
 *
 * Human-in-the-Loop Consent Principle (Kernel §16 Level 3; plan §3.4): `operatorApprovalGranted`
 * and `userConsentGranted` below are **always** the caller-supplied, human-originated booleans —
 * this file never derives, infers, or defaults them from the LLM's decision, confidence, or
 * rationale. Grep-verifiable: this file assigns those two fields exactly once each, both times
 * from `input.operatorApprovalGranted`/`input.userConsentGranted` directly.
 *
 * Not wired to any HTTP route/controller in this increment — service-layer only, mirroring
 * Pack30D-4's own scope decision (plan §5.1, §9).
 *
 * Pack37 — B2B Dispatcher Realization (see
 * docs/product/VIONA_PACK37_B2B_DISPATCHER_REALIZATION_PLAN.md §3) adds 2 new, additive switch
 * cases for the 2 Pack34 `'merchant_read_only_query'` tools, delegating to the new, sibling
 * `executeMerchantReadOnlyQuery()` (`vionaMerchantReadOnlyQueryExecutionService.ts`) — never to
 * `previewVionaExecutionPlanRealProviderPocRoute()`. `route`'s type is broadened from a single
 * Twilio/escrow-shaped result to a `kind`-tagged union (`VionaDispatchRoute` below); the existing
 * `'twilio_test_sms_poc'` case's own inner logic and downstream call are byte-for-byte unchanged —
 * only its returned `route` value is now wrapped as `{ kind: 'twilioTestSmsPoc', result: ... }`.
 */

import { appendVionaExecutionAuditEvent } from './vionaExecutionAuditWriteService';
import {
  previewVionaExecutionPlanRealProviderPocRoute,
  type PreviewVionaExecutionPlanRealProviderPocResult,
} from './vionaExecutionPlanRouteService';
import {
  executeMerchantReadOnlyQuery,
  type VionaMerchantReadOnlyQueryResult,
  type VionaMerchantReadOnlyQueryToolName,
} from './vionaMerchantReadOnlyQueryExecutionService';
import { findVionaToolRegistryEntry } from '../../lib/viona/dispatcher/vionaToolRegistry';
import {
  routeVionaDispatchIntent,
  defaultVionaDispatchCallLlm,
  type VionaDispatchRejectionReason,
  type VionaIntentRouterCallLlm,
} from '../../lib/viona/dispatcher/vionaIntentRouter';
import type { VionaRequestAuditEventType } from '../../domain/requests/vionaRequestAuditEventTypes';

export type DispatchVionaAutonomousRequestInput = Readonly<{
  authUserId: string;
  requestId: string;
  requestStatus: string;
  actionId?: string;
  requestSafetyLabels?: readonly string[];
  /** The natural-language request/intent text the Intent Router must classify. */
  userMessage: string;
  /** Human-supplied only — see module header. Never inferred from the LLM's output. */
  operatorApprovalGranted: boolean;
  /** Human-supplied only — see module header. Never inferred from the LLM's output. */
  userConsentGranted: boolean;
  idempotencyKey?: string | null;
  /** Pack37, additive, optional. Required only to accept a `'merchant_read_only_query'` tool —
   *  omitted (`undefined`) preserves every existing caller's behavior exactly: the
   *  `'twilio_test_sms_poc'` case never reads this field, and a merchant-tool dispatch with no
   *  `merchantContext` fails closed (`merchant_context_missing`) rather than guessing a tenant. */
  merchantContext?: Readonly<{ tenantId: string; merchantProfileId: string }> | null;
}>;

export type DispatchVionaAutonomousRequestFailure = 'invalid_input';

/** Pack37, additive: every existing `VionaDispatchRejectionReason` value, plus one new,
 *  dispatch-time-only reason for a merchant-tool match with no `merchantContext` supplied. */
export type VionaDispatchExecutionRejectionReason = VionaDispatchRejectionReason | 'merchant_context_missing';

/** Pack37, additive: tags which downstream execution path produced `route`, so a future caller
 *  can distinguish the Twilio/escrow shape from the merchant-read-only-query shape without an
 *  unsafe cast. The existing `'twilio_test_sms_poc'` case's own result type is unchanged — only
 *  wrapped. */
export type VionaDispatchRoute =
  | Readonly<{ kind: 'twilioTestSmsPoc'; result: PreviewVionaExecutionPlanRealProviderPocResult }>
  | Readonly<{ kind: 'merchantReadOnlyQuery'; result: VionaMerchantReadOnlyQueryResult }>;

export type DispatchVionaAutonomousRequestResult =
  | Readonly<{
      ok: true;
      requestId: string;
      dispatch: Readonly<{ accepted: true; toolName: string; confidence: number }>;
      route: VionaDispatchRoute;
    }>
  | Readonly<{
      ok: true;
      requestId: string;
      dispatch: Readonly<{ accepted: false; reason: VionaDispatchExecutionRejectionReason }>;
      route: null;
    }>
  | Readonly<{ ok: false; reason: DispatchVionaAutonomousRequestFailure }>;

export type VionaAutonomousDispatchServiceDeps = Readonly<{
  callLlm?: VionaIntentRouterCallLlm;
  auditWriter?: typeof appendVionaExecutionAuditEvent;
  routeExecutor?: typeof previewVionaExecutionPlanRealProviderPocRoute;
  /** Pack37, additive — injectable for tests, mirrors `routeExecutor`'s own shape. */
  executeMerchantQuery?: typeof executeMerchantReadOnlyQuery;
}>;

function resolveRejectionAuditEventType(
  reason: VionaDispatchRejectionReason,
): VionaRequestAuditEventType {
  return reason === 'unknown_tool' ? 'dispatcherHallucinationBlocked' : 'dispatcherIntentRejected';
}

/**
 * Classifies a natural-language intent, validates it against the Tool Registry, then — only for
 * an accepted, schema-valid decision — delegates to the existing, unmodified Pack30D-4/Pack31
 * pipeline for the matched tool. Every rejection writes exactly one audit row and returns before
 * any downstream Pack31/Pack30D call is ever made.
 */
export async function dispatchVionaAutonomousRequest(
  input: DispatchVionaAutonomousRequestInput,
  deps: VionaAutonomousDispatchServiceDeps = {},
): Promise<DispatchVionaAutonomousRequestResult> {
  const authUserId = input.authUserId.trim();
  const requestId = input.requestId.trim();
  const requestStatus = input.requestStatus.trim();
  const userMessage = input.userMessage.trim();

  if (
    authUserId.length === 0 ||
    requestId.length === 0 ||
    requestStatus.length === 0 ||
    userMessage.length === 0
  ) {
    return { ok: false, reason: 'invalid_input' };
  }

  const callLlm = deps.callLlm ?? defaultVionaDispatchCallLlm;
  const auditWriter = deps.auditWriter ?? appendVionaExecutionAuditEvent;
  const routeExecutor = deps.routeExecutor ?? previewVionaExecutionPlanRealProviderPocRoute;
  const executeMerchantQuery = deps.executeMerchantQuery ?? executeMerchantReadOnlyQuery;

  const decision = await routeVionaDispatchIntent(
    {
      requestId,
      requestStatus,
      actionId: input.actionId,
      requestSafetyLabels: input.requestSafetyLabels,
      userMessage,
    },
    { callLlm },
  );

  if (!decision.ok) {
    const auditResult = await auditWriter({
      requestId,
      eventType: resolveRejectionAuditEventType(decision.reason),
      actorUserId: authUserId,
      actorRoleLabel: null,
      message: `Pack32 dispatcher rejected intent (${decision.reason}) — zero downstream Pack31/Pack30D calls made.`,
      payloadJson: { reason: decision.reason },
    });
    if (!auditResult.ok) {
      console.error(
        `[pack32-dispatcher] failed to append intent-rejected audit event for request ${requestId}: ${auditResult.error}`,
      );
    }
    return { ok: true, requestId, dispatch: { accepted: false, reason: decision.reason }, route: null };
  }

  // Defensive re-check: `decision.ok === true` already guarantees `routeVionaDispatchIntent`
  // matched a registered entry, but this file never trusts a prior async result's referential
  // integrity blindly — an entry vanishing between validation and dispatch is still a hard stop,
  // never a "proceed anyway".
  const entry = findVionaToolRegistryEntry(decision.toolName);
  if (!entry) {
    const auditResult = await auditWriter({
      requestId,
      eventType: 'dispatcherHallucinationBlocked',
      actorUserId: authUserId,
      actorRoleLabel: null,
      message: 'Pack32 dispatcher: matched tool no longer present in the registry — hard stop.',
      payloadJson: { toolName: decision.toolName },
    });
    if (!auditResult.ok) {
      console.error(
        `[pack32-dispatcher] failed to append hallucination-blocked audit event for request ${requestId}: ${auditResult.error}`,
      );
    }
    return { ok: true, requestId, dispatch: { accepted: false, reason: 'unknown_tool' }, route: null };
  }

  const toolSelectedAudit = await auditWriter({
    requestId,
    eventType: 'dispatcherToolSelected',
    actorUserId: authUserId,
    actorRoleLabel: null,
    message: `Pack32 dispatcher selected tool "${entry.name}" (confidence ${decision.confidence.toFixed(2)}).`,
    payloadJson: {
      toolName: entry.name,
      linkedActionId: entry.linkedActionId,
      confidence: decision.confidence,
      rationale: decision.rationale,
    },
  });
  if (!toolSelectedAudit.ok) {
    console.error(
      `[pack32-dispatcher] failed to append tool-selected audit event for request ${requestId}: ${toolSelectedAudit.error}`,
    );
  }

  // This switch is the single, explicit place each registered tool's `toolInput` mapping onto its
  // own downstream call is added. `'twilio_test_sms_poc'` (Pack32) delegates to the existing
  // Pack31 escrow / Pack30D-4 pipeline; the 2 `'merchant_read_only_query'` tools (Pack37) delegate
  // to the new, sibling `executeMerchantQuery()` instead — structurally isolated from that
  // pipeline (module header).
  switch (entry.name) {
    case 'twilio_test_sms_poc': {
      const toolInput = decision.toolInput as Readonly<{
        fromNumber: string;
        toNumber: string;
        body: string;
      }>;
      const twilioRoute = await routeExecutor({
        authUserId,
        requestId,
        actionId: entry.linkedActionId,
        operatorApprovalGranted: input.operatorApprovalGranted === true,
        userConsentGranted: input.userConsentGranted === true,
        requestSafetyLabels: input.requestSafetyLabels,
        idempotencyKey: input.idempotencyKey,
        fromNumber: toolInput.fromNumber,
        toNumber: toolInput.toNumber,
        body: toolInput.body,
      });
      return {
        ok: true,
        requestId,
        dispatch: { accepted: true, toolName: entry.name, confidence: decision.confidence },
        route: { kind: 'twilioTestSmsPoc', result: twilioRoute },
      };
    }
    case 'merchant_schedule_availability_check':
    case 'merchant_inventory_stock_check': {
      // Defensive re-check, mirroring this file's own existing discipline (see the entry-lookup
      // re-check above): this switch is keyed on `entry.name`, but a future registry edit that
      // repurposes one of these 2 names without updating this switch must fail loudly here, never
      // silently execute a merchant query for a tool that is not actually
      // `'merchant_read_only_query'`.
      if (entry.category !== 'merchant_read_only_query') {
        return { ok: true, requestId, dispatch: { accepted: false, reason: 'unknown_tool' }, route: null };
      }
      if (!input.merchantContext) {
        const auditResult = await auditWriter({
          requestId,
          eventType: 'dispatcherIntentRejected',
          actorUserId: authUserId,
          actorRoleLabel: null,
          message:
            'Pack37 dispatcher: merchant read-only query tool matched but no merchantContext was supplied — hard stop.',
          payloadJson: { toolName: entry.name },
        });
        if (!auditResult.ok) {
          console.error(
            `[pack37-dispatcher] failed to append merchant-context-missing audit event for request ${requestId}: ${auditResult.error}`,
          );
        }
        return {
          ok: true,
          requestId,
          dispatch: { accepted: false, reason: 'merchant_context_missing' },
          route: null,
        };
      }
      const merchantQueryResult = await executeMerchantQuery({
        toolName: entry.name as VionaMerchantReadOnlyQueryToolName,
        tenantId: input.merchantContext.tenantId,
        merchantProfileId: input.merchantContext.merchantProfileId,
        toolInput: decision.toolInput,
      });
      return {
        ok: true,
        requestId,
        dispatch: { accepted: true, toolName: entry.name, confidence: decision.confidence },
        route: { kind: 'merchantReadOnlyQuery', result: merchantQueryResult },
      };
    }
    default:
      // Unreachable while every registry entry has a matching case above — kept as a defensive
      // hard stop rather than an unchecked `never` cast, so a future registry addition without a
      // matching switch branch fails loudly here instead of silently falling through.
      return { ok: true, requestId, dispatch: { accepted: false, reason: 'unknown_tool' }, route: null };
  }
}
