import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { StatusType } from '../../lib/formatters';

interface RadialJhiGaugeProps {
  jhi: number;
  status: StatusType;
  subScores?: {
    resistanceScore: number;
    tempRiseScore: number;
    forceScore: number;
    powerLossScore: number;
  };
  force_N?: number;
  className?: string;
}

export const RadialJhiGauge: React.FC<RadialJhiGaugeProps> = ({
  jhi,
  status,
  subScores,
  force_N,
  className = ''
}) => {
  // SVG circular arc calculations
  const radius = 78;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // Semicircle gauge: 220 degree arc from 160 deg to 380 deg
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = arcLength - (jhi / 100) * arcLength;

  const getGaugeColor = (val: number) => {
    if (val >= 80) return '#10B981'; // Emerald
    if (val >= 50) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  const gaugeColor = getGaugeColor(jhi);

  return (
    <div
      className={`bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-4 sm:p-6 shadow-sm flex flex-col justify-between relative overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            Joint Health Index (JHI)
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-400 mt-0.5">
            Holm Electrical-Thermal Contact Health Score
          </p>
        </div>
        <StatusBadge status={status} size="sm" showPulse />
      </div>

      <div className="my-4 flex flex-col sm:flex-row items-center justify-around gap-4 sm:gap-6">
        {/* Radial SVG Gauge - fluid SVG with viewBox */}
        <div className="relative flex items-center justify-center w-36 h-36 sm:w-48 sm:h-48 flex-shrink-0">
          <svg viewBox="0 0 190 190" className="w-full h-full transform -rotate-90">
            {/* Background track */}
            <circle
              stroke="currentColor"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
              r={normalizedRadius}
              cx="95"
              cy="95"
              className="text-slate-100 dark:text-navy-700"
            />
            {/* Value stroke */}
            <circle
              stroke={gaugeColor}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              style={{
                strokeDashoffset,
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease'
              }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx="95"
              cy="95"
            />
          </svg>

          {/* Centered Numbers */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
              {jhi}
            </span>
            <span className="text-[10px] sm:text-xs uppercase font-mono tracking-widest text-slate-400 font-semibold mt-0.5">
              / 100 PTS
            </span>
          </div>
        </div>

        {/* Sub-factor score meters */}
        <div className="w-full max-w-xs space-y-2 sm:space-y-3">
          <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Multi-Physics Factor Balance:
          </div>

          {subScores ? (
            <>
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Resistance Health (SR)</span>
                  <span className="font-bold tabular-nums text-slate-800 dark:text-slate-100">
                    {subScores.resistanceScore.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-copper-500 rounded-full transition-all duration-500"
                    style={{ width: `${subScores.resistanceScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Thermal Rise (ST)</span>
                  <span className="font-bold tabular-nums text-slate-800 dark:text-slate-100">
                    {subScores.tempRiseScore.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${subScores.tempRiseScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Bolt Clamping (SF)</span>
                  <span className="font-bold tabular-nums text-slate-800 dark:text-slate-100">
                    {subScores.forceScore.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${subScores.forceScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Power Dissipation (SP)</span>
                  <span className="font-bold tabular-nums text-slate-800 dark:text-slate-100">
                    {subScores.powerLossScore.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${subScores.powerLossScore}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-400 font-mono">Calibrating physical sub-scores...</div>
          )}
        </div>
      </div>

      <div className="mt-2 pt-3 border-t border-slate-100 dark:border-navy-700 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
        <div>
          <span>Bolt Force: </span>
          <span className="text-slate-800 dark:text-slate-200 font-bold tabular-nums">
            {force_N !== undefined ? `${force_N.toLocaleString()} N` : '-- N'}
          </span>
        </div>
        <div className="text-slate-400 dark:text-slate-400 text-[10px] sm:text-[11px]">
          Physics degradation model: Non-RUL deterministic
        </div>
      </div>
    </div>
  );
};
