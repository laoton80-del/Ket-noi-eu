import type { AiCostFeatureId } from '../aiCost/aiCostTypes';
import { AI_COST_GUARD_REGISTRY } from '../aiCost/aiCostGuardRegistry';
import type { AiUsageEventInput, AiUsageMeterResult, AiUsageWindowSnapshot } from './aiUsageTypes';
import { createAiUsageEvent, evaluateAiUsageAgainstGuard } from './aiUsageMeter';

/** Stable timestamp for audit/demo events (no runtime clock dependency in consumers). */
const FIXTURE_CREATED_AT_ISO = '2026-05-06T12:00:00.000Z';

function windowFromGuard(
  featureId: AiCostFeatureId,
  overrides: Readonly<
    Pick<
      AiUsageWindowSnapshot,
      | 'used'
      | 'estimatedProviderCostMinor'
      | 'estimatedBilledAmountMinor'
      | 'estimatedMarginMinor'
    >
  >
): AiUsageWindowSnapshot {
  const g = AI_COST_GUARD_REGISTRY[featureId];
  return {
    featureId,
    used: overrides.used,
    hardCap: g.hardCap,
    unit: g.unit,
    resetWindow: g.resetWindow,
    estimatedProviderCostMinor: overrides.estimatedProviderCostMinor,
    estimatedBilledAmountMinor: overrides.estimatedBilledAmountMinor,
    estimatedMarginMinor: overrides.estimatedMarginMinor,
  };
}

export type AiUsageAuditFixture = Readonly<{
  id: string;
  eventInput: AiUsageEventInput;
  snapshot: AiUsageWindowSnapshot;
  featureId: AiCostFeatureId;
  expectedVerdict: AiUsageMeterResult['verdict'];
  note: string;
}>;

/** AI Receptionist demo request within cap — aligns with `AI_COST_GUARD_REGISTRY.aiReceptionistDemo`. */
export const AI_USAGE_FIXTURE_RECEPTIONIST_DEMO_WITHIN_CAP: AiUsageAuditFixture = Object.freeze({
  id: 'receptionist_demo_within_cap',
  featureId: 'aiReceptionistDemo',
  note: 'Typical demo turn under session hard cap; positive margin.',
  eventInput: Object.freeze({
    featureId: 'aiReceptionistDemo',
    actorType: 'merchant',
    provider: 'openai',
    model: 'gpt-4o-mini',
    unit: 'request',
    quantity: 1,
    estimatedProviderCostMinor: 800,
    estimatedBilledAmountMinor: 1200,
    currency: 'VND',
    status: 'estimated',
    merchantId: 'fixture_merchant_1',
  }),
  snapshot: Object.freeze(
    windowFromGuard('aiReceptionistDemo', {
      used: 25,
      estimatedProviderCostMinor: 20_000,
      estimatedBilledAmountMinor: 30_000,
      estimatedMarginMinor: 10_000,
    })
  ),
  expectedVerdict: 'allow',
});

/** AI Receptionist pilot call near monthly hard cap — exceeds cap on this request. */
export const AI_USAGE_FIXTURE_RECEPTIONIST_PILOT_NEAR_CAP: AiUsageAuditFixture = Object.freeze({
  id: 'receptionist_pilot_near_cap',
  featureId: 'aiReceptionistPilot',
  note: 'Pilot window nearly exhausted; one more batch trips hardCap with autoPause.',
  eventInput: Object.freeze({
    featureId: 'aiReceptionistPilot',
    actorType: 'merchant',
    provider: 'twilio',
    unit: 'request',
    quantity: 2,
    estimatedProviderCostMinor: 5000,
    estimatedBilledAmountMinor: 8000,
    currency: 'VND',
    status: 'simulated',
    merchantId: 'fixture_merchant_1',
    callSessionId: 'fixture_call_sess_pilot',
  }),
  snapshot: Object.freeze(
    windowFromGuard('aiReceptionistPilot', {
      used: 499,
      estimatedProviderCostMinor: 1_000_000,
      estimatedBilledAmountMinor: 1_200_000,
      estimatedMarginMinor: 200_000,
    })
  ),
  expectedVerdict: 'autoPause',
});

