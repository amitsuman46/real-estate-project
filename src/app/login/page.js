'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Building2 } from 'lucide-react';

export default function LoginPage() {
  const { login, register, loading: authLoading, isFirebase } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('signin');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      if (isFirebase) {
        if (mode === 'register') {
          await register(email, password, name || email.split('@')[0]);
        } else {
          await login(email, password);
        }
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setPending(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="mb-8 flex items-center gap-2 text-white">
        <Building2 className="h-9 w-9 text-amber-400" aria-hidden />
        <span className="text-xl font-semibold tracking-tight">Realty AI</span>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-xl">
        <h1 className="text-lg font-semibold text-white">
          {isFirebase ? (mode === 'register' ? 'Create account' : 'Sign in') : 'Demo sign-in'}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {isFirebase
            ? 'Use your brokerage email. Owners are assigned by admin email policy.'
            : 'Pick a demo email — password is ignored.'}
        </p>

        {!isFirebase && (
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/90">
            <p className="font-medium text-amber-400">Mock accounts</p>
            <p className="mt-1 text-zinc-400">
              Owner: <code className="text-zinc-300">harsh@realstate.com</code>
            </p>
            <p className="text-zinc-400">
              Agent: <code className="text-zinc-300">rahul@realstate.com</code> or{' '}
              <code className="text-zinc-300">priya@realstate.com</code>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isFirebase && mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-zinc-400">Display name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none ring-amber-500/0 transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                placeholder="Your name"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-zinc-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
              autoComplete="email"
            />
          </div>
          {isFirebase && (
            <div>
              <label className="block text-xs font-medium text-zinc-400">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
          >
            {pending ? 'Please wait…' : isFirebase ? (mode === 'register' ? 'Register' : 'Sign in') : 'Continue'}
          </button>
        </form>

        {isFirebase && (
          <p className="mt-4 text-center text-sm text-zinc-500">
            {mode === 'signin' ? (
              <>
                No account?{' '}
                <button
                  type="button"
                  className="text-amber-400 hover:underline"
                  onClick={() => setMode('register')}
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-amber-400 hover:underline"
                  onClick={() => setMode('signin')}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-zinc-600">
          Configure <code className="text-zinc-500">NEXT_PUBLIC_FIREBASE_*</code> for production auth & data.
        </p>
      </div>
    </div>
  );
}
