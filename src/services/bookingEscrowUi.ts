import { Alert } from 'react-native';

const ESCROW_TITLE = 'Booking request acknowledgement';
const ESCROW_MESSAGE =
  'If you continue, VIO Credits for the quoted total may be reserved for this request preview. This is not a guaranteed booking, card payment, or merchant acceptance. Holds and refunds apply only when enabled in your build—merchants must review before anything is final.';

/**
 * Mandatory deposit acknowledgement before any `createBooking` REST call.
 */
export function confirmSecurityDepositThen(onAccept: () => void | Promise<void>): void {
  Alert.alert(ESCROW_TITLE, ESCROW_MESSAGE, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Accept', onPress: () => void Promise.resolve(onAccept()) },
  ]);
}