/** Live interpreter minutes over weekly hard cap. */
export const AI_USAGE_FIXTURE_LIVE_INTERPRETER_OVER_CAP: AiUsageAuditFixture = Object.freeze({
  id: 'live_interpreter_over_cap',
  featureId: 'liveInterpreter',
  note: 'High-risk pilot feature; burst minutes exceed hardCap → autoPause when enabled.',
  eventInput: Object.freeze({
    featureId: 'liveInterpreter',
    actorType: 'user',
    provider: 'twilio',
    unit: 'minute',
    quantity: 5,
    audioSeconds: 300,
    estimatedProviderCostMinor: 45_000,
    estimatedBilledAmountMinor: 60_000,
    currency: 'VND',
    status: 'estimated',
    userId: 'fixture_user_1',
    callSessionId: 'fixture_interpreter_sess',
  }),
  snapshot: Object.freeze(
    windowFromGuard('liveInterpreter', {
      used: 88,
      estimatedProviderCostMinor: 500_000,
      estimatedBilledAmountMinor: 650_000,
      estimatedMarginMinor: 150_000,
    })
  ),
  expectedVerdict: 'autoPause',
});

/** Outbound marketing draft — registry feature is frozen → blocked regardless of quantity. */
export const AI_USAGE_FIXTURE_OUTBOUND_FROZEN: AiUsageAuditFixture = Object.freeze({
  id: 'outbound_marketing_frozen',
  featureId: 'outboundMarketingDraft',
  note: 'Frozen feature in `AI_COST_GUARD_REGISTRY`; metering must hard-block.',
  eventInput: Object.freeze({
    featureId: 'outboundMarketingDraft',
    actorType: 'merchant',
    provider: 'openai',
    unit: 'request',
    quantity: 1,
    estimatedProviderCostMinor: 100,
    estimatedBilledAmountMinor: 500,
    currency: 'VND',
    status: 'estimated',
    merchantId: 'fixture_merchant_2',
  }),
  snapshot: Object.freeze(
    windowFromGuard('outboundMarketingDraft', {
      used: 0,
      estimatedProviderCostMinor: 0,
      estimatedBilledAmountMinor: 0,
      estimatedMarginMinor: 0,
    })
  ),
  expectedVerdict: 'blocked',
});

/** B2C AI call assistant — high provider risk + negative unit margin triggers autoPause (no cap breach). */
export const AI_USAGE_FIXTURE_NEGATIVE_MARGIN_HIGH_RISK: AiUsageAuditFixture = Object.freeze({
  id: 'negative_margin_high_risk',
  featureId: 'b2cAiCallAssistant',
  note: 'Billed estimate below provider estimate; high-risk guard escalates to autoPause.',
  eventInput: Object.freeze({
    featureId: 'b2cAiCallAssistant',
    actorType: 'user',
    provider: 'openai',
    unit: 'minute',
    quantity: 1,
    estimatedProviderCostMinor: 50_000,
    estimatedBilledAmountMinor: 20_000,
    currency: 'VND',
    status: 'estimated',
    userId: 'fixture_user_2',
  }),
  snapshot: Object.freeze(
    windowFromGuard('b2cAiCallAssistant', {
      used: 10,
      estimatedProviderCostMinor: 200_000,
      estimatedBilledAmountMinor: 250_000,
      estimatedMarginMinor: 50_000,
    })
  ),
  expectedVerdict: 'autoPause',
});

/** Readonly list for audits, demos, and static checks — not production telemetry. */
export const AI_USAGE_AUDIT_FIXTURES: readonly AiUsageAuditFixture[] = Object.freeze([
  AI_USAGE_FIXTURE_RECEPTIONIST_DEMO_WITHIN_CAP,
  AI_USAGE_FIXTURE_RECEPTIONIST_PILOT_NEAR_CAP,
  AI_USAGE_FIXTURE_LIVE_INTERPRETER_OVER_CAP,
  AI_USAGE_FIXTURE_OUTBOUND_FROZEN,
  AI_USAGE_FIXTURE_NEGATIVE_MARGIN_HIGH_RISK,
]);

/**
 * Evaluates a fixture against `AI_COST_GUARD_REGISTRY` (no provider I/O).
 * Uses a fixed `createdAtIso` when the input omits it so snapshots stay reproducible.
 */
export function evaluateAiUsageFixtureForAudit(fixture: AiUsageAuditFixture): AiUsageMeterResult {
  const event = createAiUsageEvent({
    ...fixture.eventInput,
    createdAtIso: fixture.eventInput.createdAtIso ?? FIXTURE_CREATED_AT_ISO,
  });
  return evaluateAiUsageAgainstGuard(event, fixture.snapshot, AI_COST_GUARD_REGISTRY[fixture.featureId]);
}
