export type LearningSignal = {
  domain: 'call' | 'interpreter' | 'booking' | 'companion' | 'daily_habit';
  key: string;
  success: boolean;
  durationMs?: number;
  qualityScore?: number;
  occurredAt: number;
};

export type LearningAggregate = {
  key: string;
  domain: LearningSignal['domain'];
  total: number;
  success: number;
  failure: number;
  avgDurationMs: number;
  avgQualityScore: number | null;
  updatedAt: number;
};

export type MerchantDependencySnapshot = {
  merchantId: string;
  bookings: number;
  successfulBookings: number;
  outboundCallsTriggered: number;
  analyticsTouches: number;
  feeCreditsTotal: number;
  dependencyScore: number;
  updatedAt: number;
};

export type HabitSignal = {
  streakDays: number;
  dailyAction: string;
  companionShown: boolean;
  at: number;
};
