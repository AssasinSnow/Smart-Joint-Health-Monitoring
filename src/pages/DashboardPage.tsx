import React from 'react';
import { useJointStore } from '../store/useJointStore';
import { RadialJhiGauge } from '../components/dashboard/RadialJhiGauge';
import { SensorCard } from '../components/dashboard/SensorCard';
import { DerivedCards } from '../components/dashboard/DerivedCards';
import { RecentAlertsCard } from '../components/dashboard/RecentAlertsCard';
import { QuickActionsCard } from '../components/dashboard/QuickActionsCard';
import { Zap, Activity, Scale, Thermometer } from 'lucide-react';
import { exportToCsv } from '../lib/formatters';

export const DashboardPage: React.FC = () => {
  const {
    currentPoint,
    rollingHistory,
    config,
    alerts,
    activeScenario,
    setDemoScenario,
    acknowledgeAlert,
    snapshotCurrentAsBaseline
  } = useJointStore();

  // Extract rolling sparkline data series
  const vDropHistory = rollingHistory.map(p => p.vDrop_mV);
  const currentHistory = rollingHistory.map(p => p.current_A);
  const forceHistory = rollingHistory.map(p => p.force_N);
  const tempHistory = rollingHistory.map(p => p.tempJoint_C);

  // Status evaluations for the 4 sensor cards
  const getForceStatus = (f: number) => {
    if (f < config.thresholds.forceCrit_N) return 'CRITICAL';
    if (f < config.thresholds.forceWarn_N) return 'WARNING';
    return 'HEALTHY';
  };

  const getCurrentStatus = (i: number) => {
    if (i >= config.thresholds.overloadCurrent_A) return 'CRITICAL';
    if (i >= config.thresholds.ratedCurrent_A) return 'WARNING';
    return 'HEALTHY';
  };

  const getTempStatus = (t: number) => {
    if (t >= config.thresholds.jointTempCrit_C || t === -127) return 'CRITICAL';
    if (t >= config.thresholds.jointTempWarn_C) return 'WARNING';
    return 'HEALTHY';
  };

  const handleExportCsv = () => {
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
    exportToCsv(flat, `smart_joint_telemetry_${Date.now()}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Hero Section: JHI Gauge & Quick Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-7 xl:col-span-8">
          <RadialJhiGauge
            jhi={currentPoint?.jhi ?? 100}
            status={currentPoint?.status ?? 'HEALTHY'}
            subScores={
              currentPoint
                ? {
                    resistanceScore: currentPoint.resistance_mOhm
                      ? Math.max(0, Math.min(100, 100 * (1 - (currentPoint.resistance_mOhm - config.baselines.baselineResistance_mOhm) / (config.thresholds.resistanceCrit_mOhm - config.baselines.baselineResistance_mOhm))))
                      : 100,
                    tempRiseScore: Math.max(0, Math.min(100, 100 * (1 - (currentPoint.tempRise_C - config.baselines.baselineTempRise_C) / (config.thresholds.tempRiseCrit_C - config.baselines.baselineTempRise_C)))),
                    forceScore: Math.max(0, Math.min(100, 100 * ((currentPoint.force_N - config.thresholds.forceCrit_N) / (config.baselines.baselineForce_N - config.thresholds.forceCrit_N)))),
                    powerLossScore: Math.max(0, Math.min(100, 100 * (1 - (currentPoint.powerLoss_W - config.baselines.nominalPowerLoss_W) / 10)))
                  }
                : undefined
            }
            force_N={currentPoint?.force_N}
          />
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          <QuickActionsCard
            activeScenario={activeScenario}
            onSelectScenario={setDemoScenario}
            onSnapshotBaseline={snapshotCurrentAsBaseline}
            onExportCsv={handleExportCsv}
          />
        </div>
      </div>

      {/* Primary Hardware Sensor Telemetry Cards (4-column responsive) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Hardware Sensor Telemetry
          </h2>
          <span className="text-xs font-mono text-slate-400">Sampling Rate: 1.0 Hz</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Voltage Drop */}
          <SensorCard
            title="Joint Voltage Drop (Vdrop)"
            sensorType="ADS1115 (16-bit Diff ADC)"
            value={currentPoint?.vDrop_mV}
            unit="mV"
            decimals={2}
            status="HEALTHY"
            icon={<Zap className="w-4 h-4 text-copper-500" />}
            baselineText="8.00 mV @ 200 A"
            historyData={vDropHistory}
            sparklineColor="#F59E0B"
          />

          {/* 2. Load Current */}
          <SensorCard
            title="Load Current (I)"
            sensorType="ACS758 (Hall Transducer)"
            value={currentPoint?.current_A}
            unit="A"
            decimals={1}
            status={currentPoint ? getCurrentStatus(currentPoint.current_A) : 'HEALTHY'}
            icon={<Activity className="w-4 h-4 text-cyan-500" />}
            baselineText={`Rated: ${config.thresholds.ratedCurrent_A} A`}
            historyData={currentHistory}
            sparklineColor="#38BDF8"
          />

          {/* 3. Clamping Force */}
          <SensorCard
            title="Contact Force (F)"
            sensorType="HX711 + Load Cell"
            value={currentPoint?.force_N}
            unit="N"
            decimals={0}
            status={currentPoint ? getForceStatus(currentPoint.force_N) : 'HEALTHY'}
            icon={<Scale className="w-4 h-4 text-emerald-500" />}
            baselineText={`Target: ${config.baselines.baselineForce_N.toLocaleString()} N`}
            historyData={forceHistory}
            sparklineColor="#10B981"
          />

          {/* 4. Joint Temperature */}
          <SensorCard
            title="Joint Temperature (T)"
            sensorType="DS18B20 1-Wire Digital"
            value={currentPoint?.tempJoint_C}
            unit="°C"
            decimals={1}
            status={currentPoint ? getTempStatus(currentPoint.tempJoint_C) : 'HEALTHY'}
            icon={<Thermometer className="w-4 h-4 text-red-500" />}
            baselineText={`Amb: ${currentPoint?.tempAmbient_C.toFixed(1) ?? '--'} °C`}
            subValue={currentPoint ? `Amb: ${currentPoint.tempAmbient_C.toFixed(1)}°C` : undefined}
            historyData={tempHistory}
            sparklineColor="#EF4444"
          />
        </div>
      </div>

      {/* Derived Physics Electrical Parameters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Derived Electrical &amp; Thermal Properties
          </h2>
          <span className="text-xs font-mono text-slate-400">Physics Computed Edge Telemetry</span>
        </div>

        <DerivedCards
          currentPoint={currentPoint}
          baselines={config.baselines}
          thresholds={config.thresholds}
        />
      </div>

      {/* Recent Alerts List */}
      <RecentAlertsCard
        alerts={alerts}
        onAcknowledge={acknowledgeAlert}
      />
    </div>
  );
};
