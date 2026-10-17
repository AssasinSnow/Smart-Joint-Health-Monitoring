import { describe, it, expect } from 'vitest';
import { FaultClassifier } from '../faultClassifier';
import { RawTelemetryPacket } from '../../types/telemetry';

describe('FaultClassifier Engine', () => {
  const classifier = new FaultClassifier();

  const nominalPacket: RawTelemetryPacket = {
    timestamp: Date.now(),
    vDrop_mV: 8.0,
    current_A: 200.0,
    force_N: 12000,
    tempJoint_C: 38.0,
    tempAmbient_C: 30.0
  };

  it('detects no faults in nominal pristine joint conditions', () => {
    const result = classifier.classify(nominalPacket);
    expect(result.hasActiveFaults).toBe(false);
    expect(result.primaryFault).toBeNull();
    expect(result.indicators.looseningRisk).toBe(0);
    expect(result.indicators.sensorIntegrity).toBe('OK');
  });

  it('detects clamping bolt relaxation (FLT_LOOSENING warning)', () => {
    const loosePacket: RawTelemetryPacket = {
      ...nominalPacket,
      force_N: 7500 // Below 8500 N warning threshold
    };
    const result = classifier.classify(loosePacket);
    expect(result.hasActiveFaults).toBe(true);
    expect(result.detectedFaults.some(f => f.faultCode === 'FLT_LOOSENING')).toBe(true);
    expect(result.primaryFault?.severity).toBe('WARNING');
    expect(result.indicators.looseningRisk).toBeGreaterThan(30);
  });

  it('detects severe clamping bolt loss (FLT_LOOSENING critical)', () => {
    const criticalLoosePacket: RawTelemetryPacket = {
      ...nominalPacket,
      force_N: 4200 // Below 5000 N critical threshold
    };
    const result = classifier.classify(criticalLoosePacket);
    expect(result.hasActiveFaults).toBe(true);
    const looseningFault = result.detectedFaults.find(f => f.faultCode === 'FLT_LOOSENING');
    expect(looseningFault?.severity).toBe('CRITICAL');
  });

  it('detects interfacial oxidation under full clamping force (FLT_OXIDATION)', () => {
    // Force is intact (12000 N), but Vdrop is high (16.0 mV at 200 A = 0.080 mΩ > 0.065 mΩ warn)
    const oxidizedPacket: RawTelemetryPacket = {
      ...nominalPacket,
      force_N: 12000,
      vDrop_mV: 16.0,
      current_A: 200.0
    };
    const result = classifier.classify(oxidizedPacket);
    expect(result.hasActiveFaults).toBe(true);
    expect(result.detectedFaults.some(f => f.faultCode === 'FLT_OXIDATION')).toBe(true);
    expect(result.indicators.oxidationRisk).toBeGreaterThan(40);
  });

  it('detects overcurrent and thermal overload (FLT_OVERLOAD)', () => {
    const overloadPacket: RawTelemetryPacket = {
      ...nominalPacket,
      current_A: 290.0, // Exceeds 275 A
      tempJoint_C: 92.0 // Exceeds 85 °C
    };
    const result = classifier.classify(overloadPacket);
    expect(result.hasActiveFaults).toBe(true);
    expect(result.detectedFaults.some(f => f.faultCode === 'FLT_OVERLOAD')).toBe(true);
    expect(result.primaryFault?.severity).toBe('CRITICAL');
  });

  it('detects sensor dropout on DS18B20 1-wire disconnect (-127°C error code)', () => {
    const dropoutPacket: RawTelemetryPacket = {
      ...nominalPacket,
      tempJoint_C: -127
    };
    const result = classifier.classify(dropoutPacket);
    expect(result.hasActiveFaults).toBe(true);
    expect(result.detectedFaults.some(f => f.faultCode === 'FLT_SENSOR_DROPOUT')).toBe(true);
    expect(result.indicators.sensorIntegrity).toBe('FAULT');
  });
});
