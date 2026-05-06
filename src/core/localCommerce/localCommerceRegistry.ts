import type { LocalCommerceCapability } from './localCommerceTypes';

const CAPABILITIES: readonly LocalCommerceCapability[] = [
  {
    id: 'localMarketplace',
    audiences: ['vietnameseAbroad', 'nativeCustomer'],
    titleKey: 'localCommerce.capability.localMarketplace.title',
    descriptionKey: 'localCommerce.capability.localMarketplace.description',
    status: 'lite',
    riskLevel: 'low',
    primaryCtaKey: 'localCommerce.cta.browseServices',
    safetyNoteKey: 'localCommerce.safety.bookingRequestNote',
  },
  {
    id: 'serviceMenu',
    audiences: ['nativeCustomer'],
    titleKey: 'localCommerce.capability.serviceMenu.title',
    descriptionKey: 'localCommerce.capability.serviceMenu.description',
    status: 'lite',
    riskLevel: 'low',
    primaryCtaKey: 'localCommerce.cta.browseServices',
    safetyNoteKey: 'localCommerce.safety.bookingRequestNote',
  },
  {
    id: 'bookingRequest',
    audiences: ['nativeCustomer'],
    titleKey: 'localCommerce.capability.bookingRequest.title',
    descriptionKey: 'localCommerce.capability.bookingRequest.description',
    status: 'requestOnly',
    riskLevel: 'medium',
    primaryCtaKey: 'localCommerce.cta.requestBooking',
    safetyNoteKey: 'localCommerce.safety.bookingRequestNote',
  },
  {
    id: 'merchantDashboard',
    audiences: ['vietnameseMerchant'],
    titleKey: 'localCommerce.capability.merchantDashboard.title',
    descriptionKey: 'localCommerce.capability.merchantDashboard.description',
    status: 'lite',
    riskLevel: 'low',
    primaryCtaKey: 'localCommerce.cta.merchantSetup',
    safetyNoteKey: 'localCommerce.safety.bookingRequestNote',
  },
  {
    id: 'aiReceptionistPilot',
    audiences: ['vietnameseMerchant'],
    titleKey: 'localCommerce.capability.aiReceptionistPilot.title',
    descriptionKey: 'localCommerce.capability.aiReceptionistPilot.description',
    status: 'pilot',
    riskLevel: 'medium',
    primaryCtaKey: 'localCommerce.cta.aiReceptionistPilot',
    safetyNoteKey: 'localCommerce.safety.aiPilotNote',
  },
  {
    id: 'nativeLanguageBooking',
    audiences: ['nativeCustomer'],
    titleKey: 'localCommerce.capability.nativeLanguageBooking.title',
    descriptionKey: 'localCommerce.capability.nativeLanguageBooking.description',
    status: 'demo',
    riskLevel: 'medium',
    primaryCtaKey: 'localCommerce.cta.requestBooking',
    safetyNoteKey: 'localCommerce.safety.bookingRequestNote',
  },
] as const;

export function getAllLocalCommerceCapabilities(): readonly LocalCommerceCapability[] {
  return CAPABILITIES;
}
