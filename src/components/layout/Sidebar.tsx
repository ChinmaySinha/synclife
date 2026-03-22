'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/today', icon: '☀️', label: 'Today' },
  { href: '/tasks', icon: '📋', label: 'Tasks' },
  { href: '/chat', icon: '💬', label: 'Chat' },
  { href: '/partner', icon: '💕', label: 'Partner' },
  { href: '/challenges', icon: '🧩', label: 'Challenges' },
  { href: '/stats', icon: '📊', label: 'Stats' },
  { href: '/profile', icon: '👤', label: 'Profile' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, partner, signOut } = useAuth();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ marginBottom: '12px' }}>
        <h1 style={{
          fontFamily: 'Space Grotesk', fontSize: '28px', fontWeight: 700,
          background: 'linear-gradient(135deg, #a5a5ff 0%, #58e6ff 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.04em',
        }}>
          SyncLife
        </h1>
      </div>

      {/* Welcome */}
      {profile && (
        <div style={{
          padding: '14px 16px', borderRadius: 'var(--radius-xl)',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '24px',
        }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>
            Welcome, {profile.name} ✨
          </p>
          {partner && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Paired with {partner.name} 💕
            </p>
          )}
        </div>
      )}

      {/* Nav */}
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

      {/* User card + Logout */}
      {profile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 16px', borderRadius: 'var(--radius-xl)',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: 'var(--radius-full)',
              background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover no-repeat` : 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: 700, color: 'white',
            }}>
              {!profile.avatar_url && profile.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Space Grotesk' }}>{profile.name}</div>
              <div style={{
                fontSize: '12px', fontWeight: 600,
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {profile.points} pts
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 'var(--radius-xl)',
              background: 'rgba(255, 110, 132, 0.08)',
              border: '1px solid rgba(255, 110, 132, 0.15)',
              color: '#ff6e84',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'Space Grotesk',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 110, 132, 0.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 110, 132, 0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      )}
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
          <span style={{ fontSize: '22px' }}>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
