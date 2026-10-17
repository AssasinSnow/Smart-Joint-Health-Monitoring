import React from 'react';
import { MetricCard } from '../common/MetricCard';
import { Zap, Flame, Gauge } from 'lucide-react';
import { ProcessedTelemetryPoint } from '../../types/telemetry';
import { JointBaselines, JointThresholds } from '../../types/config';

interface DerivedCardsProps {
  currentPoint: ProcessedTelemetryPoint | null;
  baselines: JointBaselines;
  thresholds: JointThresholds;
}

export const DerivedCards: React.FC<DerivedCardsProps> = ({
  currentPoint,
  baselines,
  thresholds
}) => {
  // 1. Resistance
  const isInsufficientCurrent =
    !currentPoint ||
    currentPoint.current_A < thresholds.minCurrentThreshold_A ||
    currentPoint.resistance_mOhm === null;

  const resistanceVal = currentPoint?.resistance_mOhm;
  let resistanceStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
  if (resistanceVal !== null && resistanceVal !== undefined) {
    if (resistanceVal >= thresholds.resistanceCrit_mOhm) resistanceStatus = 'CRITICAL';
    else if (resistanceVal >= thresholds.resistanceWarn_mOhm) resistanceStatus = 'WARNING';
  }

  // 2. Power Loss
  const powerLoss_W = currentPoint?.powerLoss_W ?? 0;
  let powerStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
  if (powerLoss_W > 10.0) powerStatus = 'CRITICAL';
  else if (powerLoss_W > 4.0) powerStatus = 'WARNING';

  // 3. Temp Rise
  const tempRise_C = currentPoint?.tempRise_C ?? 0;
  let tempRiseStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
  if (tempRise_C >= thresholds.tempRiseCrit_C) tempRiseStatus = 'CRITICAL';
  else if (tempRise_C >= thresholds.tempRiseWarn_C) tempRiseStatus = 'WARNING';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Contact Resistance */}
      <MetricCard
        title="Contact Resistance (R)"
        sensorType="Vdrop / I (Holm Constriction)"
        value={isInsufficientCurrent ? null : resistanceVal}
        unit={isInsufficientCurrent ? undefined : 'mΩ'}
        decimals={3}
        status={isInsufficientCurrent ? undefined : resistanceStatus}
        icon={<Zap className="w-5 h-5" />}
        baselineText={`${baselines.baselineResistance_mOhm.toFixed(3)} mΩ (Nominal)`}
        alertText={isInsufficientCurrent ? `Insufficient current (< ${thresholds.minCurrentThreshold_A.toFixed(1)} A)` : undefined}
      />

      {/* Power Loss */}
      <MetricCard
        title="Joint Power Loss (Ploss)"
        sensorType="Vdrop × I / 1000 (Joule Heating)"
        value={powerLoss_W}
        unit="W"
        decimals={2}
        status={powerStatus}
        icon={<Flame className="w-5 h-5" />}
        baselineText={`${baselines.nominalPowerLoss_W.toFixed(2)} W (at ${baselines.nominalCurrent_A} A)`}
        subValue={currentPoint ? `I²R dissipation` : undefined}
      />

      {/* Temperature Rise */}
      <MetricCard
        title="Temperature Rise (ΔT)"
        sensorType="T_joint - T_ambient (Thermal Gradient)"
        value={tempRise_C}
        unit="°C"
        decimals={1}
        status={tempRiseStatus}
        icon={<Gauge className="w-5 h-5" />}
        baselineText={`+${baselines.baselineTempRise_C.toFixed(1)} °C (Nominal)`}
        subValue={
          currentPoint
            ? `${currentPoint.tempJoint_C.toFixed(1)}° - ${currentPoint.tempAmbient_C.toFixed(1)}°`
            : undefined
        }
      />
    </div>
  );
};
