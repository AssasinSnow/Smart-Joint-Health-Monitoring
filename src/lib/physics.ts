import {
  RawTelemetryPacket,
  ResistanceStatus,
  ProcessedTelemetryPoint
} from '../types/telemetry';
import {
  JointBaselines,
  JointThresholds,
  JhiWeights
} from '../types/config';

export const DEFAULT_BASELINES: JointBaselines = {
  baselineResistance_mOhm: 0.040, // 40 micro-ohms
  baselineForce_N: 12000,         // 12 kN for M10 bolted joint at 45 N·m
  baselineTempRise_C: 8.0,        // 8 °C temperature rise at nominal load
  nominalCurrent_A: 200,          // 200 A nominal load
  nominalPowerLoss_W: 1.6         // P = (200 A)^2 * 0.040 mΩ = 1.6 W
};

export const DEFAULT_THRESHOLDS: JointThresholds = {
  minCurrentThreshold_A: 1.0,     // Guard against near-zero current
  resistanceWarn_mOhm: 0.065,     // Warning at +62.5% degradation
  resistanceCrit_mOhm: 0.095,     // Critical at +137.5% degradation
  forceWarn_N: 8500,              // Warning if clamping force drops below 8.5 kN
  forceCrit_N: 5000,              // Critical if force drops below 5.0 kN
  jointTempWarn_C: 70.0,          // Warning joint temperature
  jointTempCrit_C: 85.0,          // Critical joint temperature (annealing onset)
  tempRiseWarn_C: 30.0,           // Warning thermal gradient
  tempRiseCrit_C: 45.0,           // Critical thermal gradient
  ratedCurrent_A: 250.0,          // Maximum continuous rated ampacity
  overloadCurrent_A: 275.0        // Trip/overload threshold
};

export const DEFAULT_WEIGHTS: JhiWeights = {
  resistance: 0.35,
  tempRise: 0.30,
  force: 0.25,
  powerLoss: 0.10
};

/**
 * Calculates joint contact resistance with near-zero current guard.
 * Formula: R (mΩ) = Vdrop (mV) / Current (A)
 * 1 mV / 1 A = (1e-3 V) / 1 A = 1e-3 Ω = 1 mΩ
 */
export function calculateResistance(
  vDrop_mV: number,
  current_A: number,
  minCurrentThreshold_A: number = DEFAULT_THRESHOLDS.minCurrentThreshold_A
): ResistanceStatus {
  // Sensor anomaly guard
  if (vDrop_mV < -0.2 || isNaN(vDrop_mV) || isNaN(current_A)) {
    return {
      status: 'SENSOR_FAULT',
      reason: 'Negative or invalid voltage drop detected'
    };
  }

  // Guard against near-zero current:
  // Division by near-zero current results in noisy or infinite resistance values
  if (current_A < minCurrentThreshold_A) {
    return {
      status: 'INSUFFICIENT_CURRENT',
      reason: `Insufficient current (I = ${current_A.toFixed(2)} A < ${minCurrentThreshold_A.toFixed(1)} A)`
    };
  }

  const resistance_mOhm = vDrop_mV / current_A;
  return {
    status: 'VALID',
    value_mOhm: Number(resistance_mOhm.toFixed(4))
  };
}

/**
 * Calculates power loss dissipated as heat in the bolted joint.
 * Formula: P (W) = Vdrop (mV) * Current (A) / 1000
 */
export function calculatePowerLoss(vDrop_mV: number, current_A: number): number {
  if (current_A <= 0 || vDrop_mV <= 0 || isNaN(vDrop_mV) || isNaN(current_A)) {
    return 0;
  }
  const power_W = (vDrop_mV * current_A) / 1000.0;
  return Number(power_W.toFixed(3));
}

/**
 * Calculates temperature rise above ambient.
 * Formula: ΔT = T_joint - T_ambient
 */
export function calculateTempRise(tempJoint_C: number, tempAmbient_C: number): number {
  if (isNaN(tempJoint_C) || isNaN(tempAmbient_C)) {
    return 0;
  }
  return Number((tempJoint_C - tempAmbient_C).toFixed(1));
}

/**
 * Normalizes physical sub-scores (0 to 100) based on baseline and critical thresholds.
 */
