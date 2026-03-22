'use client';

import { Suspense, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import useSWR from 'swr';
import type { Mood } from '@/lib/types';
import MoodPicker from '@/components/mood/MoodPicker';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

function TodayMoodContent() {
  const { profile, partner } = useAuth();
  const supabase = createClient();
  const today = new Date().toISOString().split('T')[0];
  const [showMoodPicker, setShowMoodPicker] = useState(false);

  const fetcher = async () => {
    if (!profile) return { mood: null, partnerMood: null };
    const { data: myMood } = await supabase.from('moods').select('*').eq('user_id', profile.id).eq('date', today).single();
    let pMood = null;
    if (partner) {
      const { data } = await supabase.from('moods').select('*').eq('user_id', partner.id).eq('date', today).single();
      pMood = data;
    }
    return { mood: myMood as Mood | null, partnerMood: pMood as Mood | null };
  };

  const { data, mutate } = useSWR(`mood-${profile?.id}-${today}`, fetcher, { suspense: true });
  const { mood, partnerMood } = data || {};

  return (
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

      {showMoodPicker && (
        <MoodPicker 
          currentMood={mood?.mood || null}
          onSelect={async (selectedMood) => {
            if (!profile) return;
            await supabase.from('moods').upsert({
              user_id: profile.id, mood: selectedMood, date: today,
            }, { onConflict: 'user_id,date' });
            setShowMoodPicker(false);
            mutate();
          }}
          onClose={() => setShowMoodPicker(false)} 
        />
      )}
    </div>
  );
}

export default function TodayMoodWidget() {
  return (
    <Suspense fallback={<SkeletonLoader className="bento-card" style={{ borderRadius: '24px', height: '180px' }} />}>
      <TodayMoodContent />
    </Suspense>
  );
}
