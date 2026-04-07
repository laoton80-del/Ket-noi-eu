import { LAUNCH_PILOT_CONFIG } from '../../config/launchPilot';
import { getHolidayInsightsForCountry } from '../../services/holidays';
import { buildMarketplaceSuggestion } from '../../services/marketplace';

export function deriveContextualSuggestions(country: string | undefined, daysToExpiry: number | null) {
  const holidayActions = getHolidayInsightsForCountry(country).map((h) => `${h.holiday.name}: ${h.action}`);
  const marketplaceSuggestion = LAUNCH_PILOT_CONFIG.enableMarketplaceSurface
    ? buildMarketplaceSuggestion({
        location: country ?? null,
        language: 'vi',
        businessType: daysToExpiry !== null && daysToExpiry < 90 ? 'clinic' : 'general',
        requestedTimeIso: null,
      })
    : null;
  return { holidayActions, marketplaceSuggestion };
}
