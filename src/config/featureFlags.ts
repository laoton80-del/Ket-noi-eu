import { createContext, createElement, useContext, useMemo, useState, type PropsWithChildren } from 'react';

export interface FeatureFlags {
  enableWeb3Vault: boolean;
  enableARCamera: boolean;
  enableSpatialAudio: boolean;
}

type FeatureFlagContextValue = {
  flags: FeatureFlags;
  setFlags: (next: Partial<FeatureFlags>) => void;
};

const defaultFlags: FeatureFlags = {
  enableWeb3Vault: true,
  enableARCamera: true,
  enableSpatialAudio: true,
};

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

export function FeatureFlagProvider({ children }: PropsWithChildren) {
  const [flags, setFlagsState] = useState<FeatureFlags>(defaultFlags);

  const value = useMemo<FeatureFlagContextValue>(
    () => ({
      flags,
      setFlags: (next) => {
        setFlagsState((prev) => ({ ...prev, ...next }));
      },
    }),
    [flags]
  );

  return createElement(FeatureFlagContext.Provider, { value }, children);
}

export function useFeatureFlags(): FeatureFlagContextValue {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagProvider.');
  }
  return context;
}
