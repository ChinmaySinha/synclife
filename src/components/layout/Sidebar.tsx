'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/today', icon: '☀️', label: 'Today' },
  { href: '/tasks', icon: '📋', label: 'Tasks' },
  { href: '/chat', icon: '💬', label: 'Chat' },
  { href: '/partner', icon: '💕', label: 'Partner' },
  { href: '/stats', icon: '📊', label: 'Stats' },
  { href: '/profile', icon: '👤', label: 'Profile' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, partner } = useAuth();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ marginBottom: '12px' }}>
        <h1 style={{
          fontFamily: 'Outfit', fontSize: '28px', fontWeight: 800,
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.03em',
        }}>
          SyncLife
        </h1>
      </div>

      {/* Welcome */}
      {profile && (
        <div style={{
          padding: '14px 16px', borderRadius: 'var(--radius-xl)',
          background: 'var(--surface-low)', marginBottom: '24px',
        }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
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

      {/* User card */}
      {profile && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 16px', borderRadius: 'var(--radius-xl)',
          background: 'var(--surface-low)',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: 'var(--radius-full)',
            background: 'var(--gradient-primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 700, color: 'white',
          }}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{profile.name}</div>
            <div style={{
              fontSize: '12px', fontWeight: 600,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {profile.points} pts
            </div>
          </div>
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
