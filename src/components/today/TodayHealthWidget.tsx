'use client';

import { Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import useSWR from 'swr';
import type { HealthLog } from '@/lib/types';
import HealthRing from '@/components/health/HealthRing';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

function TodayHealthContent() {
  const { profile } = useAuth();
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  const fetcher = async () => {
    if (!profile) return null;
    const { data } = await supabase.from('health_logs').select('*').eq('user_id', profile.id).eq('date', today).single();
    return data as HealthLog | null;
  };

  const { data: health } = useSWR(`health-${profile?.id}-${today}`, fetcher, { suspense: true });

  return (
    <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="bento-title" style={{ marginBottom: '14px', alignSelf: 'flex-start' }}><span className="icon">💚</span> Health</div>
      <HealthRing water={health?.water_ml || 0} sleep={health?.sleep_hours || 0} steps={health?.steps || 0} size={110} />
      <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '11px' }}>
        <span style={{ color: 'var(--accent-secondary)' }}>💧 {((health?.water_ml || 0) / 1000).toFixed(1)}L</span>
        <span style={{ color: 'var(--accent-primary)' }}>😴 {health?.sleep_hours || 0}h</span>
        <span style={{ color: 'var(--accent-green)' }}>👟 {health?.steps || 0}</span>
      </div>
    </div>
  );
}

export default function TodayHealthWidget() {
  return (
    <Suspense fallback={<SkeletonLoader className="bento-card" style={{ borderRadius: '24px', height: '180px' }} />}>
      <TodayHealthContent />
    </Suspense>
  );
}
