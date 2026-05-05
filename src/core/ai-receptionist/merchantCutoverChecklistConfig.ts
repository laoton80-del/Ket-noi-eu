import type { FeatureFlagKey } from '../feature-flags/featureFlags';

export type MerchantCutoverItemStatus = 'required' | 'recommended' | 'optional';

export type MerchantCutoverChecklistItem = Readonly<{
  id: string;
  title: string;
  status: MerchantCutoverItemStatus;
  /** Feature flag that this item unlocks or validates. */
  relatedFlag?: FeatureFlagKey;
  acceptanceCriteria: string;
  ownerRole: 'merchant_ops' | 'merchant_it' | 'viona_ops' | 'viona_finance' | 'viona_compliance';
}>;

export const B2B_AI_RECEPTIONIST_MERCHANT_CUTOVER_CHECKLIST: readonly MerchantCutoverChecklistItem[] = [
  {
    id: 'merchant-identity-verified',
    title: 'Merchant identity and legal profile verified',
    status: 'required',
    acceptanceCriteria: 'Merchant owner KYC/KYB records are approved in operations checklist.',
    ownerRole: 'viona_compliance',
  },
  {
    id: 'production-receptionist-gate',
    title: 'Production receptionist gate approved',
    status: 'required',
    relatedFlag: 'b2bAiReceptionistProductionEnabled',
    acceptanceCriteria: 'Production gate approval ticket is signed by operations and compliance.',
    ownerRole: 'viona_ops',
  },
  {
    id: 'auto-booking-policy-pack',
    title: 'Auto-booking policy pack configured',
    status: 'required',
    relatedFlag: 'b2bAutoBookingEnabled',
    acceptanceCriteria: 'Booking hold/confirm boundaries and escalation policy are documented and tested.',
    ownerRole: 'merchant_ops',
  },
  {
    id: 'auto-inventory-safeguards',
    title: 'Inventory reservation safeguards validated',
    status: 'required',
    relatedFlag: 'b2bAutoInventoryEnabled',
    acceptanceCriteria: 'Inventory reserve/release paths are validated in dry-run and pilot reports.',
    ownerRole: 'merchant_it',
  },
  {
    id: 'bill-print-fallback',
    title: 'Bill print fallback and audit log enabled',
    status: 'recommended',
    relatedFlag: 'b2bAutoBillPrintEnabled',
    acceptanceCriteria: 'Print queue failures trigger fallback and audit entries are visible to operators.',
    ownerRole: 'merchant_it',
  },
  {
    id: 'payment-capture-approval',
    title: 'Auto payment capture approval',
    status: 'required',
    relatedFlag: 'b2bAutoPaymentEnabled',
    acceptanceCriteria: 'Finance and risk approval exists; rollback plan documented before enabling.',
    ownerRole: 'viona_finance',
  },
];
