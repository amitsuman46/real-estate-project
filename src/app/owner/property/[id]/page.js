'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell, MicBadge } from '@/components/AppShell';
import { getLeadsForProperty, getPropertyById } from '@/lib/db';
import { ArrowLeft } from 'lucide-react';

function formatMoney(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    n
  );
}

export default function OwnerPropertyPage() {
  const params = useParams();
  const id = params?.id;
  const [property, setProperty] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const [p, list] = await Promise.all([getPropertyById(id), getLeadsForProperty(id)]);
        if (!cancelled) {
          setProperty(p);
          setRows(list);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <AppShell
      title={property ? property.name : 'Property'}
      subtitle={property ? `${property.location} · Asking ${formatMoney(property.askingPrice)}` : 'Bidding tracker'}
    >
      <Link
        href="/owner/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-amber-400"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to overview
      </Link>

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : !property ? (
        <p className="text-zinc-500">Property not found.</p>
      ) : (
        <>
          <p className="mb-6 max-w-2xl text-sm text-zinc-400">
            Ranked by offered amount. Use this before closing a sale to see who else can be nudged to increase their
            bid.
          </p>
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Offered amount</th>
                  <th className="px-4 py-3">AI interest</th>
                  <th className="px-4 py-3">AI summary</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                      No bids logged for this property yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={row.id} className="border-b border-zinc-800/80 last:border-0">
                      <td className="px-4 py-3">
                        <span className="text-zinc-300">{row.agentName || '—'}</span>
                        {i === 0 && (
                          <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-300">
                            Top bid
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{row.clientName}</div>
                        <div className="text-xs text-zinc-500">{row.clientPhone}</div>
                      </td>
                      <td className="px-4 py-3 tabular-nums font-medium text-emerald-300/90">
                        {formatMoney(row.offeredAmount)}
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{row.interestLevel}</td>
                      <td className="max-w-md px-4 py-3 text-zinc-400">
                        <div className="flex items-start gap-2">
                          <MicBadge />
                          <span className="line-clamp-3">{row.summary || '—'}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}
