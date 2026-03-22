'use client';

import React, { useRef, MouseEvent } from 'react';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Pass any additional styles or overrides */
  className?: string;
  /** Color of the spotlight glow, defaults to rgba(255,142,210, 0.15) */
  spotlightColor?: string;
}

export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(255,142,210,0.15)',
  style,
  ...props
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    
    // Throttle via rAF to avoid React synthetic event thrashing
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const rect = divRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Map raw coordinates directly to CSS custom properties
      divRef.current!.style.setProperty('--mouse-x', `${x}px`);
      divRef.current!.style.setProperty('--mouse-y', `${y}px`);
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (divRef.current) {
      // Move spotlight far outside the frame so it fades out smoothly
      divRef.current.style.setProperty('--mouse-x', `-1000px`);
      divRef.current.style.setProperty('--mouse-y', `-1000px`);
    }
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
      style={{
        ...style,
        // Base required to avoid the spotlight jumping on first hover before mouse moves entirely
        '--mouse-x': '-1000px',
        '--mouse-y': '-1000px',
      } as React.CSSProperties}
      {...props}
    >
      <div 
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), ${spotlightColor}, transparent 40%)`
        }}
      />
      {/* Content sits above the spotlight */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
}