export function calculateSubScores(
  raw: RawTelemetryPacket,
  resistance: ResistanceStatus,
  tempRise_C: number,
  baselines: JointBaselines = DEFAULT_BASELINES,
  thresholds: JointThresholds = DEFAULT_THRESHOLDS
) {
  // 1. Resistance Sub-score (SR)
  let resistanceScore = 100;
  if (resistance.status === 'VALID') {
    const r = resistance.value_mOhm;
    const r0 = baselines.baselineResistance_mOhm;
    const rcrit = thresholds.resistanceCrit_mOhm;
    if (r <= r0) {
      resistanceScore = 100;
    } else if (r >= rcrit) {
      resistanceScore = 0;
    } else {
      resistanceScore = Math.max(0, Math.min(100, 100 * (1 - (r - r0) / (rcrit - r0))));
    }
  } else if (resistance.status === 'SENSOR_FAULT') {
    resistanceScore = 0;
  } else {
    // Insufficient current: hold default healthy score so unpowered busbar does not alarm
    resistanceScore = 100;
  }

  // 2. Temperature Rise Sub-score (ST)
  let tempRiseScore = 100;
  const t0 = baselines.baselineTempRise_C;
  const tcrit = thresholds.tempRiseCrit_C;
  if (tempRise_C <= t0) {
    tempRiseScore = 100;
  } else if (tempRise_C >= tcrit) {
    tempRiseScore = 0;
  } else {
    tempRiseScore = Math.max(0, Math.min(100, 100 * (1 - (tempRise_C - t0) / (tcrit - t0))));
  }

  // 3. Clamping Force Sub-score (SF)
  let forceScore = 100;
  const f = raw.force_N;
  const f0 = baselines.baselineForce_N;
  const fcrit = thresholds.forceCrit_N;
  if (f >= f0) {
    forceScore = 100;
  } else if (f <= fcrit) {
    forceScore = 0;
  } else {
    forceScore = Math.max(0, Math.min(100, 100 * ((f - fcrit) / (f0 - fcrit))));
  }

  // 4. Power Loss Sub-score (SP)
  let powerLossScore = 100;
  const p = calculatePowerLoss(raw.vDrop_mV, raw.current_A);
  const p0 = baselines.nominalPowerLoss_W;
  const pcrit = (thresholds.ratedCurrent_A * thresholds.resistanceCrit_mOhm * thresholds.ratedCurrent_A) / 1000;
  if (p <= p0) {
    powerLossScore = 100;
  } else if (p >= pcrit) {
    powerLossScore = 0;
  } else {
    powerLossScore = Math.max(0, Math.min(100, 100 * (1 - (p - p0) / (pcrit - p0))));
  }

  return {
    resistanceScore: Number(resistanceScore.toFixed(1)),
    tempRiseScore: Number(tempRiseScore.toFixed(1)),
    forceScore: Number(forceScore.toFixed(1)),
    powerLossScore: Number(powerLossScore.toFixed(1))
  };
}

/**
 * Validates that JHI weights sum to 1.0 (within epsilon tolerance).
 */
export function validateWeights(weights: JhiWeights): boolean {
  const sum = weights.resistance + weights.tempRise + weights.force + weights.powerLoss;
  return Math.abs(sum - 1.0) < 0.001;
}

/**
 * Calculates Joint Health Index (JHI) score (0–100) and overall categorical status.
 */
export function calculateJHI(
  subScores: {
    resistanceScore: number;
    tempRiseScore: number;
    forceScore: number;
    powerLossScore: number;
  },
  weights: JhiWeights = DEFAULT_WEIGHTS
): { jhi: number; healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' } {
  // Normalize weights if slightly drifting
  const sum = weights.resistance + weights.tempRise + weights.force + weights.powerLoss;
  const wR = weights.resistance / sum;
  const wT = weights.tempRise / sum;
  const wF = weights.force / sum;
  const wP = weights.powerLoss / sum;

  const rawJhi =
    subScores.resistanceScore * wR +
    subScores.tempRiseScore * wT +
    subScores.forceScore * wF +
    subScores.powerLossScore * wP;

  const jhi = Math.max(0, Math.min(100, Math.round(rawJhi)));

  let healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
  if (jhi < 50) {
    healthStatus = 'CRITICAL';
  } else if (jhi < 80) {
    healthStatus = 'WARNING';
  }

  return { jhi, healthStatus };
}

/**
 * Full derivation pipeline for a raw telemetry packet.
 */
export function processTelemetryPacket(
  packet: RawTelemetryPacket,
  baselines: JointBaselines = DEFAULT_BASELINES,
  thresholds: JointThresholds = DEFAULT_THRESHOLDS,
  weights: JhiWeights = DEFAULT_WEIGHTS
): ProcessedTelemetryPoint {
  const resistance = calculateResistance(
    packet.vDrop_mV,
    packet.current_A,
    thresholds.minCurrentThreshold_A
  );
  const powerLoss_W = calculatePowerLoss(packet.vDrop_mV, packet.current_A);
  const tempRise_C = calculateTempRise(packet.tempJoint_C, packet.tempAmbient_C);
  const subScores = calculateSubScores(packet, resistance, tempRise_C, baselines, thresholds);
  const { jhi, healthStatus } = calculateJHI(subScores, weights);

  let resistance_mOhm: number | null = null;
  let resistanceStatusText = 'Insufficient current';

  if (resistance.status === 'VALID') {
    resistance_mOhm = resistance.value_mOhm;
    resistanceStatusText = `${resistance.value_mOhm.toFixed(3)} mΩ`;
  } else if (resistance.status === 'SENSOR_FAULT') {
    resistanceStatusText = 'Sensor fault';
  }

  return {
    ...packet,
    resistance_mOhm,
    resistanceStatusText,
    powerLoss_W,
    tempRise_C,
    jhi,
    status: healthStatus
  };
}
