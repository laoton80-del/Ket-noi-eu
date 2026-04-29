import { Alert, Platform } from 'react-native';
import * as Updates from 'expo-updates';

export async function checkForEmergencyUpdates(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const update = await Updates.checkForUpdateAsync();
    if (!update.isAvailable) return;

    await Updates.fetchUpdateAsync();
    Alert.alert(
      'Cập nhật mới',
      'Có bản cập nhật tính năng mới. Đang khởi động lại ứng dụng để áp dụng...',
      [
        {
          text: 'Đồng ý',
          onPress: () => {
            void Updates.reloadAsync();
          },
        },
      ],
      { cancelable: false }
    );
  } catch {
    // Silently fail in unsupported runtime/dev sessions.
  }
}
