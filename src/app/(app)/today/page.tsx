'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getGreeting, getRandomEngagement, getCompletionPercentage, getCategoryIcon } from '@/lib/utils';
import type { Task, Mood, HealthLog, Streak } from '@/lib/types';
import HealthRing from '@/components/health/HealthRing';
import MoodPicker from '@/components/mood/MoodPicker';
import TopBar from '@/components/layout/TopBar';
import Link from 'next/link';

export default function TodayPage() {
  const { profile, partner } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [partnerTasks, setPartnerTasks] = useState<Task[]>([]);
  const [mood, setMood] = useState<Mood | null>(null);
  const [partnerMood, setPartnerMood] = useState<Mood | null>(null);
  const [health, setHealth] = useState<HealthLog | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [engagement] = useState(getRandomEngagement());
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const supabase = createClient();

  const today = new Date().toISOString().split('T')[0];
  const greeting = profile ? getGreeting(profile.name) : { text: 'Hello', emoji: '👋', subtext: '' };

  useEffect(() => {
    if (!profile) return;
    loadData();

    // Subscribe to realtime task updates
    const taskChannel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(taskChannel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;

    // Fetch user tasks for today
    const { data: taskData } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', profile.id)
      .eq('date', today)
      .order('created_at', { ascending: true });
    if (taskData) setTasks(taskData);

    // Fetch partner shared tasks
    if (partner) {
      const { data: pTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', partner.id)
        .eq('share_with_partner', true)
        .eq('date', today)
        .order('created_at', { ascending: true });
      if (pTasks) setPartnerTasks(pTasks);

      // Partner mood
      const { data: pMood } = await supabase
        .from('moods')
        .select('*')
        .eq('user_id', partner.id)
        .eq('date', today)
        .single();
      if (pMood) setPartnerMood(pMood);
    }

    // User mood
    const { data: moodData } = await supabase
      .from('moods')
      .select('*')
      .eq('user_id', profile.id)
      .eq('date', today)
      .single();
    if (moodData) setMood(moodData);

    // Health log
    const { data: healthData } = await supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', profile.id)
      .eq('date', today)
      .single();
    if (healthData) setHealth(healthData);

    // Streak
    const { data: streakData } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', profile.id)
      .eq('streak_type', 'individual')
      .single();
    if (streakData) setStreak(streakData);
  };

  const toggleTask = async (taskId: string, isCompleted: boolean) => {
    await supabase
      .from('tasks')
      .update({ 
        is_completed: !isCompleted, 
        completed_at: !isCompleted ? new Date().toISOString() : null 
      })
      .eq('id', taskId);

    // If completing, add points
    if (!isCompleted && profile) {
      await supabase
        .from('profiles')
        .update({ points: (profile.points || 0) + 10 })
        .eq('id', profile.id);
      
      // Log activity
      if (partner) {
        const task = tasks.find(t => t.id === taskId);
        await supabase.from('activity_feed').insert({
          user_id: profile.id,
          partner_id: partner.id,
          event_type: 'task_completed',
          content: `${profile.name} completed "${task?.title}" 💪`,
          emoji: '✅',
        });
      }
    }

    loadData();
  };

  const completedCount = tasks.filter(t => t.is_completed).length;
  const completionPct = getCompletionPercentage(completedCount, tasks.length);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ margin: '-36px -40px 24px -40px' }}>
        <TopBar />
      </div>

      {/* Random engagement banner */}
      <div className="glass-card" style={{
        padding: '16px 20px',
        marginBottom: '24px',
        background: engagement.type === 'reward'
          ? 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(236,72,153,0.1) 100%)'
          : 'var(--gradient-glass)',
        borderColor: engagement.type === 'reward' ? 'rgba(249,115,22,0.2)' : 'var(--border-subtle)',
      }}>
        <p style={{ fontSize: '14px' }}>{engagement.content}</p>
      </div>

      <div className="dashboard-grid">
        {/* Today's Tasks */}
        <div className="glass-card card-full" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Today&apos;s Tasks</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {completedCount}/{tasks.length} complete · {completionPct}%
              </p>
            </div>
            <Link href="/tasks" className="btn btn-sm btn-secondary">Manage →</Link>
          </div>

          {/* Progress bar */}
          <div style={{
            width: '100%', height: '6px', background: 'var(--bg-glass)',
            borderRadius: '3px', marginBottom: '16px', overflow: 'hidden',
          }}>
            <div style={{
              width: `${completionPct}%`, height: '100%',
              background: 'var(--gradient-primary)', borderRadius: '3px',
              transition: 'width 0.5s ease',
            }} />
          </div>

          {tasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
              No tasks yet today. <Link href="/tasks" style={{ color: 'var(--primary)' }}>Add some!</Link>
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tasks.slice(0, 5).map(task => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id, task.is_completed)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-glass)', cursor: 'pointer',
                    border: '1px solid var(--border-subtle)',
                    opacity: task.is_completed ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '6px',
                    border: task.is_completed ? 'none' : '2px solid var(--text-muted)',
                    background: task.is_completed ? 'var(--gradient-primary)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', color: 'white', flexShrink: 0,
                  }}>
                    {task.is_completed && '✓'}
                  </div>
                  <span style={{
                    flex: 1, fontSize: '14px',
                    textDecoration: task.is_completed ? 'line-through' : 'none',
                  }}>
                    {getCategoryIcon(task.category)} {task.title}
                  </span>
                  {task.share_with_partner && (
                    <span style={{ fontSize: '12px', opacity: 0.5 }}>👥</span>
                  )}
                </div>
              ))}
              {tasks.length > 5 && (
                <Link href="/tasks" style={{ color: 'var(--primary)', fontSize: '13px', textAlign: 'center', padding: '8px', display: 'block' }}>
                  +{tasks.length - 5} more tasks →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Interactive Premium Quick Stats */}
        <div className="glass-card card-full" style={{ padding: '24px', background: 'var(--gradient-soft)', border: '1px solid var(--primary-container)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--primary-dim)' }}>✨ Your Momentum</h3>
          <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            
            <div className="stat-card glass-card hover-lift" style={{ background: '#fff' }}>
              <div className="stat-value" style={{ fontSize: '36px' }}>{profile?.points || 0}</div>
              <div className="stat-label">Total Points</div>
            </div>
            
            <div className="stat-card glass-card hover-lift" style={{ background: '#fff' }}>
              <div className="stat-value" style={{ fontSize: '36px', color: '#f97316', WebkitTextFillColor: 'unset', background: 'none' }}>
                {streak?.current_count || 0}🔥
              </div>
              <div className="stat-label">Day Streak</div>
            </div>

            <div className="stat-card glass-card hover-lift" style={{ background: '#fff' }}>
              <div className="stat-value" style={{ fontSize: '36px', color: '#10b981', WebkitTextFillColor: 'unset', background: 'none' }}>
                {completedCount}/{tasks.length}
              </div>
              <div className="stat-label">Tasks Done</div>
            </div>

            <div className="stat-card glass-card hover-lift" style={{ background: '#fff' }}>
              <div className="stat-value" style={{ fontSize: '36px', color: '#0ea5e9', WebkitTextFillColor: 'unset', background: 'none' }}>
                {((health?.water_ml || 0) / 1000).toFixed(1)}L
              </div>
              <div className="stat-label">Hydration</div>
            </div>

          </div>
        </div>

        {/* Mood */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Mood Check-in</h3>
          {mood ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>{mood.mood}</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Today&apos;s mood set!</p>
              <button onClick={() => setShowMoodPicker(true)} className="btn btn-ghost btn-sm" style={{ marginTop: '8px' }}>
                Change
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>How are you feeling?</p>
              <button onClick={() => setShowMoodPicker(true)} className="btn btn-primary btn-sm">
                Set Mood
              </button>
            </div>
          )}
          {partner && partnerMood && (
            <div style={{
              marginTop: '16px', paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)', textAlign: 'center',
            }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{partner.name}&apos;s mood</p>
              <span style={{ fontSize: '28px' }}>{partnerMood.mood}</span>
            </div>
          )}
        </div>

        {/* Health Ring */}
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Health Ring</h3>
          <HealthRing
            water={health?.water_ml || 0}
            sleep={health?.sleep_hours || 0}
            steps={health?.steps || 0}
            size={140}
          />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', fontSize: '12px' }}>
            <span style={{ color: 'var(--accent-secondary)' }}>💧 {((health?.water_ml || 0) / 1000).toFixed(1)}L</span>
            <span style={{ color: 'var(--accent-primary)' }}>😴 {health?.sleep_hours || 0}h</span>
            <span style={{ color: 'var(--accent-green)' }}>👟 {health?.steps || 0}</span>
          </div>
        </div>

        {/* Partner Tasks */}
        {partner && (
          <div className="glass-card card-full" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
              {partner.name}&apos;s Shared Tasks 💕
            </h3>
            {partnerTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No shared tasks from your partner today.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {partnerTasks.map(task => (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)',
                    opacity: task.is_completed ? 0.6 : 1,
                  }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '6px',
                      background: task.is_completed ? 'var(--accent-green)' : 'transparent',
                      border: task.is_completed ? 'none' : '2px solid var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', color: 'white',
                    }}>
                      {task.is_completed && '✓'}
                    </div>
                    <span style={{
                      flex: 1, fontSize: '14px',
                      textDecoration: task.is_completed ? 'line-through' : 'none',
                    }}>
                      {getCategoryIcon(task.category)} {task.title}
                    </span>
                    <span className={`badge badge-${task.category}`}>{task.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mood Picker Modal */}
      {showMoodPicker && (
        <MoodPicker
          currentMood={mood?.mood || null}
          onSelect={async (selectedMood) => {
            if (!profile) return;
            await supabase.from('moods').upsert({
              user_id: profile.id,
              mood: selectedMood,
              date: today,
            }, { onConflict: 'user_id,date' });
            setShowMoodPicker(false);
            loadData();
          }}
          onClose={() => setShowMoodPicker(false)}
        />
      )}
    </div>
  );
}
