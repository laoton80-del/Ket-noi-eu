import { createContext, useContext, type ReactElement, type ReactNode } from 'react';

export type HomeCommandContextValue = Readonly<{
  openLanguageSheet: () => void;
  triggerSafetyAssist: () => void;
  openAccount: () => void;
  openRolePicker: () => void;
  showRolePicker: boolean;
}>;

const HomeCommandContext = createContext<HomeCommandContextValue | null>(null);

export function HomeCommandProvider({
  value,
  children,
}: Readonly<{ value: HomeCommandContextValue; children: ReactNode }>): ReactElement {
  return <HomeCommandContext.Provider value={value}>{children}</HomeCommandContext.Provider>;
}

/** B2C Home desktop command shell; null when provider not mounted (should not happen in Tabs). */
export function useHomeCommand(): HomeCommandContextValue | null {
  return useContext(HomeCommandContext);
}
