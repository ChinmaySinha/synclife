'use client';

interface BlossomTreeProps {
  progress: number; // 0 to 1
}

export default function BlossomTree({ progress }: BlossomTreeProps) {
  // Blossom positions along branches — spread diagonally from bottom-right to top-left
  const blossoms = [
    // Main branch blossoms (mid-tree)
    { x: 200, y: 260, s: 6 },
    { x: 175, y: 230, s: 7 },
    { x: 155, y: 200, s: 8 },
    { x: 130, y: 175, s: 7 },
    // Upper-left branch blossoms
    { x: 100, y: 145, s: 7 },
    { x: 80, y: 120, s: 8 },
    { x: 55, y: 95, s: 6 },
    { x: 35, y: 70, s: 7 },
    { x: 20, y: 45, s: 5 },
    // Upper sub-branch blossoms (going more left)
    { x: 60, y: 75, s: 5 },
    { x: 40, y: 55, s: 6 },
    { x: 15, y: 30, s: 5 },
    // Right sub-branch blossoms (branching off to the right from mid)
    { x: 165, y: 165, s: 6 },
    { x: 180, y: 140, s: 5 },
    { x: 195, y: 120, s: 6 },
    // Small sub-branch going up from trunk
    { x: 145, y: 145, s: 5 },
    { x: 115, y: 110, s: 6 },
    { x: 90, y: 85, s: 5 },
  ];

  const visibleCount = Math.round(blossoms.length * progress);

  return (
    <div style={{
      position: 'absolute',
      right: '0',
      bottom: '0',
      width: '320px',
      height: '420px',
      opacity: 0.18,
      pointerEvents: 'none',
      zIndex: 0,
    }}>
      <svg viewBox="0 0 320 420" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        {/* Main trunk — starts from bottom-right, curves diagonally to upper-left */}
        <path
          d="M300 420 Q280 380 260 340 Q240 300 220 270 Q200 240 170 210 Q140 180 110 150 Q80 120 50 85 Q30 60 15 30"
          stroke="rgba(255,182,193,0.55)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        {/* Trunk shadow line for depth */}
        <path
          d="M305 420 Q285 385 268 348 Q250 310 228 278 Q208 248 178 218 Q150 190 120 158"
          stroke="rgba(255,182,193,0.25)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right sub-branch (branches off toward upper-right from mid-trunk) */}
        <path
          d="M170 210 Q185 190 195 165 Q205 145 200 120"
          stroke="rgba(255,182,193,0.45)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Small twig off right branch */}
        <path
          d="M195 165 Q205 155 210 140"
          stroke="rgba(255,182,193,0.3)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Left sub-branch (branches further left from upper trunk) */}
        <path
          d="M110 150 Q90 130 70 105 Q55 85 35 60"
          stroke="rgba(255,182,193,0.4)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Small left twig */}
        <path
          d="M70 105 Q55 100 40 95"
          stroke="rgba(255,182,193,0.3)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Upper branch going left */}
        <path
          d="M50 85 Q35 65 20 45 Q10 30 5 15"
          stroke="rgba(255,182,193,0.4)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Tiny twig from upper branch */}
        <path
          d="M20 45 Q10 42 5 50"
          stroke="rgba(255,182,193,0.25)"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />

        {/* Mid branch going slightly right */}
        <path
          d="M140 180 Q155 160 165 140 Q170 125 168 110"
          stroke="rgba(255,182,193,0.35)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Lower branch off main trunk */}
        <path
          d="M220 270 Q235 255 245 235 Q250 220 248 200"
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
            {/* Top petal */}
            <circle cx={b.x} cy={b.y - b.s * 0.5} r={b.s * 0.35} fill="rgba(255,192,203,0.4)" />
            {/* Right petal */}
            <circle cx={b.x + b.s * 0.45} cy={b.y + b.s * 0.2} r={b.s * 0.3} fill="rgba(255,192,203,0.35)" />
            {/* Left petal */}
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
