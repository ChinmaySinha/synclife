'use client';

import { Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import useSWR from 'swr';
import type { Task } from '@/lib/types';
import { getCategoryIcon } from '@/lib/utils';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

function TodayPartnerTasksContent() {
  const { profile, partner } = useAuth();
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  const fetcher = async () => {
    if (!partner) return [];
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', partner.id)
      .eq('share_with_partner', true)
      .eq('date', today)
      .order('created_at', { ascending: true });
    return data || [];
  };

  const { data: partnerTasks } = useSWR(`partner-tasks-${partner?.id}-${today}`, fetcher, { 
    suspense: true,
  });

  if (!partner) return null;

  return (
    <div className="bento-card">
      <div className="bento-title" style={{ marginBottom: '12px' }}><span className="icon">💕</span> {partner.name}&apos;s Tasks</div>
      {!partnerTasks || partnerTasks.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No shared tasks today.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {partnerTasks.slice(0, 4).map(task => (
            <div key={task.id} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 10px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)',
              opacity: task.is_completed ? 0.5 : 1,
            }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                background: task.is_completed ? 'var(--accent-green)' : 'transparent',
                border: task.is_completed ? 'none' : '2px solid var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', color: 'white',
              }}>
                {task.is_completed && '✓'}
              </div>
              <span style={{ flex: 1, fontSize: '12px', textDecoration: task.is_completed ? 'line-through' : 'none' }}>
                {getCategoryIcon(task.category)} {task.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TodayPartnerTasksWidget() {
  const { partner } = useAuth();
  if (!partner) return null;
  
  return (
    <Suspense fallback={<SkeletonLoader className="bento-card" style={{ borderRadius: '24px', height: '180px' }} />}>
      <TodayPartnerTasksContent />
    </Suspense>
  );
}
