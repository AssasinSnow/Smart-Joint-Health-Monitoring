import React from 'react';

interface TabularValueProps {
  value: number | string | null | undefined;
  unit?: string;
  decimals?: number;
  className?: string;
  unitClassName?: string;
  fallback?: string;
}

export const TabularValue: React.FC<TabularValueProps> = ({
  value,
  unit,
  decimals = 2,
  className = 'text-2xl font-bold',
  unitClassName = 'text-xs text-slate-400 font-sans ml-1',
  fallback = '--'
}) => {
  let displayValue: string;

  if (value === null || value === undefined) {
    displayValue = fallback;
  } else if (typeof value === 'number') {
    if (isNaN(value)) {
      displayValue = fallback;
    } else {
      displayValue = value.toFixed(decimals);
    }
  } else {
    displayValue = value;
  }

  return (
    <span className={`inline-flex items-baseline font-mono tabular-nums tracking-tight ${className}`}>
      <span>{displayValue}</span>
      {unit && <span className={unitClassName}>{unit}</span>}
    </span>
  );
};
