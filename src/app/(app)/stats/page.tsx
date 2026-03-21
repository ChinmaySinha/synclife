'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Task, Mood, HealthLog, Streak, MemoryJarItem } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function StatsPage() {
  const { profile } = useAuth();
  const [weekTasks, setWeekTasks] = useState<Task[]>([]);
  const [weekMoods, setWeekMoods] = useState<Mood[]>([]);
  const [weekHealth, setWeekHealth] = useState<HealthLog[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [coupleStreak, setCoupleStreak] = useState<Streak | null>(null);
  const [memories, setMemories] = useState<MemoryJarItem[]>([]);
  const supabase = createClient();

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  useEffect(() => { if (profile) loadStats(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [profile]);

  const loadStats = async () => {
    if (!profile) return;
    const [t, mo, h, is, cs, mem] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', profile.id).gte('date', weekStartStr),
      supabase.from('moods').select('*').eq('user_id', profile.id).gte('date', weekStartStr).order('date'),
      supabase.from('health_logs').select('*').eq('user_id', profile.id).gte('date', weekStartStr),
      supabase.from('streaks').select('*').eq('user_id', profile.id).eq('streak_type', 'individual').single(),
      supabase.from('streaks').select('*').eq('streak_type', 'couple').single(),
      supabase.from('memory_jar').select('*').order('created_at', { ascending: false }).limit(10),
    ]);
    if (t.data) setWeekTasks(t.data);
    if (mo.data) setWeekMoods(mo.data);
    if (h.data) setWeekHealth(h.data);
    if (is.data) setStreak(is.data);
    if (cs.data) setCoupleStreak(cs.data);
    if (mem.data) setMemories(mem.data);
  };

  const total = weekTasks.length;
  const completed = weekTasks.filter(t => t.is_completed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const avgSleep = weekHealth.length > 0 ? (weekHealth.reduce((s, h) => s + h.sleep_hours, 0) / weekHealth.length).toFixed(1) : '0';
  const avgWater = weekHealth.length > 0 ? Math.round(weekHealth.reduce((s, h) => s + h.water_ml, 0) / weekHealth.length) : 0;

  const insights = [
    pct >= 80 ? `🎉 Amazing! ${pct}% tasks done!` : pct >= 50 ? `💪 Solid ${pct}%! Keep it up!` : `📈 ${pct}% — small steps count!`,
    Number(avgSleep) < 7 ? `😴 Sleep needs work — ${avgSleep}h avg` : `🌙 Great sleep! ${avgSleep}h avg 💚`,
    avgWater < 2000 ? `💧 More water needed — ${(avgWater/1000).toFixed(1)}L avg` : `💧 Hydration solid! ${(avgWater/1000).toFixed(1)}L avg 💚`,
  ];

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>📊 Stats & Reports</h1>
      <div className="stats-row" style={{ marginBottom: '24px' }}>
        {[
          { v: `${completed}/${total}`, l: 'Tasks This Week' },
          { v: `${streak?.current_count || 0}🔥`, l: 'Your Streak' },
          { v: `${coupleStreak?.current_count || 0}💕`, l: 'Couple Streak' },
          { v: `${profile?.points || 0}`, l: 'Total Points' },
        ].map((s, i) => (
          <div key={i} className="stat-card glass-card">
            <div className="stat-value">{s.v}</div>
            <div className="stat-label">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="glass-card card-full" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>📋 Weekly Report</h3>
          {insights.map((ins, i) => <div key={i} className="report-insight">{ins}</div>)}
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '20px', marginBottom: '12px' }}>Mood Trend</h4>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {weekMoods.length > 0 ? weekMoods.map(m => (
              <div key={m.id} style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '24px' }}>{m.mood}</span>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {new Date(m.date).toLocaleDateString([], { weekday: 'short' })}
                </div>
              </div>
            )) : <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No mood data yet</p>}
          </div>
        </div>
        <div className="glass-card card-full" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>🫙 Memory Jar</h3>
          {memories.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Memories appear as you hit milestones! ✨</p>
          ) : (
            <div className="memory-timeline">
              {memories.map(m => (
                <div key={m.id} className="memory-item glass-card" style={{ padding: '14px' }}>
                  <p style={{ fontSize: '14px' }}>{m.emoji} {m.content}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{formatDate(m.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
