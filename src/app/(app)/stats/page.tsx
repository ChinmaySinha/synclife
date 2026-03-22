'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { calculateStreak, calculateCoupleStreak } from '@/lib/streaks';
import { formatDate } from '@/lib/utils';
import type { Task, Mood, HealthLog, MemoryJarItem } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['#a5a5ff', '#ff8ed2', '#58e6ff', '#34d399'];

export default function StatsPage() {
  const { profile, partner } = useAuth();
  const [weekTasks, setWeekTasks] = useState<Task[]>([]);
  const [weekMoods, setWeekMoods] = useState<Mood[]>([]);
  const [weekHealth, setWeekHealth] = useState<HealthLog[]>([]);
  const [memories, setMemories] = useState<MemoryJarItem[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [partnerAllTasks, setPartnerAllTasks] = useState<Task[]>([]);
  const supabase = createClient();

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  useEffect(() => { if (profile) loadStats(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [profile]);

  const loadStats = async () => {
    if (!profile) return;
    const [t, mo, h, mem, all] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', profile.id).gte('date', weekStartStr),
      supabase.from('moods').select('*').eq('user_id', profile.id).gte('date', weekStartStr).order('date'),
      supabase.from('health_logs').select('*').eq('user_id', profile.id).gte('date', weekStartStr),
      supabase.from('memory_jar').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('tasks').select('*').eq('user_id', profile.id).gte('date', monthAgo),
    ]);
    if (t.data) setWeekTasks(t.data);
    if (mo.data) setWeekMoods(mo.data);
    if (h.data) setWeekHealth(h.data);
    if (mem.data) setMemories(mem.data);
    if (all.data) setAllTasks(all.data);

    if (partner) {
      const { data: pTasks } = await supabase.from('tasks').select('*').eq('user_id', partner.id).gte('date', monthAgo);
      if (pTasks) setPartnerAllTasks(pTasks);
    }
  };

  const myStreak = calculateStreak(allTasks);
  const coupleStreakCalc = partner ? calculateCoupleStreak(allTasks, partnerAllTasks) : { current: 0, longest: 0 };

  const total = weekTasks.length;
  const completed = weekTasks.filter(t => t.is_completed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const avgSleep = weekHealth.length > 0 ? (weekHealth.reduce((s, h) => s + h.sleep_hours, 0) / weekHealth.length).toFixed(1) : '0';
  const avgWater = weekHealth.length > 0 ? Math.round(weekHealth.reduce((s, h) => s + h.water_ml, 0) / weekHealth.length) : 0;

  // Chart data: daily task completion
  const dailyData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString([], { weekday: 'short' });
    const dayTasks = weekTasks.filter(t => t.date === dateStr);
    const dayCompleted = dayTasks.filter(t => t.is_completed).length;
    dailyData.push({ day: dayLabel, completed: dayCompleted, total: dayTasks.length });
  }

  // Health trend
  const healthTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString([], { weekday: 'short' });
    const log = weekHealth.find(h => h.date === dateStr);
    healthTrend.push({
      day: dayLabel,
      water: log ? log.water_ml / 1000 : 0,
      sleep: log ? log.sleep_hours : 0,
    });
  }

  // Category breakdown
  const catData = [
    { name: 'Work', value: weekTasks.filter(t => t.category === 'work').length },
    { name: 'Health', value: weekTasks.filter(t => t.category === 'health').length },
    { name: 'Personal', value: weekTasks.filter(t => t.category === 'personal').length },
    { name: 'Other', value: weekTasks.filter(t => t.category === 'other').length },
  ].filter(c => c.value > 0);

  const insights = [
    pct >= 80 ? `🎉 Amazing! ${pct}% tasks done this week!` : pct >= 50 ? `💪 Solid ${pct}%! Keep it up!` : `📈 ${pct}% — small steps count!`,
    Number(avgSleep) > 0 && Number(avgSleep) < 7 ? `😴 Sleep needs work — ${avgSleep}h avg` : Number(avgSleep) >= 7 ? `🌙 Great sleep! ${avgSleep}h avg 💚` : '',
    avgWater > 0 && avgWater < 2000 ? `💧 More water needed — ${(avgWater / 1000).toFixed(1)}L avg` : avgWater >= 2000 ? `💧 Hydration solid! ${(avgWater / 1000).toFixed(1)}L avg 💚` : '',
    myStreak.current >= 3 ? `🔥 ${myStreak.current} day streak! Your longest was ${myStreak.longest}!` : '',
    coupleStreakCalc.current >= 2 ? `💕 You & your partner have a ${coupleStreakCalc.current} day couple streak!` : '',
  ].filter(Boolean);

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>📊 Stats & Reports</h1>

      {/* Quick stats */}
      <div className="stats-row" style={{ marginBottom: '24px' }}>
        {[
          { v: `${completed}/${total}`, l: 'Tasks This Week' },
          { v: `${myStreak.current}🔥`, l: 'Your Streak' },
          { v: `${coupleStreakCalc.current}💕`, l: 'Couple Streak' },
          { v: `${profile?.points || 0}`, l: 'Total Points' },
        ].map((s, i) => (
          <div key={i} className="stat-card glass-card">
            <div className="stat-value">{s.v}</div>
            <div className="stat-label">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Task Completion Chart */}
        <div className="glass-card card-full" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>📈 Daily Task Completion</h3>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} barCategoryGap="20%">
                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                    borderRadius: '12px', fontSize: '13px',
                  }}
                />
                <Bar dataKey="completed" fill="#a5a5ff" radius={[6, 6, 0, 0]} name="Completed" />
                <Bar dataKey="total" fill="rgba(165,165,255,0.2)" radius={[6, 6, 0, 0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Trend */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>💧 Water Intake Trend</h3>
          <div style={{ width: '100%', height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthTrend}>
                <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                    borderRadius: '12px', fontSize: '13px',
                  }}
                  formatter={(v: number) => [`${v.toFixed(1)}L`, 'Water']}
                />
                <defs>
                  <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#58e6ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#58e6ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="water" stroke="#58e6ff" fill="url(#waterGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>🎯 Category Breakdown</h3>
          {catData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '140px', height: '140px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4}>
                      {catData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {catData.map((c, i) => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span>{c.name}: {c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No task data yet</p>
          )}
        </div>

        {/* Weekly Report */}
        <div className="glass-card card-full" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>📋 Weekly Report</h3>
          {insights.length > 0 ? (
            insights.map((ins, i) => <div key={i} className="report-insight">{ins}</div>)
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Start logging tasks and health data to get insights!</p>
          )}
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

        {/* Memory Jar */}
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
