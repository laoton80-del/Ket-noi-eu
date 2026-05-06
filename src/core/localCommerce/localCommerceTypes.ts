/**
 * Pack E — Universe Local commerce & booking posture (copy/model only; no fulfillment contracts).
 */

export type LocalCommerceAudience = 'vietnameseAbroad' | 'nativeCustomer' | 'vietnameseMerchant';

export type LocalBookingStatus =
  | 'lite'
  | 'requestOnly'
  | 'demo'
  | 'pilot'
  | 'comingSoon'
  | 'gated';

export type LocalCommerceRiskLevel = 'low' | 'medium' | 'high';

export type LocalCommerceCapability = Readonly<{
  id: string;
  audiences: readonly LocalCommerceAudience[];
  titleKey: string;
  descriptionKey: string;
  status: LocalBookingStatus;
  riskLevel: LocalCommerceRiskLevel;
  primaryCtaKey: string;
  safetyNoteKey: string;
}>;
