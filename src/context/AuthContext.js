'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { isFirebaseConfigured } from '@/lib/config';
import { authorizeUser, ensureUserDocument, getUserProfile } from '@/lib/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => isFirebaseConfigured());
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const auth = getFirebaseAuth();
    if (!auth) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      await ensureUserDocument(fbUser.uid, fbUser.email || '', fbUser.displayName || '');
      const profile = await getUserProfile(fbUser.uid);
      setUser({
        id: fbUser.uid,
        email: fbUser.email || '',
        name: profile?.displayName || fbUser.email?.split('@')[0] || 'User',
        role: profile?.role || 'Agent',
      });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (loading) return;
    const publicPaths = ['/login'];
    if (!user && !publicPaths.includes(pathname)) {
      router.push('/login');
    } else if (user && (pathname === '/' || pathname === '/login')) {
      router.push(`/${user.role.toLowerCase()}/dashboard`);
    }
  }, [user, pathname, router, loading]);

  const login = useCallback(
    async (email, password) => {
      if (isFirebaseConfigured()) {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error('Firebase Auth unavailable');
        await signInWithEmailAndPassword(auth, email, password);
        return;
      }
      const u = await authorizeUser(email);
      setUser({
        id: u.id,
        email: u.email,
        name: u.name || u.email.split('@')[0],
        role: u.role,
      });
    },
    []
  );

  const register = useCallback(async (email, password, displayName) => {
    if (!isFirebaseConfigured()) throw new Error('Registration requires Firebase');
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth unavailable');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await ensureUserDocument(cred.user.uid, email, displayName);
  }, []);

  const logout = useCallback(async () => {
    if (isFirebaseConfigured()) {
      const auth = getFirebaseAuth();
      if (auth) await signOut(auth);
    }
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        isFirebase: isFirebaseConfigured(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
