import type { AiCostFeatureId, AiCostGuardStatus, AiUsageUnit } from '../aiCost/aiCostTypes';

/** When no {@link AiCostGuardDefinition} is bound for metering yet. */
export type AiUsageGuardBindingStatus = AiCostGuardStatus | 'notConfigured';

export type AiUsageActorType = 'user' | 'merchant' | 'admin' | 'system' | 'anonymous';

export type AiUsageProvider = 'openai' | 'gemini' | 'twilio' | 'local' | 'manualOps' | 'unknown';

export type AiUsageEventStatus = 'estimated' | 'recorded' | 'rejected' | 'autoPaused' | 'simulated';

export type AiUsageMeterVerdict = 'allow' | 'warn' | 'autoPause' | 'blocked';

export type AiUsageMetadata = Readonly<Record<string, string | number | boolean>>;

export type AiUsageEvent = Readonly<{
  eventId: string;
  featureId: AiCostFeatureId;
  actorType: AiUsageActorType;
  actorId?: string;
  merchantId?: string;
  userId?: string;
  callSessionId?: string;
  provider: AiUsageProvider;
  model?: string;
  unit: AiUsageUnit;
  quantity: number;
  inputTokens?: number;
  outputTokens?: number;
  audioSeconds?: number;
  visionRequests?: number;
  estimatedProviderCostMinor: number;
  estimatedBilledAmountMinor: number;
  currency: string;
  status: AiUsageEventStatus;
  createdAtIso: string;
  metadata?: AiUsageMetadata;
}>;

export type AiUsageEventInput = Readonly<{
  featureId: AiCostFeatureId;
  actorType: AiUsageActorType;
  actorId?: string;
  merchantId?: string;
  userId?: string;
  callSessionId?: string;
  provider: AiUsageProvider;
  model?: string;
  unit: AiUsageUnit;
  quantity: number;
  inputTokens?: number;
  outputTokens?: number;
  audioSeconds?: number;
  visionRequests?: number;
  estimatedProviderCostMinor: number;
  estimatedBilledAmountMinor: number;
  currency: string;
  status: AiUsageEventStatus;
  createdAtIso?: string;
  metadata?: AiUsageMetadata;
}>;

export type AiUsageWindowSnapshot = Readonly<{
  featureId: AiCostFeatureId;
  used: number;
  hardCap: number;
  unit: AiUsageUnit;
  resetWindow: string;
  estimatedProviderCostMinor: number;
  estimatedBilledAmountMinor: number;
  estimatedMarginMinor: number;
}>;

export type AiUsageMeterResult = Readonly<{
  verdict: AiUsageMeterVerdict;
  featureId: AiCostFeatureId;
  guardStatus: AiUsageGuardBindingStatus;
  used: number;
  hardCap: number;
  remaining: number;
  unit: AiUsageUnit;
  autoPauseRecommended: boolean;
  reason: string;
  estimatedMarginMinor: number;
}>;
