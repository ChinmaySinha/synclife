'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        name,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        invite_code: inviteCode,
        points: 0,
        show_onboarding: true,
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Fallback strategy if triggered
      }
    }

    router.push('/today');
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="auth-layout">
      {/* Immersive Animated Background */}
      <div className="auth-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="auth-container">
        
        {/* Startup/Marketing Splash Text (Left side on desktop) */}
        <div className="auth-splash auth-splash-signup">
          <h2 className="splash-title">Double your productivity.</h2>
          <p className="splash-desc">Join thousands of couples aligning their goals, health, and daily routines through SyncLife.</p>
          <div className="splash-testimonials">
            <div className="testimonial">
              <p className="quote">"It completely changed how my partner and I handle our daily chores. We actually have fun doing them now."</p>
              <div className="author">— Alex & Jamie</div>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-logo">Join SyncLife</h1>
            <p className="auth-subtitle">Create your free account today.</p>
          </div>

          <form onSubmit={handleSignup} className="auth-form">
            {error && <div className="auth-error animate-fade-in">{error}</div>}
            
            <div className="input-group">
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="auth-input"
                placeholder=" "
              />
              <label htmlFor="name" className="auth-label">Preferred Name</label>
            </div>

            <div className="input-group">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
                placeholder=" "
              />
              <label htmlFor="email" className="auth-label">Email address</label>
            </div>

            <div className="input-group">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
                placeholder=" "
              />
              <label htmlFor="password" className="auth-label">Password</label>
              <span className="password-hint">Must be at least 6 characters.</span>
            </div>

            <button type="submit" disabled={loading} className="auth-button">
              {loading ? <span className="spinner"></span> : 'Create Account'}
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            </div>

            <button 
              type="button" 
              onClick={handleGoogleAuth} 
              disabled={loading} 
              className="auth-button" 
              style={{ background: '#ffffff', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link href="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
