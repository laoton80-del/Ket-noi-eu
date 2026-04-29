import { Alert, Linking } from 'react-native';
import { trackInteraction } from './telemetryService';

export async function openAffiliateLink(
  url: string,
  partnerId: string,
  campaign: string
): Promise<void> {
  trackInteraction('affiliate_click', 'PartnerDeals', {
    partnerId,
    campaign,
    url,
  });

  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    Alert.alert('Không thể mở liên kết', 'Thiết bị hiện tại không hỗ trợ mở ưu đãi này.');
    return;
  }

  await Linking.openURL(url);
}
