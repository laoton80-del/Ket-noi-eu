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
 */

import { appendVionaExecutionAuditEvent } from './vionaExecutionAuditWriteService';
import {
  previewVionaExecutionPlanRealProviderPocRoute,
  type PreviewVionaExecutionPlanRealProviderPocResult,
} from './vionaExecutionPlanRouteService';
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
}>;

export type DispatchVionaAutonomousRequestFailure = 'invalid_input';

export type DispatchVionaAutonomousRequestResult =
  | Readonly<{
      ok: true;
      requestId: string;
      dispatch: Readonly<{ accepted: true; toolName: string; confidence: number }>;
      route: PreviewVionaExecutionPlanRealProviderPocResult;
    }>
  | Readonly<{
      ok: true;
      requestId: string;
      dispatch: Readonly<{ accepted: false; reason: VionaDispatchRejectionReason }>;
      route: null;
    }>
  | Readonly<{ ok: false; reason: DispatchVionaAutonomousRequestFailure }>;

export type VionaAutonomousDispatchServiceDeps = Readonly<{
  callLlm?: VionaIntentRouterCallLlm;
  auditWriter?: typeof appendVionaExecutionAuditEvent;
  routeExecutor?: typeof previewVionaExecutionPlanRealProviderPocRoute;
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

  // Exactly one tool is registered today (plan §9 — multi-tool dispatch is out of scope for this
  // increment). This switch is the single, explicit place a second tool's `toolInput` mapping
  // onto its own downstream call would be added in a future, separate pack.
  switch (entry.name) {
    case 'twilio_test_sms_poc': {
      const toolInput = decision.toolInput as Readonly<{
        fromNumber: string;
        toNumber: string;
        body: string;
      }>;
      const route = await routeExecutor({
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
        route,
      };
    }
    default:
      // Unreachable while the registry has exactly one entry — kept as a defensive hard stop
      // rather than an unchecked `never` cast, so a future registry addition without a matching
      // switch branch fails loudly here instead of silently falling through.
      return { ok: true, requestId, dispatch: { accepted: false, reason: 'unknown_tool' }, route: null };
  }
}
