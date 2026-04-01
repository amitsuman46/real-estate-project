import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request) {
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const propertyId = formData.get('propertyId')?.toString();
  const clientName = formData.get('clientName')?.toString();
  const clientPhone = formData.get('clientPhone')?.toString() || '';
  const offeredRaw = formData.get('offeredAmount')?.toString();
  const offeredAmount = Number(offeredRaw?.replace(/,/g, ''));
  const audio = formData.get('audio');

  if (!propertyId || !clientName || !Number.isFinite(offeredAmount) || offeredAmount <= 0) {
    return NextResponse.json({ error: 'Missing property, client, or valid offer amount' }, { status: 400 });
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  if (!adminAuth) {
    return NextResponse.json(
      {
        error: 'Firebase Admin not configured',
        clientLead: {
          propertyId,
          clientName,
          clientPhone,
          offeredAmount,
          audioUrl: '',
          transcript: '[Server] Add FIREBASE_SERVICE_ACCOUNT_JSON to verify tokens and process audio.',
          summary:
            'Full AI pipeline requires Firebase Admin + OPENAI_API_KEY. This lead was saved from the client.',
          interestLevel: 'Interested',
        },
      },
      { status: 503 }
    );
  }

  if (!token) {
    return NextResponse.json({ error: 'Missing Authorization bearer token' }, { status: 401 });
  }

  let uid;
  let agentName = 'Agent';
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
    if (adminDb) {
      const snap = await adminDb.collection('users').doc(uid).get();
      agentName = snap.data()?.displayName || decoded.email?.split('@')[0] || 'Agent';
    }
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Firestore not available' }, { status: 503 });
  }

  let transcript = '';
  if (audio && typeof audio === 'object' && 'arrayBuffer' in audio && audio.size > 0) {
    const ab = await audio.arrayBuffer();
    const buf = Buffer.from(ab);
    const fname = audio.name || 'recording.webm';
    const mime = audio.type || 'audio/webm';

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const file = await toFile(buf, fname, { type: mime });
      const tr = await openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
      });
      transcript = tr.text || '';
    } else {
      transcript = '[Audio uploaded — set OPENAI_API_KEY to transcribe]';
    }
  } else {
    transcript = `No audio file. Client: ${clientName}. Phone: ${clientPhone || 'n/a'}. Offer entered by agent: ${offeredAmount}.`;
  }

  let summary = 'No summary available.';
  let interestLevel = 'Interested';

  if (process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an assistant for a real estate broker. Given a call transcript and the agent-entered bid amount, respond with JSON only.
Keys: "summary" (string, 2-4 sentences), "interestLevel" (exactly one of: "Interested", "Not Interested", "Highly Interested"), "pricingNotes" (string, optional).
Focus on whether the buyer is serious, objections, and how the offer compares to the conversation.`,
        },
        {
          role: 'user',
          content: `Transcript:\n${transcript}\n\nAgent-entered bid (offer): ${offeredAmount}`,
        },
      ],
      response_format: { type: 'json_object' },
    });
    const raw = completion.choices[0]?.message?.content?.trim() || '{}';
    try {
      const parsed = JSON.parse(raw);
      summary = typeof parsed.summary === 'string' ? parsed.summary : summary;
      const il = parsed.interestLevel;
      if (['Interested', 'Not Interested', 'Highly Interested'].includes(il)) {
        interestLevel = il;
      }
    } catch {
      summary = raw.slice(0, 500);
    }
  } else {
    summary = 'Set OPENAI_API_KEY for AI-generated summaries and interest detection.';
  }

  const doc = {
    propertyId,
    agentId: uid,
    agentName,
    clientName,
    clientPhone,
    offeredAmount,
    audioUrl: '',
    transcript,
    summary,
    interestLevel,
    createdAt: FieldValue.serverTimestamp(),
  };

  const ref = await adminDb.collection('leads').add(doc);
  return NextResponse.json({ ok: true, leadId: ref.id });
}
