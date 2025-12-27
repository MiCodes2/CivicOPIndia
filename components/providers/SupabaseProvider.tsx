"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Session, User } from '@supabase/supabase-js';

type SupabaseContext = {
  supabase: ReturnType<typeof createClient>;
  session: Session | null;
  user: User | null;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabase] = useState(() => createClient());
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    // Get initial session (handle errors like invalid/expired refresh token)
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch((err: any) => {
        const rawMsg = String(err?.message ?? err ?? '').toLowerCase();
        // Treat refresh-related errors as expected and clear session silently
        if (rawMsg.includes('refresh') || rawMsg.includes('invalid refresh') || rawMsg.includes('refresh token not found')) {
          try { supabase.auth.signOut(); } catch (e) {}
          try { localStorage.removeItem('civic-op-auth'); } catch (e) {}
          setSession(null);
          setUser(null);
        } else {
          console.warn('Supabase getSession error:', err?.message ?? err);
        }
      });

    // Listen for auth changes and handle token refresh failures explicitly
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Some Supabase events indicate refresh issues (names may vary by client version).
      // Be defensive: if the event mentions token/refresh/fail, clear local session and sign out.
      if (typeof event === 'string' && /token.*refresh.*failed|refresh_token_not_found|invalid refresh token/i.test(event)) {
        console.warn('Auth state indicates token refresh failure:', event);
        try { supabase.auth.signOut(); } catch (e) {}
        try { localStorage.removeItem('civic-op-auth'); } catch (e) {}
        setSession(null);
        setUser(null);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [supabase]);

  return (
    <Context.Provider value={{ supabase, session, user }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider');
  }
  return context;
};
