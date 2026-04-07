import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AutonomousAuditLog } from './types';

import { STORAGE_KEYS } from '../../storage/storageKeys';

const AUTONOMY_AUDIT_KEY = STORAGE_KEYS.autonomyAudit;
const MAX_AUDIT_ITEMS = 200;

export async function loadAutonomyAuditLogs(): Promise<AutonomousAuditLog[]> {
  try {
    const raw = await AsyncStorage.getItem(AUTONOMY_AUDIT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AutonomousAuditLog[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-MAX_AUDIT_ITEMS);
  } catch {
    return [];
  }
}

export async function appendAutonomyAuditLog(item: AutonomousAuditLog): Promise<void> {
  const prev = await loadAutonomyAuditLogs();
  const next = [...prev, item].slice(-MAX_AUDIT_ITEMS);
  await AsyncStorage.setItem(AUTONOMY_AUDIT_KEY, JSON.stringify(next));
}

export async function completeAutonomyAuditLog(
  id: string,
  patch: Pick<AutonomousAuditLog, 'completedAt' | 'outcome' | 'failureReason' | 'relatedBookingId' | 'relatedCallSessionId'>
): Promise<void> {
  const prev = await loadAutonomyAuditLogs();
  const next = prev.map((row) => (row.id === id ? { ...row, ...patch } : row));
  await AsyncStorage.setItem(AUTONOMY_AUDIT_KEY, JSON.stringify(next.slice(-MAX_AUDIT_ITEMS)));
}

export async function getTodayAutonomyCreditsSpent(userId: string, today = new Date()): Promise<number> {
  const rows = await loadAutonomyAuditLogs();
  const day = today.toISOString().slice(0, 10);
  return rows
    .filter((r) => r.userId === userId && r.outcome === 'success' && r.startedAt.slice(0, 10) === day)
    .reduce((sum, r) => sum + (r.creditsReserved || 0), 0);
}

export async function hasRecentSuccessfulAutonomyAction(
  userId: string,
  triggerType: AutonomousAuditLog['triggerType'],
  withinMs: number,
  now = Date.now()
): Promise<boolean> {
  const rows = await loadAutonomyAuditLogs();
  return rows.some((r) => {
    if (r.userId !== userId) return false;
    if (r.triggerType !== triggerType) return false;
    if (r.outcome !== 'success') return false;
    const at = Date.parse(r.startedAt);
    if (!Number.isFinite(at)) return false;
    return now - at <= withinMs;
  });
}
