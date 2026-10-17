import React from 'react';
import { useJointStore } from '../store/useJointStore';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  CheckSquare,
  Square,
  ShieldCheck,
  Flame,
  Wrench,
  Info
} from 'lucide-react';
import { formatTimeString } from '../lib/formatters';
import { MaintenancePriority } from '../types/maintenance';

export const PredictiveMaintenancePage: React.FC = () => {
  const {
    currentPoint,
    rollingHistory,
    activeFaults,
    checklist,
    toggleChecklistItem,
    config
  } = useJointStore();

  // Derive priority level
  let priority: MaintenancePriority = 'P4_ROUTINE';
  let priorityLabel = 'P4 - Routine Inspection (Normal)';
  let priorityBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';

  if (currentPoint) {
    if (currentPoint.jhi < 50 || activeFaults.detectedFaults.some(f => f.severity === 'CRITICAL')) {
      priority = 'P1_CRITICAL';
      priorityLabel = 'P1 - Immediate Intervention (Critical)';
      priorityBg = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    } else if (currentPoint.jhi < 70) {
      priority = 'P2_HIGH';
      priorityLabel = 'P2 - High Priority (Service within 24h)';
      priorityBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    } else if (currentPoint.jhi < 85) {
      priority = 'P3_MEDIUM';
      priorityLabel = 'P3 - Medium Priority (Schedule Verification)';
      priorityBg = 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
    }
  }

  // JHI chart points
  const jhiHistory = rollingHistory.map(p => ({
    time: formatTimeString(p.timestamp),
    jhi: p.jhi
  }));

  // Baseline comparison deltas
  const rBase = config.baselines.baselineResistance_mOhm;
  const rCurrent = currentPoint?.resistance_mOhm;
  const rDeltaPct = rCurrent ? ((rCurrent - rBase) / rBase) * 100 : null;

  const fBase = config.baselines.baselineForce_N;
  const fCurrent = currentPoint?.force_N ?? fBase;
  const fDeltaPct = ((fCurrent - fBase) / fBase) * 100;

  const tBase = config.baselines.baselineTempRise_C;
  const tCurrent = currentPoint?.tempRise_C ?? tBase;
  const tDelta = tCurrent - tBase;

  const pBase = config.baselines.nominalPowerLoss_W;
  const pCurrent = currentPoint?.powerLoss_W ?? pBase;
  const pDelta = pCurrent - pBase;

  return (
    <div className="space-y-6">
      {/* Top Banner & Priority */}
      <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-copper-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Condition-Based Health &amp; Diagnostic Classification
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Real-time degradation trend analysis evaluating mechanical bolt tension loss, contact micro-constriction,
            and thermal runaway risk vectors.
          </p>
        </div>

        <div className="flex-shrink-0">
          <div data-priority={priority} className={`px-4 py-2 rounded-xl border text-sm font-bold font-mono ${priorityBg}`}>
            {priorityLabel}
          </div>
        </div>
      </div>

      {/* JHI Historical Trajectory Chart */}
      <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Joint Health Index (JHI) Degradation Trajectory
            </h3>
            <p className="text-xs text-slate-400">
              Normalized 0–100 Holm Contact Health Track
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Current JHI: <span className="font-bold text-copper-500 text-sm">{currentPoint?.jhi ?? 100}</span>
          </div>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={jhiHistory}>
              <defs>
                <linearGradient id="colorJhi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontFamily: 'monospace'
                }}
                formatter={(val: any) => [`${val} / 100`, 'JHI Score']}
              />
              <ReferenceLine y={80} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Healthy (80)', fill: '#10B981', fontSize: 10 }} />
              <ReferenceLine y={50} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Critical (50)', fill: '#EF4444', fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="jhi"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorJhi)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-navy-700/80 flex items-center gap-2 text-xs text-slate-400">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>
            <strong>Deterministic Physics Approach:</strong> To adhere to electrical engineering safety standards, this system deliberately avoids arbitrary synthetic "Remaining Useful Life" (RUL) countdowns. Real busbar failure depends on stochastic switching transients. Instead, condition tracking and fault classification drive prescriptive actions.
          </span>
        </div>
      </div>

      {/* Abnormal Pattern Classification Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bolt Loosening Probability */}
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bolt Loosening Risk
            </span>
            <Wrench className="w-4 h-4 text-copper-500" />
          </div>
          <div className="text-3xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">
            {activeFaults.indicators.looseningRisk}%
          </div>
          <div className="mt-3 h-2 w-full bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                activeFaults.indicators.looseningRisk > 40 ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${activeFaults.indicators.looseningRisk}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Evaluates strain gauge tension decay against M10 nominal clamp force (12,000 N).
          </p>
        </div>

        {/* Oxidation / Fretting Index */}
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Interfacial Oxidation Index
            </span>
            <ShieldCheck className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-3xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">
            {activeFaults.indicators.oxidationRisk}%
          </div>
          <div className="mt-3 h-2 w-full bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                activeFaults.indicators.oxidationRisk > 30 ? 'bg-amber-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${activeFaults.indicators.oxidationRisk}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Detected when contact resistance increases while clamping force remains intact.
          </p>
        </div>

        {/* Thermal Runaway Risk */}
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Thermal Runaway Risk
            </span>
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-3xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">
            {activeFaults.indicators.thermalRunawayRisk}%
          </div>
          <div className="mt-3 h-2 w-full bg-slate-100 dark:bg-navy-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                activeFaults.indicators.thermalRunawayRisk > 50 ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${activeFaults.indicators.thermalRunawayRisk}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Composite assessment of Joulean self-heating and enclosure ambient temperature.
          </p>
        </div>
      </div>

      {/* Before vs. After Maintenance Baseline Comparison */}
      <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 mb-3">
          Baseline vs. Current Live Parameter Comparator
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 dark:border-navy-700 text-slate-400 uppercase">
                <th className="py-2.5 px-3">Physical Metric</th>
                <th className="py-2.5 px-3">As-Installed Baseline</th>
                <th className="py-2.5 px-3">Current Live Value</th>
                <th className="py-2.5 px-3">Delta / Deviation</th>
                <th className="py-2.5 px-3">Condition Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-700/60">
              <tr>
                <td className="py-3 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                  Contact Resistance R
                </td>
                <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                  {rBase.toFixed(3)} mΩ
                </td>
                <td className="py-3 px-3 font-bold text-slate-900 dark:text-white tabular-nums">
                  {rCurrent !== null && rCurrent !== undefined ? `${rCurrent.toFixed(3)} mΩ` : 'Insufficient Current'}
                </td>
                <td className="py-3 px-3 tabular-nums">
                  {rDeltaPct !== null ? (
                    <span className={rDeltaPct > 50 ? 'text-red-500 font-bold' : rDeltaPct > 20 ? 'text-amber-500' : 'text-emerald-500'}>
                      {rDeltaPct >= 0 ? `+${rDeltaPct.toFixed(1)}%` : `${rDeltaPct.toFixed(1)}%`}
                    </span>
                  ) : (
                    '--'
                  )}
                </td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    rDeltaPct === null ? 'bg-slate-500/10 text-slate-400' :
                    rDeltaPct > 50 ? 'bg-red-500/10 text-red-500' :
                    rDeltaPct > 20 ? 'bg-amber-500/10 text-amber-500' :
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {rDeltaPct === null ? 'UNLOADED' : rDeltaPct > 50 ? 'DEGRADED' : rDeltaPct > 20 ? 'WATCH' : 'NOMINAL'}
                  </span>
                </td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                  Bolt Clamping Force F
                </td>
                <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                  {fBase.toLocaleString()} N
                </td>
                <td className="py-3 px-3 font-bold text-slate-900 dark:text-white tabular-nums">
                  {Math.round(fCurrent).toLocaleString()} N
                </td>
                <td className="py-3 px-3 tabular-nums">
                  <span className={fDeltaPct < -40 ? 'text-red-500 font-bold' : fDeltaPct < -20 ? 'text-amber-500' : 'text-emerald-500'}>
                    {fDeltaPct.toFixed(1)}%
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    fDeltaPct < -40 ? 'bg-red-500/10 text-red-500' :
                    fDeltaPct < -20 ? 'bg-amber-500/10 text-amber-500' :
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {fDeltaPct < -40 ? 'LOOSE' : fDeltaPct < -20 ? 'RELAXED' : 'TIGHT'}
                  </span>
                </td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                  Thermal Gradient ΔT
                </td>
                <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                  +{tBase.toFixed(1)} °C
                </td>
                <td className="py-3 px-3 font-bold text-slate-900 dark:text-white tabular-nums">
                  +{tCurrent.toFixed(1)} °C
                </td>
                <td className="py-3 px-3 tabular-nums">
                  <span className={tDelta > 20 ? 'text-red-500 font-bold' : tDelta > 10 ? 'text-amber-500' : 'text-emerald-500'}>
                    {tDelta >= 0 ? `+${tDelta.toFixed(1)} °C` : `${tDelta.toFixed(1)} °C`}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    tDelta > 20 ? 'bg-red-500/10 text-red-500' :
                    tDelta > 10 ? 'bg-amber-500/10 text-amber-500' :
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {tDelta > 20 ? 'HOT-SPOT' : tDelta > 10 ? 'ELEVATED' : 'STABLE'}
                  </span>
                </td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                  Power Loss Dissipation
                </td>
                <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                  {pBase.toFixed(2)} W
                </td>
                <td className="py-3 px-3 font-bold text-slate-900 dark:text-white tabular-nums">
                  {pCurrent.toFixed(2)} W
                </td>
                <td className="py-3 px-3 tabular-nums">
                  <span className={pDelta > 5 ? 'text-red-500 font-bold' : pDelta > 2 ? 'text-amber-500' : 'text-emerald-500'}>
                    {pDelta >= 0 ? `+${pDelta.toFixed(2)} W` : `${pDelta.toFixed(2)} W`}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    pDelta > 5 ? 'bg-red-500/10 text-red-500' :
                    pDelta > 2 ? 'bg-amber-500/10 text-amber-500' :
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {pDelta > 5 ? 'EXCESS JOULE' : pDelta > 2 ? 'WARM' : 'NORMAL'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Physical Inspection Checklist */}
      <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              Prescriptive Physical Inspection Checklist
            </h3>
            <p className="text-xs text-slate-400">
              Interactive IEEE / IEC standard field inspection protocol for de-energized joint service
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {checklist.filter(c => c.completed).length} / {checklist.length} Completed
          </span>
        </div>

        <div className="space-y-3">
          {checklist.map(item => (
            <div
              key={item.id}
              onClick={() => toggleChecklistItem(item.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                item.completed
                  ? 'bg-slate-50 dark:bg-navy-900/40 border-slate-200 dark:border-navy-700/60 opacity-80'
                  : 'bg-white dark:bg-navy-800 border-copper-500/30 hover:border-copper-500 shadow-sm'
              }`}
            >
              <button
                className="mt-0.5 text-copper-500 focus:outline-none flex-shrink-0"
                aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {item.completed ? (
                  <CheckSquare className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </button>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      item.completed
                        ? 'line-through text-slate-400 dark:text-slate-400'
                        : 'text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {item.task}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-700 text-slate-500 dark:text-slate-400">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
