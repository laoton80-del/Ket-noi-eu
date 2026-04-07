export type NetworkActionType = 'call' | 'interpreter' | 'booking';

export type NetworkEffectEvent = {
  actionType: NetworkActionType;
  success: boolean;
  durationMs: number;
  language: string;
  scenario: string;
  responsePatternId?: string;
  flowId?: string;
};

export type AggregatedBucket = {
  key: string;
  actionType: NetworkActionType;
  language: string;
  scenario: string;
  total: number;
  successCount: number;
  failureCount: number;
  avgDurationMs: number;
  bestPatternId: string | null;
  flows: Record<string, number>;
  patternWins: Record<string, number>;
};

export type NetworkPromptContextInput = {
  actionType: NetworkActionType;
  language: string;
  scenario: string;
};

export type NetworkPromptHints = {
  successRate: number | null;
  bestPatternId: string | null;
  bestFlowId: string | null;
  commonFailureHint: string | null;
};
