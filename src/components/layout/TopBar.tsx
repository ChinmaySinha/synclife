'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

const FACTS = [
  "Couples who try new things together are happier.",
  "Holding hands reduces psychological stress.",
  "Octopuses have three hearts.",
  "Honey never spoils — 3000-year-old honey is still edible.",
  "Bananas are berries, but strawberries aren't.",
  "A day on Venus is longer than a year on Venus.",
  "Laughing together is a strong sign of relationship health.",
  "You are 50% more likely to achieve a goal if you share it with someone.",
];

export default function TopBar() {
  const { profile } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [fact, setFact] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    const name = profile?.name ? profile.name.split(' ')[0] : 'friend';
    if (hour < 12) setGreeting(`Good morning, ${name}`);
    else if (hour < 17) setGreeting(`Hey ${name}`);
    else if (hour < 21) setGreeting(`Good evening, ${name}`);
    else setGreeting(`Night owl, ${name}?`);

    setFact(FACTS[Math.floor(Math.random() * FACTS.length)]);
  }, [profile]);

  return (
    <div className="top-area">
      <h2 className="greeting-text">{greeting} ✨</h2>
      <div className="trivia-chip" onClick={() => setFact(FACTS[Math.floor(Math.random() * FACTS.length)])}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-pink)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          💡 Did you know?
        </span>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '4px' }}>
          {fact}
        </p>
      </div>
    </div>
  );
}
