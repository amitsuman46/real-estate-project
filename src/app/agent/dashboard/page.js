'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell, MicBadge } from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { getLeadsForAgent } from '@/lib/db';
import { ArrowUpRight } from 'lucide-react';

function formatMoney(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    n
  );
}

export default function AgentDashboardPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getLeadsForAgent(user.id);
        if (!cancelled) setLeads(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <AppShell title="Your leads" subtitle="Agent workspace">
      <div className="mb-6 flex justify-end">
        <Link
          href="/agent/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
        >
          Log new conversation
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading leads…</p>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 px-6 py-12 text-center text-zinc-500">
          No leads yet.{' '}
          <Link href="/agent/upload" className="text-amber-400 hover:underline">
            Upload a conversation
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Offer</th>
                <th className="px-4 py-3">Interest</th>
                <th className="px-4 py-3">Summary</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((row) => (
                <tr key={row.id} className="border-b border-zinc-800/80 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{row.clientName}</div>
                    <div className="text-xs text-zinc-500">{row.clientPhone}</div>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-200">{formatMoney(row.offeredAmount)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                      {row.interestLevel}
                    </span>
                  </td>
                  <td className="max-w-md px-4 py-3 text-zinc-400">
                    <div className="flex items-start gap-2">
                      <MicBadge />
                      <span className="line-clamp-2">{row.summary || '—'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
