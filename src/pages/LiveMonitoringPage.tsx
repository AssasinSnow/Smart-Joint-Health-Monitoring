import React, { useState, useEffect } from 'react';
import { useJointStore } from '../store/useJointStore';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { Play, Pause, Download, WifiOff } from 'lucide-react';
import { formatTimeString, exportToCsv } from '../lib/formatters';
import { db } from '../lib/db';
import { ProcessedTelemetryPoint } from '../types/telemetry';

type TimeRange = '1m' | '5m' | '1h' | '24h' | '7d';

export const LiveMonitoringPage: React.FC = () => {
  const {
    rollingHistory,
    isStreamingPaused,
    togglePauseStream,
    lastPacketTime,
    config
  } = useJointStore();

  const [timeRange, setTimeRange] = useState<TimeRange>('1m');
  const [historicalData, setHistoricalData] = useState<ProcessedTelemetryPoint[]>([]);
  const [isStale, setIsStale] = useState<boolean>(false);

  // Check for stale data (> 5 seconds without new packet)
  useEffect(() => {
    const checkStale = () => {
      if (!lastPacketTime) {
        setIsStale(true);
        return;
      }
      const elapsed = Date.now() - lastPacketTime;
      setIsStale(elapsed > 5000);
    };

    const interval = setInterval(checkStale, 1000);
    checkStale();
    return () => clearInterval(interval);
  }, [lastPacketTime]);

  // Load appropriate data window
  useEffect(() => {
    if (timeRange === '1m') {
      // Use rolling live memory buffer
      setHistoricalData(rollingHistory.slice(-60));
    } else if (timeRange === '5m') {
      setHistoricalData(rollingHistory);
    } else {
      // Query IndexedDB for broader historical horizons
      const now = Date.now();
      const horizonMs =
        timeRange === '1h' ? 3600000 : timeRange === '24h' ? 86400000 : 7 * 86400000;
      const minTimestamp = now - horizonMs;

      db.telemetry
        .where('timestamp')
        .above(minTimestamp)
        .limit(300)
        .toArray()
        .then(pts => {
          if (pts.length > 0) {
            setHistoricalData(pts);
          } else {
            setHistoricalData(rollingHistory);
          }
        })
        .catch(() => {
          setHistoricalData(rollingHistory);
        });
    }
  }, [timeRange, rollingHistory]);

  const displayData = timeRange === '1m' ? rollingHistory.slice(-60) : historicalData;

  // Chart data formatting
  const chartPoints = displayData.map(p => ({
    time: formatTimeString(p.timestamp),
    timestamp: p.timestamp,
    vDrop: p.vDrop_mV,
    current: p.current_A,
    force: p.force_N,
    tempJoint: p.tempJoint_C,
    tempAmbient: p.tempAmbient_C,
    resistance: p.resistance_mOhm,
    powerLoss: p.powerLoss_W,
    jhi: p.jhi
  }));

  const handleExport = () => {
    if (displayData.length === 0) return;
    const flat = displayData.map(p => ({
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
      Status: p.status
    }));
    exportToCsv(flat, `joint_stream_${timeRange}_${Date.now()}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-navy-800 p-4 rounded-xl border border-slate-200 dark:border-navy-700 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Multi-Channel Telemetry Stream
            {isStreamingPaused && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono">
                PAUSED
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Synchronized 4-channel real-time electrical, thermal, and mechanical sensor wave analysis
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time range buttons */}
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-navy-900 p-1 border border-slate-200 dark:border-navy-700 text-xs font-mono font-medium">
            {(['1m', '5m', '1h', '24h', '7d'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  timeRange === range
                    ? 'bg-copper-500 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Pause / Resume Button */}
          <button
            onClick={togglePauseStream}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              isStreamingPaused
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-100 dark:bg-navy-700 border-slate-200 dark:border-navy-600 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
            }`}
          >
            {isStreamingPaused ? (
              <>
                <Play className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                <span>Resume Stream</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Stream</span>
              </>
            )}
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-navy-700 border border-slate-200 dark:border-navy-600 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-copper-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Stale Data Overlay Notice if packet stream drops for > 5 seconds */}
      {isStale && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-3 text-amber-800 dark:text-amber-200 animate-pulse">
          <div className="flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <span className="text-sm font-bold block">Telemetry Stream Interrupted / Stale</span>
              <p className="text-xs">
                No new telemetry packets received in the last &gt;5 seconds. Visualized curves represent last captured buffer.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
            HOLDING BUFFER
          </span>
        </div>
      )}

      {/* 4 Synchronized Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Contact Resistance R (mΩ) */}
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-copper-500" />
                Contact Resistance R (mΩ)
              </h3>
              <p className="text-xs text-slate-400">Vdrop / I with Near-Zero Current Guard</p>
            </div>
            <span className="text-xs font-mono font-bold text-copper-500">
              Warn: {config.thresholds.resistanceWarn_mOhm.toFixed(3)} mΩ
            </span>
          </div>

          <div className="h-52 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartPoints} syncId="jointSync">
                <defs>
                  <linearGradient id="colorResistance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  domain={[0.02, 0.1]}
                  tickFormatter={v => v.toFixed(3)}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontFamily: 'monospace'
                  }}
                  formatter={(val: any) => [`${Number(val).toFixed(4)} mΩ`, 'Resistance']}
                />
                <ReferenceLine
                  y={config.baselines.baselineResistance_mOhm}
                  stroke="#10B981"
                  strokeDasharray="4 4"
                  label={{ value: 'Baseline', fill: '#10B981', fontSize: 10, position: 'right' }}
                />
                <ReferenceLine
                  y={config.thresholds.resistanceWarn_mOhm}
                  stroke="#F59E0B"
                  strokeDasharray="3 3"
                  label={{ value: 'Warn', fill: '#F59E0B', fontSize: 10, position: 'right' }}
                />
                <Area
                  type="monotone"
                  dataKey="resistance"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorResistance)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Temperatures (°C) */}
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Joint &amp; Ambient Temperatures (°C)
              </h3>
              <p className="text-xs text-slate-400">DS18B20 1-Wire Digital Sensors</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-red-500 font-semibold">● Joint</span>
              <span className="text-cyan-400 font-semibold">● Ambient</span>
            </div>
          </div>

          <div className="h-52 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartPoints} syncId="jointSync">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  domain={[20, 95]}
                  tickFormatter={v => `${v}°`}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontFamily: 'monospace'
                  }}
                  formatter={(val: any, name: any) => [
                    `${Number(val).toFixed(1)} °C`,
                    name === 'tempJoint' ? 'Joint Temp' : 'Ambient Temp'
                  ]}
                />
                <ReferenceLine
                  y={config.thresholds.jointTempCrit_C}
                  stroke="#EF4444"
                  strokeDasharray="3 3"
                  label={{ value: 'Crit 85°C', fill: '#EF4444', fontSize: 10, position: 'right' }}
                />
                <Line
                  type="monotone"
                  dataKey="tempJoint"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="tempAmbient"
                  stroke="#38BDF8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Current Load I (A) */}
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                Busbar Load Current I (A)
              </h3>
              <p className="text-xs text-slate-400">ACS758 Hall-Effect Current Transducer</p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-500">
              Rated: {config.thresholds.ratedCurrent_A} A
            </span>
          </div>

          <div className="h-52 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartPoints} syncId="jointSync">
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  domain={[0, 300]}
                  tickFormatter={v => `${v}A`}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontFamily: 'monospace'
                  }}
                  formatter={(val: any) => [`${Number(val).toFixed(1)} A`, 'Load Current']}
                />
                <ReferenceLine
                  y={config.thresholds.ratedCurrent_A}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  label={{ value: 'Rated', fill: '#F59E0B', fontSize: 10, position: 'right' }}
                />
                <ReferenceLine
                  y={config.thresholds.overloadCurrent_A}
                  stroke="#EF4444"
                  strokeDasharray="3 3"
                  label={{ value: 'Trip Overload', fill: '#EF4444', fontSize: 10, position: 'right' }}
                />
                <Area
                  type="monotone"
                  dataKey="current"
                  stroke="#0284C7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCurrent)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Clamping Force F (N) */}
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Bolt Clamping Tension Force F (N)
              </h3>
              <p className="text-xs text-slate-400">HX711 24-bit Strain Gauge Load Cell</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-500">
              Target: {config.baselines.baselineForce_N.toLocaleString()} N
            </span>
          </div>

          <div className="h-52 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartPoints} syncId="jointSync">
                <defs>
                  <linearGradient id="colorForce" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  domain={[3000, 14000]}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontFamily: 'monospace'
                  }}
                  formatter={(val: any) => [`${Math.round(Number(val)).toLocaleString()} N`, 'Contact Force']}
                />
                <ReferenceLine
                  y={config.baselines.baselineForce_N}
                  stroke="#10B981"
                  strokeDasharray="4 4"
                  label={{ value: 'Target 12kN', fill: '#10B981', fontSize: 10, position: 'right' }}
                />
                <ReferenceLine
                  y={config.thresholds.forceWarn_N}
                  stroke="#F59E0B"
                  strokeDasharray="3 3"
                  label={{ value: 'Warn 8.5kN', fill: '#F59E0B', fontSize: 10, position: 'right' }}
                />
                <ReferenceLine
                  y={config.thresholds.forceCrit_N}
                  stroke="#EF4444"
                  strokeDasharray="3 3"
                  label={{ value: 'Crit 5.0kN', fill: '#EF4444', fontSize: 10, position: 'right' }}
                />
                <Area
                  type="monotone"
                  dataKey="force"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorForce)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
