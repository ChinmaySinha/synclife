'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const dockItems = [
  { href: '/today', icon: '☀️', label: 'Today' },
  { href: '/tasks', icon: '📋', label: 'Tasks' },
  { href: '/chat', icon: '💬', label: 'Chat' },
  { href: '/partner', icon: '💕', label: 'Partner' },
  { href: '/challenges', icon: '🧩', label: 'Challenges' },
  { href: '/stats', icon: '📊', label: 'Stats' },
  { href: '/profile', icon: '👤', label: 'Profile' },
];

export default function FloatingDock() {
  const pathname = usePathname();

  return (
    <nav className="floating-dock">
      {dockItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`dock-item ${pathname === item.href ? 'active' : ''}`}
        >
          <span className="dock-label">{item.label}</span>
          <span>{item.icon}</span>
        </Link>
      ))}
    </nav>
  );
}
