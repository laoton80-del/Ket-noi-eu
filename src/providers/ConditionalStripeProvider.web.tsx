import type { ConditionalStripeProviderProps } from './conditionalStripeTypes';

/** Web: Stripe React Native SDK is native-only; render children without wrapping. */
export function ConditionalStripeProvider({ children }: ConditionalStripeProviderProps) {
  return <>{children}</>;
}
