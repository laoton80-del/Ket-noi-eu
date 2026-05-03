/**
 * Central AsyncStorage key registry.
 * Feature ownership: see per-line comments. Cross-cutting policy: `sourceOfTruth.ts`.
 */
export const STORAGE_KEYS = {
  schemaVersion: 'ketnoieu.storage.schema.version', // owner: storage/runMigrations
  authSession: 'ketnoieu.auth.session.v1', // owner: AuthContext
  /** JWT for ViGlobal REST API (`/api/*`) — see `services/apiClient.ts`. */
  restApiJwt: 'ketnoieu.restApi.jwt.v1', // owner: services/apiClient + restAuthClient
  wallet: 'ketnoieu.wallet.v1', // owner: state/wallet (server balance is truth)
  usageHistory: 'ketnoieu.usage.history.v1', // owner: services/history (interpreter/leona/booking/…)
  growthSnapshot: 'ketnoieu.growth.snapshot.v1', // owner: services/growth
  dailyLoop: 'ketnoieu.engagement.dailyLoop.v1', // owner: services/engagement
  companionMemory: 'ketnoieu.companion.memory.v1', // owner: services/companion
  networkEffectAggregates: 'ketnoieu.networkEffect.aggregates.v1', // owner: services/networkEffect
  lifeOsRecentActions: 'ketnoieu.lifeos.recentActions.v1', // owner: services/selling
  sellPendingResume: 'ketnoieu.sell.pendingResume.v1', // owner: services/selling
  guidedIntentCompleted: 'ketnoieu.guided.intent.completed.v1', // owner: onboarding
  guidedLeTanAiSeed: 'ketnoieu.guided.letan.aiSeed.v1', // owner: onboarding
  guidedMicroPrefix: 'ketnoieu.guided.micro.', // owner: onboarding (pairs with STORAGE_KEY_BUILDERS.guidedMicro)
  adminUnlock: 'ketnoieu.admin.unlocked.v1', // owner: HomeScreen/CaNhanScreen
  /** Must match `APP_LANGUAGE_KEY` in `src/i18n/persistLanguage.ts` (`@app_language`). */
  appLanguage: '@app_language', // owner: i18n persistLanguage + CaNhanScreen language modal
  proactiveSuggestions: 'ketnoieu.proactive.suggestions.v1', // owner: components/ProactiveSuggestions
  ttsClientCache: 'ketnoieu.tts.cache.v1', // owner: services/OpenAIService
  documentVault: 'ketnoieu.userDocuments.v1', // owner: services/DocumentAlarmService (+ Vault UI)
  documentAlarmSeen: 'ketnoieu.documentAlarmSeen.v1', // owner: services/DocumentAlarmService
  learningB1B2Unlocked: 'ketnoieu.learning.b1b2.unlocked.v1', // owner: screens/HocTapScreen
  /** JSON `{ month: 'YYYY-MM', usedMinutes: number }` — AI Teacher fair-use meter (client estimate). */
  learningAiTeacherUsageMonth: 'ketnoieu.learning.aiTeacher.usageMonth.v1', // owner: screens/HocTapScreen
  /** JSON map `userId` → loyalty snapshot — owner: services/loyalty + state/kngLoyaltyStore */
  kngLoyalty: 'ketnoieu.loyalty.v1',
  marketplaceTransactions: 'ketnoieu.marketplace.transactions.v1', // owner: services/marketplace
  moatHabitSignals: 'ketnoieu.moat.habit.signals.v1', // owner: services/moat/habitLoop
  moatB2bLockIn: 'ketnoieu.moat.b2b.lockin.v1', // owner: services/moat/b2bLockIn
  moatLearningAggregates: 'ketnoieu.moat.learning.aggregates.v1', // owner: services/moat/centralLearningData
  autonomyAudit: 'ketnoieu.autonomy.audit.v1', // owner: services/autonomy/auditLogStorage
  /** B2B merchant-approved Leona promo rules + human-touch queue (client cache). */
  b2bMerchantPromoSettings: 'ketnoieu.b2b.merchantPromoSettings.v1',
} as const;

export const STORAGE_KEY_BUILDERS = {
  aiIdentityProfile: (userId: string) => `ketnoieu.ai.identity.profile.${userId}.v1`,
  aiIdentityMemory: (userId: string) => `ketnoieu.ai.identity.memory.${userId}.v1`,
  autonomyConsent: (userId: string) => `ketnoieu.autonomy.consent.${userId}.v1`,
  lifeOsSuggestionCooldown: (action: string) => `ketnoieu.lifeos.lastSuggested.${action}.v1`,
  guidedMicro: (feature: string) => `${STORAGE_KEYS.guidedMicroPrefix}${feature}`,
} as const;
