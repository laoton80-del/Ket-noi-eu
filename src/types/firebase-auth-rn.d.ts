import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  /** Provided in the React Native bundle of `@firebase/auth`; needed for AsyncStorage-backed auth. */
  export function getReactNativePersistence(
    storage: import('@react-native-async-storage/async-storage').default
  ): Persistence;
}
