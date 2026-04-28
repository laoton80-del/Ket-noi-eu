/**
 * Central AsyncStorage key registry.
 * Feature ownership: see per-line comments. Cross-cutting policy: `sourceOfTruth.ts`.
 */
export const STORAGE_KEYS = {
  schemaVersion: 'ketnoiglobal.storage.schema.version', // owner: storage/runMigrations
  authSession: 'ketnoiglobal.auth.session.v1', // owner: AuthContext
  wallet: 'ketnoiglobal.wallet.v1', // owner: state/wallet (server balance is truth)
  usageHistory: 'ketnoiglobal.usage.history.v1', // owner: services/history (interpreter/leona/booking/…)
  growthSnapshot: 'ketnoiglobal.growth.snapshot.v1', // owner: services/growth
  dailyLoop: 'ketnoiglobal.engagement.dailyLoop.v1', // owner: services/engagement
  companionMemory: 'ketnoiglobal.companion.memory.v1', // owner: services/companion
  networkEffectAggregates: 'ketnoiglobal.networkEffect.aggregates.v1', // owner: services/networkEffect
  lifeOsRecentActions: 'ketnoiglobal.lifeos.recentActions.v1', // owner: services/selling
  sellPendingResume: 'ketnoiglobal.sell.pendingResume.v1', // owner: services/selling
  guidedIntentCompleted: 'ketnoiglobal.guided.intent.completed.v1', // owner: onboarding
  guidedLeTanAiSeed: 'ketnoiglobal.guided.letan.aiSeed.v1', // owner: onboarding
  guidedMicroPrefix: 'ketnoiglobal.guided.micro.', // owner: onboarding (pairs with STORAGE_KEY_BUILDERS.guidedMicro)
  adminUnlock: 'ketnoiglobal.admin.unlocked.v1', // owner: HomeScreen/CaNhanScreen
  proactiveSuggestions: 'ketnoiglobal.proactive.suggestions.v1', // owner: components/ProactiveSuggestions
  ttsClientCache: 'ketnoiglobal.tts.cache.v1', // owner: services/OpenAIService
  documentVault: 'ketnoiglobal.userDocuments.v1', // owner: services/DocumentAlarmService (+ Vault UI)
  documentAlarmSeen: 'ketnoiglobal.documentAlarmSeen.v1', // owner: services/DocumentAlarmService
  learningB1B2Unlocked: 'ketnoiglobal.learning.b1b2.unlocked.v1', // owner: screens/AcademyScreen
  marketplaceTransactions: 'ketnoiglobal.marketplace.transactions.v1', // owner: services/marketplace
  moatHabitSignals: 'ketnoiglobal.moat.habit.signals.v1', // owner: services/moat/habitLoop
  moatB2bLockIn: 'ketnoiglobal.moat.b2b.lockin.v1', // owner: services/moat/b2bLockIn
  moatLearningAggregates: 'ketnoiglobal.moat.learning.aggregates.v1', // owner: services/moat/centralLearningData
  autonomyAudit: 'ketnoiglobal.autonomy.audit.v1', // owner: services/autonomy/auditLogStorage
} as const;

export const STORAGE_KEY_BUILDERS = {
  aiIdentityProfile: (userId: string) => `ketnoiglobal.ai.identity.profile.${userId}.v1`,
  aiIdentityMemory: (userId: string) => `ketnoiglobal.ai.identity.memory.${userId}.v1`,
  autonomyConsent: (userId: string) => `ketnoiglobal.autonomy.consent.${userId}.v1`,
  lifeOsSuggestionCooldown: (action: string) => `ketnoiglobal.lifeos.lastSuggested.${action}.v1`,
  guidedMicro: (feature: string) => `${STORAGE_KEYS.guidedMicroPrefix}${feature}`,
} as const;
