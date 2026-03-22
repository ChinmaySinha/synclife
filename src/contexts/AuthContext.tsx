'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  partner: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  partner: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // Profile vanished or wasn't created due to past bugs. Auto-heal it!
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
        alert(`CRITICAL DATABASE ERROR: Supabase refused to create your profile.\n\nError Code: ${createErr?.code}\nMessage: ${createErr?.message}\nDetails: ${createErr?.details}\n\nPlease take a screenshot of this alert and send it to me!`);
      }
    } else if (error) {
      // It's a different database error preventing profile load!
      console.error('Profile fetch failed with unseen error:', error);
      alert(`PROFILE FETCH FAILED!\n\nError Code: ${error.code}\nMessage: ${error.message}\nDetails: ${error.details}\n\nPlease screenshot this error!`);
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
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety timeout: if auth takes too long, stop showing loading
    const authTimeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 10000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        try {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          if (currentUser) {
            await fetchProfile(currentUser.id);
          } else {
            setProfile(null);
            setPartner(null);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
        } finally {
          if (mounted) setLoading(false);
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
    <AuthContext.Provider value={{ user, profile, partner, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
