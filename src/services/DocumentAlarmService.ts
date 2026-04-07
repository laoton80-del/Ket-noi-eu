import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { STORAGE_KEYS } from '../storage/storageKeys';

export const DOCUMENT_VAULT_STORAGE_KEY = STORAGE_KEYS.documentVault;
const DOCUMENT_ALARM_SEEN_KEY = STORAGE_KEYS.documentAlarmSeen;
const DAY_MS = 24 * 60 * 60 * 1000;

export type CoreDocumentType = 'passport' | 'visa_residency' | 'labor_contract';

export type DocumentVaultItem = {
  id: string;
  documentType: CoreDocumentType;
  expiryDate: string;
  holderName: string;
  source: 'scan' | 'manual';
  actionRequired?: string;
  createdAt: string;
  reminderIds?: string[];
  // legacy fields kept for backward compatibility
  type?: string;
  expiry_date?: string;
  holder_name?: string;
};

type SeenThresholdMap = Record<string, Array<90 | 30>>;

type StartupAlarmAction = {
  documentId: string;
  documentType: CoreDocumentType;
  expiryDate: string;
  daysLeft: number;
  ctaMessage: string;
};

function daysUntil(expiryDate: string): number {
  const now = new Date();
  const target = new Date(`${expiryDate}T00:00:00`);
  return Math.ceil((target.getTime() - now.getTime()) / DAY_MS);
}

function resolveDocumentType(raw?: string): CoreDocumentType {
  const value = (raw ?? '').toLowerCase();
  if (value.includes('passport') || value.includes('hộ chiếu') || value.includes('ho chieu')) return 'passport';
  if (value.includes('visa') || value.includes('residency') || value.includes('cư trú') || value.includes('cu tru')) {
    return 'visa_residency';
  }
  return 'labor_contract';
}

export function getDocumentTypeLabel(type: CoreDocumentType): string {
  if (type === 'passport') return 'Hộ chiếu';
  if (type === 'visa_residency') return 'Thẻ cư trú (Visa)';
  return 'Hợp đồng lao động';
}

export function normalizeVaultDocument(input: Partial<DocumentVaultItem>): DocumentVaultItem | null {
  const expiryDate = (input.expiryDate ?? input.expiry_date ?? '').trim();
  const holderName = (input.holderName ?? input.holder_name ?? '').trim();
  if (!expiryDate) return null;
  const parsedDate = new Date(`${expiryDate}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return null;
  const documentType = input.documentType ?? resolveDocumentType(input.type);
  const actionRequired = input.actionRequired ?? (input as { action_required?: string }).action_required ?? '';
  return {
    id: input.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    documentType,
    expiryDate,
    holderName: holderName || 'Chưa cập nhật',
    source: input.source ?? 'scan',
    actionRequired: actionRequired || undefined,
    createdAt: input.createdAt ?? new Date().toISOString(),
    reminderIds: input.reminderIds ?? [],
    type: input.type,
    expiry_date: input.expiry_date,
    holder_name: input.holder_name,
  };
}

export async function loadVaultDocuments(): Promise<DocumentVaultItem[]> {
  const raw = await AsyncStorage.getItem(DOCUMENT_VAULT_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Array<Partial<DocumentVaultItem>>;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeVaultDocument).filter((item): item is DocumentVaultItem => !!item);
  } catch {
    return [];
  }
}

async function readSeenThresholdMap(): Promise<SeenThresholdMap> {
  const raw = await AsyncStorage.getItem(DOCUMENT_ALARM_SEEN_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as SeenThresholdMap;
  } catch {
    return {};
  }
}

async function writeSeenThresholdMap(next: SeenThresholdMap) {
  await AsyncStorage.setItem(DOCUMENT_ALARM_SEEN_KEY, JSON.stringify(next));
}

export async function clearDocumentAlarmSeen(documentId: string): Promise<void> {
  const seen = await readSeenThresholdMap();
  if (!(documentId in seen)) return;
  delete seen[documentId];
  await writeSeenThresholdMap(seen);
}

export async function runStartupDocumentAlarmCheck(): Promise<StartupAlarmAction | null> {
  const docs = await loadVaultDocuments();
  if (!docs.length) return null;
  const seen = await readSeenThresholdMap();
  const sorted = [...docs].sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate));
  for (const doc of sorted) {
    const left = daysUntil(doc.expiryDate);
    if (left > 90) continue;
    const threshold: 90 | 30 = left <= 30 ? 30 : 90;
    const seenForDoc = seen[doc.id] ?? [];
    if (seenForDoc.includes(threshold)) continue;
    const docLabel = getDocumentTypeLabel(doc.documentType);
    const ctaMessage =
      `Cảnh báo: ${docLabel} của bạn sẽ hết hạn vào ${doc.expiryDate}. ` +
      'Đừng để trễ hạn! Bạn có muốn Trợ lý Leona Nguyen gọi điện đặt lịch gia hạn ngay bây giờ không?';
    seen[doc.id] = [...seenForDoc, threshold];
    await writeSeenThresholdMap(seen);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Cảnh báo giấy tờ',
          body: ctaMessage,
          data: {
            route: 'LeonaCall',
            prefillRequest: `Gọi hỗ trợ gia hạn ${docLabel} cho khách hàng, giấy tờ hết hạn vào ${doc.expiryDate}.`,
          },
        },
        trigger: null,
      });
    } catch {
      // keep in-app path even if notification scheduling is unavailable
    }
    return {
      documentId: doc.id,
      documentType: doc.documentType,
      expiryDate: doc.expiryDate,
      daysLeft: left,
      ctaMessage,
    };
  }
  return null;
}

