/**
 * Client-side AI cost firewall vocabulary — policy documentation and UI labels only.
 * Does not call providers, meter usage, or change server billing (see server `AIGateway` separately).
 */

export type AiCostFeatureId =
  | 'aiReceptionistDemo'
  | 'aiReceptionistPilot'
  | 'b2cAiCallAssistant'
  | 'leonaAssistant'
  | 'minhKhangTranslator'
  | 'documentScanner'
  | 'liveInterpreter'
  | 'copilot'
  | 'outboundMarketingDraft';

export type AiUsageUnit = 'request' | 'message' | 'minute' | 'token' | 'image' | 'document';

export type AiCostGuardStatus = 'active' | 'demoOnly' | 'pilotOnly' | 'gated' | 'frozen';

/** How often soft/hard caps reset for planning (enforcement is server-side when implemented). */
export type AiCostResetWindow = 'none' | 'session' | 'daily' | 'weekly' | 'monthly';

export type AiCostProviderRisk = 'low' | 'medium' | 'high';

export type AiCostGuardDefinition = Readonly<{
  featureId: AiCostFeatureId;
  /** i18n key for human-readable feature name */
  labelKey: string;
  status: AiCostGuardStatus;
  /** Soft budget before warnings / throttles (planning). */
  includedUsage: number;
  /** Hard stop threshold (planning; not enforced in this module). */
  hardCap: number;
  unit: AiUsageUnit;
  resetWindow: AiCostResetWindow;
  requiresUpgrade: boolean;
  requiresHumanApproval: boolean;
  autoPauseOnCap: boolean;
  providerCostRisk: AiCostProviderRisk;
  productionReady: boolean;
  /** i18n key for short ops note */
  notesKey: string;
}>;
