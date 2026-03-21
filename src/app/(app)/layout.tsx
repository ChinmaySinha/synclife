'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import Onboarding from '@/components/onboarding/Onboarding';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading, profile, refreshProfile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(145deg, #fef3f0 0%, #f0eeff 50%, #eefaff 100%)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'Outfit, sans-serif', fontSize: '36px', fontWeight: 800,
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '12px',
          }}>
            SyncLife
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading your world...</p>
        </div>
      </div>
    );
  }

  // Show onboarding for new users
  if (profile?.show_onboarding && showOnboarding) {
    return (
      <Onboarding onComplete={() => {
        setShowOnboarding(false);
        refreshProfile();
      }} />
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
