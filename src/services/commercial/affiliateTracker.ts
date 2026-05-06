import { Linking } from 'react-native';
import { trackInteraction } from '../telemetryService';

export async function openPartnerDeal(dealId: string, partnerUrl: string): Promise<void> {
  console.log('Logging affiliate click for commission:', dealId);
  trackInteraction('affiliate_deal_click', 'PartnerDeals', {
    dealId,
    partnerUrl,
  });
  await Linking.openURL(partnerUrl);
}
