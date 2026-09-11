import React from 'react';

export default function RocketIllustration({ size = 160, className = '' }) {
  return (
    <div 
      className={`rocket-illustration-wrapper ${className}`}
      style={{
        width: size,
        height: size,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Soft Aura Gradient */}
          <radialGradient id="auraGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ede9fe" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#f5f3ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f5f3ff" stopOpacity="0" />
          </radialGradient>

          {/* Rocket Body Gradient */}
          <linearGradient id="rocketBodyGrad" x1="45" y1="110" x2="115" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3730a3" />
            <stop offset="50%" stopColor="#4338ca" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>

          {/* Rocket Highlight / Reflection */}
          <linearGradient id="rocketHighlight" x1="55" y1="100" x2="100" y2="45" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0.2" />
          </linearGradient>

          {/* Fin Gradient */}
          <linearGradient id="finGrad" x1="30" y1="120" x2="70" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#3730a3" />
          </linearGradient>

          {/* Window Glass Gradient */}
          <linearGradient id="windowGlass" x1="80" y1="62" x2="98" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Flame Gradient */}
          <linearGradient id="flameGrad" x1="60" y1="105" x2="35" y2="135" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
          </linearGradient>

          {/* Inner Flame */}
          <linearGradient id="innerFlame" x1="56" y1="108" x2="42" y2="126" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Background Soft Aura Circle */}
        <circle cx="82" cy="78" r="54" fill="url(#auraGlow)" />

        {/* Floating Sparkles & Stars */}
        {/* Star 1 - Top Left (Orange/Yellow) */}
        <g transform="translate(42, 28)">
          <path d="M0 4C2 4 4 2 4 0C4 2 6 4 8 4C6 4 4 6 4 8C4 6 2 4 0 4Z" fill="#f59e0b" />
        </g>
        {/* Star 2 - Top Right (Lilac) */}
        <g transform="translate(122, 44)">
          <path d="M0 3.5C1.8 3.5 3.5 1.8 3.5 0C3.5 1.8 5.2 3.5 7 3.5C5.2 3.5 3.5 5.2 3.5 7C3.5 5.2 1.8 3.5 0 3.5Z" fill="#8b5cf6" />
        </g>
        {/* Star 3 - Right (Amber) */}
        <g transform="translate(136, 74)">
          <path d="M0 3C1.5 3 3 1.5 3 0C3 1.5 4.5 3 6 3C4.5 3 3 4.5 3 6C3 4.5 1.5 3 0 3Z" fill="#f97316" />
        </g>
        {/* Star 4 - Bottom Left (Purple) */}
        <g transform="translate(24, 76)">
          <path d="M0 3C1.5 3 3 1.5 3 0C3 1.5 4.5 3 6 3C4.5 3 3 4.5 3 6C3 4.5 1.5 3 0 3Z" fill="#6366f1" />
        </g>

        {/* Small floating dots */}
        <circle cx="38" cy="46" r="1.5" fill="#ec4899" />
        <circle cx="118" cy="26" r="2" fill="#38bdf8" />
        <circle cx="130" cy="100" r="1.8" fill="#a855f7" />
        <circle cx="30" cy="98" r="1.5" fill="#f59e0b" />
        <circle cx="50" cy="20" r="1.2" fill="#6366f1" />

        {/* Speed / Smoke Trail behind rocket */}
        <g opacity="0.85">
          {/* Smoke Puffs */}
          <circle cx="42" cy="116" r="7" fill="#ffffff" stroke="#e0e7ff" strokeWidth="1.5" />
          <circle cx="34" cy="126" r="9" fill="#ffffff" stroke="#e0e7ff" strokeWidth="1.5" />
          <circle cx="48" cy="130" r="6.5" fill="#ffffff" stroke="#e0e7ff" strokeWidth="1.5" />
          <circle cx="25" cy="138" r="7" fill="#ffffff" stroke="#e0e7ff" strokeWidth="1.5" />

          {/* Speed line accents */}
          <path d="M48 116L32 136" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round" />
          <path d="M56 122L42 140" stroke="#c7d2fe" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M38 108L24 126" stroke="#c7d2fe" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M60 134L50 148" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
          <path d="M28 142L20 152" stroke="#a5b4fc" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Rocket Thruster Flame */}
        <path
          d="M51 106C47 114 36 125 32 135C44 131 54 120 62 114Z"
          fill="url(#flameGrad)"
        />
        <path
          d="M53 108C50 114 43 121 40 127C48 124 54 118 59 113Z"
          fill="url(#innerFlame)"
        />

        {/* Rocket Nozzle */}
        <path
          d="M52 101L46 107C48 111 55 116 59 114L65 108C61 104 56 102 52 101Z"
          fill="#1e1b4b"
          stroke="#0f172a"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Rocket Lower Fin (Bottom-Right) */}
        <path
          d="M74 104C74 104 77 122 88 123C89 116 87 101 81 97L74 104Z"
          fill="url(#finGrad)"
          stroke="#1e1b4b"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Rocket Upper Fin (Top-Left) */}
        <path
          d="M56 72C56 72 38 75 37 86C44 87 59 85 63 79L56 72Z"
          fill="url(#finGrad)"
          stroke="#1e1b4b"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Rocket Body */}
        <path
          d="M56 104C49 84 62 60 78 46C92 34 116 26 122 28C124 34 116 58 104 72C90 88 66 101 56 104Z"
          fill="url(#rocketBodyGrad)"
          stroke="#1e1b4b"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Body Reflection / Highlight Arc */}
        <path
          d="M60 98C68 95 86 84 98 70C108 58 115 42 118 33"
          stroke="url(#rocketHighlight)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Dorsal Fin / Center Fin */}
        <path
          d="M62 98C62 98 73 99 80 92C87 85 88 74 88 74C88 74 77 75 70 82C63 89 62 98 62 98Z"
          fill="#6366f1"
          stroke="#1e1b4b"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Porthole Outer Rim */}
        <circle
          cx="89"
          cy="61"
          r="13"
          fill="#1e1b4b"
          stroke="#1e1b4b"
          strokeWidth="1.5"
        />

        {/* Porthole Glass */}
        <circle
          cx="89"
          cy="61"
          r="10"
          fill="url(#windowGlass)"
        />

        {/* Porthole Reflection Highlight */}
        <path
          d="M84 57C85 54 88 52 91 53"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="85" cy="65" r="1.5" fill="#ffffff" opacity="0.7" />
      </svg>
    </div>
  );
}
