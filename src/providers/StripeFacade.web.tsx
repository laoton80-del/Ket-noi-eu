import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

type StripeProviderProps = {
  children?: ReactNode;
};

type PlatformPaySupportedParams = {
  googlePay?: {
    testEnv?: boolean;
  };
};

export type PlatformPayCartSummaryItem = {
  paymentType: string;
  label: string;
  amount: string;
};

type PlatformPayAppleParams = {
  applePay: {
    merchantCountryCode: string;
    currencyCode: string;
    cartItems: PlatformPayCartSummaryItem[];
  };
};

type PlatformPayGoogleParams = {
  googlePay: {
    testEnv?: boolean;
    merchantCountryCode: string;
    currencyCode: string;
    merchantName: string;
  };
};

export type PlatformPayConfirmParams = PlatformPayAppleParams | PlatformPayGoogleParams;

type ConfirmResult = {
  error?: { message: string };
};

type PlatformPayButtonProps = {
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const PlatformPay = {
  PaymentType: {
    Immediate: 'Immediate',
  },
  ButtonType: {
    Buy: 'Buy',
    Pay: 'Pay',
  },
  ButtonStyle: {
    Black: 'Black',
  },
} as const;

export function StripeProvider({ children }: StripeProviderProps) {
  return <>{children}</>;
}

export function PlatformPayButton({ onPress, disabled, style }: PlatformPayButtonProps) {
  return <Pressable onPress={onPress} disabled={disabled} style={style} />;
}

export function useStripe() {
  return {
    isPlatformPaySupported: async (_params?: PlatformPaySupportedParams): Promise<boolean> => false,
    confirmPlatformPayPayment: async (
      _clientSecret: string,
      _params: PlatformPayConfirmParams
    ): Promise<ConfirmResult> => ({
      error: { message: 'Not supported on web' },
    }),
  };
}
