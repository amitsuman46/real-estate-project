import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { DEFAULT_RSS_FEEDS } from '@/lib/rss-feeds-config';
import { parseRss2 } from '@/lib/rss-parse';

export const runtime = 'nodejs';

const UA =
  'Mozilla/5.0 (compatible; RealtyAI-RSS/1.0; +https://example.invalid; contact: owner) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function mergeEnabledFromDefaults(storedEnabledById) {
  const enabledById = {};
  for (const f of DEFAULT_RSS_FEEDS) {
    if (storedEnabledById && Object.prototype.hasOwnProperty.call(storedEnabledById, f.id)) {
      enabledById[f.id] = Boolean(storedEnabledById[f.id]);
    } else {
      enabledById[f.id] = f.enabledDefault;
    }
  }
  return enabledById;
}

async function loadStoredEnabledById() {
  const adminDb = getAdminDb();
  if (!adminDb) return null;
  try {
    const snap = await adminDb.doc('appSettings/rssFeeds').get();
    if (!snap.exists) return null;
    const v = snap.data()?.enabledById;
    return v && typeof v === 'object' ? v : null;
  } catch {
    // Misconfigured Admin (e.g. ADC without project), expired creds, etc. — still serve RSS from defaults.
    return null;
  }
}

async function fetchFeedXml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/rss+xml, application/xml, application/atom+xml, text/xml;q=0.9, */*;q=0.8',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(25000),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

export async function GET() {
  const stored = await loadStoredEnabledById();
  const enabledById = mergeEnabledFromDefaults(stored);

  const results = await Promise.all(
    DEFAULT_RSS_FEEDS.map(async (def) => {
      if (!enabledById[def.id]) {
        return {
          ...def,
          enabled: false,
          skipped: true,
          items: [],
          channelTitle: undefined,
          error: null,
        };
      }

      if (def.kind === 'reference') {
        return {
          ...def,
          enabled: true,
          skipped: false,
          items: [],
          channelTitle: def.referenceTitle || def.label,
          error: null,
        };
      }

      try {
        const { ok, status, text } = await fetchFeedXml(def.feedUrl);
        if (!ok) {
          return {
            ...def,
            enabled: true,
            skipped: false,
            items: [],
            channelTitle: undefined,
            error: `HTTP ${status} from feed URL`,
          };
        }
        const parsed = parseRss2(text, 18);
        return {
          ...def,
          enabled: true,
          skipped: false,
          items: parsed.items,
          channelTitle: parsed.title,
          error: null,
        };
      } catch (e) {
        return {
          ...def,
          enabled: true,
          skipped: false,
          items: [],
          channelTitle: undefined,
          error: e instanceof Error ? e.message : 'Fetch failed',
        };
      }
    })
  );

  return NextResponse.json({
    fetchedAt: new Date().toISOString(),
    firestoreSettingsLoaded: Boolean(stored),
    feeds: results,
  });
}
