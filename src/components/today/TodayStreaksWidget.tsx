'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import useSWR from 'swr';
import { calculateStreak, calculateCoupleStreak } from '@/lib/streaks';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

function TodayStreaksContent() {
  const { profile, partner } = useAuth();
  const supabase = createClient();

  const fetcher = async () => {
    if (!profile) return { myStreak: { current: 0, longest: 0 }, coupleStreakData: { current: 0, longest: 0 } };
    
    const weekAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const { data: historyData } = await supabase.from('tasks').select('*').eq('user_id', profile.id).gte('date', weekAgo);
    const myS = calculateStreak(historyData || []);
    
    let cS = { current: 0, longest: 0 };
    if (partner) {
      const { data: pHistory } = await supabase.from('tasks').select('*').eq('user_id', partner.id).gte('date', weekAgo);
      cS = calculateCoupleStreak(historyData || [], pHistory || []);
    }
    return { myStreak: myS, coupleStreakData: cS };
  };

  const { data } = useSWR(`streaks-${profile?.id}-${partner?.id}`, fetcher, { suspense: true });
  const { myStreak, coupleStreakData } = data || { myStreak: { current: 0, longest: 0 }, coupleStreakData: { current: 0, longest: 0 }};

  return (
    <div className="bento-card bento-wide" style={{
      background: 'linear-gradient(135deg, rgba(139,126,255,0.06) 0%, rgba(0,217,255,0.04) 100%)',
      border: '1px solid rgba(139,126,255,0.1)',
    }}>
      <div className="bento-title" style={{ marginBottom: '16px' }}><span className="icon">✨</span> Your Momentum</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { v: profile?.points || 0, l: 'Points', gradient: true },
          { v: myStreak.current, l: 'Day Streak', fire: true },
          { v: partner ? coupleStreakData.current : '-', l: 'Sync Streak', fire: !!partner },
          { v: myStreak.longest, l: 'Best Streak' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px 8px', borderRadius: '12px' }}>
            <span style={{ 
              fontSize: '20px', fontWeight: 800, display: 'block', marginBottom: '2px',
              ...(s.gradient ? { background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : {}),
              ...(s.fire ? { color: 'var(--accent-pink)' } : {})
            }}>
              {s.v}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TodayStreaksWidget() {
  return (
    <Suspense fallback={<SkeletonLoader className="bento-card bento-wide" style={{ borderRadius: '24px', height: '140px' }} />}>
      <TodayStreaksContent />
    </Suspense>
  );
}
