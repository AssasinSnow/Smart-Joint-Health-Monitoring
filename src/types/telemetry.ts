export interface RawTelemetryPacket {
  timestamp: number; // Unix timestamp in ms
  vDrop_mV: number;   // Joint voltage drop in millivolts (mV)
  current_A: number;  // Joint load current in amperes (A)
  force_N: number;    // Clamping bolt contact force in newtons (N)
  tempJoint_C: number;// Joint contact surface temperature in °C
  tempAmbient_C: number; // Ambient busbar enclosure temperature in °C
}

export type ResistanceStatus = 
  | { status: 'VALID'; value_mOhm: number }
  | { status: 'INSUFFICIENT_CURRENT'; reason: string }
  | { status: 'SENSOR_FAULT'; reason: string };

export interface DerivedMetrics {
  timestamp: number;
  resistance: ResistanceStatus;
  powerLoss_W: number;
  tempRise_C: number;
  jhi: number; // Joint Health Index: 0 to 100
  subScores: {
    resistanceScore: number;
    tempRiseScore: number;
    forceScore: number;
    powerLossScore: number;
  };
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface ProcessedTelemetryPoint extends RawTelemetryPacket {
  id?: number;
  resistance_mOhm: number | null; // null if insufficient current
  resistanceStatusText: string;    // "0.043 mΩ" or "Insufficient current"
  powerLoss_W: number;
  tempRise_C: number;
  jhi: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}
