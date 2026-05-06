import type { ReactElement } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import type { ConditionalStripeProviderProps } from './conditionalStripeTypes';

/** Native / default: real Stripe provider. Web uses `ConditionalStripeProvider.web.tsx` so Stripe SDK is not bundled. */
export function ConditionalStripeProvider({
  children,
  publishableKey,
  merchantIdentifier,
  urlScheme,
}: ConditionalStripeProviderProps) {
  return (
    <StripeProvider
      publishableKey={publishableKey}
      merchantIdentifier={merchantIdentifier}
      urlScheme={urlScheme}
    >
      {children as ReactElement}
    </StripeProvider>
  );
}
