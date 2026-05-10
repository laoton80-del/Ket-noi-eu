/**
 * SOS session / event record — frontend contract for future instrumentation (AF.SOS.2).
 * Not wired to analytics or backend in this phase.
 */

export type SosTriggerSource =
  | 'desktop_hold_gate'
  | 'fab_hold'
  | 'quick_action'
  | 'login_pre_gate'
  | 'sheet_manual'
  | 'unknown';

export type SosCallTargetType = 'emergency' | 'trustedContact' | 'vionaOperator' | 'nativeDialer';

export type SosSessionStatus = 'created' | 'holding' | 'confirmed' | 'cancelled' | 'failed' | 'completed';

export type LocationPermissionStatus = 'unknown' | 'granted' | 'denied' | 'limited';

export type SosSessionRecord = Readonly<{
  sosSessionId: string;
  triggerSource: SosTriggerSource;
  userId: string | null;
  startedAt: string;
  locationPermissionStatus: LocationPermissionStatus;
  recordingConsentSnapshot: Readonly<{
    audio: boolean;
    video: boolean;
  }>;
  callTargetType: SosCallTargetType;
  status: SosSessionStatus;
}>;

export function createSosSessionDraft(
  input: Readonly<{
    triggerSource?: SosTriggerSource;
    userId?: string | null;
    locationPermissionStatus?: LocationPermissionStatus;
    recordingConsentSnapshot?: Readonly<{ audio: boolean; video: boolean }>;
    callTargetType?: SosCallTargetType;
    status?: SosSessionStatus;
  }>
): SosSessionRecord {
  const now = new Date().toISOString();
  const suffix = Math.random().toString(36).slice(2, 10);
  return {
    sosSessionId: `sos_${Date.now()}_${suffix}`,
    triggerSource: input.triggerSource ?? 'unknown',
    userId: input.userId ?? null,
    startedAt: now,
    locationPermissionStatus: input.locationPermissionStatus ?? 'unknown',
    recordingConsentSnapshot: input.recordingConsentSnapshot ?? { audio: false, video: false },
    callTargetType: input.callTargetType ?? 'nativeDialer',
    status: input.status ?? 'created',
  };
}
