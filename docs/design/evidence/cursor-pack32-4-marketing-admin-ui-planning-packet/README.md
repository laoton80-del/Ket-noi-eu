# Pack32.4 — Marketing Admin Dashboard UI Integration: Planning Packet Evidence

**Operator phrase:** `APPROVE_PACK32_4_MARKETING_ADMIN_UI_PLANNING` — provided this session.
**Baseline:** `origin/master @ 41098fe` (PR #315 — Pack32.3 route wiring, merged).
**Branch:** `docs/pack32-4-marketing-admin-ui-planning`
**Plan:** `docs/internal-ops/VIONA_PACK32_4_MARKETING_ADMIN_UI_PLAN.md`

---

## 1. Why this is docs-only

This packet defines the design for a future React Native component + one additive integration
point in an existing screen. No `.ts`/`.tsx` file was created or modified to produce this packet.

## 2. Source evidence backing the plan's architecture survey (§2) and integration decision (§3)

**Frontend stack — Expo + React Native + react-native-web, no expo-router/Next.js:**

```87:143:package.json
    "expo": "~54.0.34",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.5",
    "react-native-web": "~0.21.0",
```

**Existing marketing admin screen — raw RN primitives, no shared Button/Card:**

```1:29:src/screens/admin/MarketingApprovalScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
...
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
...
import {
  deleteAdminMarketingDraft,
  fetchAdminMarketingPosts,
  postAdminMarketingApproveAndTranslate,
  publishAdminMarketingPost,
  putMarketingPost,
  triggerAdminMarketingDraft,
  type MarketingPostRowDto,
  type MarketingTranslationDto,
} from '../../services/viGlobalAdminApi';
import { formatNetworkFailureMessage, isRestApiConfigured } from '../../services/apiClient';
```

**Existing load/error pattern this new component's data flow mirrors:**

```89:116:src/screens/admin/MarketingApprovalScreen.tsx
  const loadDrafts = useCallback(async (): Promise<void> => {
    if (!isRestApiConfigured()) {
      setDrafts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchAdminMarketingPosts('DRAFT', true, 1);
      if (!res.ok) {
        Alert.alert('Không tải được', res.error);
        setDrafts([]);
        return;
      }
      setDrafts([...res.data.items]);
    } catch (e) {
      Alert.alert('Lỗi', formatNetworkFailureMessage(e));
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, []);
```

**Existing admin marketing API wrappers — stop short of the new Pack32.3 endpoint:**

```67:133:src/services/viGlobalAdminApi.ts
export async function fetchAdminMarketingPosts(...): Promise<ApiRequestResult<AdminMarketingPostsPageDto>> {
  ...
}
...
export async function triggerAdminMarketingDraft(): Promise<ApiRequestResult<AdminMarketingDraftTriggerPayload>> {
  return restApiFetchJson<AdminMarketingDraftTriggerPayload>('/api/admin/trigger-auto-post', {
    method: 'POST',
  });
}
```

**Shared fetch client — JWT + base URL, used by every admin screen:**

```79:105:src/services/apiClient.ts
export async function restApiFetchJson<T>(
  path: string,
  init: Readonly<{
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    skipAuth?: boolean;
  }> = {}
): Promise<ApiRequestResult<T>> {
  ...
}
```

**Target backend endpoint (Pack32.3, PR #315) this plan's new wrapper will call, unmodified:**

```33:37:src/routes/adminRoutes.ts
adminRouter.post('/marketing/generate-draft', (req, res, next) => {
  void AdminMarketingController.postAdminMarketingGenerateDraft(req, res).catch(next);
});
```

**Admin-debug gating chain the embedded component inherits automatically (no new frontend gate
needed):**

```23:28:src/config/adminDebugGate.ts
export function isAdminDebugSurfaceEnabled(): boolean {
  if (!isAdminDebugRequested()) return false;
  if (__DEV__) return true;
  return hasReleaseDebugAck();
}
```

```646:656:App.tsx
            {isAdminDebugSurfaceEnabled() && getFeatureFlags().adminDemoMetricsEnabled ? (
              <>
                ...
                <Stack.Screen name="MarketingApproval" component={MarketingApprovalScreen} />
              </>
            ) : null}
```

## 3. Drift Report

| Check | Result |
| --- | --- |
| Files changed by this packet | 2 (`VIONA_PACK32_4_MARKETING_ADMIN_UI_PLAN.md`, this README) |
| `.ts` / `.tsx` files created or modified | **ZERO** |
| `package.json` diff | **EMPTY** |
| New navigation route / `Stack.Screen` registered | **NO** — planning only |
| Any test run | **NO** |
| Real execution / auto-posting / production | **UNCHANGED — all remain BLOCKED / FORBIDDEN / NOT AUTHORIZED** |

## 4. Next step

A future, separate operator phrase (e.g.
`APPROVE_PACK32_4_MARKETING_ADMIN_UI_IMPLEMENTATION`) is required before the 5-file allowlist in
the plan's §6 may be implemented.
