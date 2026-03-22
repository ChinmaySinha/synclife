'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { getGreeting } from '@/lib/utils';
import { getDailyTrivia, type TriviaQuestion } from '@/lib/trivia';
import TopBar from '@/components/layout/TopBar';

import TodayTasksWidget from '@/components/today/TodayTasksWidget';
import TodayMoodWidget from '@/components/today/TodayMoodWidget';
import TodayHealthWidget from '@/components/today/TodayHealthWidget';
import TodayStreaksWidget from '@/components/today/TodayStreaksWidget';
import TodayPartnerTasksWidget from '@/components/today/TodayPartnerTasksWidget';

export default function TodayPage() {
  const { profile } = useAuth();

  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const [trivia] = useState<TriviaQuestion>(getDailyTrivia());
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [triviaRevealed, setTriviaRevealed] = useState(false);

  const greeting = profile ? getGreeting(profile.name) : { text: 'Hello', emoji: '👋', subtext: '' };

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

  const handleTriviaAnswer = (index: number) => {
    if (triviaRevealed) return;
    setSelectedAnswer(index);
    setTriviaRevealed(true);
  };

  return (
    <div className="animate-fade-in">
      <TopBar />

      {/* ===== BENTO GRID ===== */}
      <div className="bento-grid stagger-children">

        <TodayTasksWidget />
        <TodayMoodWidget />
        <TodayHealthWidget />
        <TodayStreaksWidget />

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

        <TodayPartnerTasksWidget />

      </div>
    </div>
  );
}
