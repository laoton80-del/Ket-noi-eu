import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type AppMode = 'B2C_MODE' | 'B2B_MODE';

type AppModeContextValue = {
  mode: AppMode;
  isB2B: boolean;
  setMode: (nextMode: AppMode) => void;
  toggleMode: () => void;
};

const AppModeContext = createContext<AppModeContextValue | null>(null);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>('B2C_MODE');

  const setMode = useCallback((nextMode: AppMode) => {
    setModeState(nextMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === 'B2C_MODE' ? 'B2B_MODE' : 'B2C_MODE'));
  }, []);

  const value = useMemo<AppModeContextValue>(
    () => ({
      mode,
      isB2B: mode === 'B2B_MODE',
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode]
  );

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>;
}

export function useAppMode() {
  const ctx = useContext(AppModeContext);
  if (!ctx) {
    throw new Error('useAppMode must be used within AppModeProvider');
  }
  return ctx;
}
