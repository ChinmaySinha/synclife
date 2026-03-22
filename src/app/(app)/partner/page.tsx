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
      <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '40px auto', paddingBottom: '40px' }}>
        <div className="card-full" style={{ 
          padding: '48px 40px', 
          background: 'linear-gradient(135deg, #0e0e0e 0%, #1a1a2e 100%)',
          borderRadius: '32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          color: '#fff',
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          {/* Atmospheric Glows */}
          <div style={{ position: 'absolute', top: '-50%', left: '-20%', width: '100%', height: '200%', background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 60%)', pointerEvents: 'none' }}></div>
          
          <div style={{ 
            fontSize: '72px', 
            marginBottom: '24px', 
            animation: 'pulse 2s infinite',
            textShadow: '0 0 40px rgba(236,72,153,0.4)',
            position: 'relative', zIndex: 1
          }}>💕</div>
          
          <h1 style={{ position: 'relative', zIndex: 1, fontSize: '32px', fontWeight: 900, marginBottom: '16px', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px' }}>
            Find Your Sync Partner
          </h1>
          <p style={{ position: 'relative', zIndex: 1, color: '#adaaaa', fontSize: '16px', lineHeight: 1.6 }}>
            To sync tasks, moods, and habits, you need to connect your accounts. <br/>
            Share your unique code, or enter your partner's code below.
          </p>
        </div>

        {error && <div className="error-message" style={{ marginBottom: '24px', fontSize: '15px', fontWeight: 600 }}>{error}</div>}
        {success && <div className="success-message" style={{ marginBottom: '24px', fontSize: '15px', fontWeight: 600 }}>{success}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Option 1: Share YOUR code */}
          <div style={{ 
            padding: '36px', 
            textAlign: 'center',
            background: 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '14px', color: '#a5a5ff', marginBottom: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>
              Step 1: Share Your Code
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '24px' }}>
              Send this secure code to your partner so they can link with you.
            </p>
            
            <div style={{
              fontSize: '48px', 
              fontWeight: 900, 
              fontFamily: 'Outfit, monospace',
              letterSpacing: '12px', 
              color: 'var(--text-primary)',
              background: 'linear-gradient(135deg, rgba(165,165,255,0.1) 0%, rgba(236,72,153,0.1) 100%)',
              padding: '20px 32px',
              borderRadius: '20px',
              border: '2px dashed rgba(165,165,255,0.4)',
              display: 'inline-block',
              marginBottom: '24px',
            }}>
              {inviteCode || <span className="spinner"></span>}
            </div>
            
            <div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteCode);
                  setSuccess('Code copied to clipboard! Send it to your partner. 💌');
                  setTimeout(() => setSuccess(''), 4000);
                }}
                className="btn btn-primary"
                style={{ padding: '14px 40px', fontSize: '16px', borderRadius: '30px', fontWeight: 700 }}
              >
                📋 Copy Code to Share
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: '14px', letterSpacing: '2px' }}>
            — OR —
          </div>

          {/* Option 2: Enter THEIR code */}
          <div style={{ 
            padding: '36px',
            background: 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)' 
          }}>
            <h3 style={{ fontSize: '14px', color: '#ff8ed2', marginBottom: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center' }}>
              Step 2: Enter Theirs
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '24px', textAlign: 'center' }}>
              Did they send you a code? Paste it right here!
            </p>
            
            <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-glass)', padding: '12px', borderRadius: '24px', border: '1px solid var(--border-subtle)' }}>
              <input
                className="input"
                placeholder="Paste code here..."
                value={enterCode}
                onChange={e => setEnterCode(e.target.value.toUpperCase())}
                style={{ 
                  flex: 1, 
                  textAlign: 'center', 
                  letterSpacing: '6px', 
                  fontWeight: 900, 
                  fontSize: '24px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  textTransform: 'uppercase'
                }}
              />
              <button 
                onClick={connectPartner} 
                className="btn btn-secondary"
                style={{ borderRadius: '16px', padding: '0 32px', fontWeight: 800, fontSize: '16px' }}
              >
                Connect 🔗
              </button>
            </div>
          </div>
          
        </div>
      </div>
    );
  }

  // Paired — show partner overview
  return (
    <div className="animate-fade-in pb-10">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden',
            background: 'var(--surface-card)', border: '2px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            {partner.avatar_url ? (
               <img src={partner.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
               <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {partner.name?.charAt(0).toUpperCase() || '👤'}
               </span>
            )}
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'Outfit', margin: 0 }}>{partner.name}</h1>
        </div>
        <button onClick={() => sendNudge()} className="btn btn-secondary" style={{ borderRadius: '20px', fontWeight: 700 }}>👉 Send Nudge</button>
      </div>

      {success && <div className="success-message" style={{ marginBottom: '24px' }}>{success}</div>}

      <div className="dashboard-grid">
        {/*
          THE ETHEREAL PROFESSIONAL: PARTNER HERO
          StitchMCP Aesthetic integration: Deep Smoky Charcoal Background, large avatar, frosted data readouts.
        */}
        <div className="card-full" style={{ 
          padding: '40px', 
          display: 'flex', 
          gap: '32px',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0e0e0e 0%, #1a1a2e 100%)',
          borderRadius: '32px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          color: '#fff',
          flexWrap: 'wrap'
        }}>
          {/* Atmospheric Glows */}
          <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: '100%', height: '200%', background: 'radial-gradient(circle, rgba(255,142,210,0.08) 0%, transparent 60%)', pointerEvents: 'none' }}></div>

          <div style={{
            width: '120px', height: '120px', borderRadius: '50%',
            background: partner.avatar_url ? `url(${partner.avatar_url}) center/cover no-repeat` : 'var(--gradient-warm)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: partner.avatar_url ? '0' : '48px', fontWeight: 800, color: 'white',
            boxShadow: '0 0 0 2px rgba(255,142,210,0.3)',
            position: 'relative', zIndex: 1
          }}>
            {!partner.avatar_url && partner.name.charAt(0).toUpperCase()}
          </div>
          
          <div style={{ flex: 1, zIndex: 1 }}>
            <h3 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '16px', fontFamily: 'Outfit, sans-serif' }}>{partner.name}</h3>
            
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ 
                padding: '12px 24px', 
                background: 'rgba(255,255,255,0.05)', 
                backdropFilter: 'blur(20px)',
                borderRadius: '16px', 
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{ fontSize: '12px', color: '#adaaaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Partner Points</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#ff8ed2' }}>{partner.points} 🏆</div>
              </div>

              {partnerMood && (
                <div style={{ 
                  padding: '12px 24px', 
                  background: 'rgba(255,255,255,0.05)', 
                  backdropFilter: 'blur(20px)',
                  borderRadius: '16px', 
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <div style={{ fontSize: '12px', color: '#adaaaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Current Mood</div>
                  <div style={{ fontSize: '24px' }}>{partnerMood.mood}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Partner Health */}
        <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: 'var(--primary)' }}>Health Ring</h3>
          <HealthRing
            water={partnerHealth?.water_ml || 0}
            sleep={partnerHealth?.sleep_hours || 0}
            steps={partnerHealth?.steps || 0}
            size={160}
          />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px', fontSize: '14px', fontWeight: 600 }}>
            <span style={{ color: 'var(--accent-secondary)' }}>💧 {((partnerHealth?.water_ml || 0) / 1000).toFixed(1)}L</span>
            <span style={{ color: 'var(--accent-primary)' }}>😴 {partnerHealth?.sleep_hours || 0}h</span>
            <span style={{ color: 'var(--accent-green)' }}>👟 {partnerHealth?.steps || 0}</span>
          </div>
        </div>

        {/* Partner Tasks (Redesigned) */}
        <div style={{ 
            padding: '32px',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: 'var(--primary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Shared Tasks</span>
            <span style={{ color: 'var(--text-muted)' }}>({partnerTasks.filter(t => t.is_completed).length}/{partnerTasks.length})</span>
          </h3>
          {partnerTasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
              No shared tasks from {partner.name} today
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {partnerTasks.map(task => (
                <div key={task.id} style={{ 
                  padding: '16px 20px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '16px',
                  border: task.is_completed ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s',
                  opacity: task.is_completed ? 0.7 : 1
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '8px',
                      background: task.is_completed ? 'var(--accent-green)' : 'transparent',
                      border: task.is_completed ? 'none' : '2px dashed var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', color: 'white',
                    }}>
                      {task.is_completed && '✓'}
                    </div>
                    <span style={{
                      flex: 1, fontSize: '15px', fontWeight: 600,
                      textDecoration: task.is_completed ? 'line-through' : 'none',
                    }}>
                      {getCategoryIcon(task.category)} {task.title}
                    </span>
                    <span className={`badge badge-${task.category}`}>{task.category}</span>
                  </div>
                  {/* Reactions */}
                  <div style={{ display: 'flex', gap: '8px', justifyItems: 'center', marginTop: '12px', paddingLeft: '36px' }}>
                    {['❤️', '🔥', '😡', '👏'].map(reaction => (
                      <button
                        key={reaction}
                        className="reaction-btn"
                        onClick={() => reactToTask(task.id, reaction)}
                        style={{ fontSize: '16px', background: 'var(--bg-off)', padding: '6px 10px', borderRadius: '12px' }}
                      >
                        {reaction}
                      </button>
                    ))}
                    {!task.is_completed && (
                      <button
                        onClick={() => sendNudge(task.id)}
                        className="btn btn-sm btn-ghost"
                        style={{ marginLeft: 'auto', fontWeight: 600, color: '#ff8ed2' }}
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
