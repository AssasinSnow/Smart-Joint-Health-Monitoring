import { describe, it, expect } from 'vitest';
import {
  calculateResistance,
  calculatePowerLoss,
  calculateTempRise,
  calculateSubScores,
  calculateJHI,
  validateWeights,
  DEFAULT_BASELINES,
  DEFAULT_THRESHOLDS,
  DEFAULT_WEIGHTS
} from '../physics';
import { RawTelemetryPacket } from '../../types/telemetry';

describe('Physics Engine: calculateResistance', () => {
  it('calculates accurate resistance in mΩ under nominal current', () => {
    // 8.0 mV at 200 A = 0.040 mΩ
    const result = calculateResistance(8.0, 200.0);
    expect(result.status).toBe('VALID');
    if (result.status === 'VALID') {
      expect(result.value_mOhm).toBe(0.040);
    }
  });

  it('activates near-zero current guard when current < threshold', () => {
    // 0.4 A is below default 1.0 A guard
    const result = calculateResistance(0.02, 0.4);
    expect(result.status).toBe('INSUFFICIENT_CURRENT');
    if (result.status === 'INSUFFICIENT_CURRENT') {
      expect(result.reason).toContain('Insufficient current');
    }
  });

  it('activates near-zero current guard at zero current without division by zero', () => {
    const result = calculateResistance(0.0, 0.0);
    expect(result.status).toBe('INSUFFICIENT_CURRENT');
  });

  it('detects negative voltage drop as sensor fault', () => {
    const result = calculateResistance(-1.5, 100.0);
    expect(result.status).toBe('SENSOR_FAULT');
  });
});

describe('Physics Engine: calculatePowerLoss & calculateTempRise', () => {
  it('calculates joint power loss in Watts (P = Vdrop * I / 1000)', () => {
    // 10 mV * 200 A = 2000 mW = 2.0 W
    const power = calculatePowerLoss(10.0, 200.0);
    expect(power).toBe(2.0);
  });

  it('returns 0 W if current is zero or negative', () => {
    expect(calculatePowerLoss(10.0, 0)).toBe(0);
    expect(calculatePowerLoss(10.0, -5)).toBe(0);
  });

  it('calculates temperature rise (ΔT = T_joint - T_ambient)', () => {
    expect(calculateTempRise(45.5, 30.5)).toBe(15.0);
    expect(calculateTempRise(25.0, 25.0)).toBe(0.0);
  });
});

describe('Physics Engine: calculateJHI and Sub-scores', () => {
  const nominalPacket: RawTelemetryPacket = {
    timestamp: Date.now(),
    vDrop_mV: 8.0,
    current_A: 200.0,
    force_N: 12000,
    tempJoint_C: 38.0,
    tempAmbient_C: 30.0
  };

  it('yields 100 score and HEALTHY status for pristine baseline values', () => {
    const resistance = calculateResistance(nominalPacket.vDrop_mV, nominalPacket.current_A);
    const tempRise = calculateTempRise(nominalPacket.tempJoint_C, nominalPacket.tempAmbient_C);
    const subScores = calculateSubScores(nominalPacket, resistance, tempRise, DEFAULT_BASELINES, DEFAULT_THRESHOLDS);

    expect(subScores.resistanceScore).toBe(100);
    expect(subScores.forceScore).toBe(100);
    expect(subScores.tempRiseScore).toBe(100);
    expect(subScores.powerLossScore).toBe(100);

    const { jhi, healthStatus } = calculateJHI(subScores, DEFAULT_WEIGHTS);
    expect(jhi).toBe(100);
    expect(healthStatus).toBe('HEALTHY');
  });

  it('degrades JHI when clamping force drops severely', () => {
    const loosePacket: RawTelemetryPacket = {
      ...nominalPacket,
      force_N: 4500 // Below critical 5000 N
    };
    const resistance = calculateResistance(loosePacket.vDrop_mV, loosePacket.current_A);
    const tempRise = calculateTempRise(loosePacket.tempJoint_C, loosePacket.tempAmbient_C);
    const subScores = calculateSubScores(loosePacket, resistance, tempRise, DEFAULT_BASELINES, DEFAULT_THRESHOLDS);

    expect(subScores.forceScore).toBe(0);
    const { jhi } = calculateJHI(subScores, DEFAULT_WEIGHTS);
    expect(jhi).toBeLessThan(80);
  });

  it('validates weight distribution summing to 1.0', () => {
    expect(validateWeights(DEFAULT_WEIGHTS)).toBe(true);
    expect(validateWeights({ resistance: 0.5, tempRise: 0.2, force: 0.2, powerLoss: 0.1 })).toBe(true);
    expect(validateWeights({ resistance: 0.4, tempRise: 0.2, force: 0.2, powerLoss: 0.1 })).toBe(false);
  });
});
