import React from 'react';

export type BrandLogoVariant =
  | 'master'
  | 'light'
  | 'dark'
  | 'tight'
  | 'monochrome'
  | 'icon'
  | 'iconDarkBG';

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  height?: number | string;
  width?: number | string;
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'master',
  className = '',
  size = 'md',
  height,
  width,
  showTagline = false,
}) => {
  const isDark = variant === 'dark';
  const isMono = variant === 'monochrome';
  const isIcon = variant === 'icon' || variant === 'iconDarkBG';
  const isTight = variant === 'tight';

  // Size mapping
  const sizeMap = {
    sm: { icon: 28, textH: 22 },
    md: { icon: 38, textH: 28 },
    lg: { icon: 52, textH: 38 },
    xl: { icon: 68, textH: 48 },
    custom: { icon: 38, textH: 28 },
  };

  const { icon: iconSize } = sizeMap[size] || sizeMap.md;

  // Render standalone mark / icon
  const renderIconMark = (mono = false) => {
    if (mono) {
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Monochrome Stylized N */}
          <path
            d="M26 30V90M26 30C26 23.3726 31.3726 18 38 18C44.6274 18 50 23.3726 50 30V90C50 96.6274 44.6274 102 38 102C31.3726 102 26 96.6274 26 90Z"
            fill="currentColor"
          />
          <path
            d="M36 28L86 92C90 97 98 95 100 88L100 40C100 33.3726 94.6274 28 88 28C81.3726 28 76 33.3726 76 40V78L42 34C39 30 33 30 30 35L36 28Z"
            fill="currentColor"
          />
          {/* Plus */}
          <path
            d="M74 14H86M80 8V20"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* ECG Pulse */}
          <path
            d="M10 65H42L50 48L60 82L70 54L78 65H110"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    return (
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="dnx-blue-vert" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E7BFF" />
            <stop offset="100%" stopColor="#0B52D9" />
          </linearGradient>
          <linearGradient id="dnx-diag-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#176BFF" />
            <stop offset="100%" stopColor="#00E5D4" />
          </linearGradient>
          <linearGradient id="dnx-right-pillar" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1282FF" />
            <stop offset="100%" stopColor="#00E5D4" />
          </linearGradient>
          <linearGradient id="dnx-plus-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5D4" />
            <stop offset="100%" stopColor="#00C9BA" />
          </linearGradient>
          <filter id="glow-coral" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#FF3D71" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Left Vertical Pillar */}
        <rect
          x="20"
          y="26"
          width="20"
          height="68"
          rx="10"
          fill="url(#dnx-blue-vert)"
        />

        {/* Diagonal Transverse Stroke */}
        <path
          d="M26 34L88 94C93 99 101 95 101 88V44C101 38.477 96.523 34 91 34C85.477 34 81 38.477 81 44V74L38 30C33 25 24 28 24 35L26 34Z"
          fill="url(#dnx-diag-cyan)"
        />

        {/* Right Vertical Pillar */}
        <rect
          x="80"
          y="42"
          width="20"
          height="52"
          rx="10"
          fill="url(#dnx-right-pillar)"
        />

        {/* Medical Plus Symbol floating on top-right */}
        <g>
          <rect x="68" y="14" width="16" height="5.5" rx="2.75" fill="url(#dnx-plus-glow)" />
          <rect x="73.25" y="8.75" width="5.5" height="16" rx="2.75" fill="url(#dnx-plus-glow)" />
        </g>

        {/* Coral ECG Heartbeat Wave */}
        <path
          d="M8 64H38L47 46L58 84L70 52L80 64H112"
          stroke="#FF3D71"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow-coral)"
        />
      </svg>
    );
  };

  if (variant === 'iconDarkBG') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl bg-[#07111F] p-2 border border-slate-800/80 shadow-md ${className}`}
        style={{ width: width || iconSize * 1.3, height: height || iconSize * 1.3 }}
      >
        <div style={{ width: iconSize, height: iconSize }}>
          {renderIconMark(false)}
        </div>
      </div>
    );
  }

  if (isIcon) {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: width || iconSize, height: height || iconSize }}
      >
        {renderIconMark(isMono)}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
      style={{ height: height }}
    >
      {/* Icon Mark */}
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{ width: iconSize, height: iconSize }}
      >
        {renderIconMark(isMono)}
      </div>

      {/* Typography Lockup */}
      <div className="flex flex-col justify-center">
        <div
          className={`flex items-center font-bold tracking-tight leading-none ${
            isTight ? '-space-x-0.5' : 'space-x-0.5'
          }`}
          style={{
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            fontSize:
              size === 'sm'
                ? '1.25rem'
                : size === 'md'
                ? '1.625rem'
                : size === 'lg'
                ? '2.25rem'
                : '2.75rem',
          }}
        >
          <span
            className={
              isMono
                ? 'text-current font-extrabold'
                : isDark
                ? 'text-white font-extrabold'
                : 'text-[#07111F] font-extrabold'
            }
          >
            Digit
          </span>
          <span
            className={
              isMono
                ? 'text-current font-black'
                : 'text-[#176BFF] font-black'
            }
          >
            Nex
          </span>
          <span
            className={
              isMono
                ? 'text-current font-extrabold'
                : isDark
                ? 'text-white font-extrabold'
                : 'text-[#07111F] font-extrabold'
            }
          >
            Care
          </span>
        </div>

        {showTagline && (
          <span
            className={`text-[0.65rem] uppercase font-semibold tracking-wider mt-1 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Smarter Care. Stronger Connections.
          </span>
        )}
      </div>
    </div>
  );
};
