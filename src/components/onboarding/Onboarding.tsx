'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const steps = [
  {
    title: 'Welcome to SyncLife ✨',
    subtitle: 'Your shared journey starts here',
    description: 'SyncLife is a beautiful productivity platform designed for you and your partner. Together, you\'ll track tasks, share moods, and grow side by side.',
    emoji: '🚀',
    color: 'linear-gradient(135deg, #6834eb, #58e6ff)',
  },
  {
    title: 'Daily Tasks 📋',
    subtitle: 'Stay on top of your goals',
    description: 'Create tasks with categories (Work, Health, Personal). Share them with your partner, set reminders, and track recurring habits. Earn points for every task done!',
    emoji: '✅',
    color: 'linear-gradient(135deg, #10b981, #06b6d4)',
  },
  {
    title: 'Your Partner 💕',
    subtitle: 'Connect with someone special',
    description: 'Pair with your partner using invite codes. See their tasks, send nudges, react with emojis (❤️🔥👏), and hold each other accountable — with love!',
    emoji: '👫',
    color: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
  },
  {
    title: 'Mood & Health 🌈',
    subtitle: 'Track your well-being',
    description: 'Log your daily mood, track water intake, sleep hours, and steps with beautiful health rings. Your partner can see how you\'re feeling and send hugs!',
    emoji: '💚',
    color: 'linear-gradient(135deg, #10b981, #f59e0b)',
  },
  {
    title: 'AI Suggestions 🧠',
    subtitle: 'Powered by smart insights',
    description: 'Get personalized AI-powered suggestions based on your health data, mood, and task progress. SyncLife learns what works for you!',
    emoji: '✨',
    color: 'linear-gradient(135deg, #6834eb, #ec4899)',
  },
  {
    title: 'Streaks & Rewards 🔥',
    subtitle: 'Stay motivated together',
    description: 'Build daily streaks (yours + couple streaks!), earn points, and create custom rewards to redeem. It\'s not just productivity — it\'s a game you play together.',
    emoji: '🏆',
    color: 'linear-gradient(135deg, #f97316, #ef4444)',
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const supabase = createClient();
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleComplete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ show_onboarding: false }).eq('id', user.id);
    }
    onComplete();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'linear-gradient(145deg, #fef3f0 0%, #f0eeff 50%, #eefaff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        width: '100%', maxWidth: '500px', textAlign: 'center',
        animation: 'slideUp 0.5s ease',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '40px' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: i === step ? 'var(--gradient-primary)' : 'var(--surface-high)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Emoji */}
        <div style={{
          width: '100px', height: '100px', borderRadius: '50%',
          background: current.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 32px', fontSize: '44px',
          boxShadow: '0 12px 32px rgba(104, 52, 235, 0.15)',
          animation: 'fadeIn 0.4s ease',
        }}>
          {current.emoji}
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'Outfit', fontSize: '28px', fontWeight: 800,
          marginBottom: '8px', letterSpacing: '-0.03em',
          animation: 'fadeIn 0.4s ease 0.1s both',
        }}>
          {current.title}
        </h1>

        <p style={{
          fontSize: '15px', color: 'var(--text-muted)',
          fontWeight: 600, marginBottom: '16px',
          animation: 'fadeIn 0.4s ease 0.15s both',
        }}>
          {current.subtitle}
        </p>

        <p style={{
          fontSize: '15px', color: 'var(--text-secondary)',
          lineHeight: '1.7', maxWidth: '380px', margin: '0 auto 40px',
          animation: 'fadeIn 0.4s ease 0.2s both',
        }}>
          {current.description}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="btn btn-secondary">
              Back
            </button>
          )}
          {isLast ? (
            <button onClick={handleComplete} className="btn btn-primary" style={{ minWidth: '180px' }}>
              Let&apos;s Go! 🚀
            </button>
          ) : (
            <button onClick={() => setStep(step + 1)} className="btn btn-primary" style={{ minWidth: '160px' }}>
              Next →
            </button>
          )}
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={handleComplete}
            className="btn btn-ghost"
            style={{ marginTop: '16px', fontSize: '13px' }}
          >
            Skip tour
          </button>
        )}
      </div>
    </div>
  );
}
