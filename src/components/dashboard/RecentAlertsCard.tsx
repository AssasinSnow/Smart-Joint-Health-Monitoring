import React from 'react';
import { AlertItem } from '../../types/alerts';
import { StatusBadge } from '../common/StatusBadge';
import { formatTimeString } from '../../lib/formatters';
import { AlertCircle, Check, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecentAlertsCardProps {
  alerts: AlertItem[];
  onAcknowledge: (id: string) => void;
}

export const RecentAlertsCard: React.FC<RecentAlertsCardProps> = ({ alerts, onAcknowledge }) => {
  const activeAlerts = alerts.filter(a => !a.acknowledged).slice(0, 4);

  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-copper-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Active Faults &amp; Alerts ({activeAlerts.length})
            </h3>
          </div>
          <Link
            to="/alerts"
            className="text-xs font-semibold text-copper-500 hover:text-copper-600 dark:text-copper-400 flex items-center gap-0.5 transition-colors"
          >
            Alert Center <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-slate-400 text-sm">
            <span className="text-2xl block mb-1">✔</span>
            All electrical and mechanical parameters operating normally.
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map(alert => (
              <div
                key={alert.id}
                className="p-3 rounded-lg border border-slate-100 dark:border-navy-700/80 bg-slate-50/50 dark:bg-navy-900/50 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={alert.severity} size="sm" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {alert.title}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {formatTimeString(alert.timestamp)}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 line-clamp-1">
                    {alert.description}
                  </p>
                </div>
                <button
                  onClick={() => onAcknowledge(alert.id)}
                  title="Acknowledge alert"
                  className="p-1.5 rounded bg-slate-200 dark:bg-navy-700 hover:bg-copper-500 hover:text-white dark:hover:bg-copper-500 transition-colors flex-shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-700/80 text-[11px] text-slate-400 flex justify-between">
        <span>Hysteresis Debounce Active (3-sample hold)</span>
        <Link to="/alerts" className="text-cyan-500 hover:underline">
          View History
        </Link>
      </div>
    </div>
  );
};
