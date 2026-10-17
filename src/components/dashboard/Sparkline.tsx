import React from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#F59E0B',
  height = 36,
  width = 120,
  className = ''
}) => {
  if (!data || data.length < 2) {
    return (
      <div
        style={{ height, width }}
        className={`flex items-center justify-center text-[10px] text-slate-400 font-mono ${className}`}
      >
        Awaiting samples...
      </div>
    );
  }

  const validData = data.filter(d => !isNaN(d) && d !== null);
  if (validData.length < 2) {
    return <div style={{ height, width }} className={className} />;
  }

  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min === 0 ? 1 : max - min;
  const padding = 2;
  const usableHeight = height - padding * 2;
  const usableWidth = width - padding * 2;

  const points = validData
    .map((val, idx) => {
      const x = padding + (idx / (validData.length - 1)) * usableWidth;
      const y = padding + usableHeight - ((val - min) / range) * usableHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      className={`overflow-visible ${className}`}
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* End point dot */}
      {validData.length > 0 && (
        <circle
          cx={padding + usableWidth}
          cy={
            padding +
            usableHeight -
            ((validData[validData.length - 1] - min) / range) * usableHeight
          }
          r="2.5"
          fill={color}
        />
      )}
    </svg>
  );
};
