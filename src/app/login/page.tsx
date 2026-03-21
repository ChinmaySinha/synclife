'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/today');
    }
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
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo-wrap">
              <div className="auth-logo-glow"></div>
              <h1 className="auth-logo">SyncLife</h1>
            </div>
            <p className="auth-subtitle">Welcome back to your shared world.</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            {error && <div className="auth-error animate-fade-in">{error}</div>}
            
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
            </div>

            <button type="submit" disabled={loading} className="auth-button">
              {loading ? <span className="spinner"></span> : 'Sign In to SyncLife'}
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
            Don&apos;t have an account? <Link href="/signup" className="auth-link">Create one</Link>
          </p>
        </div>
        
        {/* Startup/Marketing Splash Text */}
        <div className="auth-splash">
          <h2 className="splash-title">Stay perfectly in sync.</h2>
          <p className="splash-desc">Connect with your partner, align your habits, and build a beautiful life together — one task at a time.</p>
          <div className="splash-badges">
            <div className="badge"><span className="emoji">✅</span> Shared Tasks</div>
            <div className="badge"><span className="emoji">❤️</span> Mood Tracking</div>
            <div className="badge"><span className="emoji">✨</span> Smart Suggestions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
