'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { addProperty, getProperties } from '@/lib/db';
import { ChevronRight, Plus } from 'lucide-react';

function formatMoney(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    n
  );
}

export default function OwnerPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [status, setStatus] = useState('Active');

  async function refresh() {
    const list = await getProperties();
    setProperties(list);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      await addProperty({
        name,
        location,
        askingPrice: askingPrice.replace(/,/g, ''),
        status,
      });
      setName('');
      setLocation('');
      setAskingPrice('');
      setStatus('Active');
      setMessage('Property added.');
      await refresh();
    } catch (err) {
      setMessage(err.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Property listings" subtitle="Add and manage inventory">
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : (
        <div className="space-y-10">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="mb-4 flex items-center gap-2 text-white">
              <Plus className="h-5 w-5 text-amber-400" aria-hidden />
              <h2 className="text-lg font-semibold">Add a new property</h2>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-400">Property name / title</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lakeview Residency — 3BHK"
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-400">Location</label>
                <input
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Area, city"
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400">Asking price (INR)</label>
                <input
                  required
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(e.target.value)}
                  placeholder="e.g. 8500000"
                  inputMode="decimal"
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm tabular-nums text-white outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
                >
                  <option value="Active">Active</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
              <div className="flex items-end sm:col-span-2 lg:col-span-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Add property'}
                </button>
                {message && (
                  <span className="ml-4 text-sm text-zinc-400" role="status">
                    {message}
                  </span>
                )}
              </div>
            </form>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">All properties</h2>
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3 text-right">Asking price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 w-px" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {properties.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                        No properties yet. Add one above.
                      </td>
                    </tr>
                  ) : (
                    properties.map((p) => (
                      <tr key={p.id} className="border-b border-zinc-800/80 last:border-0">
                        <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                        <td className="px-4 py-3 text-zinc-400">{p.location}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-zinc-200">{formatMoney(p.askingPrice)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              p.status === 'Active'
                                ? 'rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300'
                                : 'rounded-full bg-zinc-700/80 px-2 py-0.5 text-xs text-zinc-400'
                            }
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/owner/property/${p.id}`}
                            className="inline-flex items-center gap-1 text-amber-400/90 hover:text-amber-300"
                          >
                            Bids
                            <ChevronRight className="h-4 w-4" aria-hidden />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
