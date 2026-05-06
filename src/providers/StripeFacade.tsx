export {
  StripeProvider,
  PlatformPay,
  PlatformPayButton,
  useStripe,
} from '@stripe/stripe-react-native';

export type PlatformPayCartSummaryItem =
  import('@stripe/stripe-react-native').PlatformPay.CartSummaryItem;
export type PlatformPayConfirmParams =
  import('@stripe/stripe-react-native').PlatformPay.ConfirmParams;
