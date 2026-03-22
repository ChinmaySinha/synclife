'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
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

export function AuthProvider({ children, initialSession }: { children: ReactNode; initialSession?: Session | null }) {
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  // Track whether we intentionally signed out to prevent false SIGNED_OUT events
  const intentionalSignOut = useRef(false);
  // Track whether profile was loaded from server session to prevent race conditions
  const profileLoadedFromServer = useRef(false);

  const fetchProfile = async (userId: string) => {
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: { user } } = await supabase.auth.getUser();
      const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

      const { data: newlyCreated, error: createErr } = await supabase.from('profiles').insert({
        id: userId,
        name: name,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        invite_code: inviteCode,
        points: 0,
        show_onboarding: true,
      }).select().single();

      if (newlyCreated) {
        data = newlyCreated;
      } else {
        console.error('Auto-heal profile creation failed:', createErr);
      }
    } else if (error) {
      console.error('Profile fetch error:', error);
    }
    
    if (data) {
      setProfile(data);
      if (data.partner_id) {
        const { data: partnerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.partner_id)
          .single();
        setPartner(partnerData);
      }
      return true;
    }
    return false;
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    intentionalSignOut.current = true;
    profileLoadedFromServer.current = false;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setPartner(null);
    window.location.href = '/login';
  };

  useEffect(() => {
    let mounted = true;

    const authTimeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 10000);

    // If we have a server session, use it directly — this is the source of truth
    if (initialSession?.user) {
      profileLoadedFromServer.current = true;
      fetchProfile(initialSession.user.id).finally(() => {
        if (mounted) setLoading(false);
      });
    } else {
      // No server session — try the browser client as fallback
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (mounted && session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          if (mounted) setLoading(false);
        }
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Skip INITIAL_SESSION — we handled it above
        if (event === 'INITIAL_SESSION') return;

        // If user explicitly signed in (e.g. after OAuth redirect on client side)
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
          if (mounted) setLoading(false);
          return;
        }

        // If token was refreshed, update user but keep profile
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
          return;
        }

        // SIGNED_OUT: Only clear state if WE triggered it intentionally
        // The browser client fires false SIGNED_OUT events when it can't
        // read server-managed cookies — ignore those completely
        if (event === 'SIGNED_OUT') {
          if (intentionalSignOut.current) {
            setUser(null);
            setProfile(null);
            setPartner(null);
            if (mounted) setLoading(false);
          }
          // else: ignore the false sign-out from browser cookie mismatch
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
