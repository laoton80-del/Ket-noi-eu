/**
 * Node-only: executes {@link planDispatchChannels} using Expo Push API + SES email.
 * Do not import from React Native entry points.
 */

import { Expo } from 'expo-server-sdk';

import { getPrisma } from '../../lib/prisma';
import { isEmailConfigured, sendEmail } from '../EmailService';
import { planDispatchChannels, type DispatchPayload } from '../../utils/Dispatcher';

let expoClient: Expo | null = null;

function getExpo(): Expo {
  if (!expoClient) {
    expoClient = new Expo();
  }
  return expoClient;
}

export type CentralDispatchReceipt = Readonly<{
  pushAttempted: boolean;
  pushOk: boolean;
  emailAttempted: boolean;
  emailOk: boolean;
  detail?: string;
}>;

export async function executeCentralDispatchForUser(userId: string, payload: DispatchPayload): Promise<CentralDispatchReceipt> {
  const channels = planDispatchChannels({ ...payload, userId });
  const user = await getPrisma().user.findUnique({
    where: { id: userId },
    select: { fcmToken: true, email: true, emailVerifiedAt: true },
  });

  let pushAttempted = false;
  let pushOk = false;
  let emailAttempted = false;
  let emailOk = false;

  const token = user?.fcmToken?.trim() ?? '';
  const title = (payload.title ?? 'VIONA').trim() || 'VIONA';
  const body = payload.body.trim();

  if (channels.includes('push') && token.length > 0) {
    pushAttempted = true;
    if (!Expo.isExpoPushToken(token)) {
      pushOk = false;
    } else {
      try {
        const expo = getExpo();
        const [ticket] = await expo.sendPushNotificationsAsync([
          {
            to: token,
            sound: 'default',
            title,
            body,
            data: { kind: payload.kind },
          },
        ]);
        pushOk = ticket.status === 'ok';
      } catch (e) {
        pushOk = false;
      }
    }
  }

  const wantEmail = channels.includes('email');
  const dest =
    (payload.toEmail?.trim() || (user?.emailVerifiedAt ? user?.email?.trim() : null)) ?? null;

  if (wantEmail && dest && isEmailConfigured()) {
    emailAttempted = true;
    try {
      await sendEmail({
        to: dest,
        subject: title,
        text: body,
      });
      emailOk = true;
    } catch {
      emailOk = false;
    }
  }

  return {
    pushAttempted,
    pushOk,
    emailAttempted,
    emailOk,
  };
}
