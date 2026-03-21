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
