import React from 'react';
import { useJointStore } from '../../store/useJointStore';
import { StatusBadge } from '../common/StatusBadge';
import { Sun, Moon, Menu, Download, Zap, FlaskConical } from 'lucide-react';
import { exportToCsv } from '../../lib/formatters';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    config,
    isDarkMode,
    toggleTheme,
    connectionStatus,
    rollingHistory,
    setTelemetryMode
  } = useJointStore();

  const handleExport = () => {
    if (rollingHistory.length === 0) return;
    const flat = rollingHistory.map(p => ({
      Timestamp: new Date(p.timestamp).toISOString(),
      Vdrop_mV: p.vDrop_mV,
      Current_A: p.current_A,
      Force_N: p.force_N,
      TempJoint_C: p.tempJoint_C,
      TempAmbient_C: p.tempAmbient_C,
      Resistance_mOhm: p.resistance_mOhm ?? '',
      PowerLoss_W: p.powerLoss_W,
      TempRise_C: p.tempRise_C,
      JHI: p.jhi,
      HealthStatus: p.status
    }));
    exportToCsv(flat, `joint_telemetry_${Date.now()}`);
  };

  return (
    <header className="h-16 bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-700 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Menu"
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center justify-center min-w-[40px] min-h-[40px]"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-lg bg-copper-500 text-white font-bold shadow-sm flex-shrink-0">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
          </div>
          <div className="min-w-0 truncate">
            <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5 truncate">
              <span className="truncate">Smart Joint Monitor</span>
              <span className="hidden md:inline-block text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-copper-500/10 text-copper-600 dark:text-copper-400 border border-copper-500/20 flex-shrink-0">
                B.Tech EEE
              </span>
            </h1>
            <p className="hidden md:block text-xs text-slate-400 dark:text-slate-400 truncate">
              Bolted Copper Busbar Health &amp; Predictive Telemetry
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Mode Toggle Switch (Demo vs Live) */}
        <div className="flex items-center rounded-lg bg-slate-100 dark:bg-navy-800 p-0.5 sm:p-1 border border-slate-200 dark:border-navy-700 text-xs font-semibold">
          <button
            onClick={() => setTelemetryMode('demo')}
            title="Switch to Demo Simulation Mode"
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded transition-colors text-xs ${
              config.mode === 'demo'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Demo</span>
          </button>
          <button
            onClick={() => setTelemetryMode('live')}
            title="Switch to Live ESP32 Hardware Stream"
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded transition-colors text-xs ${
              config.mode === 'live'
                ? 'bg-copper-500 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live</span>
          </button>
        </div>

        {/* Connection status pill */}
        <div className="hidden min-[480px]:block">
          <StatusBadge
            status={
              config.mode === 'demo'
                ? 'DEMO'
                : connectionStatus === 'CONNECTED'
                ? 'HEALTHY'
                : 'OFFLINE'
            }
            customLabel={
              config.mode === 'demo'
                ? 'Demo 🧪'
                : connectionStatus === 'CONNECTED'
                ? 'ESP32 ⚡'
                : 'Offline ⏻'
            }
            size="sm"
            showPulse={connectionStatus === 'CONNECTED' || config.mode === 'demo'}
          />
        </div>

        {/* Export CSV button (tablet and desktop) */}
        <button
          onClick={handleExport}
          title="Export Telemetry to CSV"
          className="hidden md:flex items-center gap-1.5 p-2 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-medium border border-slate-200 dark:border-navy-700 transition-colors"
        >
          <Download className="w-4 h-4 text-copper-500" />
          <span>Export CSV</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors flex items-center justify-center min-w-[38px] min-h-[38px]"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
};
