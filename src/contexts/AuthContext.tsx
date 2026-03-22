'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  partner: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  partner: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

type AuthProviderProps = {
  children: ReactNode;
  initialUser?: User | null;
  initialProfile?: Profile | null;
  initialPartner?: Profile | null;
};

export function AuthProvider({
  children,
  initialUser = null,
  initialProfile = null,
  initialPartner = null,
}: AuthProviderProps) {
  // Initialize state from server-fetched data — this is the key fix
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [partner, setPartner] = useState<Profile | null>(initialPartner);
  const [loading, setLoading] = useState(!initialUser);
  const supabase = createClient();
  const intentionalSignOut = useRef(false);

  // Fetch profile via server API route (not browser client)
  const fetchProfileFromServer = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/me', { credentials: 'include' });
      if (!res.ok) return false;

      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
      if (data.profile) {
        setProfile(data.profile);
        setPartner(data.partner || null);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to fetch profile from server:', e);
      return false;
    }
  };

  const refreshProfile = async () => {
    await fetchProfileFromServer();
  };

  const signOut = async () => {
    intentionalSignOut.current = true;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setPartner(null);
    window.location.href = '/login';
  };

  useEffect(() => {
    let mounted = true;

    // Safety timeout — never stay loading forever
    const authTimeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8000);

    // If we already have server data, we're good to go
    if (initialUser && initialProfile) {
      setLoading(false);
    } else if (initialUser && !initialProfile) {
      // User exists but no profile yet — fetch it
      fetchProfileFromServer().finally(() => {
        if (mounted) setLoading(false);
      });
    } else {
      // No server data — try to recover session from browser client
      fetchProfileFromServer().finally(() => {
        if (mounted) setLoading(false);
      });
    }

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Skip initial — we handled it above
        if (event === 'INITIAL_SESSION') return;

        // User signed in (e.g. after OAuth redirect on client side)
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await fetchProfileFromServer();
          if (mounted) setLoading(false);
          return;
        }

        // Token refreshed — update user but keep profile
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
          return;
        }

        // Only clear state on intentional sign-out
        if (event === 'SIGNED_OUT') {
          if (intentionalSignOut.current) {
            setUser(null);
            setProfile(null);
            setPartner(null);
            if (mounted) setLoading(false);
          }
          return;
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, partner, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
