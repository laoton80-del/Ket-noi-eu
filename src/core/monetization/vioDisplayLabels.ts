import { vioDisplayConfig } from './vioDisplayConfig';

/** Customer-facing loyalty name (e.g. "VIO Points"). */
export function getVioPointsLabel(): string {
  return vioDisplayConfig.publicName;
}

/** Customer-facing spend/prepaid wallet unit (e.g. "VIO Credits"). */
export function getVioCreditsLabel(): string {
  return vioDisplayConfig.publicCreditName;
}

/** Internal ledger code — use only where legacy disclosure is required, not as primary UX. */
export function getLegacyVigLabel(): string {
  return vioDisplayConfig.legacyCode;
}

/**
 * Short safety copy (English). Prefer localized `walletTopUp.vioDisclaimer*` from `getStrings` in UI.
 */
export function getVioDisclaimer(): string {
  return (
    `${vioDisplayConfig.publicName} are loyalty-style credits inside VIONA. ` +
    `They are not cryptocurrency, not investment assets, and not withdrawable bank cash. ` +
    `Redemption limits may apply (up to ${vioDisplayConfig.redeemCapPercent}% of eligible baskets where configured).`
  );
}

export function formatVioPoints(amount: number): string {
  return `${amount} ${getVioPointsLabel()}`;
}

export function formatVioCredits(amount: number): string {
  return `${amount} ${getVioCreditsLabel()}`;
}
