import * as LiveActivity from 'expo-live-activity';
import { Platform } from 'react-native';

type QueueActivityPayload = {
  queueNumber: number;
  estimatedWaitTime: number;
};

type LiveActivityResult = {
  ok: boolean;
  activityId: string | null;
  payload: QueueActivityPayload;
};

function buildQueueState(payload: QueueActivityPayload): LiveActivity.LiveActivityState {
  return {
    title: 'Kết Nối Global',
    subtitle: `Số thứ tự #${payload.queueNumber}`,
    progressBar: {
      progress: Math.max(0, Math.min(1, 1 - payload.estimatedWaitTime / 60)),
    },
  };
}

/**
 * Foundation API for lock-screen / Dynamic Island queue activity.
 * On non-iOS platforms this safely returns a mocked success payload.
 */
export async function startQueueActivity(
  queueNumber: number,
  estimatedWaitTime: number
): Promise<LiveActivityResult> {
  const payload: QueueActivityPayload = {
    queueNumber,
    estimatedWaitTime,
  };

  if (Platform.OS !== 'ios') {
    return {
      ok: true,
      activityId: `mock-queue-${queueNumber}`,
      payload,
    };
  }

  const activityId = LiveActivity.startActivity(buildQueueState(payload), {
    deepLinkUrl: 'ketnoiglobal://b2b/inbound-queue',
  });

  return {
    ok: Boolean(activityId),
    activityId: activityId ?? null,
    payload,
  };
}
