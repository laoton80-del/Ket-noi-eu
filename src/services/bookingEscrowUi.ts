import { Alert } from 'react-native';

const ESCROW_TITLE = 'Full price pre-authorization';
const ESCROW_MESSAGE =
  'The full service price in VIG will be locked (moved to a booking hold) when you confirm. Completion via QR settles payment to the merchant; cancel/no-show applies a 20% penalty split between the merchant and platform, with the remaining 80% returned to your spendable balance.';

/**
 * Mandatory deposit acknowledgement before any `createBooking` REST call.
 */
export function confirmSecurityDepositThen(onAccept: () => void | Promise<void>): void {
  Alert.alert(ESCROW_TITLE, ESCROW_MESSAGE, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Accept', onPress: () => void Promise.resolve(onAccept()) },
  ]);
}
