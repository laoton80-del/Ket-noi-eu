/**
 * EU GDPR **Article 17 — Right to erasure** orchestration.
 * **Server**: POST `/gdpr/right-to-erasure` (Supabase/Prisma cascade: bookings, vault blobs, AI chat logs).
 * **Client**: best-effort purge of AsyncStorage artefacts keyed to the user.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { restApiFetchJson } from '../apiClient';
import { STORAGE_KEYS, STORAGE_KEY_BUILDERS } from '../../storage/storageKeys';

export type ErasureResult = Readonly<{
  ok: boolean;
  serverAcknowledged: boolean;
  detail: string;
}>;

/**
 * Triggers cascading delete: **remote** (when API configured) + **local** caches on device.
 * Implement backend to delete rows in `Booking`, `DocumentVault`, `AiChatMessage` (or equivalents) for `userId`.
 */
export async function executeRightToErasure(userId: string): Promise<ErasureResult> {
  const uid = userId.trim();
  if (uid.length === 0) {
    throw new Error('GDPR erasure: userId required');
  }

  let serverAcknowledged = false;
  const api = await restApiFetchJson<{ scheduled?: boolean; jobId?: string }>(
    '/api/gdpr/right-to-erasure',
    {
      method: 'POST',
      body: { userId: uid },
    }
  );

  if (api.ok) {
    serverAcknowledged = true;
  }

  await localErasureCascade(uid);

  const detail = serverAcknowledged
    ? 'Yêu cầu xóa đã được gửi tới máy chủ ViGlobal và dữ liệu cục bộ trên thiết bị đã được dọn.'
    : 'Đã xóa dữ liệu cục bộ trên thiết bị. Kết nối API (EXPO_PUBLIC_REST_API_BASE) để xóa đầy đủ trên máy chủ (Supabase).';

  return {
    ok: true,
    serverAcknowledged,
    detail,
  };
}

async function localErasureCascade(userId: string): Promise<void> {
  const keys: string[] = [
    STORAGE_KEYS.usageHistory,
    STORAGE_KEYS.documentVault,
    STORAGE_KEYS.companionMemory,
    STORAGE_KEYS.networkEffectAggregates,
    STORAGE_KEYS.lifeOsRecentActions,
    STORAGE_KEYS.proactiveSuggestions,
    STORAGE_KEYS.ttsClientCache,
    STORAGE_KEYS.marketplaceTransactions,
    STORAGE_KEY_BUILDERS.aiIdentityProfile(userId),
    STORAGE_KEY_BUILDERS.aiIdentityMemory(userId),
    STORAGE_KEY_BUILDERS.autonomyConsent(userId),
  ];

  const unique = [...new Set(keys)].filter((k) => k.length > 0);
  try {
    await AsyncStorage.multiRemove(unique);
  } catch {
    for (const k of unique) {
      try {
        await AsyncStorage.removeItem(k);
      } catch {
        /* best effort */
      }
    }
  }
}
