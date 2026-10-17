import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface SafetyBannerProps {
  className?: string;
}

export const SafetyBanner: React.FC<SafetyBannerProps> = ({ className = '' }) => {
  return (
    <div
      role="alert"
      className={`bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-md text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-sm ${className}`}
    >
      <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="text-xs sm:text-sm">
        <span className="font-bold uppercase tracking-wider block text-amber-800 dark:text-amber-300 mb-0.5">
          Mandatory Safety Notice
        </span>
        <p className="leading-relaxed">
          Safety-critical protection must run locally on the ESP32 or dedicated hardware protection.
          This app must never be the sole mechanism for disconnecting an unsafe load.
        </p>
      </div>
    </div>
  );
};
