'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { getAllLeads, getProperties, getSalesRepPerformance } from '@/lib/db';
import { Building2, ChevronRight, Phone, Target, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function formatMoney(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    n
  );
}

function shortName(full) {
  const p = (full || '').trim().split(/\s+/);
  return p[0] || '—';
}

export default function OwnerDashboardPage() {
  const [properties, setProperties] = useState([]);
  const [leads, setLeads] = useState([]);
  const [repPerformance, setRepPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, l, reps] = await Promise.all([
          getProperties(),
          getAllLeads(),
          getSalesRepPerformance(),
        ]);
        if (!cancelled) {
          setProperties(p);
          setLeads(l);
          setRepPerformance(reps);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeProps = properties.filter((p) => p.status === 'Active').length;
  const leadsByProperty = leads.reduce((acc, lead) => {
    acc[lead.propertyId] = (acc[lead.propertyId] || 0) + 1;
    return acc;
  }, {});

  const chartData = useMemo(
    () =>
      repPerformance.map((r) => ({
        name: shortName(r.name),
        fullName: r.name,
        Today: r.callsToday,
        '7 days': r.callsWeek,
        '30 days': r.callsMonth,
      })),
    [repPerformance]
  );

  return (
    <AppShell title="Owner overview" subtitle="Harsh — global pipeline">
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : (
        <>
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex items-center gap-2 text-zinc-500">
                <Building2 className="h-4 w-4" aria-hidden />
                <span className="text-xs font-medium uppercase tracking-wide">Active listings</span>
              </div>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{activeProps}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex items-center gap-2 text-zinc-500">
                <Users className="h-4 w-4" aria-hidden />
                <span className="text-xs font-medium uppercase tracking-wide">Total leads</span>
              </div>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{leads.length}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Properties tracked</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{properties.length}</p>
            </div>
          </div>

          <section className="mb-12">
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  Sales team performance
                </h2>
                <p className="mt-1 max-w-2xl text-xs text-zinc-600">
                  Calls are logged conversations (each lead submission). Conversion (30d) is the share of that
                  rep&apos;s last-30-day leads marked Interested or Highly Interested by AI.
                </p>
              </div>
            </div>

            {repPerformance.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 px-4 py-8 text-center text-sm text-zinc-500">
                No sales representatives found. Add users with role Agent in Firestore, or use demo sign-in.
              </p>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                        <th className="px-4 py-3">Representative</th>
                        <th className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" aria-hidden />
                            Today
                          </span>
                        </th>
                        <th className="px-4 py-3 text-right">Last 7 days</th>
                        <th className="px-4 py-3 text-right">Last 30 days</th>
                        <th className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1">
                            <Target className="h-3.5 w-3.5" aria-hidden />
                            Conversion (30d)
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {repPerformance.map((row) => (
                        <tr key={row.agentId} className="border-b border-zinc-800/80 last:border-0">
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">{row.name}</div>
                            {row.email ? (
                              <div className="text-xs text-zinc-500">{row.email}</div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-zinc-200">{row.callsToday}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-zinc-200">{row.callsWeek}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-zinc-200">{row.callsMonth}</td>
                          <td className="px-4 py-3 text-right">
                            {row.conversionRate !== null ? (
                              <span className="tabular-nums font-medium text-emerald-400/90">
                                {row.conversionRate}%
                              </span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                            {row.leadsInMonth > 0 && (
                              <span className="ml-1 text-xs text-zinc-600">
                                ({row.positiveInMonth}/{row.leadsInMonth})
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Logged conversations by period
                  </h3>
                  <div className="h-72 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis
                          stroke="#71717a"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#18181b',
                            border: '1px solid #3f3f46',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          labelFormatter={(_, payload) =>
                            payload?.[0]?.payload?.fullName || payload?.[0]?.payload?.name
                          }
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="Today" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="7 days" fill="#d97706" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="30 days" fill="#78350f" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </section>

          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Property hub</h2>
          <div className="space-y-2">
            {properties.map((p) => (
              <Link
                key={p.id}
                href={`/owner/property/${p.id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 transition hover:border-amber-500/30 hover:bg-zinc-900/70"
              >
                <div>
                  <div className="font-medium text-white">{p.name}</div>
                  <div className="text-sm text-zinc-500">
                    {p.location} · Asking {formatMoney(p.askingPrice)} ·{' '}
                    <span
                      className={
                        p.status === 'Active' ? 'text-emerald-400/90' : 'text-zinc-500'
                      }
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-400">
                  <span>{leadsByProperty[p.id] || 0} bids</span>
                  <ChevronRight className="h-5 w-5 text-zinc-600" aria-hidden />
                </div>
              </Link>
            ))}
          </div>

          {properties.length === 0 && (
            <p className="text-zinc-500">No properties yet. Seed the `properties` collection in Firestore.</p>
          )}

          <h2 className="mb-4 mt-12 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Recent activity
          </h2>
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Offer</th>
                  <th className="px-4 py-3">Interest</th>
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 8).map((row) => (
                  <tr key={row.id} className="border-b border-zinc-800/80 last:border-0">
                    <td className="px-4 py-3 text-zinc-200">{row.clientName}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-300">{formatMoney(row.offeredAmount)}</td>
                    <td className="px-4 py-3 text-zinc-400">{row.interestLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}
