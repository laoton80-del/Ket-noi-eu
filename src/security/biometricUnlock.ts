import * as LocalAuthentication from 'expo-local-authentication';

/** Mã PIN dự phòng (checklist nội bộ). */
export const WALLET_FALLBACK_PIN = '8888';

export type BiometricAvailability = 'ready' | 'no_hardware' | 'not_enrolled';

export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return 'no_hardware';
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) return 'not_enrolled';
  return 'ready';
}

export async function authenticateBiometric(promptMessage: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Hủy',
    disableDeviceFallback: false,
  });
  return result.success === true;
}

export function isValidWalletPin(pin: string): boolean {
  return pin === WALLET_FALLBACK_PIN;
}
