import React from "react";

interface GMBLLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showGlow?: boolean;
}

export const GMBLLogo: React.FC<GMBLLogoProps> = ({
  className = "",
  size = "md",
  showGlow = true,
}) => {
  const sizeMap = {
    sm: "h-7 w-7",
    md: "h-10 w-10",
    lg: "h-14 w-14",
    xl: "h-24 w-24",
  };

  const dim = sizeMap[size] || className;

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${dim} ${className}`}>
      {showGlow && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/40 via-blue-500/30 to-amber-500/40 blur-md animate-pulse pointer-events-none" />
      )}
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-lg select-none"
      >
        <defs>
          {/* Blue/Cyan Gradient for Left Gear & Accent */}
          <linearGradient id="blueGearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="50%" stopColor="#0084FF" />
            <stop offset="100%" stopColor="#0052D4" />
          </linearGradient>

          {/* Orange/Gold Gradient for Right Gear & Arrows */}
          <linearGradient id="orangeGearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFC107" />
            <stop offset="50%" stopColor="#FF9100" />
            <stop offset="100%" stopColor="#DD2C00" />
          </linearGradient>

          {/* Lightning Bolt Gradient */}
          <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F2FE" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          {/* Meter Body Gradient */}
          <linearGradient id="meterBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Screen Display Gradient */}
          <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>

        {/* Outer Dark Ring Backing */}
        <circle cx="100" cy="100" r="92" fill="#0B1329" stroke="#1E293B" strokeWidth="4" />

        {/* --- LEFT HALF GEAR (Cyan/Blue) --- */}
        <g id="left-gear">
          {/* Outer Left Gear Teeth */}
          <path
            d="M 100 14
               A 86 86 0 0 0 14 100
               A 86 86 0 0 0 100 186
               L 100 164
               A 64 64 0 0 1 36 100
               A 64 64 0 0 1 100 36
               Z"
            fill="url(#blueGearGrad)"
          />
          {/* Gear Teeth Left */}
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = 120 + i * 24;
            const rad = (angle * Math.PI) / 180;
            const x = 100 + 86 * Math.cos(rad);
            const y = 100 + 86 * Math.sin(rad);
            return (
              <rect
                key={i}
                x={x - 8}
                y={y - 8}
                width="16"
                height="16"
                rx="3"
                fill="url(#blueGearGrad)"
                transform={`rotate(${angle + 90}, ${x}, ${y})`}
              />
            );
          })}
        </g>

        {/* --- RIGHT HALF GEAR (Orange/Gold) --- */}
        <g id="right-gear">
          <path
            d="M 100 14
               A 86 86 0 0 1 186 100
               A 86 86 0 0 1 100 186
               L 100 164
               A 64 64 0 0 0 164 100
               A 64 64 0 0 0 100 36
               Z"
            fill="url(#orangeGearGrad)"
          />
          {/* Gear Teeth Right */}
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = -60 + i * 24;
            const rad = (angle * Math.PI) / 180;
            const x = 100 + 86 * Math.cos(rad);
            const y = 100 + 86 * Math.sin(rad);
            return (
              <rect
                key={i}
                x={x - 8}
                y={y - 8}
                width="16"
                height="16"
                rx="3"
                fill="url(#orangeGearGrad)"
                transform={`rotate(${angle + 90}, ${x}, ${y})`}
              />
            );
          })}
        </g>

        {/* --- CENTER ELECTRIC METER (Meteran kWh PLN) --- */}
        <g id="electric-meter">
          {/* Meter Box Outer Shadow/Border */}
          <rect
            x="60"
            y="54"
            width="80"
            height="96"
            rx="16"
            fill="url(#meterBodyGrad)"
            stroke="#38BDF8"
            strokeWidth="5"
          />
          {/* Meter Screen */}
          <rect
            x="70"
            y="66"
            width="60"
            height="32"
            rx="6"
            fill="#0F172A"
            stroke="#1E293B"
            strokeWidth="2"
          />
          {/* Screen Digital Bars */}
          <rect x="76" y="74" width="8" height="16" rx="2" fill="url(#screenGrad)" />
          <rect x="87" y="74" width="8" height="16" rx="2" fill="url(#screenGrad)" />
          <rect x="98" y="74" width="8" height="16" rx="2" fill="url(#screenGrad)" />
          <rect x="109" y="74" width="8" height="16" rx="2" fill="url(#screenGrad)" />
          <rect x="120" y="74" width="4" height="16" rx="1" fill="#334155" />

          {/* Meter Buttons */}
          <rect x="72" y="106" width="16" height="6" rx="2" fill="#475569" />
          <rect x="92" y="106" width="16" height="6" rx="2" fill="#475569" />
          <rect x="112" y="106" width="16" height="6" rx="2" fill="#FF9100" />

          {/* Lightning Token Circle at Bottom Meter */}
          <circle cx="100" cy="130" r="10" fill="#FF9100" stroke="#FFF" strokeWidth="1.5" />
          {/* Small Bolt inside circle */}
          <path d="M 101 123 L 96 131 L 100 131 L 99 137 L 104 129 L 100 129 Z" fill="#FFF" />
        </g>

        {/* --- DYNAMIC STYLIZED "G" & "M" ARROWS (Orange & Gold) --- */}
        <g id="gm-arrows">
          {/* Left Arrow "G" swoop */}
          <path
            d="M 52 118 
               C 42 98, 48 72, 72 60 
               L 80 66 
               C 62 76, 58 96, 64 112 
               Z"
            fill="url(#orangeGearGrad)"
          />
          <path
            d="M 55 125 L 42 110 L 65 110 Z"
            fill="url(#orangeGearGrad)"
          />

          {/* Right Arrow "M" swoop */}
          <path
            d="M 148 82 
               C 158 102, 152 128, 128 140 
               L 120 134 
               C 138 124, 142 104, 136 88 
               Z"
            fill="url(#orangeGearGrad)"
          />
          <path
            d="M 145 75 L 158 90 L 135 90 Z"
            fill="url(#orangeGearGrad)"
          />
        </g>

        {/* --- TOP LIGHTNING BOLT & SPARKS (PLN Power) --- */}
        <g id="top-lightning">
          <path
            d="M 106 4 L 90 32 L 100 32 L 94 54 L 114 24 L 102 24 Z"
            fill="url(#boltGrad)"
            stroke="#FFF"
            strokeWidth="1.5"
          />
          {/* Sparks */}
          <circle cx="82" cy="16" r="3" fill="#00E5FF" />
          <circle cx="120" cy="14" r="2.5" fill="#FFC107" />
          <path d="M 76 26 L 82 22" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
          <path d="M 124 24 L 128 20" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};
