import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FirebaseAuth from 'firebase/auth';
import type { Auth, Persistence } from 'firebase/auth';
import { ensureFirebaseAppCheckInitialized } from '../config/appCheckClient';
import { maybeLogNativeAppCheckEnforcementRiskOnce } from '../config/runtimeTrustProfile';
import { getFirebaseApp, isFirebaseClientConfigured } from '../config/firebaseApp';

const { getAuth, getIdToken, initializeAuth, signInAnonymously } = FirebaseAuth;

const getReactNativePersistence = (
  FirebaseAuth as unknown as {
    getReactNativePersistence?: (storage: typeof AsyncStorage) => Persistence;
  }
).getReactNativePersistence;

let authReady: Promise<Auth | null> | null = null;

function getOrInitAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    return getAuth(app);
  } catch {
    if (typeof getReactNativePersistence === 'function') {
      return initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    }
    return initializeAuth(app);
  }
}

/**
 * Ensures an anonymous Firebase Auth user exists (persisted) so Cloud Functions can verify ID tokens for walletOps.
 */
export function ensureWalletFirebaseAuth(): Promise<Auth | null> {
  if (!isFirebaseClientConfigured()) return Promise.resolve(null);
  if (authReady) return authReady;
  authReady = (async () => {
    try {
      void ensureFirebaseAppCheckInitialized();
      const auth = getOrInitAuth();
      if (!auth) {
        authReady = null;
        return null;
      }
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      maybeLogNativeAppCheckEnforcementRiskOnce();
      return auth;
    } catch {
      authReady = null;
      return null;
    }
  })();
  return authReady;
}

export async function getWalletIdToken(forceRefresh = false): Promise<string | null> {
  const auth = await ensureWalletFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) return null;
  try {
    return await getIdToken(user, forceRefresh);
  } catch {
    return null;
  }
}
