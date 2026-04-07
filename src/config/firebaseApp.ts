import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';

function readFirebaseOptions(): FirebaseOptions | null {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim() ?? '';
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? '';
  if (!apiKey || !projectId) return null;
  const authDomain =
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || `${projectId}.firebaseapp.com`;
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim() ?? '';
  const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? '';
  const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ?? '';
  return {
    apiKey,
    authDomain,
    projectId,
    ...(appId ? { appId } : {}),
    ...(messagingSenderId ? { messagingSenderId } : {}),
    ...(storageBucket ? { storageBucket } : {}),
  };
}

export function isFirebaseClientConfigured(): boolean {
  return readFirebaseOptions() !== null;
}

export function getFirebaseApp(): FirebaseApp | null {
  const opts = readFirebaseOptions();
  if (!opts) return null;
  if (getApps().length) return getApp();
  return initializeApp(opts);
}
