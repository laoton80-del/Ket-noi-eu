import type { AuthUser } from '../context/authTypes';
import type { RootStackParamList } from './routes';

/**
 * Super-app always cold-starts on `Tabs`; role switching is handled in-app via `useUserStore`.
 *
 * V7 OMNIVERSE: bottom tabs are defined in `MainTabNavigator` (not here). B2C shows four hubs
 * (Hub · Local · Travel · Academy) via `V7_B2C_TAB_LABELS`; B2B/Broker/Admin mount their own 1–5 tab decks.
 */
export function resolveRootStackRoute(_user: AuthUser | null): keyof RootStackParamList {
  return 'Tabs';
}
