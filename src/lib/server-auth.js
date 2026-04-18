import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

function bearerToken(request) {
  const authHeader = request.headers.get('authorization') || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
}

/**
 * @param {Request} request
 * @returns {Promise<{ ok: true, uid: string, email?: string } | { ok: false, status: number, error: string }>}
 */
export async function requireOwner(request) {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();
  const token = bearerToken(request);

  if (!adminAuth || !adminDb) {
    return { ok: false, status: 503, error: 'Firebase Admin is not configured (FIREBASE_SERVICE_ACCOUNT_JSON).' };
  }
  if (!token) {
    return { ok: false, status: 401, error: 'Missing Authorization bearer token' };
  }

  let uid;
  let email;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
    email = decoded.email || '';
  } catch {
    return { ok: false, status: 401, error: 'Invalid or expired token' };
  }

  const snap = await adminDb.collection('users').doc(uid).get();
  const role = snap.data()?.role;
  if (role !== 'Owner') {
    return { ok: false, status: 403, error: 'Owner role required' };
  }

  return { ok: true, uid, email };
}

/**
 * @param {Request} request
 * @returns {Promise<{ uid: string, email?: string } | null>}
 */
export async function getOptionalOwner(request) {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();
  const token = bearerToken(request);
  if (!adminAuth || !adminDb || !token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const snap = await adminDb.collection('users').doc(decoded.uid).get();
    if (snap.data()?.role !== 'Owner') return null;
    return { uid: decoded.uid, email: decoded.email || '' };
  } catch {
    return null;
  }
}
