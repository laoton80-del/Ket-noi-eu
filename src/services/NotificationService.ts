import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { isRestApiConfigured, restApiFetchJson } from './apiClient';

/** Foreground: show banner + play sound when configured. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getEasProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  const id = extra?.eas?.projectId?.trim();
  return id && id.length > 0 ? id : undefined;
}

export type PushRegistrationResult = Readonly<
  | { ok: true; expoPushToken: string }
  | { ok: false; reason: 'not_device' | 'permission_denied' | 'no_token' | 'simulator' }
>;

/**
 * Requests notification permission and returns the Expo push token (maps to FCM/APNs on native builds).
 */
export async function registerForExpoPushTokenAsync(): Promise<PushRegistrationResult> {
  if (!Device.isDevice) {
    return { ok: false, reason: 'not_device' };
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return { ok: false, reason: 'permission_denied' };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const projectId = getEasProjectId();
  const tokenResult = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  const expoPushToken = tokenResult.data;
  if (!expoPushToken || expoPushToken.length < 8) {
    return { ok: false, reason: 'no_token' };
  }

  return { ok: true, expoPushToken };
}

/**
 * Registers the device for push and syncs the token to `User.fcmToken` when the user is logged into the REST API.
 */
export async function registerPushAndSyncToServer(): Promise<PushRegistrationResult> {
  const reg = await registerForExpoPushTokenAsync();
  if (!reg.ok) {
    return reg;
  }
  if (!isRestApiConfigured()) {
    return reg;
  }
  const sync = await restApiFetchJson<{ ok: boolean }>('/api/users/push-token', {
    method: 'PATCH',
    body: { fcmToken: reg.expoPushToken },
  });
  if (!sync.ok && __DEV__) {
    console.warn('[NotificationService] push-token sync failed', sync.error);
  }
  return reg;
}

/**
 * Call once on app startup: permissions + token + optional server sync when JWT exists.
 */
export async function initializePushNotificationsOnStartup(): Promise<void> {
  try {
    await registerPushAndSyncToServer();
  } catch {
    // Dev client / misconfigured projectId — remote push remains optional.
  }
}

export function addForegroundNotificationListener(
  listener: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(listener);
}

export function addNotificationResponseListener(
  listener: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(listener);
}
