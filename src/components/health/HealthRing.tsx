'use client';

interface HealthRingProps {
  water: number;
  sleep: number;
  steps: number;
  size?: number;
  waterGoal?: number;
  sleepGoal?: number;
  stepsGoal?: number;
}

export default function HealthRing({
  water, sleep, steps,
  size = 120,
  waterGoal = 2500,
  sleepGoal = 8,
  stepsGoal = 10000,
}: HealthRingProps) {
  const strokeWidth = 8;
  const gap = 4;
  const center = size / 2;

  const rings = [
    { label: 'Steps', value: steps, goal: stepsGoal, color: '#10b981', radius: center - strokeWidth / 2 - 2 },
    { label: 'Sleep', value: sleep, goal: sleepGoal, color: '#8b5cf6', radius: center - strokeWidth / 2 - strokeWidth - gap - 2 },
    { label: 'Water', value: water / 1000, goal: waterGoal / 1000, color: '#06b6d4', radius: center - strokeWidth / 2 - (strokeWidth + gap) * 2 - 2 },
  ];

  const overall = Math.round(
    ((Math.min(steps / stepsGoal, 1) + Math.min(sleep / sleepGoal, 1) + Math.min(water / waterGoal, 1)) / 3) * 100
  );

  return (
    <div className="health-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {rings.map((ring, i) => {
          const circumference = 2 * Math.PI * ring.radius;
          const progress = Math.min(ring.value / ring.goal, 1);
          const offset = circumference - progress * circumference;
          return (
            <g key={i}>
              <circle cx={center} cy={center} r={ring.radius} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth={strokeWidth} strokeLinecap="round" />
              <circle cx={center} cy={center} r={ring.radius} fill="none" stroke={ring.color} strokeWidth={strokeWidth} strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset} className="ring-progress"
                style={{ filter: `drop-shadow(0 0 4px ${ring.color}30)` }} />
            </g>
          );
        })}
      </svg>
      <div className="ring-label">
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Health</div>
        <div style={{
          fontSize: '18px', fontWeight: 700, fontFamily: 'Outfit',
          background: 'var(--gradient-health)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {overall}%
        </div>
      </div>
    </div>
  );
}
