import type { ReactNode } from 'react';

export type ConditionalStripeProviderProps = {
  children: ReactNode;
  publishableKey: string;
  merchantIdentifier?: string;
  urlScheme: string;
};
