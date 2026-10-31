import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = 'w-7 h-7 sm:w-8 sm:h-8', size = 32 }) => {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`flex-shrink-0 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="logoBgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="70%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#030712" />
        </radialGradient>
        <linearGradient id="logoBoltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="40%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="logoCopperGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#EA580C" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>
      </defs>

      {/* Rounded Badge Base */}
      <rect width="512" height="512" rx="108" fill="url(#logoBgGrad)" />

      {/* Circular Electrical Field Ring */}
      <circle cx="256" cy="256" r="224" stroke="#F59E0B" strokeWidth="6" strokeDasharray="14 10" opacity="0.4" />
      <circle cx="256" cy="256" r="208" stroke="#38BDF8" strokeWidth="2.5" opacity="0.3" />

      {/* Left Busbar Line */}
      <rect x="56" y="240" width="150" height="32" rx="6" fill="url(#logoCopperGrad)" stroke="#B45309" strokeWidth="3" />
      <circle cx="96" cy="256" r="6" fill="#030712" />
      <circle cx="156" cy="256" r="6" fill="#030712" />

      {/* Right Busbar Line */}
      <rect x="306" y="240" width="150" height="32" rx="6" fill="url(#logoCopperGrad)" stroke="#B45309" strokeWidth="3" />
      <circle cx="356" cy="256" r="6" fill="#030712" />
      <circle cx="416" cy="256" r="6" fill="#030712" />

      {/* Bolted Overlap Joint Core */}
      <rect x="220" y="224" width="72" height="64" rx="8" fill="#D97706" stroke="#92400E" strokeWidth="4" />
      <circle cx="256" cy="238" r="5" fill="#FEF08A" />
      <circle cx="256" cy="274" r="5" fill="#FEF08A" />

      {/* Electric Lightning Aura */}
      <path
        d="M 282 86 L 176 268 L 246 268 L 216 426 L 348 238 L 268 238 Z"
        fill="#38BDF8"
        opacity="0.35"
      />

      {/* High-Voltage Lightning Bolt */}
      <path
        d="M 282 86 L 176 268 L 246 268 L 216 426 L 348 238 L 268 238 Z"
        fill="url(#logoBoltGrad)"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* Spark Glow Center */}
      <path
        d="M 276 112 L 196 256 L 248 256 L 230 380 L 324 246 L 268 246 Z"
        fill="#FFFFFF"
        opacity="0.85"
      />
    </svg>
  );
};
