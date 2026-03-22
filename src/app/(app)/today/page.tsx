'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getGreeting, getCompletionPercentage, getCategoryIcon } from '@/lib/utils';
import { calculateStreak, calculateCoupleStreak } from '@/lib/streaks';
import { getDailyTrivia, type TriviaQuestion } from '@/lib/trivia';
import type { Task, Mood, HealthLog } from '@/lib/types';
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
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const supabase = createClient();

  // Streaks
  const [myStreak, setMyStreak] = useState({ current: 0, longest: 0 });
  const [coupleStreakData, setCoupleStreakData] = useState({ current: 0, longest: 0 });

  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Trivia
  const [trivia] = useState<TriviaQuestion>(getDailyTrivia());
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [triviaRevealed, setTriviaRevealed] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const greeting = profile ? getGreeting(profile.name) : { text: 'Hello', emoji: '👋', subtext: '' };

  useEffect(() => {
    if (!profile) return;
    loadData();

    const taskChannel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(taskChannel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Load AI suggestions once
  useEffect(() => {
    if (profile) fetchAiSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const fetchAiSuggestions = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/suggestions');
      const data = await res.json();
      setAiSuggestions(data.suggestions || []);
    } catch {
      setAiSuggestions(['✨ Keep up your great work today!']);
    }
    setAiLoading(false);
  };

  const loadData = async () => {
    if (!profile) return;
    const weekAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    // Fetch user tasks for today + history for streaks
    const [todayRes, historyRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', profile.id).eq('date', today).order('created_at', { ascending: true }),
      supabase.from('tasks').select('*').eq('user_id', profile.id).gte('date', weekAgo),
    ]);
    if (todayRes.data) setTasks(todayRes.data);
    if (historyRes.data) {
      setMyStreak(calculateStreak(historyRes.data));
    }

    // Partner data
    if (partner) {
      const [pTasks, pHistory, pMood] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', partner.id).eq('share_with_partner', true).eq('date', today).order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').eq('user_id', partner.id).gte('date', weekAgo),
        supabase.from('moods').select('*').eq('user_id', partner.id).eq('date', today).single(),
      ]);
      if (pTasks.data) setPartnerTasks(pTasks.data);
      if (pMood.data) setPartnerMood(pMood.data);
      if (historyRes.data && pHistory.data) {
        setCoupleStreakData(calculateCoupleStreak(historyRes.data, pHistory.data));
      }
    }

    // User mood
    const { data: moodData } = await supabase.from('moods').select('*').eq('user_id', profile.id).eq('date', today).single();
    if (moodData) setMood(moodData);

    // Health log
    const { data: healthData } = await supabase.from('health_logs').select('*').eq('user_id', profile.id).eq('date', today).single();
    if (healthData) setHealth(healthData);
  };

  const toggleTask = async (taskId: string, isCompleted: boolean) => {
    await supabase.from('tasks').update({
      is_completed: !isCompleted,
      completed_at: !isCompleted ? new Date().toISOString() : null,
    }).eq('id', taskId);

    if (!isCompleted && profile) {
      await supabase.from('profiles').update({ points: (profile.points || 0) + 10 }).eq('id', profile.id);

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

      // Memory jar: check for streak milestones after this task
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, is_completed: true, completed_at: new Date().toISOString() } : t);
      const allDone = updatedTasks.length > 0 && updatedTasks.every(t => t.is_completed);

      if (allDone && updatedTasks.length >= 3) {
        await supabase.from('memory_jar').insert({
          user_id: profile.id,
          content: `${profile.name} completed ALL ${updatedTasks.length} tasks today! 🔥`,
          emoji: '🏆',
          milestone_type: 'all_tasks',
        });
      }

      // Check if both partners completed all tasks
      if (allDone && partner && partnerTasks.length > 0 && partnerTasks.every(t => t.is_completed)) {
        await supabase.from('memory_jar').insert({
          user_id: profile.id,
          content: `Both ${profile.name} & ${partner.name} crushed ALL their tasks today! 💕🔥`,
          emoji: '🎊',
          milestone_type: 'both_complete',
        });
      }
    }

    loadData();
  };

  const handleTriviaAnswer = (index: number) => {
    if (triviaRevealed) return;
    setSelectedAnswer(index);
    setTriviaRevealed(true);
  };

  const completedCount = tasks.filter(t => t.is_completed).length;
  const completionPct = getCompletionPercentage(completedCount, tasks.length);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ margin: '-36px -40px 24px -40px' }}>
        <TopBar />
      </div>

      {/* Daily Trivia Quiz */}
      <div className="glass-card" style={{
        padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(165,165,255,0.08) 0%, rgba(88,230,255,0.08) 100%)',
        border: '1px solid rgba(165,165,255,0.15)',
      }}>
        <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>🧠 Daily Trivia</h4>
        <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>{trivia.question}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {trivia.options.map((opt, i) => {
            let bg = 'var(--bg-glass)';
            let border = '1px solid var(--border-subtle)';
            if (triviaRevealed) {
              if (i === trivia.correctIndex) { bg = 'rgba(52,211,153,0.15)'; border = '1px solid rgba(52,211,153,0.4)'; }
              else if (i === selectedAnswer) { bg = 'rgba(248,113,113,0.15)'; border = '1px solid rgba(248,113,113,0.4)'; }
            } else if (i === selectedAnswer) {
              bg = 'rgba(165,165,255,0.15)'; border = '1px solid rgba(165,165,255,0.3)';
            }
            return (
              <button
                key={i}
                onClick={() => handleTriviaAnswer(i)}
                style={{
                  padding: '10px 14px', borderRadius: '12px', background: bg, border,
                  fontSize: '13px', fontWeight: 500, cursor: triviaRevealed ? 'default' : 'pointer',
                  textAlign: 'left', transition: 'all 0.2s', color: 'var(--text-primary)',
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {triviaRevealed && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px', fontStyle: 'italic' }}>
            {selectedAnswer === trivia.correctIndex ? '✅ Correct! ' : '❌ Not quite! '}
            {trivia.funFact}
          </p>
        )}
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

        {/* Streaks + Quick Stats (real calculation) */}
        <div className="glass-card card-full" style={{ padding: '24px', background: 'var(--gradient-soft)', border: '1px solid var(--primary-container)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--primary-dim)' }}>✨ Your Momentum</h3>
          <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="stat-card glass-card hover-lift" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="stat-value" style={{ fontSize: '36px' }}>{profile?.points || 0}</div>
              <div className="stat-label">Total Points</div>
            </div>
            <div className="stat-card glass-card hover-lift" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="stat-value" style={{ fontSize: '36px', color: '#f97316', WebkitTextFillColor: 'unset', background: 'none' }}>
                {myStreak.current}🔥
              </div>
              <div className="stat-label">Day Streak</div>
            </div>
            <div className="stat-card glass-card hover-lift" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="stat-value" style={{ fontSize: '36px', color: '#ec4899', WebkitTextFillColor: 'unset', background: 'none' }}>
                {coupleStreakData.current}💕
              </div>
              <div className="stat-label">Couple Streak</div>
            </div>
            <div className="stat-card glass-card hover-lift" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="stat-value" style={{ fontSize: '36px', color: '#10b981', WebkitTextFillColor: 'unset', background: 'none' }}>
                {completedCount}/{tasks.length}
              </div>
              <div className="stat-label">Tasks Done</div>
            </div>
          </div>
        </div>

        {/* AI Suggestions Card */}
        <div className="glass-card card-full" style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(236,72,153,0.06) 100%)',
          border: '1px solid rgba(139,92,246,0.12)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>🤖 AI Suggestions</h3>
            <button onClick={fetchAiSuggestions} className="btn btn-ghost btn-sm" disabled={aiLoading}>
              {aiLoading ? '⏳' : '🔄 Refresh'}
            </button>
          </div>
          {aiLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
              <span className="spinner" style={{ display: 'inline-block', marginBottom: '8px' }}></span>
              <p style={{ fontSize: '13px' }}>Analyzing your day...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {aiSuggestions.map((s, i) => (
                <div key={i} style={{
                  padding: '12px 16px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '14px', lineHeight: 1.5,
                }}>
                  {s}
                </div>
              ))}
            </div>
          )}
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
