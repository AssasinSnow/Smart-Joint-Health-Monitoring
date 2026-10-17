import { RawTelemetryPacket } from '../types/telemetry';
import { AlertItem, FaultClassificationResult } from '../types/alerts';
import { JointBaselines, JointThresholds } from '../types/config';
import { calculateResistance, calculateTempRise, DEFAULT_BASELINES, DEFAULT_THRESHOLDS } from './physics';

export class FaultClassifier {
  private baselines: JointBaselines;
  private thresholds: JointThresholds;

  constructor(
    baselines: JointBaselines = DEFAULT_BASELINES,
    thresholds: JointThresholds = DEFAULT_THRESHOLDS
  ) {
    this.baselines = baselines;
    this.thresholds = thresholds;
  }

  public updateConfig(baselines: JointBaselines, thresholds: JointThresholds) {
    this.baselines = baselines;
    this.thresholds = thresholds;
  }

  public classify(packet: RawTelemetryPacket): FaultClassificationResult {
    const detectedFaults: AlertItem[] = [];
    const now = packet.timestamp || Date.now();

    // 1. SENSOR DROPOUT & INTEGRITY CHECK
    let sensorIntegrity: 'OK' | 'DEGRADED' | 'FAULT' = 'OK';
    const isDs18b20Dropout =
      packet.tempJoint_C === -127 ||
      packet.tempJoint_C === 85 ||
      packet.tempAmbient_C === -127 ||
      packet.tempAmbient_C === 85 ||
      isNaN(packet.tempJoint_C) ||
      isNaN(packet.tempAmbient_C);

    const isForceDropout = packet.force_N < 0 || isNaN(packet.force_N);
    const isVdropDropout = packet.vDrop_mV < -0.2 || isNaN(packet.vDrop_mV);

    if (isDs18b20Dropout || isForceDropout || isVdropDropout) {
      sensorIntegrity = 'FAULT';
      detectedFaults.push({
        id: `sensor-dropout-${now}`,
        timestamp: now,
        severity: 'CRITICAL',
        faultCode: 'FLT_SENSOR_DROPOUT',
        title: 'Sensor Hardware Dropout / Fault',
        description: `Hardware error detected on busbar sensing chain: ${[
          isDs18b20Dropout ? 'DS18B20 1-wire disconnect (-127/85°C)' : '',
          isForceDropout ? 'HX711 negative/open strain gauge' : '',
          isVdropDropout ? 'ADS1115 negative/floating differential voltage' : ''
        ].filter(Boolean).join('; ')}`,
        triggerValue: `T_joint=${packet.tempJoint_C}°C, F=${packet.force_N}N, V=${packet.vDrop_mV}mV`,
        thresholdValue: 'Sensors in valid operational range',
        recommendedAction: 'Inspect 4.7kΩ 1-wire pullup resistor, load cell Wheatstone bridge excitation wires, and ADC differential shielding.',
        acknowledged: false,
        resolved: false
      });
    }

    // 2. OVERLOAD / THERMAL RUNAWAY CHECK
    const isOverCurrent = packet.current_A >= this.thresholds.overloadCurrent_A;
    const isOverTemp = packet.tempJoint_C >= this.thresholds.jointTempCrit_C;

    if (isOverCurrent || isOverTemp) {
      detectedFaults.push({
        id: `overload-${now}`,
        timestamp: now,
        severity: 'CRITICAL',
        faultCode: 'FLT_OVERLOAD',
        title: 'Busbar Overload / Critical Thermal Condition',
        description: isOverCurrent
          ? `Current load ${packet.current_A.toFixed(1)} A exceeds maximum trip rating (${this.thresholds.overloadCurrent_A} A).`
          : `Joint temperature ${packet.tempJoint_C.toFixed(1)} °C exceeds maximum copper annealing safety limit (${this.thresholds.jointTempCrit_C} °C).`,
        triggerValue: isOverCurrent ? `${packet.current_A.toFixed(1)} A` : `${packet.tempJoint_C.toFixed(1)} °C`,
        thresholdValue: isOverCurrent ? `< ${this.thresholds.overloadCurrent_A} A` : `< ${this.thresholds.jointTempCrit_C} °C`,
        recommendedAction: 'Verify trip coordination curve, inspect upstream breaker, and initiate immediate load reduction.',
        acknowledged: false,
        resolved: false
      });
    }

    // 3. CLAMPING BOLT LOOSENING CHECK
    if (packet.force_N < this.thresholds.forceCrit_N) {
      detectedFaults.push({
        id: `loosening-crit-${now}`,
        timestamp: now,
        severity: 'CRITICAL',
        faultCode: 'FLT_LOOSENING',
        title: 'Severe Clamping Force Loss (Critical)',
        description: `Bolt tension dropped to ${Math.round(packet.force_N)} N, well below critical safety limit (${this.thresholds.forceCrit_N} N). High risk of interfacial micro-arcing.`,
        triggerValue: `${Math.round(packet.force_N)} N`,
        thresholdValue: `> ${this.thresholds.forceCrit_N} N`,
        recommendedAction: 'De-energize panel immediately and re-torque M10 busbar bolt to specified 45 N·m torque using a calibrated torque wrench.',
        acknowledged: false,
        resolved: false
      });
    } else if (packet.force_N < this.thresholds.forceWarn_N) {
      detectedFaults.push({
        id: `loosening-warn-${now}`,
        timestamp: now,
        severity: 'WARNING',
        faultCode: 'FLT_LOOSENING',
        title: 'Clamping Bolt Relaxation Detected',
        description: `Bolt tension dropped to ${Math.round(packet.force_N)} N, below baseline tension (${this.baselines.baselineForce_N} N).`,
        triggerValue: `${Math.round(packet.force_N)} N`,
        thresholdValue: `> ${this.thresholds.forceWarn_N} N`,
        recommendedAction: 'Schedule torque verification during next scheduled maintenance window. Inspect Belleville spring washers for creep.',
        acknowledged: false,
        resolved: false
      });
    }

    // 4. INTERFACIAL OXIDATION / FRETTING CHECK
    const resistanceStatus = calculateResistance(
      packet.vDrop_mV,
      packet.current_A,
      this.thresholds.minCurrentThreshold_A
    );
    const tempRise = calculateTempRise(packet.tempJoint_C, packet.tempAmbient_C);

    if (
      resistanceStatus.status === 'VALID' &&
      resistanceStatus.value_mOhm >= this.thresholds.resistanceWarn_mOhm &&
      packet.force_N >= this.thresholds.forceWarn_N
    ) {
      // Clamping force is adequate, but resistance is high -> classic interfacial oxidation!
      const isCriticalR = resistanceStatus.value_mOhm >= this.thresholds.resistanceCrit_mOhm;
      detectedFaults.push({
        id: `oxidation-${now}`,
        timestamp: now,
        severity: isCriticalR ? 'CRITICAL' : 'WARNING',
        faultCode: 'FLT_OXIDATION',
        title: isCriticalR ? 'Severe Contact Oxidation / Surface Degradation' : 'Interfacial Oxidation Warning',
        description: `Contact resistance measured ${resistanceStatus.value_mOhm.toFixed(3)} mΩ despite normal clamping force (${Math.round(packet.force_N)} N), indicating copper oxidation or fretting corrosion.`,
        triggerValue: `${resistanceStatus.value_mOhm.toFixed(3)} mΩ`,
        thresholdValue: `< ${this.thresholds.resistanceWarn_mOhm} mΩ`,
        recommendedAction: 'De-energize joint during outage, disassemble overlap faces, remove tarnish with abrasive pad, apply electrical joint compound (Penetrox A), and reassemble.',
        acknowledged: false,
        resolved: false
      });
    }

    // 5. EXCESSIVE TEMPERATURE RISE CHECK
    if (tempRise >= this.thresholds.tempRiseCrit_C) {
      detectedFaults.push({
        id: `temp-rise-crit-${now}`,
        timestamp: now,
        severity: 'CRITICAL',
        faultCode: 'FLT_TEMP_RISE',
        title: 'Critical Temperature Rise Gradient (ΔT)',
        description: `Joint temperature rise ΔT reached +${tempRise.toFixed(1)} °C above ambient enclosure temperature.`,
        triggerValue: `+${tempRise.toFixed(1)} °C`,
        thresholdValue: `< ${this.thresholds.tempRiseCrit_C} °C`,
        recommendedAction: 'Perform infrared thermographic scan to verify joint hot-spot gradient and check enclosure forced cooling.',
        acknowledged: false,
        resolved: false
      });
    } else if (tempRise >= this.thresholds.tempRiseWarn_C) {
      detectedFaults.push({
        id: `temp-rise-warn-${now}`,
        timestamp: now,
        severity: 'WARNING',
        faultCode: 'FLT_TEMP_RISE',
        title: 'Elevated Temperature Rise (ΔT)',
        description: `Joint temperature rise ΔT is +${tempRise.toFixed(1)} °C above ambient.`,
        triggerValue: `+${tempRise.toFixed(1)} °C`,
        thresholdValue: `< ${this.thresholds.tempRiseWarn_C} °C`,
        recommendedAction: 'Monitor load trends and verify busbar duct ventilation.',
        acknowledged: false,
        resolved: false
      });
    }

    // Risk Indicator Calculations (0 to 100%)
    const forceFraction = Math.max(0, Math.min(1, packet.force_N / this.baselines.baselineForce_N));
    const looseningRisk = Math.round((1 - forceFraction) * 100);

    let oxidationRisk = 0;
    if (resistanceStatus.status === 'VALID') {
      const rRatio = resistanceStatus.value_mOhm / this.baselines.baselineResistance_mOhm;
      oxidationRisk = Math.min(100, Math.max(0, Math.round((rRatio - 1.0) * 80)));
    }

    const currentFraction = packet.current_A / this.thresholds.ratedCurrent_A;
    const tempFraction = Math.max(0, (packet.tempJoint_C - 25) / (this.thresholds.jointTempCrit_C - 25));
    const thermalRunawayRisk = Math.min(100, Math.round(currentFraction * tempFraction * 100));

    // Determine primary active fault (highest severity)
    const primaryFault =
      detectedFaults.find(f => f.severity === 'CRITICAL') ||
      detectedFaults.find(f => f.severity === 'WARNING') ||
      null;

    return {
      hasActiveFaults: detectedFaults.length > 0,
      primaryFault,
      detectedFaults,
      indicators: {
        looseningRisk,
        oxidationRisk,
        thermalRunawayRisk,
        sensorIntegrity
      }
    };
  }
}

export const defaultFaultClassifier = new FaultClassifier();
