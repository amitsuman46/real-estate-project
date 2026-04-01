import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  try {
    if (json) {
      const parsed = JSON.parse(json);
      return initializeApp({ credential: cert(parsed) });
    }
  } catch {
    return null;
  }
  try {
    return initializeApp({ credential: applicationDefault() });
  } catch {
    return null;
  }
}

export function getAdminDb() {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}

export function getAdminAuth() {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}
