import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type AppMode = 'B2C_MODE' | 'B2B_MODE';

type AppModeContextValue = {
  mode: AppMode;
  transitionKey: number;
  setMode: (next: AppMode) => void;
  toggleMode: () => void;
};

const AppModeContext = createContext<AppModeContextValue | null>(null);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>('B2C_MODE');
  const [transitionKey, setTransitionKey] = useState(0);

  const setMode = useCallback((next: AppMode) => {
    setModeState((prev) => {
      if (prev === next) return prev;
      setTransitionKey((v) => v + 1);
      return next;
    });
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next: AppMode = prev === 'B2C_MODE' ? 'B2B_MODE' : 'B2C_MODE';
      setTransitionKey((v) => v + 1);
      return next;
    });
  }, []);

  const value = useMemo<AppModeContextValue>(
    () => ({ mode, transitionKey, setMode, toggleMode }),
    [mode, transitionKey, setMode, toggleMode]
  );

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>;
}

export function useAppMode() {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error('useAppMode must be used within AppModeProvider');
  return ctx;
}

