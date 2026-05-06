/** Hard cap for any API list slice returned from Prisma `findMany` (Iron Dome pagination). */
export const GLOBAL_MAX_LIST_ITEMS = 20 as const;

/** React Query — static / catalog feeds (tourism discover, reference data). */
export const STALE_TIME_MS_CATALOG = 8 * 60 * 1000;

/** React Query — semi-static hubs / profile-adjacent reads. */
export const STALE_TIME_MS_PROFILE = 6 * 60 * 1000;

/** React Query — default for app-wide `QueryClient`. */
export const STALE_TIME_MS_DEFAULT = 5 * 60 * 1000;
