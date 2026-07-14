/**
 * Pack35 — B2B Omni-Channel Webhook & Agent Routing: standing-approval derivation gate (pure, no
 * I/O). Mirrors `vionaMerchantTenantScope.ts`'s role exactly: a small, pure, independently
 * unit-testable gate the webhook controller calls, rather than reimplementing this
 * safety-critical check ad hoc inline. See
 * docs/product/VIONA_PACK35_B2B_WEBHOOK_ROUTING_PLAN.md §5.4 (CRITICAL — test plan item 4).
 *
 * `dispatchVionaAutonomousRequest()`'s module header is explicit and load-bearing:
 * `operatorApprovalGranted`/`userConsentGranted` must be human-supplied only, never inferred from
 * the LLM's output. This gate implements the plan's "standing, pre-granted consent" model: a
 * human (the merchant admin) sets `standingApprovalForReadOnlyToolsOnly` once, in advance,
 * out-of-band — this file never grants anything itself, it only narrows an already-granted
 * standing flag down to the one, structurally read-only case the plan allows it to cover.
 *
 * Fail-closed by construction: any missing/unknown/non-qualifying input takes the same
 * `false`/`false` branch as "no standing approval was ever granted at all". There is exactly one
 * `return` statement in this file that can produce `true`/`true`, gated by three independent,
 * explicit conditions (category, `merchantScopedOnly`, `toolScope` membership) — this is
 * deliberate, so a future registry change can never silently widen this gate.
 */

import { findVionaToolRegistryEntry } from '../dispatcher/vionaToolRegistry';

export type VionaMerchantWebhookApprovalGateInput = Readonly<{
  /** The channel binding's own standing-approval flag (`VionaMerchantWebhookChannel`). */
  standingApprovalForReadOnlyToolsOnly: boolean;
  /** The Intent Router's resolved tool name for this message, or `null` if none was accepted. */
  resolvedToolName: string | null;
  /** The resolved merchant's own `MerchantProfile.toolScope` (Pack34). */
  merchantToolScope: readonly string[];
}>;

export type VionaMerchantWebhookApprovalGateResult = Readonly<{
  operatorApprovalGranted: boolean;
  userConsentGranted: boolean;
}>;

const DENY_ALL: VionaMerchantWebhookApprovalGateResult = Object.freeze({
  operatorApprovalGranted: false,
  userConsentGranted: false,
});

/**
 * Pure, synchronous, never throws. Returns `{ true, true }` **only** when every one of these
 * holds: (1) the channel's standing-approval flag is `true`; (2) a tool was actually resolved;
 * (3) that tool is registered; (4) its `category` is `'merchant_read_only_query'`; (5) its
 * `merchantScopedOnly` is `true`; (6) its `name` is present in the merchant's own `toolScope`.
 * Every other input — including every existing write/execution-capable tool
 * (`twilio_test_sms_poc`, `marketing_content_generator`) regardless of the standing flag —
 * resolves to `{ false, false }`, which correctly causes the existing, unmodified
 * `dispatchVionaAutonomousRequest()` downstream gate to reject with `blockedOperator`.
 */
export function deriveVionaWebhookStandingApprovalFlags(
  input: VionaMerchantWebhookApprovalGateInput,
): VionaMerchantWebhookApprovalGateResult {
  if (!input.standingApprovalForReadOnlyToolsOnly) {
    return DENY_ALL;
  }
  if (input.resolvedToolName == null) {
    return DENY_ALL;
  }

  const entry = findVionaToolRegistryEntry(input.resolvedToolName);
  if (entry == null) {
    return DENY_ALL;
  }
  if (entry.category !== 'merchant_read_only_query' || entry.merchantScopedOnly !== true) {
    return DENY_ALL;
  }
  if (!input.merchantToolScope.includes(entry.name)) {
    return DENY_ALL;
  }

  return { operatorApprovalGranted: true, userConsentGranted: true };
}
