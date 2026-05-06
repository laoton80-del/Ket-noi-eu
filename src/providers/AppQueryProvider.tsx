import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactElement, type ReactNode } from 'react';

import { createAppQueryClient } from '../lib/queryClient';

export function AppQueryProvider({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  const [client] = useState(createAppQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
