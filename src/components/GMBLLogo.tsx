import React, { useId } from "react";

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
  const rawId = useId();
  const idPrefix = `gmbl_logo_${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

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
        className="w-full h-full relative z-10 drop-shadow-xl select-none overflow-visible"
      >
        <defs>
          {/* Blue/Cyan Gradient for Left Gear & Accent */}
          <linearGradient id={`${idPrefix}_blueGearGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="50%" stopColor="#0084FF" />
            <stop offset="100%" stopColor="#0052D4" />
          </linearGradient>

          {/* Orange/Gold Gradient for Right Gear & Arrows */}
          <linearGradient id={`${idPrefix}_orangeGearGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD54F" />
            <stop offset="50%" stopColor="#FF9100" />
            <stop offset="100%" stopColor="#DD2C00" />
          </linearGradient>

          {/* Lightning Bolt Gradient */}
          <linearGradient id={`${idPrefix}_boltGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F2FE" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          {/* Meter Body Gradient */}
          <linearGradient id={`${idPrefix}_meterBodyGrad`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Screen Display Gradient */}
          <linearGradient id={`${idPrefix}_screenGrad`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>

        {/* Outer Dark Ring Backing */}
        <circle cx="100" cy="100" r="92" fill="#0B1329" stroke="#1E293B" strokeWidth="4" />

        {/* --- LEFT HALF GEAR (Cyan/Blue) --- */}
        <g id="left-gear">
          {/* Outer Left Gear Arc Ring */}
          <path
            d="M 100 16 
               A 84 84 0 0 0 16 100 
               A 84 84 0 0 0 100 184 
               L 100 160 
               A 60 60 0 0 1 40 100 
               A 60 60 0 0 1 100 40 
               Z"
            fill={`url(#${idPrefix}_blueGearGrad)`}
          />
          {/* Gear Teeth Left Side */}
          {[120, 145, 170, 195, 220, 240].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 100 + 84 * Math.cos(rad);
            const y = 100 + 84 * Math.sin(rad);
            return (
              <rect
                key={i}
                x={x - 8}
                y={y - 8}
                width="16"
                height="16"
                rx="4"
                fill={`url(#${idPrefix}_blueGearGrad)`}
                transform={`rotate(${angle + 90}, ${x}, ${y})`}
              />
            );
          })}
        </g>

        {/* --- RIGHT HALF GEAR (Orange/Gold) --- */}
        <g id="right-gear">
          {/* Outer Right Gear Arc Ring */}
          <path
            d="M 100 16 
               A 84 84 0 0 1 184 100 
               A 84 84 0 0 1 100 184 
               L 100 160 
               A 60 60 0 0 0 160 100 
               A 60 60 0 0 0 100 40 
               Z"
            fill={`url(#${idPrefix}_orangeGearGrad)`}
          />
          {/* Gear Teeth Right Side */}
          {[-60, -35, -10, 15, 40, 60].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 100 + 84 * Math.cos(rad);
            const y = 100 + 84 * Math.sin(rad);
            return (
              <rect
                key={i}
                x={x - 8}
                y={y - 8}
                width="16"
                height="16"
                rx="4"
                fill={`url(#${idPrefix}_orangeGearGrad)`}
                transform={`rotate(${angle + 90}, ${x}, ${y})`}
              />
            );
          })}
        </g>

        {/* --- CENTER ELECTRIC METER (Meteran kWh PLN) --- */}
        <g id="electric-meter">
          {/* Meter Box Outer Shadow/Border */}
          <rect
            x="58"
            y="52"
            width="84"
            height="98"
            rx="18"
            fill={`url(#${idPrefix}_meterBodyGrad)`}
            stroke="#38BDF8"
            strokeWidth="4"
          />
          {/* Meter Screen */}
          <rect
            x="68"
            y="64"
            width="64"
            height="34"
            rx="8"
            fill="#0F172A"
            stroke="#1E293B"
            strokeWidth="2"
          />
          {/* Screen Digital Bars */}
          <rect x="74" y="72" width="9" height="18" rx="2" fill={`url(#${idPrefix}_screenGrad)`} />
          <rect x="86" y="72" width="9" height="18" rx="2" fill={`url(#${idPrefix}_screenGrad)`} />
          <rect x="98" y="72" width="9" height="18" rx="2" fill={`url(#${idPrefix}_screenGrad)`} />
          <rect x="110" y="72" width="9" height="18" rx="2" fill={`url(#${idPrefix}_screenGrad)`} />
          <rect x="122" y="72" width="4" height="18" rx="1" fill="#334155" />

          {/* Meter Keypad Buttons */}
          <rect x="70" y="106" width="16" height="7" rx="2" fill="#475569" />
          <rect x="92" y="106" width="16" height="7" rx="2" fill="#475569" />
          <rect x="114" y="106" width="16" height="7" rx="2" fill="#FF9100" />

          {/* Lightning Token Circle at Bottom Meter */}
          <circle cx="100" cy="131" r="11" fill="#FF9100" stroke="#FFF" strokeWidth="1.5" />
          {/* Small Bolt inside circle */}
          <path d="M 101 123 L 95 132 L 100 132 L 99 139 L 105 130 L 100 130 Z" fill="#FFF" />
        </g>

        {/* --- DYNAMIC STYLIZED REPLACEMENT ARROWS (Orange & Cyan) --- */}
        <g id="gm-arrows">
          {/* Top Left Replacement Arrow */}
          <path
            d="M 50 100 A 50 50 0 0 1 100 50"
            fill="none"
            stroke={`url(#${idPrefix}_blueGearGrad)`}
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Bottom Right Replacement Arrow */}
          <path
            d="M 150 100 A 50 50 0 0 1 100 150"
            fill="none"
            stroke={`url(#${idPrefix}_orangeGearGrad)`}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>

        {/* --- TOP LIGHTNING BOLT & SPARKS (PLN Power) --- */}
        <g id="top-lightning">
          <path
            d="M 106 2 L 88 32 L 100 32 L 93 56 L 115 24 L 102 24 Z"
            fill={`url(#${idPrefix}_boltGrad)`}
            stroke="#FFF"
            strokeWidth="1.5"
          />
          {/* Sparks */}
          <circle cx="80" cy="14" r="3" fill="#00E5FF" />
          <circle cx="122" cy="12" r="2.5" fill="#FFC107" />
          <path d="M 74 24 L 80 20" stroke="#00E5FF" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 124 22 L 129 18" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};
