import { useEffect, type ReactElement } from 'react';

import { useAuth } from '../context/AuthContext';
import { useUserStore } from './userStore';

/** Keeps `allowedRoles` / active hat aligned with persisted Prisma `Role` after login or logout. */
export function SuperAppUserStoreSync(): ReactElement | null {
  const user = useAuth().user;
  const syncFromServerRole = useUserStore((s) => s.syncFromServerRole);

  useEffect(() => {
    syncFromServerRole(user?.serverRole);
  }, [syncFromServerRole, user?.serverRole]);

  return null;
}
