import type { DetectOpportunityInput, SellCTA, SellingOpportunity } from './sellingTypes';
import { detectOpportunity } from './detectOpportunity';
import { generateSellCTA } from './generateSellCTA';

export function maybeGenerateSellCTA(input: DetectOpportunityInput): {
  opportunity: Exclude<SellingOpportunity, null> | null;
  cta: SellCTA | null;
} {
  const opportunity = detectOpportunity(input);
  const cta = opportunity ? generateSellCTA(opportunity, input) : null;
  return { opportunity: opportunity ?? null, cta };
}

