'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Task, Mood, HealthLog } from '@/lib/types';
import { getCategoryIcon, getRandomNudge } from '@/lib/utils';
import HealthRing from '@/components/health/HealthRing';

export default function PartnerPage() {
  const { profile, partner, refreshProfile } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [enterCode, setEnterCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [partnerTasks, setPartnerTasks] = useState<Task[]>([]);
  const [partnerMood, setPartnerMood] = useState<Mood | null>(null);
  const [partnerHealth, setPartnerHealth] = useState<HealthLog | null>(null);
  const supabase = createClient();

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (profile) {
      setInviteCode(profile.invite_code || '');
      if (partner) loadPartnerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, partner]);

  const loadPartnerData = async () => {
    if (!partner) return;

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', partner.id)
      .eq('share_with_partner', true)
      .eq('date', today)
      .order('created_at', { ascending: true });
    if (tasks) setPartnerTasks(tasks);

    const { data: mood } = await supabase
      .from('moods')
      .select('*')
      .eq('user_id', partner.id)
      .eq('date', today)
      .single();
    if (mood) setPartnerMood(mood);

    const { data: health } = await supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', partner.id)
      .eq('date', today)
      .single();
    if (health) setPartnerHealth(health);
  };

  const connectPartner = async () => {
    if (!enterCode.trim() || !profile) return;
    setError('');
    setSuccess('');

    // Find the partner by invite code
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('invite_code', enterCode.trim())
      .single();

    if (!partnerProfile) {
      setError('Invalid invite code. Please check and try again.');
      return;
    }

    if (partnerProfile.id === profile.id) {
      setError("You can't pair with yourself! 😄");
      return;
    }

    if (partnerProfile.partner_id) {
      setError('This person is already paired with someone.');
      return;
    }

    // Link both users
    await supabase.from('profiles').update({ partner_id: partnerProfile.id }).eq('id', profile.id);
    await supabase.from('profiles').update({ partner_id: profile.id }).eq('id', partnerProfile.id);

    // Create partnership record
    await supabase.from('partnerships').insert({
      user1_id: profile.id,
      user2_id: partnerProfile.id,
    });

    // Initialize streaks
    await supabase.from('streaks').insert([
      { user_id: profile.id, streak_type: 'individual' },
      { user_id: partnerProfile.id, streak_type: 'individual' },
      { user_id: profile.id, streak_type: 'couple' },
    ]);

    // Add memory jar entry
    await supabase.from('memory_jar').insert({
      user_id: profile.id,
      content: `${profile.name} and ${partnerProfile.name} connected! The journey begins! 🎉`,
      emoji: '🎊',
      milestone_type: 'custom',
    });

    setSuccess(`Connected with ${partnerProfile.name}! 🎉`);
    await refreshProfile();
  };

  const sendNudge = async (taskId?: string) => {
    if (!profile || !partner) return;
    const message = getRandomNudge();
    await supabase.from('nudges').insert({
      sender_id: profile.id,
      receiver_id: partner.id,
      task_id: taskId || null,
      message,
    });
    await supabase.from('messages').insert({
      sender_id: profile.id,
      receiver_id: partner.id,
      content: message,
      message_type: 'nudge',
    });
    await supabase.from('notifications').insert({
      user_id: partner.id,
      title: 'Nudge! 👉',
      body: message,
      type: 'nudge',
    });
    setSuccess('Nudge sent! 💕');
    setTimeout(() => setSuccess(''), 3000);
  };

  const reactToTask = async (taskId: string, reaction: string) => {
    if (!profile) return;
    await supabase.from('task_reactions').upsert({
      task_id: taskId,
      user_id: profile.id,
      reaction,
    }, { onConflict: 'task_id,user_id,reaction' });
  };

  // Not paired yet — show invite system
  if (!partner) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>💕</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Connect with Your Partner</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Share your code or enter theirs to start your journey together
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Your invite code */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '20px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Your Invite Code
          </h3>
          <div style={{
            fontSize: '28px', fontWeight: 800, fontFamily: 'Outfit',
            letterSpacing: '4px', background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '12px',
          }}>
            {inviteCode}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(inviteCode)}
            className="btn btn-sm btn-secondary"
          >
            📋 Copy Code
          </button>
        </div>

        {/* Enter partner's code */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', textAlign: 'center' }}>
            Enter Partner&apos;s Code
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              className="input"
              placeholder="Enter their code..."
              value={enterCode}
              onChange={e => setEnterCode(e.target.value)}
              style={{ flex: 1, textAlign: 'center', letterSpacing: '2px', fontWeight: 600 }}
            />
            <button onClick={connectPartner} className="btn btn-primary">Connect</button>
          </div>
        </div>
      </div>
    );
  }

  // Paired — show partner overview
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>💕 {partner.name}</h1>
        <button onClick={() => sendNudge()} className="btn btn-sm btn-secondary">👉 Send Nudge</button>
      </div>

      {success && <div className="success-message">{success}</div>}

      <div className="dashboard-grid">
        {/* Partner Profile Card */}
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'var(--gradient-warm)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: 700, color: 'white',
            margin: '0 auto 12px',
          }}>
            {partner.name.charAt(0).toUpperCase()}
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{partner.name}</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{partner.points} points 🏆</p>

          {partnerMood && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current mood</p>
              <span style={{ fontSize: '36px' }}>{partnerMood.mood}</span>
            </div>
          )}
        </div>

        {/* Partner Health */}
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Health Ring</h3>
          <HealthRing
            water={partnerHealth?.water_ml || 0}
            sleep={partnerHealth?.sleep_hours || 0}
            steps={partnerHealth?.steps || 0}
            size={120}
          />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px', fontSize: '12px' }}>
            <span style={{ color: 'var(--accent-secondary)' }}>💧 {((partnerHealth?.water_ml || 0) / 1000).toFixed(1)}L</span>
            <span style={{ color: 'var(--accent-primary)' }}>😴 {partnerHealth?.sleep_hours || 0}h</span>
            <span style={{ color: 'var(--accent-green)' }}>👟 {partnerHealth?.steps || 0}</span>
          </div>
        </div>

        {/* Partner Tasks */}
        <div className="glass-card card-full" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            Shared Tasks Today ({partnerTasks.filter(t => t.is_completed).length}/{partnerTasks.length})
          </h3>
          {partnerTasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
              No shared tasks from {partner.name} today
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {partnerTasks.map(task => (
                <div key={task.id} className="glass-card" style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                      opacity: task.is_completed ? 0.6 : 1,
                    }}>
                      {getCategoryIcon(task.category)} {task.title}
                    </span>
                    <span className={`badge badge-${task.category}`}>{task.category}</span>
                  </div>
                  {/* Reactions */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px', paddingLeft: '34px' }}>
                    {['❤️', '🔥', '😡', '👏'].map(reaction => (
                      <button
                        key={reaction}
                        className="reaction-btn"
                        onClick={() => reactToTask(task.id, reaction)}
                      >
                        {reaction}
                      </button>
                    ))}
                    {!task.is_completed && (
                      <button
                        onClick={() => sendNudge(task.id)}
                        className="btn btn-sm btn-ghost"
                        style={{ marginLeft: 'auto' }}
                      >
                        👉 Nudge
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
