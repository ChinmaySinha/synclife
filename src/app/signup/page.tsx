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
          </form>

          <p className="auth-footer">
            Already have an account? <Link href="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
