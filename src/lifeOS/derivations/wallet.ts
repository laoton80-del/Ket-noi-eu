import { LIFEOS_LEGAL_LEONA_CREDITS } from '../../constants/lifeOSConversion';
import { INTERPRETER_SESSION_CREDITS } from '../../services/liveInterpreterService';
import { calculateCallCreditPrice, calculateLeTanBookingPrice } from '../../services/PaymentsService';

export function deriveLifeOSPricing(country?: string) {
  const leonaQuote = calculateCallCreditPrice(country);
  const leTanQuote = calculateLeTanBookingPrice(country);
  return {
    legalLeona: LIFEOS_LEGAL_LEONA_CREDITS,
    leonaOutbound: leonaQuote.localAmount,
    interpreterSession: INTERPRETER_SESSION_CREDITS,
    leTanBooking: leTanQuote.localAmount,
  };
}

export function deriveWalletStatus(credits: number, pricing: ReturnType<typeof deriveLifeOSPricing>) {
  const lowCreditThreshold = Math.min(pricing.leonaOutbound, pricing.interpreterSession, pricing.leTanBooking);
  const minActionCost = lowCreditThreshold;
  const showLowCreditBanner = credits < lowCreditThreshold;
  const primaryActionsRemaining = lowCreditThreshold > 0 ? Math.floor(credits / lowCreditThreshold) : 0;
  const smartWalletLine = `Ước tính còn ~${primaryActionsRemaining} hành động chính · Leona ~${Math.floor(
    credits / pricing.leonaOutbound
  )} · Phiên dịch ~${Math.floor(credits / pricing.interpreterSession)} · CSKH ~${Math.floor(credits / pricing.leTanBooking)}.`;
  return {
    lowCreditThreshold,
    minActionCost,
    showLowCreditBanner,
    smartWalletLine,
    isLowBalance: credits < 50,
  };
}
