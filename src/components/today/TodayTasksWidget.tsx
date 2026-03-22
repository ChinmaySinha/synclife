'use client';

import { Suspense, useState, useTransition } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import type { Task } from '@/lib/types';
import { getCategoryIcon } from '@/lib/utils';
import Link from 'next/link';
import useSWR from 'swr';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

function TodayTasksContent() {
  const { profile, partner } = useAuth();
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];
  const [isPending, startTransition] = useTransition();

  const fetcher = async () => {
    if (!profile) return [];
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .in('user_id', partner ? [profile.id, partner.id] : [profile.id])
      .eq('date', today)
      .order('created_at', { ascending: false });
    return data || [];
  };

  const { data: allTasks, mutate } = useSWR<Task[]>(`tasks-${profile?.id}-${today}`, fetcher, { 
    suspense: true,
    revalidateOnFocus: false
  });

  const tasks = allTasks?.filter(t => t.user_id === profile?.id) || [];
  const partnerTasks = allTasks?.filter(t => t.user_id !== profile?.id) || [];

  const completedCount = tasks.filter(t => t.is_completed).length;
  const completionPct = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const toggleTask = async (taskId: string, isCompleted: boolean) => {
    const newCompleted = !isCompleted;
    
    // Optimistic UI
    startTransition(() => {
      mutate(curr => curr?.map(t => 
        t.id === taskId ? { ...t, is_completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null } : t
      ), false);
    });

    await supabase.from('tasks').update({
      is_completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null,
    }).eq('id', taskId);

    if (newCompleted && profile) {
      // points are handled by trigger or optimistic local
      if (partner) {
        const task = tasks.find(t => t.id === taskId);
        await supabase.from('activity_feed').insert({
          user_id: profile.id, partner_id: partner.id,
          event_type: 'task_completed',
          content: `${profile.name} completed "${task?.title}" 💪`, emoji: '✅',
        });
      }
    }
    mutate(); // Revalidate
  };

  return (
    <div className="bento-card bento-tall" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="bento-header">
        <div className="bento-title"><span className="icon">📋</span> Today&apos;s Tasks</div>
        <Link href="/tasks" className="btn btn-ghost btn-sm" style={{ fontSize: '12px' }}>Manage →</Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${completionPct}%`, height: '100%', background: 'var(--gradient-primary)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{completedCount}/{tasks.length}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
        {tasks.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
            No tasks yet. <Link href="/tasks" style={{ color: 'var(--primary)' }}>Add some!</Link>
          </p>
        ) : (
          tasks.slice(0, 6).map(task => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id, task.is_completed)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.04)',
                opacity: task.is_completed ? 0.5 : 1, transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                border: task.is_completed ? 'none' : '2px solid var(--text-muted)',
                background: task.is_completed ? 'var(--gradient-primary)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', color: 'white',
              }}>
                {task.is_completed && '✓'}
              </div>
              <span style={{ flex: 1, fontSize: '13px', textDecoration: task.is_completed ? 'line-through' : 'none' }}>
                {getCategoryIcon(task.category)} {task.title}
              </span>
            </div>
          ))
        )}
        {tasks.length > 6 && (
          <Link href="/tasks" style={{ color: 'var(--primary)', fontSize: '12px', textAlign: 'center', padding: '6px' }}>
            +{tasks.length - 6} more →
          </Link>
        )}
      </div>
    </div>
  );
}

export default function TodayTasksWidget() {
  return (
    <Suspense fallback={<SkeletonLoader className="bento-tall" style={{ borderRadius: '24px' }} />}>
      <TodayTasksContent />
    </Suspense>
  );
}
