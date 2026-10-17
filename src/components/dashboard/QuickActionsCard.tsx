import React from 'react';
import { DemoScenarioType } from '../../types/config';
import { Camera, Download, PlusCircle, FlaskConical, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickActionsCardProps {
  activeScenario: DemoScenarioType;
  onSelectScenario: (scenario: DemoScenarioType) => void;
  onSnapshotBaseline: () => void;
  onExportCsv: () => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  activeScenario,
  onSelectScenario,
  onSnapshotBaseline,
  onExportCsv
}) => {
  const scenarios: { key: DemoScenarioType; label: string; desc: string }[] = [
    { key: 'PRISTINE', label: 'Pristine Joint', desc: '12 kN clamped, 0.040 mΩ, 200 A' },
    { key: 'LOOSENING', label: 'Bolt Loosening', desc: 'Force decay to 4.2 kN' },
    { key: 'OXIDATION', label: 'Oxidation / Fretting', desc: 'R creeps to 0.085 mΩ' },
    { key: 'OVERLOAD', label: 'Current Overload', desc: 'Load surges to 290 A' },
    { key: 'LOW_LOAD', label: 'Near-Zero Load', desc: '0.4 A (Tests low current guard)' },
    { key: 'SENSOR_FAULT', label: 'Sensor Dropout', desc: 'DS18B20 disconnect (-127°C)' },
    { key: 'THERMAL_RUNAWAY', label: 'Thermal Stress', desc: 'High ambient, ΔT > 45°C' }
  ];

  return (
    <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Diagnostic &amp; Test Controls
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Scenario Injector
          </span>
        </div>

        {/* Scenario Selector Dropdown / Grid */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
            Inject Physics Fault Scenario:
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {scenarios.map(sc => (
              <button
                key={sc.key}
                onClick={() => onSelectScenario(sc.key)}
                className={`p-2 rounded text-left transition-all text-xs border ${
                  activeScenario === sc.key
                    ? 'bg-copper-500/10 border-copper-500 text-copper-600 dark:text-copper-400 font-bold shadow-sm'
                    : 'bg-slate-50 dark:bg-navy-900 border-slate-100 dark:border-navy-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-navy-600'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Play className={`w-3 h-3 ${activeScenario === sc.key ? 'fill-copper-500 text-copper-500' : 'text-slate-400'}`} />
                  <span className="truncate">{sc.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="pt-3 border-t border-slate-100 dark:border-navy-700/80 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onSnapshotBaseline}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-700 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
          >
            <Camera className="w-3.5 h-3.5 text-copper-500" />
            <span>Snapshot Baseline</span>
          </button>

          <button
            onClick={onExportCsv}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-700 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-500" />
            <span>Export CSV</span>
          </button>
        </div>

        <Link
          to="/records"
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-copper-500 hover:bg-copper-600 text-white text-xs font-semibold shadow-sm transition-colors text-center"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Log Maintenance Inspection</span>
        </Link>
      </div>
    </div>
  );
};
