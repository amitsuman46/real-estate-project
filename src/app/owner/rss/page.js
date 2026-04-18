'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { ExternalLink } from 'lucide-react';

const CATEGORY_LABEL = {
  rbi: 'RBI — macro & regulation',
  pib: 'PIB — government press lines',
  nhb: 'NHB — housing index reference',
  markets: 'Markets & business headlines',
};

function clip(s, n = 220) {
  if (!s) return '';
  return s.length <= n ? s : `${s.slice(0, n)}…`;
}

export default function OwnerRssPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loadingFeeds, setLoadingFeeds] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'Owner') {
      router.replace('/agent/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (loading || !user || user.role !== 'Owner') return;
    let cancelled = false;
    (async () => {
      setLoadingFeeds(true);
      setErr('');
      try {
        const res = await fetch('/api/rss', { cache: 'no-store' });
        const raw = await res.text();
        let json;
        try {
          json = raw ? JSON.parse(raw) : {};
        } catch {
          throw new Error(raw?.slice(0, 120) || 'Server returned non-JSON (check /api/rss logs).');
        }
        if (!res.ok) throw new Error(json?.error || res.statusText);
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load feeds');
      } finally {
        if (!cancelled) setLoadingFeeds(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  if (loading || !user || user.role !== 'Owner') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">Loading…</div>
    );
  }

  const feeds = data?.feeds || [];
  const byCat = feeds.reduce((acc, f) => {
    const k = f.category || 'other';
    if (!acc[k]) acc[k] = [];
    acc[k].push(f);
    return acc;
  }, {});

  return (
    <AppShell title="RSS" subtitle="Macro, policy & markets">
      <p className="mb-6 max-w-3xl text-sm text-zinc-400">
        Live items are pulled server-side from public RSS where available. PIB sometimes blocks datacenter IPs with
        HTTP 401; if that happens, use the feed link in a normal browser or wire a residential proxy later.
      </p>

      {err && (
        <div className="mb-6 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      {loadingFeeds && <p className="text-zinc-500">Fetching feeds…</p>}

      {!loadingFeeds && data && (
        <div className="space-y-10">
          {['rbi', 'pib', 'nhb', 'markets'].map((cat) => {
            const list = byCat[cat];
            if (!list?.length) return null;
            return (
              <section key={cat}>
                <h2 className="mb-4 text-lg font-semibold text-white">{CATEGORY_LABEL[cat] || cat}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {list.map((feed) => (
                    <article
                      key={feed.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-sm"
                    >
                      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-medium text-zinc-100">{feed.label}</h3>
                        {feed.feedUrl && (
                          <a
                            href={feed.feedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-amber-400/90 hover:text-amber-300"
                          >
                            Source <ExternalLink className="h-3 w-3" aria-hidden />
                          </a>
                        )}
                      </div>
                      <p className="mb-3 text-xs leading-relaxed text-zinc-500">{feed.harshNote}</p>

                      {feed.skipped && (
                        <p className="text-xs text-zinc-600">Disabled in Admin → RSS feed policy.</p>
                      )}

                      {feed.kind === 'reference' && feed.referenceUrl && (
                        <a
                          href={feed.referenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex rounded-lg bg-amber-500/15 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-amber-500/25"
                        >
                          {feed.referenceTitle || 'Open reference'}
                        </a>
                      )}

                      {feed.error && (
                        <p className="mb-2 text-xs text-amber-200/90">
                          Could not load items: {feed.error}
                        </p>
                      )}

                      {feed.kind === 'rss' && !feed.skipped && feed.items?.length > 0 && (
                        <ul className="max-h-72 space-y-2 overflow-y-auto border-t border-zinc-800/80 pt-3 text-sm">
                          {feed.items.map((it, idx) => (
                            <li key={`${feed.id}-${idx}`} className="border-b border-zinc-800/60 pb-2 last:border-0">
                              {it.link ? (
                                <a
                                  href={it.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-sky-300 hover:underline"
                                >
                                  {it.title}
                                </a>
                              ) : (
                                <span className="font-medium text-zinc-200">{it.title}</span>
                              )}
                              {it.pubDate && (
                                <div className="text-xs text-zinc-500">{it.pubDate}</div>
                              )}
                              {it.description && (
                                <p className="mt-1 text-xs text-zinc-500">{clip(it.description)}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}

                      {feed.kind === 'rss' && !feed.skipped && !feed.error && (!feed.items || feed.items.length === 0) && (
                        <p className="text-xs text-zinc-600">No items returned.</p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
