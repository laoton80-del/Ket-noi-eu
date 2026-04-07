import type { AutonomousActionTrigger } from './types';

export function buildVisaExpiryThresholdTrigger(params: {
  documentId: string;
  expiryDate: string;
  daysLeft: number;
}): AutonomousActionTrigger {
  return {
    type: 'visa_expiry_threshold',
    source: 'vault',
    data: {
      documentId: params.documentId,
      expiryDate: params.expiryDate,
      daysLeft: params.daysLeft,
    },
  };
}
