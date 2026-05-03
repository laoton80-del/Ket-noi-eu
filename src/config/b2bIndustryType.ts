/** B2B vertical for wallet / telecom hybrid billing surfaces. */
export const IndustryType = {
  RETAIL: 'RETAIL',
  WHOLESALE: 'WHOLESALE',
  SERVICES: 'SERVICES',
} as const;

export type IndustryTypeId = (typeof IndustryType)[keyof typeof IndustryType];
