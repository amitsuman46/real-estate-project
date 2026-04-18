'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { getFirebaseAuth } from '@/lib/firebase';
import { getOwnerEmail } from '@/lib/config';
import { HARSH_RSS_BUSINESS_NOTES, DEFAULT_RSS_FEEDS } from '@/lib/rss-feeds-config';
import { Shield } from 'lucide-react';

async function ownerAuthHeader() {
  const auth = getFirebaseAuth();
  const u = auth?.currentUser;
  if (!u) return {};
  const token = await u.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export default function OwnerAdminPage() {
  const { user, loading, isFirebase } = useAuth();
  const router = useRouter();
  const [enabledById, setEnabledById] = useState(() =>
    Object.fromEntries(DEFAULT_RSS_FEEDS.map((f) => [f.id, f.enabledDefault]))
  );
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'Owner') {
      router.replace('/agent/dashboard');
    }
  }, [user, loading, router]);

  const loadSettings = useCallback(async () => {
    if (!isFirebase) {
      setLoadingSettings(false);
      return;
    }
    setLoadingSettings(true);
    setMessage('');
    try {
      const headers = await ownerAuthHeader();
      const res = await fetch('/api/rss/settings', { headers, cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || res.statusText);
      setEnabledById(json.enabledById || {});
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not load RSS settings');
    } finally {
      setLoadingSettings(false);
    }
  }, [isFirebase]);

  useEffect(() => {
    if (loading || !user || user.role !== 'Owner') return;
    loadSettings();
  }, [user, loading, loadSettings]);

  async function saveSettings() {
    if (!isFirebase) return;
    setSaving(true);
    setMessage('');
    try {
      const headers = {
        ...(await ownerAuthHeader()),
        'Content-Type': 'application/json',
      };
      const res = await fetch('/api/rss/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({ enabledById }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || res.statusText);
      setMessage('Saved RSS feed policy.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user || user.role !== 'Owner') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">Loading…</div>
    );
  }

  const ownerEmail = getOwnerEmail();

  return (
    <AppShell title="Admin" subtitle="RBAC & RSS feed policy">
      <div className="space-y-10">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-400" aria-hidden />
            <h2 className="text-lg font-semibold text-white">Role-based access</h2>
          </div>
          <p className="mb-3 text-sm text-zinc-400">
            <strong className="text-zinc-300">Owner</strong> is assigned when a user signs in with the brokerage owner
            email (<code className="rounded bg-zinc-800 px-1.5 py-0.5 text-amber-200/90">{ownerEmail}</code>
            ), configurable via <code className="rounded bg-zinc-800 px-1.5 py-0.5">NEXT_PUBLIC_OWNER_EMAIL</code>.
            Everyone else is an <strong className="text-zinc-300">Agent</strong>. Agents upload leads; owners see all
            listings, leads, and macro tools such as RSS.
          </p>
          <p className="text-sm text-zinc-500">
            Signed in as <span className="text-zinc-300">{user.email}</span> — role{' '}
            <span className="text-amber-200/90">{user.role}</span>.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
          <h2 className="mb-2 text-lg font-semibold text-white">Harsh — RSS & macro context (business brief)</h2>
          <p className="mb-4 text-sm text-zinc-500">
            Pulled from the client brief for what this tab should prioritize.
          </p>
          <ul className="space-y-4">
            {HARSH_RSS_BUSINESS_NOTES.map((row) => (
              <li key={row.title} className="border-l-2 border-amber-500/40 pl-4">
                <div className="font-medium text-zinc-200">{row.title}</div>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">{row.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
          <h2 className="mb-2 text-lg font-semibold text-white">RSS feed policy</h2>
          <p className="mb-4 text-sm text-zinc-500">
            Choose which sources appear on the <strong className="text-zinc-300">RSS</strong> page. Settings are stored
            in Firestore at <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">appSettings/rssFeeds</code>{' '}
            and require Firebase Admin on the server.
          </p>

          {!isFirebase && (
            <p className="text-sm text-amber-200/90">
              Firebase is not configured in this environment — RSS still loads from defaults via{' '}
              <code className="rounded bg-zinc-800 px-1">/api/rss</code>, but feed toggles are not persisted here.
            </p>
          )}

          {isFirebase && loadingSettings && <p className="text-sm text-zinc-500">Loading current policy…</p>}

          {isFirebase && !loadingSettings && (
            <>
              <div className="space-y-3">
                {DEFAULT_RSS_FEEDS.map((f) => (
                  <label
                    key={f.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2 hover:border-zinc-700"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-amber-500 focus:ring-amber-500/40"
                      checked={Boolean(enabledById[f.id])}
                      onChange={(e) =>
                        setEnabledById((prev) => ({
                          ...prev,
                          [f.id]: e.target.checked,
                        }))
                      }
                    />
                    <span>
                      <span className="font-medium text-zinc-200">{f.label}</span>
                      <span className="mt-0.5 block text-xs text-zinc-500">{f.harshNote}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => saveSettings()}
                  disabled={saving}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save feed policy'}
                </button>
                <button
                  type="button"
                  onClick={() => loadSettings()}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Reload
                </button>
              </div>
            </>
          )}

          {message && (
            <p className={`mt-4 text-sm ${message.startsWith('Saved') ? 'text-emerald-400' : 'text-amber-200/90'}`}>
              {message}
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
