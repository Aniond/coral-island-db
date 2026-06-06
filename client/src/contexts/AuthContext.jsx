import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

const AuthContext = createContext(null);

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function AuthProvider({ children }) {
  const [session,  setSession]  = useState(undefined); // undefined = loading
  const [user,     setUser]     = useState(null);
  const [isAdmin,  setIsAdmin]  = useState(false);

  async function fetchAdminStatus(token) {
    try {
      const res = await fetch(`${API}/api/admin/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { isAdmin } = await res.json();
        setIsAdmin(isAdmin);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
      if (session) fetchAdminStatus(session.access_token);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
      if (session) fetchAdminStatus(session.access_token);
      else setIsAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, loading: session === undefined, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
