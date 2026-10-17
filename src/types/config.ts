export type TelemetryMode = 'demo' | 'live';
export type LiveProtocol = 'mqtt' | 'http';
export type DemoScenarioType =
  | 'PRISTINE'
  | 'LOOSENING'
  | 'OXIDATION'
  | 'OVERLOAD'
  | 'LOW_LOAD'
  | 'SENSOR_FAULT'
  | 'THERMAL_RUNAWAY';

export interface MqttConfig {
  brokerUrl: string;
  topic: string;
  commandTopic: string;
  clientId: string;
  username?: string;
  password?: string;
  keepAlive: number;
}

export interface HttpConfig {
  endpointUrl: string;
  pollIntervalMs: number;
}

export interface SensorCalibration {
  // HX711 Load Cell
  hx711ScaleFactor: number; // Calibration factor
  hx711ZeroOffset_N: number;

  // ADS1115 ADC
  ads1115Gain: '2/3x' | '1x' | '2x' | '4x' | '8x' | '16x';
  vDropZeroOffset_mV: number;

  // DS18B20 Probes
  tempJointOffset_C: number;
  tempAmbientOffset_C: number;
}

export interface JointBaselines {
  baselineResistance_mOhm: number; // R0 (e.g. 0.040 mΩ)
  baselineForce_N: number;         // F0 (e.g. 12000 N for M10 at 45 Nm)
  baselineTempRise_C: number;      // ΔT0 (e.g. 8.0 °C at nominal current)
  nominalCurrent_A: number;        // Inom (e.g. 200 A)
  nominalPowerLoss_W: number;      // P0 (e.g. 1.6 W)
}

export interface JointThresholds {
  minCurrentThreshold_A: number;   // Below this, R is untrusted (default: 1.0 A)
  
  // Resistance thresholds
  resistanceWarn_mOhm: number;     // e.g. 0.060 mΩ (+50% degradation)
  resistanceCrit_mOhm: number;     // e.g. 0.090 mΩ (+125% degradation)
  
  // Contact Force thresholds
  forceWarn_N: number;             // e.g. 8500 N (loosening warning)
  forceCrit_N: number;             // e.g. 5000 N (severe loosening)

  // Temperature thresholds
  jointTempWarn_C: number;         // e.g. 70 °C
  jointTempCrit_C: number;         // e.g. 85 °C
  tempRiseWarn_C: number;          // e.g. 30 °C
  tempRiseCrit_C: number;          // e.g. 45 °C

  // Current thresholds
  ratedCurrent_A: number;          // e.g. 250 A
  overloadCurrent_A: number;       // e.g. 275 A
}

export interface JhiWeights {
  resistance: number;  // wR (default 0.35)
  tempRise: number;    // wT (default 0.30)
  force: number;       // wF (default 0.25)
  powerLoss: number;   // wP (default 0.10)
}

export interface AppConfig {
  mode: TelemetryMode;
  liveProtocol: LiveProtocol;
  mqtt: MqttConfig;
  http: HttpConfig;
  calibration: SensorCalibration;
  baselines: JointBaselines;
  thresholds: JointThresholds;
  weights: JhiWeights;
}
