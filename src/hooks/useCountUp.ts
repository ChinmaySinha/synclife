'use client';

import { useState, useEffect, useRef } from 'react';

// Easing function: easeOutExpo (decelerates smoothly)
const easeOutExpo = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

export function useCountUp(end: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let animationFrame: number;
    let startVal = count; // Start from current value to allow smooth updates if 'end' changes

    const tick = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = timestamp - startTimeRef.current;
      
      // Calculate normalized time [0.0, 1.0]
      const timeFraction = Math.min(progress / duration, 1);
      
      // Calculate current value based on easing
      const easedProgress = easeOutExpo(timeFraction);
      const currentVal = Math.floor(startVal + (end - startVal) * easedProgress);
      
      setCount(currentVal);

      if (timeFraction < 1) {
        animationFrame = requestAnimationFrame(tick);
      } else {
        setCount(end); // Ensure we land exactly on the end value
      }
    };

    // Reset start time for new animation
    startTimeRef.current = null;
    animationFrame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}
