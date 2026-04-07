import { loadAggregates, saveAggregates } from './store';
import type { AggregatedBucket, NetworkEffectEvent, NetworkPromptContextInput, NetworkPromptHints } from './types';
import { trackLearningSignal } from '../moat';

function bucketKey(actionType: string, language: string, scenario: string): string {
  return `${actionType}::${language.toLowerCase()}::${scenario.toLowerCase()}`;
}

function safeDurationMs(v: number): number {
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.round(v);
}

export async function trackNetworkEffectEvent(event: NetworkEffectEvent): Promise<void> {
  const data = await loadAggregates();
  const key = bucketKey(event.actionType, event.language, event.scenario);
  const prev = data[key];
  const base: AggregatedBucket =
    prev ??
    {
      key,
      actionType: event.actionType,
      language: event.language.toLowerCase(),
      scenario: event.scenario.toLowerCase(),
      total: 0,
      successCount: 0,
      failureCount: 0,
      avgDurationMs: 0,
      bestPatternId: null,
      flows: {},
      patternWins: {},
    };

  const total = base.total + 1;
  const duration = safeDurationMs(event.durationMs);
  const nextAvg = Math.round((base.avgDurationMs * base.total + duration) / total);
  const nextSuccess = base.successCount + (event.success ? 1 : 0);
  const nextFailure = base.failureCount + (event.success ? 0 : 1);
  const patternWins = { ...base.patternWins };
  const flows = { ...base.flows };

  if (event.success && event.responsePatternId) {
    patternWins[event.responsePatternId] = (patternWins[event.responsePatternId] ?? 0) + 1;
  }
  if (event.success && event.flowId) {
    flows[event.flowId] = (flows[event.flowId] ?? 0) + 1;
  }

  const bestPatternEntry = Object.entries(patternWins).sort((a, b) => b[1] - a[1])[0];
  const next: AggregatedBucket = {
    ...base,
    total,
    successCount: nextSuccess,
    failureCount: nextFailure,
    avgDurationMs: nextAvg,
    patternWins,
    flows,
    bestPatternId: bestPatternEntry?.[0] ?? null,
  };

  data[key] = next;
  await saveAggregates(data);
  void trackLearningSignal({
    domain: event.actionType,
    key,
    success: event.success,
    durationMs: event.durationMs,
    qualityScore: total > 0 ? nextSuccess / total : undefined,
    occurredAt: Date.now(),
  });
}

export async function getNetworkPromptHints(input: NetworkPromptContextInput): Promise<NetworkPromptHints> {
  const data = await loadAggregates();
  const key = bucketKey(input.actionType, input.language, input.scenario);
  const bucket = data[key];
  if (!bucket || bucket.total < 3) {
    return {
      successRate: null,
      bestPatternId: null,
      bestFlowId: null,
      commonFailureHint: null,
    };
  }
  const bestFlowEntry = Object.entries(bucket.flows).sort((a, b) => b[1] - a[1])[0];
  const successRate = bucket.total > 0 ? bucket.successCount / bucket.total : null;
  const commonFailureHint =
    bucket.failureCount / bucket.total > 0.35
      ? 'Giảm độ dài câu, xác nhận 1 ý mỗi lượt, ưu tiên câu hỏi rõ ràng.'
      : null;
  return {
    successRate,
    bestPatternId: bucket.bestPatternId,
    bestFlowId: bestFlowEntry?.[0] ?? null,
    commonFailureHint,
  };
}
