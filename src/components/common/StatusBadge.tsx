import React from 'react';
import { getStatusVisual, StatusType } from '../../lib/formatters';

interface StatusBadgeProps {
  status: StatusType;
  customLabel?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  customLabel,
  className = '',
  size = 'md',
  showPulse = false
}) => {
  const visual = getStatusVisual(status);
  const Icon = visual.Icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold'
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors ${visual.badgeClass} ${sizeClasses} ${className}`}
    >
      {showPulse && (
        <span className="relative flex h-2 w-2 mr-0.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              status === 'HEALTHY'
                ? 'bg-emerald-400'
                : status === 'CRITICAL'
                ? 'bg-red-400'
                : status === 'WARNING'
                ? 'bg-amber-400'
                : 'bg-purple-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status === 'HEALTHY'
                ? 'bg-emerald-500'
                : status === 'CRITICAL'
                ? 'bg-red-500'
                : status === 'WARNING'
                ? 'bg-amber-500'
                : 'bg-purple-500'
            }`}
          />
        </span>
      )}
      <Icon className={`${iconSizes} flex-shrink-0`} />
      <span>{customLabel || visual.label}</span>
    </span>
  );
};
