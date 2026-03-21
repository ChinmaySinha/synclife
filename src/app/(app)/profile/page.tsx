'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      loadData();
      
      // SELF HEALING LOGIC: Generate invite code for legacy users
      if (!profile.invite_code) {
        generateInviteCode();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const generateInviteCode = async () => {
    if (!profile) return;
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    await supabase.from('profiles').update({ invite_code: newCode }).eq('id', profile.id);
    await refreshProfile();
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !profile) return;
    const file = e.target.files[0];
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      await refreshProfile();
    } catch (err: any) {
      alert(`Error uploading avatar: ${err.message}. Did you create the public 'avatars' storage bucket?`);
    }
    
    setUploading(false);
  };

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

  // Rest of state management...
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

  // Convert join date
  const joinDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Pioneer Member';

  return (
    <div className="animate-fade-in pb-10">
      <div className="dashboard-grid">
        {/*
          THE ETHEREAL PROFESSIONAL: ABOUT ME HERO
          StitchMCP Aesthetic integration: Deep Smoky Charcoal Background, large 150px avatar, frosted data readouts.
        */}
        <div className="card-full" style={{ 
          padding: '48px 40px', 
          display: 'flex', 
          gap: '40px',
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
          <div style={{ position: 'absolute', top: '-50%', left: '-20%', width: '100%', height: '200%', background: 'radial-gradient(circle, rgba(165,165,255,0.08) 0%, transparent 60%)', pointerEvents: 'none' }}></div>
          <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '80%', height: '80%', background: 'radial-gradient(circle, rgba(255,142,210,0.06) 0%, transparent 60%)', pointerEvents: 'none' }}></div>

          {/* Interactive Avatar Area */}
          <div 
            style={{ position: 'relative', cursor: 'pointer' }}
            title="Upload new photo"
            onClick={() => fileInputRef.current?.click()}
            className="group"
          >
            <div style={{
              width: '150px', 
              height: '150px', 
              borderRadius: '50%', 
              background: profile?.avatar_url ? `url(${profile.avatar_url}) center/cover no-repeat` : 'var(--gradient-primary)',
              boxShadow: '0 0 0 2px rgba(165,165,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: profile?.avatar_url ? '0' : '56px', fontWeight: 800, color: 'white',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {!profile?.avatar_url && profile?.name.charAt(0).toUpperCase()}
              
              {/* Camera Hover Overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.2s',
              }} className="opacity-0 hover:opacity-100">
                {uploading ? (
                  <span className="spinner" style={{ borderColor: 'white', borderTopColor: 'transparent' }}></span>
                ) : (
                  <span style={{ fontSize: '32px' }}>📷</span>
                )}
              </div>
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={uploadAvatar} 
            />
          </div>
          
          {/* Main Info Area */}
          <div style={{ flex: 1, zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  style={{ 
                    fontSize: '48px', 
                    fontWeight: 900, 
                    fontFamily: 'Outfit, sans-serif',
                    letterSpacing: '-1px',
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    maxWidth: '100%',
                    width: `${Math.max(name.length, 5)}ch`,
                    outline: 'none',
                    borderBottom: '2px dashed rgba(255,255,255,0.2)',
                  }} 
                />
                <button onClick={saveName} className="btn btn-sm btn-ghost" style={{ color: '#a5a5ff' }} disabled={saving}>
                  {saving ? '⚙️' : '💾 Save'}
                </button>
              </div>
              <p style={{ color: '#adaaaa', fontSize: '16px', fontWeight: 500, letterSpacing: '0.5px' }}>
                SyncLife Member • Joined {joinDate}
              </p>
            </div>

            {/* Frosted Glass Readouts */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ 
                padding: '12px 24px', 
                background: 'rgba(255,255,255,0.05)', 
                backdropFilter: 'blur(20px)',
                borderRadius: '16px', 
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{ fontSize: '12px', color: '#adaaaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Lifetime Points</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#a5a5ff' }}>{profile?.points || 0} ✨</div>
              </div>

              <div style={{ 
                padding: '12px 24px', 
                background: 'rgba(255,255,255,0.05)', 
                backdropFilter: 'blur(20px)',
                borderRadius: '16px', 
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{ fontSize: '12px', color: '#adaaaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Partner Status</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: partner ? '#ff8ed2' : '#ffffff' }}>
                  {partner ? partner.name : 'Not connected'}
                </div>
              </div>

              <div style={{ 
                padding: '12px 24px', 
                background: 'rgba(165,165,255,0.1)', 
                backdropFilter: 'blur(20px)',
                borderRadius: '16px', 
                border: '1px solid rgba(165,165,255,0.3)',
                boxShadow: '0 0 20px rgba(165,165,255,0.1)'
              }}>
                <div style={{ fontSize: '12px', color: '#a5a5ff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Invite Code</div>
                <div style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '4px', color: '#ffffff' }}>
                  {profile?.invite_code || <span className="spinner"></span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Existing Widgets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', gridColumn: '1 / -1' }}>
          
          {/* Health Tracking */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: 'var(--primary)' }}>💧 Daily Health</h3>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <HealthRing water={health?.water_ml || 0} sleep={health?.sleep_hours || 0} steps={health?.steps || 0} size={150} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
              {[250, 500].map(ml => (
                <button key={ml} onClick={() => addWater(ml)} className="btn btn-sm" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
                  💧 +{ml}ml
                </button>
              ))}
            </div>
            <button onClick={() => setShowHealthLog(true)} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>📝 Log Details</button>
          </div>

          {/* Notifications */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: 'var(--primary)' }}>🔔 Notifications</h3>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-glass)', borderRadius: '16px', padding: '40px' }}>
                <span style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}>✨</span>
                You're all caught up!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div key={n.id} onClick={() => markNotificationRead(n.id)} style={{
                    padding: '16px', background: 'var(--bg-glass)', borderRadius: '16px',
                    cursor: 'pointer', border: '1px solid var(--border-subtle)',
                    transition: 'all 0.2s ease',
                  }} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <strong style={{ fontSize: '15px' }}>{n.title}</strong>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px', lineHeight: 1.4 }}>{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rewards */}
        <div className="glass-card card-full" style={{ padding: '32px', marginTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)' }}>🏆 Rewards Market</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>You have {profile?.points || 0} points to spend</p>
            </div>
            <button onClick={() => setShowRewardForm(true)} className="btn btn-primary">+ Create Reward</button>
          </div>
          
          {rewards.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '40px', background: 'var(--bg-glass)', borderRadius: '16px' }}>
              Create custom rewards to motivate yourself!
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {rewards.map(r => (
                <div key={r.id} className="glass-card" style={{ 
                  padding: '24px', textAlign: 'center', 
                  opacity: r.is_redeemed ? 0.5 : 1,
                  background: 'var(--bg-glass)'
                }}>
                  <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>{r.emoji}</span>
                  <p style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{r.title}</p>
                  <p style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 600, marginBottom: '16px' }}>{r.points_cost} pts</p>
                  {!r.is_redeemed && (
                    <button onClick={() => redeemReward(r)} className="btn btn-sm btn-secondary" style={{ width: '100%' }}
                      disabled={(profile?.points || 0) < r.points_cost}>
                      Redeem
                    </button>
                  )}
                  {r.is_redeemed && <p style={{ fontSize: '13px', color: 'var(--accent-green)', fontWeight: 600 }}>✓ Redeemed</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals remain structurally mostly same, standardizing borders */}
      {showHealthLog && (
        <div className="modal-overlay" onClick={() => setShowHealthLog(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: 'var(--primary)' }}>📝 Log Health</h3>
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
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={saveHealth} className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>Save</button>
              <button onClick={() => setShowHealthLog(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showRewardForm && (
        <div className="modal-overlay" onClick={() => setShowRewardForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: 'var(--primary)' }}>🏆 Create Reward</h3>
            <div className="form-group">
              <label>Title</label>
              <input className="input" placeholder="Coffee treat ☕" value={rewardTitle} onChange={e => setRewardTitle(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={createReward} className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>Create</button>
              <button onClick={() => setShowRewardForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Dynamic CSS for hover states */}
      <style key="profile-css" dangerouslySetInnerHTML={{__html: `
        .hover\\:opacity-100:hover { opacity: 1 !important; }
        .group:hover .hover\\:opacity-100 { opacity: 1 !important; }
      `}} />
    </div>
  );
}
