'use client';

interface BlossomTreeProps {
  progress: number; // 0 to 1
}

export default function BlossomTree({ progress }: BlossomTreeProps) {
  // Blossom positions along branches (x, y, size)
  const blossoms = [
    // Right branch blossoms
    { x: 185, y: 65, s: 8 },
    { x: 200, y: 45, s: 6 },
    { x: 175, y: 85, s: 7 },
    { x: 210, y: 70, s: 5 },
    { x: 195, y: 30, s: 7 },
    // Left branch blossoms
    { x: 85, y: 60, s: 7 },
    { x: 70, y: 40, s: 6 },
    { x: 95, y: 80, s: 8 },
    { x: 60, y: 65, s: 5 },
    { x: 80, y: 35, s: 6 },
    // Top blossoms
    { x: 140, y: 25, s: 7 },
    { x: 155, y: 15, s: 5 },
    { x: 125, y: 20, s: 6 },
    { x: 150, y: 50, s: 7 },
    { x: 120, y: 55, s: 5 },
    // Small scattered blossoms
    { x: 165, y: 95, s: 4 },
    { x: 105, y: 90, s: 4 },
    { x: 145, y: 40, s: 5 },
  ];

  const visibleCount = Math.round(blossoms.length * progress);

  return (
    <div style={{
      position: 'absolute',
      right: '10px',
      bottom: '80px',
      width: '280px',
      height: '320px',
      opacity: 0.15,
      pointerEvents: 'none',
      zIndex: 0,
    }}>
      <svg viewBox="0 0 280 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        {/* Trunk */}
        <path
          d="M140 310 Q138 260 135 220 Q132 190 130 170 Q128 155 130 140"
          stroke="rgba(255,182,193,0.6)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Trunk slight curve */}
        <path
          d="M140 310 Q142 270 140 230 Q138 200 140 180"
          stroke="rgba(255,182,193,0.4)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Main right branch */}
        <path
          d="M135 180 Q155 150 180 120 Q195 100 210 80 Q220 65 215 45"
          stroke="rgba(255,182,193,0.5)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Right sub-branch */}
        <path
          d="M180 120 Q190 105 200 95 Q205 85 195 70"
          stroke="rgba(255,182,193,0.4)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Small right twig */}
        <path
          d="M195 100 Q200 90 210 85"
          stroke="rgba(255,182,193,0.3)"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />

        {/* Main left branch */}
        <path
          d="M130 170 Q115 140 95 110 Q80 85 70 60 Q65 45 75 30"
          stroke="rgba(255,182,193,0.5)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Left sub-branch */}
        <path
          d="M95 110 Q85 95 80 80 Q75 65 85 50"
          stroke="rgba(255,182,193,0.4)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Small left twig */}
        <path
          d="M85 95 Q75 85 65 80"
          stroke="rgba(255,182,193,0.3)"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />

        {/* Top center branch */}
        <path
          d="M132 155 Q135 130 140 100 Q145 70 150 40 Q152 25 145 15"
          stroke="rgba(255,182,193,0.5)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Top sub-branch right */}
        <path
          d="M143 80 Q155 60 160 45"
          stroke="rgba(255,182,193,0.35)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Top sub-branch left */}
        <path
          d="M138 90 Q125 70 120 50"
          stroke="rgba(255,182,193,0.35)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Blossoms — revealed based on progress */}
        {blossoms.slice(0, visibleCount).map((b, i) => (
          <g key={i} style={{
            animation: `blossomFadeIn 0.6s ease-out ${i * 0.08}s both`,
          }}>
            {/* Outer petal ring */}
            <circle cx={b.x} cy={b.y} r={b.s} fill="rgba(255,182,193,0.5)" />
            {/* Inner center */}
            <circle cx={b.x} cy={b.y} r={b.s * 0.4} fill="rgba(255,220,230,0.7)" />
            {/* Top petal hint */}
            <circle cx={b.x} cy={b.y - b.s * 0.5} r={b.s * 0.35} fill="rgba(255,192,203,0.4)" />
            {/* Right petal hint */}
            <circle cx={b.x + b.s * 0.45} cy={b.y + b.s * 0.2} r={b.s * 0.3} fill="rgba(255,192,203,0.35)" />
            {/* Left petal hint */}
            <circle cx={b.x - b.s * 0.45} cy={b.y + b.s * 0.2} r={b.s * 0.3} fill="rgba(255,192,203,0.35)" />
          </g>
        ))}
      </svg>

      <style>{`
        @keyframes blossomFadeIn {
          from { opacity: 0; transform: scale(0.3); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
