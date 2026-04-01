'use client';

import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { isFirebaseConfigured } from './config';
import { getFirebaseDb } from './firebase';
import { getOwnerEmail } from './config';
import { buildSalesRepPerformance } from './salesPerformance';

const mockProperties = [
  { id: '1', name: 'Sunrise Apartments - 402', location: 'Downtown', askingPrice: 450000, status: 'Active' },
  { id: '2', name: 'Green Valley Villa', location: 'Suburbs', askingPrice: 1200000, status: 'Active' },
];

const mockAgents = [
  { id: 'a1', name: 'Rahul Sharma', email: 'rahul@realstate.com', role: 'Agent' },
  { id: 'a2', name: 'Priya Patel', email: 'priya@realstate.com', role: 'Agent' },
];

const mockOwner = { id: 'o1', name: 'Harsh', email: 'harsh@realstate.com', role: 'Owner' };

let mockLeads = [
  {
    id: 'l1',
    propertyId: '1',
    agentId: 'a1',
    agentName: 'Rahul Sharma',
    clientName: 'Suresh Kumar',
    clientPhone: '9876543210',
    offeredAmount: 420000,
    interestLevel: 'Interested',
    audioUrl: '',
    transcript: 'Customer seemed very interested but suggested 4.2L...',
    summary:
      'The client liked the property but requested a slight negotiation on the final price due to some minor repairs needed. Re-evaluate at 4.2L.',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'l2',
    propertyId: '1',
    agentId: 'a2',
    agentName: 'Priya Patel',
    clientName: 'Vikram Singh',
    clientPhone: '9988776655',
    offeredAmount: 440000,
    interestLevel: 'Highly Interested',
    audioUrl: '',
    transcript: 'He is ready to sign the papers at 4.4L if we can cover the parking.',
    summary:
      'Client is ready to close quickly if a dedicated parking spot is included. Offer is strong at 4.4L.',
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'l3',
    propertyId: '2',
    agentId: 'a1',
    agentName: 'Rahul Sharma',
    clientName: 'Anita Desai',
    clientPhone: '8877665544',
    offeredAmount: 1150000,
    interestLevel: 'Interested',
    audioUrl: '',
    transcript: 'Beautiful place, but my budget maxes out at 1.15 Cr.',
    summary:
      'Client loves the villa but has a strict budget ceiling of 1.15 Cr. Might need flexible payment terms.',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'l4',
    propertyId: '1',
    agentId: 'a1',
    agentName: 'Rahul Sharma',
    clientName: 'Ravi Mehta',
    clientPhone: '9123456780',
    offeredAmount: 430000,
    interestLevel: 'Highly Interested',
    audioUrl: '',
    transcript: 'Wants to visit again tomorrow.',
    summary: 'Strong follow-up; likely to improve offer.',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'l5',
    propertyId: '2',
    agentId: 'a2',
    agentName: 'Priya Patel',
    clientName: 'Neha Kulkarni',
    clientPhone: '9000011122',
    offeredAmount: 1180000,
    interestLevel: 'Not Interested',
    audioUrl: '',
    transcript: 'Location is too far from office.',
    summary: 'Dropped out due to commute.',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'l6',
    propertyId: '1',
    agentId: 'a2',
    agentName: 'Priya Patel',
    clientName: 'Amit Verma',
    clientPhone: '9887766554',
    offeredAmount: 435000,
    interestLevel: 'Interested',
    audioUrl: '',
    transcript: 'Comparing with two other listings.',
    summary: 'Still in evaluation phase.',
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'l7',
    propertyId: '1',
    agentId: 'a1',
    agentName: 'Rahul Sharma',
    clientName: 'Deepa Nair',
    clientPhone: '9012345678',
    offeredAmount: 425000,
    interestLevel: 'Interested',
    audioUrl: '',
    transcript: 'Callback next week.',
    summary: 'Warm lead; schedule follow-up.',
    timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

function firestoreEnabled() {
  return isFirebaseConfigured() && getFirebaseDb();
}

function tsToIso(v) {
  if (!v) return new Date().toISOString();
  if (typeof v === 'string') return v;
  if (v?.toDate) return v.toDate().toISOString();
  return new Date().toISOString();
}

export async function authorizeUser(email) {
  if (firestoreEnabled()) {
    throw new Error('Use Firebase email/password sign-in');
  }
  if (email === mockOwner.email) return mockOwner;
  const agent = mockAgents.find((a) => a.email === email);
  if (agent) return agent;
  throw new Error('User not found');
}

export async function ensureUserDocument(uid, email, displayName) {
  if (!firestoreEnabled()) return;
  const db = getFirebaseDb();
  const ref = doc(db, 'users', uid);
  const existing = await getDoc(ref);
  const role = email.toLowerCase() === getOwnerEmail() ? 'Owner' : 'Agent';
  if (!existing.exists()) {
    await setDoc(ref, {
      email: email.toLowerCase(),
      displayName: displayName || email.split('@')[0],
      role,
      createdAt: serverTimestamp(),
    });
  }
}

export async function getUserProfile(uid) {
  if (!firestoreEnabled()) return null;
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getProperties() {
  if (firestoreEnabled()) {
    const db = getFirebaseDb();
    const snap = await getDocs(collection(db, 'properties'));
    return snap.docs.map((d) => {
      const x = d.data();
      return {
        id: d.id,
        name: x.name,
        location: x.location,
        askingPrice: x.askingPrice,
        status: x.status || 'Active',
      };
    });
  }
  return [...mockProperties];
}

/** Owner: create a new listing (mock or Firestore). */
export async function addProperty({ name, location, askingPrice, status = 'Active' }) {
  const price = Number(askingPrice);
  if (!name?.trim() || !location?.trim() || !Number.isFinite(price) || price <= 0) {
    throw new Error('Valid name, location, and asking price are required');
  }
  const s = status === 'Sold' ? 'Sold' : 'Active';
  if (firestoreEnabled()) {
    const db = getFirebaseDb();
    const ref = await addDoc(collection(db, 'properties'), {
      name: name.trim(),
      location: location.trim(),
      askingPrice: price,
      status: s,
      createdAt: serverTimestamp(),
    });
    return { id: ref.id, name: name.trim(), location: location.trim(), askingPrice: price, status: s };
  }
  const id = `p-${Date.now()}`;
  const row = {
    id,
    name: name.trim(),
    location: location.trim(),
    askingPrice: price,
    status: s,
  };
  mockProperties.push(row);
  return row;
}

export async function getAgents() {
  if (firestoreEnabled()) {
    const db = getFirebaseDb();
    const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'Agent')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return [...mockAgents];
}

export async function getLeadsForAgent(agentId) {
  if (firestoreEnabled()) {
    const db = getFirebaseDb();
    const q = query(collection(db, 'leads'), where('agentId', '==', agentId));
    const snap = await getDocs(q);
    const rows = snap.docs.map((d) => {
      const x = d.data();
      return {
        id: d.id,
        propertyId: x.propertyId,
        agentId: x.agentId,
        agentName: x.agentName || '',
        clientName: x.clientName,
        clientPhone: x.clientPhone,
        offeredAmount: x.offeredAmount,
        interestLevel: x.interestLevel,
        audioUrl: x.audioUrl || '',
        transcript: x.transcript || '',
        summary: x.summary || '',
        timestamp: tsToIso(x.createdAt),
      };
    });
    return rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
  return mockLeads.filter((l) => l.agentId === agentId);
}

export async function getAllLeads() {
  if (firestoreEnabled()) {
    const db = getFirebaseDb();
    const snap = await getDocs(collection(db, 'leads'));
    const rows = snap.docs.map((d) => {
      const x = d.data();
      return {
        id: d.id,
        propertyId: x.propertyId,
        agentId: x.agentId,
        agentName: x.agentName || '',
        clientName: x.clientName,
        clientPhone: x.clientPhone,
        offeredAmount: x.offeredAmount,
        interestLevel: x.interestLevel,
        audioUrl: x.audioUrl || '',
        transcript: x.transcript || '',
        summary: x.summary || '',
        timestamp: tsToIso(x.createdAt),
      };
    });
    return rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
  return [...mockLeads].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function getLeadsForProperty(propertyId) {
  if (firestoreEnabled()) {
    const db = getFirebaseDb();
    const q = query(collection(db, 'leads'), where('propertyId', '==', propertyId));
    const snap = await getDocs(q);
    const rows = snap.docs.map((d) => {
      const x = d.data();
      return {
        id: d.id,
        propertyId: x.propertyId,
        agentId: x.agentId,
        agentName: x.agentName || '',
        clientName: x.clientName,
        clientPhone: x.clientPhone,
        offeredAmount: x.offeredAmount,
        interestLevel: x.interestLevel,
        audioUrl: x.audioUrl || '',
        transcript: x.transcript || '',
        summary: x.summary || '',
        timestamp: tsToIso(x.createdAt),
      };
    });
    return rows.sort((a, b) => b.offeredAmount - a.offeredAmount);
  }
  return mockLeads.filter((l) => l.propertyId === propertyId).sort((a, b) => b.offeredAmount - a.offeredAmount);
}

export async function addLead(leadData) {
  if (firestoreEnabled()) {
    const db = getFirebaseDb();
    const ref = await addDoc(collection(db, 'leads'), {
      ...leadData,
      createdAt: serverTimestamp(),
    });
    return { id: ref.id, ...leadData, timestamp: new Date().toISOString() };
  }
  const newLead = {
    ...leadData,
    id: 'l' + (mockLeads.length + 1),
    timestamp: new Date().toISOString(),
  };
  mockLeads.push(newLead);
  return newLead;
}

export async function getPropertyById(id) {
  const list = await getProperties();
  return list.find((p) => p.id === id) || null;
}

/** @deprecated Use getSalesRepPerformance */
export async function getAgentStats() {
  return getSalesRepPerformance();
}

/** Owner dashboard: per-rep call volumes and 30d positive-interest conversion from lead logs. */
export async function getSalesRepPerformance() {
  const [agents, leads] = await Promise.all([getAgents(), getAllLeads()]);
  return buildSalesRepPerformance(leads, agents);
}
