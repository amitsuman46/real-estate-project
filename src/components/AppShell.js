'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Building2, LayoutDashboard, List, LogOut, Mic, Upload } from 'lucide-react';

export function AppShell({ children, title, subtitle }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const base = user?.role === 'Owner' ? '/owner' : '/agent';

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Loading…
      </div>
    );
  }

  const nav = [
    { href: `${base}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    ...(user.role === 'Owner'
      ? [{ href: '/owner/properties', label: 'Listings', icon: List }]
      : []),
    ...(user.role === 'Agent'
      ? [{ href: '/agent/upload', label: 'New lead', icon: Upload }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="fixed inset-y-0 left-0 z-40 w-56 border-r border-zinc-800 bg-zinc-900/80 backdrop-blur">
        <div className="flex h-14 items-center gap-2 border-b border-zinc-800 px-4">
          <Building2 className="h-6 w-6 text-amber-400" aria-hidden />
          <span className="font-semibold tracking-tight">Realty AI</span>
        </div>
        <nav className="flex flex-col gap-0.5 p-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-amber-500/15 text-amber-300' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800 p-3">
          <div className="mb-2 truncate px-1 text-xs text-zinc-500">{user.email}</div>
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>
      </aside>
      <div className="pl-56">
        <header className="border-b border-zinc-800 bg-zinc-950/80 px-8 py-6 backdrop-blur">
          {subtitle && <p className="text-xs font-medium uppercase tracking-wider text-amber-500/90">{subtitle}</p>}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{title}</h1>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

export function MicBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
      <Mic className="h-3 w-3" aria-hidden />
      AI
    </span>
  );
}
