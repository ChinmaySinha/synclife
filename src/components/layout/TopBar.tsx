'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

const TRIVIA_FACTS = [
  "Couples who try new things together are happier.",
  "Holding hands reduces physical and psychological stress.",
  "Looking at a photo of your partner can reduce pain by 44%.",
  "It takes about 4 minutes to decide if you like someone.",
  "Couples' heart rates synchronize when they stare into each other's eyes for 3 minutes.",
  "Laughing together is a strong sign of relationship health.",
  "You are 50% more likely to achieve a goal if you share it with someone.",
  "Couples who show gratitude to one another are more resistant to breakups."
];

const FUN_FACTS = [
  "Octopuses have three hearts.",
  "Honey never spoils. You can eat 3000-year-old honey.",
  "Bananas are berries, but strawberries aren't.",
  "Wombat poop is cube-shaped.",
  "The Eiffel Tower can be 15 cm taller during the summer.",
  "A day on Venus is longer than a year on Venus.",
  "A jiffy is an actual unit of time: 1/100th of a second.",
  "Sloths can hold their breath longer than dolphins."
];

export default function TopBar() {
  const { profile } = useAuth();
  const [greeting, setGreeting] = useState("What are we crushing today?");
  const [showTrivia, setShowTrivia] = useState(true);
  const [currentFact, setCurrentFact] = useState('');
  const [fade, setFade] = useState(true);

  // Determine dynamic greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    const name = profile?.name ? profile.name.split(' ')[0] : 'friend';
    
    if (hour < 12) setGreeting(`Good morning, ${name}! Back at it?`);
    else if (hour < 17) setGreeting(`Hi ${name}! What are you crushing today?`);
    else if (hour < 21) setGreeting(`Evening, ${name}! Winding down?`);
    else setGreeting(`Late night, ${name}? Don't forget to sleep!`);

    // Pick initial fact
    setCurrentFact(TRIVIA_FACTS[Math.floor(Math.random() * TRIVIA_FACTS.length)]);
  }, [profile]);

  // Handle slider toggle
  const toggleSlider = () => {
    setFade(false);
    setTimeout(() => {
      setShowTrivia(!showTrivia);
      if (showTrivia) {
        // Switching to Fun Fact
        setCurrentFact(FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]);
      } else {
        // Switching to Trivia
        setCurrentFact(TRIVIA_FACTS[Math.floor(Math.random() * TRIVIA_FACTS.length)]);
      }
      setFade(true);
    }, 300); // Wait for fade out
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '24px 40px',
      background: 'rgba(6, 6, 11, 0.7)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      gap: '20px'
    }}>
      
      {/* Left side spacer - to keep middle center-aligned if needed, or put logo/breadcrumb here */}
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)', fontFamily: 'Space Grotesk' }}>SyncLife</h2>
      </div>

      {/* Middle Greeting */}
      <div style={{ flex: 2, textAlign: 'center' }}>
        <h2 style={{
          fontSize: '22px', 
          fontWeight: 700, 
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 10px rgba(104, 52, 235, 0.1)',
          animation: 'float 4s ease-in-out infinite'
        }}>
          {greeting}
        </h2>
      </div>

      {/* Right side Slider Widget */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <div 
          onClick={toggleSlider}
          style={{
            background: 'var(--surface-card)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            maxWidth: '280px',
            minHeight: '70px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            border: '1px solid var(--outline-variant)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          className="hover-lift"
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              color: showTrivia ? '#ec4899' : '#0ea5e9',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transition: 'color 0.3s ease'
            }}>
              {showTrivia ? "💡 Today's Trivia" : "🌍 Random Fact"}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Tap to flip ↺</span>
          </div>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: 1.4,
            opacity: fade ? 1 : 0,
            transform: fade ? 'translateY(0)' : 'translateY(4px)',
            transition: 'all 0.3s ease'
          }}>
            {currentFact}
          </p>
        </div>
      </div>

      <style jsx>{`
        .hover-lift:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: var(--shadow-lg);
          border-color: rgba(104, 52, 235, 0.2);
        }
        @media (max-width: 900px) {
          div[style*="justifyContent: 'space-between'"] {
            flex-direction: column;
            gap: 16px;
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
