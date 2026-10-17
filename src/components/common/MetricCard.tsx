import React from 'react';
import { TabularValue } from './TabularValue';
import { StatusBadge } from './StatusBadge';
import { StatusType } from '../../lib/formatters';

interface MetricCardProps {
  title: string;
  sensorType?: string;
  value: number | string | null | undefined;
  unit?: string;
  decimals?: number;
  status?: StatusType;
  icon?: React.ReactNode;
  baselineText?: string;
  subValue?: string;
  children?: React.ReactNode;
  className?: string;
  alertText?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  sensorType,
  value,
  unit,
  decimals = 2,
  status,
  icon,
  baselineText,
  subValue,
  children,
  className = '',
  alertText
}) => {
  return (
    <div
      className={`bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-tight flex items-center gap-1.5">
              {title}
            </h3>
            {sensorType && (
              <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 dark:text-slate-400 block mt-0.5">
                {sensorType}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {status && <StatusBadge status={status} size="sm" />}
            {icon && (
              <div className="p-1.5 sm:p-2 rounded-lg bg-slate-100 dark:bg-navy-700/60 text-copper-500 dark:text-copper-400">
                {icon}
              </div>
            )}
          </div>
        </div>

        <div className="mt-2.5 sm:mt-3">
          {alertText ? (
            <div className="py-1 px-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-medium">
              {alertText}
            </div>
          ) : (
            <div className="flex items-baseline gap-2 flex-wrap">
              <TabularValue
                value={value}
                unit={unit}
                decimals={decimals}
                className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50"
              />
              {subValue && (
                <span className="text-xs font-mono text-slate-400 dark:text-slate-400">
                  {subValue}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        {children}

        {baselineText && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-navy-700/80 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span>Baseline Ref:</span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">{baselineText}</span>
          </div>
        )}
      </div>
    </div>
  );
};
