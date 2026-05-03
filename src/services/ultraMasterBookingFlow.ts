import { Alert } from 'react-native';

import { getDemoBookingPayload } from '../config/demoRestBooking';
import { createBooking } from './bookingService';
import { confirmSecurityDepositThen } from './bookingEscrowUi';
import { formatNetworkFailureMessage, getRestApiJwt, isRestApiConfigured } from './apiClient';

export async function runUltraMasterBookingWithAlerts(featureLabel: string): Promise<void> {
  if (!isRestApiConfigured()) {
    Alert.alert(
      featureLabel,
      'Chưa cấu hình EXPO_PUBLIC_REST_API_BASE. Thêm biến môi trường rồi khởi động lại Expo.'
    );
    return;
  }

  const jwt = await getRestApiJwt();
  if (!jwt) {
    Alert.alert(
      featureLabel,
      'Chưa có JWT REST. Đăng nhập API (loginRestApi) hoặc EXPO_PUBLIC_DEV_REST_JWT khi dev.'
    );
    return;
  }

  const payload = getDemoBookingPayload();
  if (!payload) {
    Alert.alert(
      featureLabel,
      'Thiếu EXPO_PUBLIC_DEMO_BOOKING_BUSINESS_ID và EXPO_PUBLIC_DEMO_BOOKING_SERVICE_ID trong .env.'
    );
    return;
  }

  confirmSecurityDepositThen(async () => {
    Alert.alert('ViGlobal', 'Transaction Processing…');
    try {
      const res = await createBooking(payload);
      if (res.ok) {
        Alert.alert('ViGlobal', 'Success!');
        return;
      }
      Alert.alert(featureLabel, res.error);
    } catch (e) {
      Alert.alert(featureLabel, formatNetworkFailureMessage(e));
    }
  });
}
