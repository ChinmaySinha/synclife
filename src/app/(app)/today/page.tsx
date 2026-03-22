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

  const [myStreak, setMyStreak] = useState({ current: 0, longest: 0 });
  const [coupleStreakData, setCoupleStreakData] = useState({ current: 0, longest: 0 });

  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => { loadData(); })
      .subscribe();
    return () => { supabase.removeChannel(taskChannel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  useEffect(() => {
    if (profile) fetchAiSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const fetchAiSuggestions = async () => {
    setAiLoading(true);
    try {
      const now = new Date();
      const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
      const res = await fetch(`/api/ai/suggestions?time=${encodeURIComponent(timeString)}`);
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

    const [todayRes, historyRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', profile.id).eq('date', today).order('created_at', { ascending: true }),
      supabase.from('tasks').select('*').eq('user_id', profile.id).gte('date', weekAgo),
    ]);
    if (todayRes.data) setTasks(todayRes.data);
    if (historyRes.data) setMyStreak(calculateStreak(historyRes.data));

    if (partner) {
      const [pTasks, pHistory, pMood] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', partner.id).eq('share_with_partner', true).eq('date', today).order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').eq('user_id', partner.id).gte('date', weekAgo),
        supabase.from('moods').select('*').eq('user_id', partner.id).eq('date', today).single(),
      ]);
      if (pTasks.data) setPartnerTasks(pTasks.data);
      if (pMood.data) setPartnerMood(pMood.data);
      if (historyRes.data && pHistory.data) setCoupleStreakData(calculateCoupleStreak(historyRes.data, pHistory.data));
    }

    const { data: moodData } = await supabase.from('moods').select('*').eq('user_id', profile.id).eq('date', today).single();
    if (moodData) setMood(moodData);

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
          user_id: profile.id, partner_id: partner.id,
          event_type: 'task_completed',
          content: `${profile.name} completed "${task?.title}" 💪`, emoji: '✅',
        });
      }

      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, is_completed: true, completed_at: new Date().toISOString() } : t);
      const allDone = updatedTasks.length > 0 && updatedTasks.every(t => t.is_completed);

      if (allDone && updatedTasks.length >= 3) {
        await supabase.from('memory_jar').insert({
          user_id: profile.id,
          content: `${profile.name} completed ALL ${updatedTasks.length} tasks today! 🔥`,
          emoji: '🏆', milestone_type: 'all_tasks',
        });
      }

      if (allDone && partner && partnerTasks.length > 0 && partnerTasks.every(t => t.is_completed)) {
        await supabase.from('memory_jar').insert({
          user_id: profile.id,
          content: `Both ${profile.name} & ${partner.name} crushed ALL their tasks today! 💕🔥`,
          emoji: '🎊', milestone_type: 'both_complete',
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
    <div className="animate-fade-in">
      <TopBar />

      {/* ===== BENTO GRID ===== */}
      <div className="bento-grid stagger-children">

        {/* Today's Tasks — Tall */}
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

        {/* Mood Check-in */}
        <div className="bento-card">
          <div className="bento-title" style={{ marginBottom: '16px' }}><span className="icon">😊</span> Mood</div>
          {mood ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>{mood.mood}</div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Today&apos;s mood set</p>
              <button onClick={() => setShowMoodPicker(true)} className="btn btn-ghost btn-sm" style={{ marginTop: '6px', fontSize: '12px' }}>Change</button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>How are you feeling?</p>
              <button onClick={() => setShowMoodPicker(true)} className="btn btn-primary btn-sm">Set Mood</button>
            </div>
          )}
          {partner && partnerMood && (
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{partner.name}</p>
              <span style={{ fontSize: '24px' }}>{partnerMood.mood}</span>
            </div>
          )}
        </div>

        {/* Health Ring */}
        <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="bento-title" style={{ marginBottom: '14px', alignSelf: 'flex-start' }}><span className="icon">💚</span> Health</div>
          <HealthRing water={health?.water_ml || 0} sleep={health?.sleep_hours || 0} steps={health?.steps || 0} size={110} />
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '11px' }}>
            <span style={{ color: 'var(--accent-secondary)' }}>💧 {((health?.water_ml || 0) / 1000).toFixed(1)}L</span>
            <span style={{ color: 'var(--accent-primary)' }}>😴 {health?.sleep_hours || 0}h</span>
            <span style={{ color: 'var(--accent-green)' }}>👟 {health?.steps || 0}</span>
          </div>
        </div>

        {/* Streaks — Wide */}
        <div className="bento-card bento-wide" style={{
          background: 'linear-gradient(135deg, rgba(139,126,255,0.06) 0%, rgba(0,217,255,0.04) 100%)',
          border: '1px solid rgba(139,126,255,0.1)',
        }}>
          <div className="bento-title" style={{ marginBottom: '16px' }}><span className="icon">✨</span> Your Momentum</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { v: profile?.points || 0, l: 'Points', gradient: true },
              { v: `${myStreak.current}🔥`, l: 'Day Streak', color: '#f97316' },
              { v: `${coupleStreakData.current}💕`, l: 'Couple', color: '#ff6b9d' },
              { v: `${completedCount}/${tasks.length}`, l: 'Done', color: '#34d399' },
            ].map((s, i) => (
              <div key={i} style={{
                textAlign: 'center', padding: '14px 8px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{
                  fontFamily: 'Space Grotesk', fontSize: '24px', fontWeight: 700,
                  ...(s.gradient ? {
                    background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  } : { color: s.color }),
                }}>
                  {s.v}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Suggestions — Full width */}
        <div className="bento-card bento-full" style={{
          background: 'linear-gradient(135deg, rgba(139,126,255,0.04) 0%, rgba(255,107,157,0.04) 100%)',
          border: '1px solid rgba(139,126,255,0.08)',
        }}>
          <div className="bento-header">
            <div className="bento-title"><span className="icon">🤖</span> AI Suggestions</div>
            <button onClick={fetchAiSuggestions} className="btn btn-ghost btn-sm" disabled={aiLoading} style={{ fontSize: '12px' }}>
              {aiLoading ? '⏳' : '🔄 Refresh'}
            </button>
          </div>
          {aiLoading ? (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
              <span className="spinner" style={{ display: 'inline-block', marginBottom: '8px' }}></span>
              <p style={{ fontSize: '12px' }}>Analyzing your day...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              {aiSuggestions.map((s, i) => (
                <div key={i} style={{
                  padding: '12px 16px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '13px', lineHeight: 1.5,
                }}>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trivia Quiz */}
        <div className="bento-card" style={{
          background: 'linear-gradient(135deg, rgba(139,126,255,0.06) 0%, rgba(0,217,255,0.06) 100%)',
          border: '1px solid rgba(139,126,255,0.12)',
        }}>
          <div className="bento-title" style={{ marginBottom: '10px' }}><span className="icon">🧠</span> Daily Trivia</div>
          <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', lineHeight: 1.4 }}>{trivia.question}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {trivia.options.map((opt, i) => {
              let bg = 'rgba(255,255,255,0.04)';
              let border = '1px solid rgba(255,255,255,0.06)';
              if (triviaRevealed) {
                if (i === trivia.correctIndex) { bg = 'rgba(52,211,153,0.15)'; border = '1px solid rgba(52,211,153,0.3)'; }
                else if (i === selectedAnswer) { bg = 'rgba(248,113,113,0.15)'; border = '1px solid rgba(248,113,113,0.3)'; }
              }
              return (
                <button key={i} onClick={() => handleTriviaAnswer(i)} style={{
                  padding: '8px 12px', borderRadius: '10px', background: bg, border,
                  fontSize: '12px', fontWeight: 500, cursor: triviaRevealed ? 'default' : 'pointer',
                  textAlign: 'left', transition: 'all 0.2s', color: 'var(--text-primary)',
                }}>
                  {opt}
                </button>
              );
            })}
          </div>
          {triviaRevealed && (
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic' }}>
              {selectedAnswer === trivia.correctIndex ? '✅ Correct! ' : '❌ Nope! '}{trivia.funFact}
            </p>
          )}
        </div>

        {/* Partner Tasks */}
        {partner && (
          <div className="bento-card">
            <div className="bento-title" style={{ marginBottom: '12px' }}><span className="icon">💕</span> {partner.name}&apos;s Tasks</div>
            {partnerTasks.length === 0 ? (
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
        )}
      </div>

      {/* Mood Picker Modal */}
      {showMoodPicker && (
        <MoodPicker
          currentMood={mood?.mood || null}
          onSelect={async (selectedMood) => {
            if (!profile) return;
            await supabase.from('moods').upsert({
              user_id: profile.id, mood: selectedMood, date: today,
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
