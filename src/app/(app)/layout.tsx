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
        background: '#06060b', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,98,236,0.15), transparent 70%)', top: '10%', left: '15%', filter: 'blur(60px)' }}></div>
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(88,230,255,0.1), transparent 70%)', bottom: '15%', right: '20%', filter: 'blur(60px)' }}></div>
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif', fontSize: '42px', fontWeight: 700,
            background: 'linear-gradient(135deg, #a5a5ff 0%, #58e6ff 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '16px', letterSpacing: '-0.03em',
          }}>
            SyncLife
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{ width: '18px', height: '18px', border: '2px solid rgba(165,165,255,0.3)', borderTopColor: '#a5a5ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
            <p style={{ color: '#777575', fontSize: '14px', fontFamily: 'Space Grotesk' }}>Loading your world...</p>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{__html: '@keyframes spin { to { transform: rotate(360deg); } }'}} />
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
