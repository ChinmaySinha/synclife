'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/today', label: 'Today', icon: '☀️', mobileIcon: '☀️' },
  { href: '/partner', label: 'Partner', icon: '💕', mobileIcon: '💕' },
  { href: '/chat', label: 'Chat', icon: '💬', mobileIcon: '💬' },
  { href: '/stats', label: 'Stats', icon: '📊', mobileIcon: '📊' },
  { href: '/profile', label: 'Profile', icon: '👤', mobileIcon: '👤' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="sidebar">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '24px',
          fontWeight: 800,
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          SyncLife
        </h1>
        {profile && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Welcome, {profile.name} ✨
          </p>
        )}
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${pathname === item.href ? 'active' : ''}`}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '16px' }}>
        {profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 700,
              color: 'white',
            }}>
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{profile.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {profile.points} pts 🏆
              </div>
            </div>
          </div>
        )}
        <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }}>
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav">
      {navItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`mobile-nav-link ${pathname === item.href ? 'active' : ''}`}
        >
          <span style={{ fontSize: '22px' }}>{item.mobileIcon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
