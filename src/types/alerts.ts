export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type FaultCode = 
  | 'FLT_LOOSENING'
  | 'FLT_OXIDATION'
  | 'FLT_OVERLOAD'
  | 'FLT_SENSOR_DROPOUT'
  | 'FLT_TEMP_RISE'
  | 'EVT_SYSTEM_ONLINE'
  | 'EVT_CALIBRATION_UPDATED';

export interface AlertItem {
  id: string;
  timestamp: number;
  severity: AlertSeverity;
  faultCode: FaultCode;
  title: string;
  description: string;
  triggerValue: string;
  thresholdValue: string;
  recommendedAction: string;
  acknowledged: boolean;
  acknowledgedAt?: number;
  resolved: boolean;
  resolvedAt?: number;
}

export interface FaultClassificationResult {
  hasActiveFaults: boolean;
  primaryFault: AlertItem | null;
  detectedFaults: AlertItem[];
  indicators: {
    looseningRisk: number; // 0 to 100%
    oxidationRisk: number; // 0 to 100%
    thermalRunawayRisk: number; // 0 to 100%
    sensorIntegrity: 'OK' | 'DEGRADED' | 'FAULT';
  };
}
