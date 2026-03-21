'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { HealthLog, Reward, Notification } from '@/lib/types';
import HealthRing from '@/components/health/HealthRing';

export default function ProfilePage() {
  const { profile, partner, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [health, setHealth] = useState<HealthLog | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showHealthLog, setShowHealthLog] = useState(false);
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [water, setWater] = useState(0);
  const [sleep, setSleep] = useState(0);
  const [steps, setSteps] = useState(0);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardEmoji, setRewardEmoji] = useState('🎁');
  const [rewardCost, setRewardCost] = useState(100);
  const [saving, setSaving] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;
    const [h, r, n] = await Promise.all([
      supabase.from('health_logs').select('*').eq('user_id', profile.id).eq('date', today).single(),
      supabase.from('rewards').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('user_id', profile.id).eq('is_read', false).order('created_at', { ascending: false }).limit(10),
    ]);
    if (h.data) { setHealth(h.data); setWater(h.data.water_ml); setSleep(h.data.sleep_hours); setSteps(h.data.steps); }
    if (r.data) setRewards(r.data);
    if (n.data) setNotifications(n.data);
  };

  const saveName = async () => {
    if (!profile || !name.trim()) return;
    setSaving(true);
    await supabase.from('profiles').update({ name: name.trim() }).eq('id', profile.id);
    await refreshProfile();
    setSaving(false);
  };

  const saveHealth = async () => {
    if (!profile) return;
    await supabase.from('health_logs').upsert({
      user_id: profile.id, date: today, water_ml: water, sleep_hours: sleep, steps,
    }, { onConflict: 'user_id,date' });
    setShowHealthLog(false);
    loadData();
  };

  const addWater = async (ml: number) => {
    const newWater = (health?.water_ml || 0) + ml;
    setWater(newWater);
    await supabase.from('health_logs').upsert({
      user_id: profile!.id, date: today, water_ml: newWater, sleep_hours: health?.sleep_hours || 0, steps: health?.steps || 0,
    }, { onConflict: 'user_id,date' });
    loadData();
  };

  const createReward = async () => {
    if (!profile || !rewardTitle.trim()) return;
    await supabase.from('rewards').insert({
      user_id: profile.id, title: rewardTitle.trim(), emoji: rewardEmoji, points_cost: rewardCost,
    });
    setShowRewardForm(false);
    setRewardTitle(''); setRewardEmoji('🎁'); setRewardCost(100);
    loadData();
  };

  const redeemReward = async (reward: Reward) => {
    if (!profile || profile.points < reward.points_cost) return;
    await supabase.from('rewards').update({ is_redeemed: true, redeemed_at: new Date().toISOString() }).eq('id', reward.id);
    await supabase.from('profiles').update({ points: profile.points - reward.points_cost }).eq('id', profile.id);
    await refreshProfile();
    loadData();
  };

  const markNotificationRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    loadData();
  };

  const fetchAiSuggestions = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          health: { water: health?.water_ml || 0, sleep: health?.sleep_hours || 0, steps: health?.steps || 0 },
          taskCount: 0,
          mood: null,
        }),
      });
      const data = await res.json();
      if (data.suggestions) setAiSuggestions(data.suggestions);
    } catch { setAiSuggestions(['Stay hydrated! 💧', 'Take a 5-min break 🧘', 'Great job today! 🎉']); }
    setLoadingAi(false);
  };

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>👤 Profile</h1>

      <div className="dashboard-grid">
        {/* Enhanced 'About Me' Profile Header */}
        <div className="glass-card card-full" style={{ 
          padding: '32px', 
          display: 'flex', 
          gap: '32px',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(240,240,255,0.4) 100%)',
          border: '1px solid rgba(104, 52, 235, 0.15)'
        }}>
          {/* Avatar Area */}
          <div style={{
            minWidth: '120px', height: '120px', borderRadius: '50%', 
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '48px', fontWeight: 800, color: 'white',
            boxShadow: '0 8px 32px rgba(104,52,235,0.3)',
            border: '4px solid white'
          }}>
            {profile?.name.charAt(0).toUpperCase()}
          </div>
          
          {/* Info Area */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <input 
                className="input" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                style={{ 
                  fontSize: '28px', 
                  fontWeight: 800, 
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px dashed var(--border-subtle)',
                  padding: '0 0 4px 0',
                  color: 'var(--primary)',
                  maxWidth: '300px'
                }} 
              />
              <button onClick={saveName} className="btn btn-sm btn-ghost" disabled={saving}>
                {saving ? '⚙️' : '💾 Save'}
              </button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontWeight: 500 }}>
              SyncLife Member • {profile?.points || 0} Total Lifetime Points ✨
            </p>

            {/* Metric Pills */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ padding: '6px 16px', background: 'var(--bg-glass)', borderRadius: '20px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--border-subtle)' }}>
                💕 Partner: {partner ? partner.name : <span style={{ color: 'var(--text-muted)' }}>Not connected</span>}
              </div>
              <div style={{ padding: '6px 16px', background: 'rgba(236,72,153,0.1)', color: '#ec4899', borderRadius: '20px', fontSize: '13px', fontWeight: 700, border: '1px solid rgba(236,72,153,0.2)' }}>
                🎟️ Invite Code: {profile?.invite_code || '---'}
              </div>
            </div>
          </div>
        </div>

        {/* Health Tracking */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>💧 Health Tracking</h3>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <HealthRing water={health?.water_ml || 0} sleep={health?.sleep_hours || 0} steps={health?.steps || 0} size={110} />
          </div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '12px' }}>
            {[250, 500].map(ml => (
              <button key={ml} onClick={() => addWater(ml)} className="btn btn-sm btn-secondary">💧+{ml}ml</button>
            ))}
          </div>
          <button onClick={() => setShowHealthLog(true)} className="btn btn-sm btn-secondary" style={{ width: '100%' }}>📝 Log Details</button>
        </div>

        {/* Notifications */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>🔔 Notifications ({notifications.length})</h3>
          {notifications.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>All caught up! ✨</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {notifications.map(n => (
                <div key={n.id} onClick={() => markNotificationRead(n.id)} style={{
                  padding: '10px 12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', border: '1px solid var(--border-subtle)', fontSize: '13px',
                }}>
                  <strong>{n.title}</strong>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Suggestions */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>🧠 AI Suggestions</h3>
          {aiSuggestions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {aiSuggestions.map((s, i) => <div key={i} className="report-insight">{s}</div>)}
            </div>
          ) : (
            <button onClick={fetchAiSuggestions} className="btn btn-primary btn-sm" style={{ width: '100%' }} disabled={loadingAi}>
              {loadingAi ? 'Thinking...' : '✨ Get AI Suggestions'}
            </button>
          )}
        </div>

        {/* Rewards */}
        <div className="glass-card card-full" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>🏆 Rewards ({profile?.points || 0} pts)</h3>
            <button onClick={() => setShowRewardForm(true)} className="btn btn-sm btn-primary">+ New</button>
          </div>
          {rewards.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Create custom rewards to motivate yourself!</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {rewards.map(r => (
                <div key={r.id} className="glass-card" style={{ padding: '16px', textAlign: 'center', opacity: r.is_redeemed ? 0.5 : 1 }}>
                  <span style={{ fontSize: '28px' }}>{r.emoji}</span>
                  <p style={{ fontSize: '14px', fontWeight: 500, marginTop: '8px' }}>{r.title}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.points_cost} pts</p>
                  {!r.is_redeemed && (
                    <button onClick={() => redeemReward(r)} className="btn btn-sm btn-secondary" style={{ marginTop: '8px' }}
                      disabled={(profile?.points || 0) < r.points_cost}>
                      Redeem
                    </button>
                  )}
                  {r.is_redeemed && <p style={{ fontSize: '11px', color: 'var(--accent-green)', marginTop: '8px' }}>✓ Redeemed</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Health Log Modal */}
      {showHealthLog && (
        <div className="modal-overlay" onClick={() => setShowHealthLog(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>📝 Log Health</h3>
            <div className="form-group">
              <label>💧 Water (ml)</label>
              <input className="input" type="number" value={water} onChange={e => setWater(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>😴 Sleep (hours)</label>
              <input className="input" type="number" step="0.5" value={sleep} onChange={e => setSleep(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>👟 Steps</label>
              <input className="input" type="number" value={steps} onChange={e => setSteps(Number(e.target.value))} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={saveHealth} className="btn btn-primary" style={{ flex: 1 }}>Save</button>
              <button onClick={() => setShowHealthLog(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reward Form Modal */}
      {showRewardForm && (
        <div className="modal-overlay" onClick={() => setShowRewardForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>🏆 Create Reward</h3>
            <div className="form-group">
              <label>Title</label>
              <input className="input" placeholder="Coffee treat ☕" value={rewardTitle} onChange={e => setRewardTitle(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Emoji</label>
                <select className="input select" value={rewardEmoji} onChange={e => setRewardEmoji(e.target.value)}>
                  {['🎁', '☕', '🎬', '🍕', '🎮', '💆', '🏖️', '🛍️'].map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Points Cost</label>
                <input className="input" type="number" min="10" step="10" value={rewardCost} onChange={e => setRewardCost(Number(e.target.value))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={createReward} className="btn btn-primary" style={{ flex: 1 }}>Create</button>
              <button onClick={() => setShowRewardForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
