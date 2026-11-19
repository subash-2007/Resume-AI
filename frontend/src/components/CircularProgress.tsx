import React from 'react';

interface CircularProgressProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showLabel?: boolean;
  showText?: boolean;
  sublabel?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  score,
  size = 120,
  strokeWidth = 9,
  label = "Match",
  showLabel,
  showText = true,
  sublabel
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Decide if label should show (only on large sizes unless explicitly overridden)
  const shouldShowLabel = showLabel !== undefined ? showLabel : size >= 90;

  // Adaptive font sizing based on circle diameter
  const fontClass =
    size < 40 ? "text-[10px]" :
    size < 55 ? "text-xs font-semibold" :
    size < 80 ? "text-sm font-bold" :
    size < 110 ? "text-lg font-bold" :
    "text-2xl font-bold";

  return (
    <div className="inline-flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 block"
        >
          {/* Background Track: Mocha Brown with low opacity */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#463124"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Indicator: Pale Lavender */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E6E0F0"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Text */}
        {showText && size >= 48 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-0.5">
            <span className={`font-sans text-silver leading-none ${fontClass}`}>
              {clampedScore.toFixed(0)}%
            </span>
            {shouldShowLabel && label && size >= 75 && (
              <span className="text-[10px] text-lavender uppercase font-semibold tracking-wider mt-1 leading-none">
                {label}
              </span>
            )}
          </div>
        )}
      </div>

      {sublabel && (
        <span className="text-xs text-silver/70 mt-2 text-center max-w-[140px]">
          {sublabel}
        </span>
      )}
    </div>
  );
};


