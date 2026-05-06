import { QueryClient } from '@tanstack/react-query';

import { STALE_TIME_MS_DEFAULT } from '../constants/globalPerformance';

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS_DEFAULT,
        gcTime: 45 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
    },
  });
}
