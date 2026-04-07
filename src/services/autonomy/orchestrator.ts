import * as Notifications from 'expo-notifications';
import type { AuthUser } from '../../context/AuthContext';
import { LIFEOS_LEGAL_LEONA_CREDITS } from '../../constants/lifeOSConversion';
import { syncWalletFromServer } from '../../state/wallet';
import type { SellResume } from '../selling/sellingTypes';
import { loadAutonomousConsent } from './consentStorage';
import { appendAutonomyAuditLog, completeAutonomyAuditLog, getTodayAutonomyCreditsSpent, hasRecentSuccessfulAutonomyAction } from './auditLogStorage';
import { evaluateAutonomousAction } from './policyEngine';
import { getUserState } from './userStateAggregator';
import type { AutonomousActionTrigger, AutonomousAuditLog, AutonomousOrchestratorResult } from './types';

const VISA_AUTONOMY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function newAuditId() {
  return `autonomy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildVisaResumeAction(userState: Awaited<ReturnType<typeof getUserState>>): SellResume {
  const expiry = userState.visaExpiry ?? 'gần nhất';
  return {
    route: 'LeonaCall',
    params: {
      prefillRequest: `Gọi hỗ trợ gia hạn hồ sơ trước ngày ${expiry}.`,
      autoSubmit: true,
    },
  };
}

async function emitAutonomyNotification(message: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tự động hóa đã chạy',
        body: message,
      },
      trigger: null,
    });
  } catch {
    // Notification is optional. Auditing is primary source of truth.
  }
}

export async function orchestrateAutonomousAction(params: {
  trigger: AutonomousActionTrigger;
  user: AuthUser;
}): Promise<AutonomousOrchestratorResult> {
  const { trigger, user } = params;
  await syncWalletFromServer();
  const userState = await getUserState(user);
  const consent = await loadAutonomousConsent(userState.userId);
  const actionCost = trigger.type === 'visa_expiry_threshold' ? LIFEOS_LEGAL_LEONA_CREDITS : 0;
  const dailySpent = await getTodayAutonomyCreditsSpent(userState.userId);
  const cooldown = {
    isActive:
      trigger.type === 'visa_expiry_threshold'
        ? await hasRecentSuccessfulAutonomyAction(userState.userId, trigger.type, VISA_AUTONOMY_COOLDOWN_MS)
        : false,
  };

  const decision = evaluateAutonomousAction({
    trigger,
    userState,
    consent,
    credits: { actionCost, dailySpent },
    currentTime: new Date(),
    cooldown,
    requiredData: {
      hasPhone: !!user.phone?.trim(),
      hasVisaExpiry: !!userState.visaExpiry,
    },
  });

  const audit: AutonomousAuditLog = {
    id: newAuditId(),
    triggerType: trigger.type,
    actionType: 'auto_visa_booking',
    userId: userState.userId,
    allowedByPolicy: decision.status === 'allowed',
    creditsReserved: actionCost,
    startedAt: new Date().toISOString(),
    completedAt: null,
    outcome:
      decision.status === 'allowed'
        ? 'started'
        : decision.status === 'require_confirmation'
          ? 'policy_require_confirmation'
          : 'policy_blocked',
    failureReason: decision.status === 'blocked' ? decision.reason : undefined,
  };
  await appendAutonomyAuditLog(audit);

  if (decision.status !== 'allowed') {
    await completeAutonomyAuditLog(audit.id, {
      completedAt: new Date().toISOString(),
      outcome: audit.outcome,
      failureReason: audit.failureReason,
    });
    return { decision, audit };
  }

  // Pilot trust: no client-only ledger mutation here. Policy already gated on synced balance;
  // LeonaCall applies chargeTrustedService (server) when the session is billed.

  const resumeAction = buildVisaResumeAction(userState);
  await completeAutonomyAuditLog(audit.id, {
    completedAt: new Date().toISOString(),
    outcome: 'success',
  });
  const message = 'Đã khởi tạo cuộc gọi gia hạn visa theo consent của bạn.';
  await emitAutonomyNotification(message);
  return {
    decision,
    audit: { ...audit, completedAt: new Date().toISOString(), outcome: 'success' },
    resumeAction,
    emittedEvent: {
      type: 'autonomy_action_executed',
      message,
    },
  };
}
