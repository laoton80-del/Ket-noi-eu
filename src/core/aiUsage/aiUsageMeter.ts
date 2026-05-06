import type { AiCostGuardDefinition, AiCostGuardStatus } from '../aiCost/aiCostTypes';
import type {
  AiUsageEvent,
  AiUsageEventInput,
  AiUsageGuardBindingStatus,
  AiUsageMeterResult,
  AiUsageMeterVerdict,
  AiUsageWindowSnapshot,
} from './aiUsageTypes';

function makeEventId(): string {
  const t = Date.now();
  const r = Math.floor(Math.random() * 1_000_000_000);
  return `aiusage_${String(t)}_${String(r)}`;
}

function verdictSeverity(v: AiUsageMeterVerdict): number {
  switch (v) {
    case 'blocked':
      return 4;
    case 'autoPause':
      return 3;
    case 'warn':
      return 2;
    case 'allow':
    default:
      return 1;
  }
}

function worstVerdict(a: AiUsageMeterVerdict, b: AiUsageMeterVerdict): AiUsageMeterVerdict {
  return verdictSeverity(a) >= verdictSeverity(b) ? a : b;
}

export function createAiUsageEvent(input: AiUsageEventInput): AiUsageEvent {
  const createdAtIso = input.createdAtIso ?? new Date().toISOString();
  return {
    eventId: makeEventId(),
    featureId: input.featureId,
    actorType: input.actorType,
    actorId: input.actorId,
    merchantId: input.merchantId,
    userId: input.userId,
    callSessionId: input.callSessionId,
    provider: input.provider,
    model: input.model,
    unit: input.unit,
    quantity: input.quantity,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    audioSeconds: input.audioSeconds,
    visionRequests: input.visionRequests,
    estimatedProviderCostMinor: input.estimatedProviderCostMinor,
    estimatedBilledAmountMinor: input.estimatedBilledAmountMinor,
    currency: input.currency,
    status: input.status,
    createdAtIso,
    metadata: input.metadata,
  };
}

/** VIONA margin for a single usage event (billed − provider cost), minor units. */
export function estimateAiUsageMargin(event: AiUsageEvent): number {
  return event.estimatedBilledAmountMinor - event.estimatedProviderCostMinor;
}

function buildMeterBase(
  event: AiUsageEvent,
  snapshot: AiUsageWindowSnapshot,
  guardStatus: AiUsageGuardBindingStatus,
  margin: number
): Omit<AiUsageMeterResult, 'verdict' | 'reason' | 'autoPauseRecommended'> {
  const projected = snapshot.used + event.quantity;
  const remaining = Math.max(0, snapshot.hardCap - projected);
  return {
    featureId: event.featureId,
    guardStatus,
    used: snapshot.used,
    hardCap: snapshot.hardCap,
    remaining,
    unit: event.unit,
    estimatedMarginMinor: margin,
  };
}

/**
 * Pure policy evaluation — no I/O. `snapshot` should align window usage with `guard` caps.
 * When `guard` is null, the event is blocked (missing configuration).
 */
export function evaluateAiUsageAgainstGuard(
  event: AiUsageEvent,
  snapshot: AiUsageWindowSnapshot,
  guard: AiCostGuardDefinition | null
): AiUsageMeterResult {
  const margin = estimateAiUsageMargin(event);

  if (!guard) {
    const base = buildMeterBase(event, snapshot, 'notConfigured', margin);
    return {
      ...base,
      verdict: 'blocked',
      reason: 'missing_guard',
      autoPauseRecommended: false,
    };
  }

  const guardStatus: AiCostGuardStatus = guard.status;
  let verdict: AiUsageMeterVerdict = 'allow';
  let reason = 'within_cap';
  let autoPauseRecommended = false;

  if (guard.status === 'frozen') {
    const base = buildMeterBase(event, snapshot, guardStatus, margin);
    return {
      ...base,
      verdict: 'blocked',
      reason: 'feature_frozen',
      autoPauseRecommended: false,
    };
  }

  if (event.unit !== guard.unit) {
    verdict = worstVerdict(verdict, 'warn');
    reason = 'unit_mismatch';
  }

  const projected = snapshot.used + event.quantity;
  if (projected > snapshot.hardCap) {
    if (guard.autoPauseOnCap) {
      verdict = worstVerdict(verdict, 'autoPause');
      reason = 'hard_cap_exceeded';
      autoPauseRecommended = true;
    } else {
      verdict = worstVerdict(verdict, 'blocked');
      reason = 'hard_cap_exceeded';
    }
  }

  const capBreached = projected > snapshot.hardCap;

  if (margin < 0) {
    const marginPause =
      guard.autoPauseOnCap &&
      (guard.providerCostRisk === 'high' ||
        guard.status === 'demoOnly' ||
        guard.status === 'pilotOnly' ||
        guard.status === 'gated');
    if (marginPause) {
      verdict = worstVerdict(verdict, 'autoPause');
      if (verdict === 'autoPause' && !capBreached) {
        reason = 'negative_margin_high_risk';
      }
      autoPauseRecommended = verdict === 'autoPause';
    } else {
      verdict = worstVerdict(verdict, 'warn');
      if (verdict === 'warn' && reason === 'within_cap' && !capBreached) {
        reason = 'negative_margin';
      }
    }
  }

  if (event.status === 'recorded' && !guard.productionReady) {
    if (verdict === 'allow') {
      verdict = 'warn';
      reason = 'recorded_not_production_ready';
    }
  }

  const base = buildMeterBase(event, snapshot, guardStatus, margin);
  return {
    ...base,
    verdict,
    reason,
    autoPauseRecommended: autoPauseRecommended || verdict === 'autoPause',
  };
}

export function shouldRejectAiUsage(result: AiUsageMeterResult): boolean {
  return result.verdict === 'blocked' || result.verdict === 'autoPause';
}

export function shouldWarnAiUsage(result: AiUsageMeterResult): boolean {
  return result.verdict === 'warn';
}
