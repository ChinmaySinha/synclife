'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Challenge, ChallengeProgress } from '@/lib/types';

export default function ChallengesPage() {
  const { profile, partner } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<Record<string, ChallengeProgress>>({});
  const [partnerProgress, setPartnerProgress] = useState<Record<string, ChallengeProgress>>({});
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [challengeType, setChallengeType] = useState<'compete' | 'collaborate'>('compete');
  const [targetValue, setTargetValue] = useState(7);
  const supabase = createClient();

  useEffect(() => {
    if (profile) loadChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const loadChallenges = async () => {
    if (!profile) return;

    const { data: challengeData } = await supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false });
    if (challengeData) setChallenges(challengeData);

    const { data: myProgress } = await supabase
      .from('challenge_progress')
      .select('*')
      .eq('user_id', profile.id);

    const progMap: Record<string, ChallengeProgress> = {};
    if (myProgress) myProgress.forEach(p => { progMap[p.challenge_id] = p; });
    setProgress(progMap);

    if (partner) {
      const { data: pProgress } = await supabase
        .from('challenge_progress')
        .select('*')
        .eq('user_id', partner.id);
      const pMap: Record<string, ChallengeProgress> = {};
      if (pProgress) pProgress.forEach(p => { pMap[p.challenge_id] = p; });
      setPartnerProgress(pMap);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    if (!profile) return;
    await supabase.from('challenge_progress').insert({
      challenge_id: challengeId,
      user_id: profile.id,
      current_value: 0,
      is_completed: false,
    });
    loadChallenges();
  };

  const incrementProgress = async (challengeId: string) => {
    if (!profile) return;
    const current = progress[challengeId];
    if (!current) return;

    const challenge = challenges.find(c => c.id === challengeId);
    const newValue = current.current_value + 1;
    const isComplete = challenge ? newValue >= challenge.target_value : false;

    await supabase.from('challenge_progress').update({
      current_value: newValue,
      is_completed: isComplete,
      completed_at: isComplete ? new Date().toISOString() : null,
    }).eq('id', current.id);

    if (isComplete && profile && partner) {
      await supabase.from('memory_jar').insert({
        user_id: profile.id,
        content: `${profile.name} completed the "${challenge?.title}" challenge! 🏆`,
        emoji: challenge?.emoji || '🎯',
        milestone_type: 'challenge',
      });
      await supabase.from('profiles').update({ points: (profile.points || 0) + 50 }).eq('id', profile.id);
    }

    loadChallenges();
  };

  const createChallenge = async () => {
    if (!profile || !title.trim()) return;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + targetValue);

    await supabase.from('challenges').insert({
      title: title.trim(),
      description: description.trim() || null,
      emoji,
      challenge_type: challengeType,
      target_value: targetValue,
      start_date: new Date().toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      created_by: profile.id,
    });

    setShowForm(false);
    setTitle(''); setDescription(''); setEmoji('🎯'); setTargetValue(7);
    loadChallenges();
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>🧩 Challenges</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Compete or collaborate with your partner!</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">+ New Challenge</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {challenges.map(challenge => {
          const myProg = progress[challenge.id];
          const partProg = partnerProgress[challenge.id];
          const myPct = myProg ? Math.min(100, Math.round((myProg.current_value / challenge.target_value) * 100)) : 0;
          const partPct = partProg ? Math.min(100, Math.round((partProg.current_value / challenge.target_value) * 100)) : 0;

          return (
            <div key={challenge.id} className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>{challenge.emoji}</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{challenge.title}</h3>
                  {challenge.description && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{challenge.description}</p>
                  )}
                </div>
                <span className={`badge ${challenge.challenge_type === 'compete' ? 'badge-work' : 'badge-health'}`}>
                  {challenge.challenge_type === 'compete' ? '⚔️ Compete' : '🤝 Collaborate'}
                </span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Target: {challenge.target_value} {challenge.end_date && `· Ends ${new Date(challenge.end_date).toLocaleDateString()}`}
              </p>

              {/* Progress bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {myProg ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>You {myProg.is_completed && '✅'}</span>
                      <span>{myProg.current_value}/{challenge.target_value}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-glass)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${myPct}%`, height: '100%',
                        background: myProg.is_completed ? 'var(--accent-green)' : 'var(--gradient-primary)',
                        borderRadius: '4px', transition: 'width 0.5s',
                      }} />
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>You haven&apos;t joined yet</p>
                )}
                {partner && partProg && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>{partner.name} {partProg.is_completed && '✅'}</span>
                      <span>{partProg.current_value}/{challenge.target_value}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-glass)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${partPct}%`, height: '100%',
                        background: partProg.is_completed ? 'var(--accent-green)' : 'var(--gradient-warm)',
                        borderRadius: '4px', transition: 'width 0.5s',
                      }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {!myProg ? (
                  <button onClick={() => joinChallenge(challenge.id)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    🎯 Join Challenge
                  </button>
                ) : !myProg.is_completed ? (
                  <button onClick={() => incrementProgress(challenge.id)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    +1 Progress
                  </button>
                ) : (
                  <div style={{ flex: 1, textAlign: 'center', color: 'var(--accent-green)', fontWeight: 700, fontSize: '14px', padding: '8px' }}>
                    🏆 Completed!
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {challenges.length === 0 && (
          <div className="glass-card card-full" style={{ padding: '60px', textAlign: 'center' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🧩</span>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No challenges yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Create one to start competing or collaborating!</p>
            <button onClick={() => setShowForm(true)} className="btn btn-primary">Create First Challenge</button>
          </div>
        )}
      </div>

      {/* Create challenge modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>🧩 New Challenge</h3>

            <div className="form-group">
              <label>Title *</label>
              <input className="input" placeholder="Drink 2L water daily" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea className="input textarea" placeholder="Details..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Emoji</label>
                <select className="input select" value={emoji} onChange={e => setEmoji(e.target.value)}>
                  {['🎯', '💧', '🏃', '📚', '🧘', '🥗', '💪', '🧠', '😴', '🚶'].map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Target Days</label>
                <input className="input" type="number" min={1} max={30} value={targetValue} onChange={e => setTargetValue(Number(e.target.value))} />
              </div>
            </div>

            <div className="form-group">
              <label>Type</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setChallengeType('compete')}
                  className={`btn btn-sm ${challengeType === 'compete' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                >
                  ⚔️ Compete
                </button>
                <button
                  type="button"
                  onClick={() => setChallengeType('collaborate')}
                  className={`btn btn-sm ${challengeType === 'collaborate' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                >
                  🤝 Collaborate
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={createChallenge} className="btn btn-primary" style={{ flex: 1 }}>Create Challenge</button>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
