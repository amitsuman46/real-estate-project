import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireOwner } from '@/lib/server-auth';
import { DEFAULT_RSS_FEEDS } from '@/lib/rss-feeds-config';

export const runtime = 'nodejs';

function mergeEnabled(stored) {
  const fromDb = stored && typeof stored === 'object' ? stored.enabledById : null;
  const enabledById = {};
  for (const f of DEFAULT_RSS_FEEDS) {
    if (fromDb && Object.prototype.hasOwnProperty.call(fromDb, f.id)) {
      enabledById[f.id] = Boolean(fromDb[f.id]);
    } else {
      enabledById[f.id] = f.enabledDefault;
    }
  }
  return enabledById;
}

export async function GET(request) {
  const auth = await requireOwner(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ error: 'Firestore unavailable' }, { status: 503 });
  }

  let data = {};
  try {
    const ref = adminDb.doc('appSettings/rssFeeds');
    const snap = await ref.get();
    data = snap.exists ? snap.data() : {};
  } catch {
    return NextResponse.json(
      { error: 'Firestore not reachable (check Admin credentials / project id).' },
      { status: 503 }
    );
  }
  const enabledById = mergeEnabled(data);

  return NextResponse.json({
    feeds: DEFAULT_RSS_FEEDS.map((f) => ({
      ...f,
      enabled: enabledById[f.id],
    })),
    enabledById,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
  });
}

export async function POST(request) {
  const auth = await requireOwner(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const patch = body?.enabledById;
  if (!patch || typeof patch !== 'object') {
    return NextResponse.json({ error: 'Body must include enabledById object' }, { status: 400 });
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ error: 'Firestore unavailable' }, { status: 503 });
  }

  const allowed = new Set(DEFAULT_RSS_FEEDS.map((f) => f.id));
  const enabledById = {};
  for (const [k, v] of Object.entries(patch)) {
    if (allowed.has(k)) enabledById[k] = Boolean(v);
  }

  try {
    const ref = adminDb.doc('appSettings/rssFeeds');
    await ref.set(
      {
        enabledById,
        updatedAt: new Date(),
        updatedByUid: auth.uid,
      },
      { merge: true }
    );
  } catch {
    return NextResponse.json(
      { error: 'Firestore write failed (check Admin credentials / project id).' },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, enabledById });
}
