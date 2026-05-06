import { useSyncExternalStore } from 'react';

export type RegionState = {
  currentCountry: string;
  localLanguage: string;
  localCurrency: string;
};

let regionState: RegionState = {
  currentCountry: 'Czechia',
  localLanguage: 'Czech',
  localCurrency: 'CZK',
};

const listeners = new Set<() => void>();

export function getRegionState(): RegionState {
  return regionState;
}

export function setRegion(country: string, language: string, currency: string): RegionState {
  regionState = {
    currentCountry: country,
    localLanguage: language,
    localCurrency: currency,
  };
  listeners.forEach((listener) => listener());
  return regionState;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRegionState(): RegionState {
  return useSyncExternalStore(subscribe, getRegionState, getRegionState);
}
