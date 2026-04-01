'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { addLead, getProperties } from '@/lib/db';
import { getFirebaseAuth } from '@/lib/firebase';
import { isFirebaseConfigured } from '@/lib/config';
import { Upload, X } from 'lucide-react';

export default function AgentUploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [offeredAmount, setOfferedAmount] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await getProperties();
      setProperties(list);
      if (list[0]) setPropertyId(list[0].id);
    })();
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) setFile(f);
  }, []);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user || !propertyId || !clientName.trim() || !offeredAmount) {
      setStatus('Fill property, client name, and offer amount.');
      return;
    }
    const amount = Number(offeredAmount.replace(/,/g, ''));
    if (Number.isNaN(amount) || amount <= 0) {
      setStatus('Enter a valid offer amount.');
      return;
    }

    setSubmitting(true);
    setStatus('');

    try {
      if (!isFirebaseConfigured()) {
        await addLead({
          propertyId,
          agentId: user.id,
          agentName: user.name,
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          offeredAmount: amount,
          audioUrl: '',
          transcript: '[Demo] No audio pipeline in mock mode.',
          summary:
            'Demo summary: connect Firebase + OpenAI to transcribe and analyze real conversations.',
          interestLevel: 'Interested',
        });
        setStatus('Saved (demo mode).');
        router.push('/agent/dashboard');
        return;
      }

      const auth = getFirebaseAuth();
      if (!auth?.currentUser) {
        setStatus('Not signed in.');
        return;
      }
      const idToken = await auth.currentUser.getIdToken();

      const fd = new FormData();
      fd.set('propertyId', propertyId);
      fd.set('clientName', clientName.trim());
      fd.set('clientPhone', clientPhone.trim());
      fd.set('offeredAmount', String(amount));
      if (file) fd.set('audio', file);

      const res = await fetch('/api/process-audio', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.clientLead && res.status === 503) {
          await addLead({
            ...data.clientLead,
            agentId: user.id,
            agentName: user.name,
          });
          setStatus('Saved via client (configure Firebase Admin + OpenAI on the server for full pipeline).');
          router.push('/agent/dashboard');
          return;
        }
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      setStatus('Processed and saved.');
      router.push('/agent/dashboard');
    } catch (err) {
      setStatus(err.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Log conversation" subtitle="Upload audio & capture the bid">
      <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-6">
        <div>
          <label className="block text-xs font-medium text-zinc-400">Property</label>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
            required
          >
            {properties.length === 0 ? (
              <option value="">No properties — add in Firestore</option>
            ) : (
              properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.location}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-zinc-400">Client name</label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400">Phone</label>
            <input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50"
              type="tel"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400">Offered amount (bid)</label>
          <input
            value={offeredAmount}
            onChange={(e) => setOfferedAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm tabular-nums text-white outline-none focus:border-amber-500/50"
            placeholder="e.g. 440000"
            inputMode="decimal"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400">Audio recording</label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="mt-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/40 px-6 py-10 text-center"
          >
            {file ? (
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="mb-2 h-8 w-8 text-zinc-600" aria-hidden />
                <p className="text-sm text-zinc-500">Drop a file or choose below</p>
                <label className="mt-3 cursor-pointer rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
                  Choose file
                  <input type="file" accept="audio/*" className="hidden" onChange={onFile} />
                </label>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-600">Optional if API runs without audio (uses bid context only).</p>
        </div>

        {status && <p className="text-sm text-amber-200/90">{status}</p>}

        <button
          type="submit"
          disabled={submitting || properties.length === 0}
          className="w-full rounded-lg bg-amber-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {submitting ? 'Processing…' : 'Submit & run AI'}
        </button>
      </form>
    </AppShell>
  );
}
