import React, { useState } from 'react';
import { useJointStore } from '../store/useJointStore';
import { SafetyBanner } from '../components/layout/SafetyBanner';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDateTimeString } from '../lib/formatters';
import { Check, CheckCheck, Filter, ShieldAlert, Clock, Wrench } from 'lucide-react';

type AlertTab = 'active' | 'critical' | 'history';

export const AlertsPage: React.FC = () => {
  const { alerts, acknowledgeAlert, acknowledgeAllAlerts } = useJointStore();
  const [activeTab, setActiveTab] = useState<AlertTab>('active');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAckSingle = (id: string, title: string) => {
    acknowledgeAlert(id);
    showToast(`Acknowledged alert: "${title}"`);
  };

  const handleAckAll = () => {
    acknowledgeAllAlerts();
    showToast('All active alerts acknowledged');
  };

  // Filter alerts by tab and severity
  const filteredAlerts = alerts.filter(a => {
    if (activeTab === 'active' && a.acknowledged) return false;
    if (activeTab === 'critical' && a.severity !== 'CRITICAL') return false;
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    return true;
  });

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && !a.acknowledged).length;

  return (
    <div className="space-y-6">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy-900 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-mono animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mandatory Safety Notice */}
      <SafetyBanner />

      {/* Controls & Tabs Bar */}
      <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto smooth-scroll max-w-full pb-1 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'active'
                ? 'bg-copper-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Active Alerts</span>
            {unacknowledgedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px] font-mono">
                {unacknowledgedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('critical')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'critical'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Critical Only</span>
            {criticalCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px] font-mono">
                {criticalCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white dark:bg-navy-700 shadow-sm'
                : 'bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Event History ({alerts.length})
          </button>
        </div>

        {/* Severity filter & Batch Acknowledge */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg px-2 py-1 text-xs font-mono text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="WARNING">Warning Only</option>
              <option value="INFO">Info Only</option>
            </select>
          </div>

          {unacknowledgedCount > 0 && (
            <button
              onClick={handleAckAll}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-700 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Acknowledge All</span>
            </button>
          )}
        </div>
      </div>

      {/* Debounce / Hysteresis Info Box */}
      <div className="bg-slate-50 dark:bg-navy-900/60 border border-slate-200 dark:border-navy-700 rounded-xl p-3 flex items-center justify-between gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-copper-500 flex-shrink-0" />
          <span>
            <strong>Debounce Pipeline Active:</strong> 3-sample temporal hold required to trigger; 3-sample recovery required to clear. Suppresses chatter at physical boundary thresholds.
          </span>
        </div>
        <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
          DEBOUNCED ✔
        </span>
      </div>

      {/* Alerts Table / List */}
      <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 shadow-sm overflow-hidden">
        {filteredAlerts.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <ShieldAlert className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
              No Matching Alerts
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              There are currently no active alerts under this filter criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-navy-700">
            {filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-5 transition-colors flex flex-col md:flex-row items-start justify-between gap-4 ${
                  alert.acknowledged
                    ? 'opacity-70 bg-slate-50/40 dark:bg-navy-900/20'
                    : 'bg-white dark:bg-navy-800'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={alert.severity} size="sm" />
                    <span className="font-mono text-xs font-bold text-copper-500 dark:text-copper-400">
                      [{alert.faultCode}]
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {alert.title}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      • {formatDateTimeString(alert.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div className="p-2 rounded bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-700/60">
                      <span className="text-slate-400 block text-[10px] uppercase">
                        Observed Reading:
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {alert.triggerValue}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-700/60">
                      <span className="text-slate-400 block text-[10px] uppercase">
                        Safe Parameter Boundary:
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {alert.thresholdValue}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 mt-2">
                    <Wrench className="w-4 h-4 text-copper-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-copper-600 dark:text-copper-400">Prescriptive Action: </strong>
                      {alert.recommendedAction}
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div className="flex-shrink-0 self-end md:self-center">
                  {!alert.acknowledged ? (
                    <button
                      onClick={() => handleAckSingle(alert.id, alert.title)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-emerald-500 hover:text-white dark:bg-navy-700 dark:hover:bg-emerald-500 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded bg-slate-100 dark:bg-navy-900 text-slate-400 text-xs font-mono flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
