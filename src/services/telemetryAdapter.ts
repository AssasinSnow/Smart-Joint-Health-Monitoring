import { RawTelemetryPacket } from '../types/telemetry';

export type TelemetryDataListener = (packet: RawTelemetryPacket) => void;
export type TelemetryStatusListener = (status: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'ERROR', message?: string) => void;

export interface ITelemetryAdapter {
  id: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  onData(listener: TelemetryDataListener): () => void;
  onStatusChange(listener: TelemetryStatusListener): () => void;
  isConnected(): boolean;
  injectFaultScenario?(scenario: DemoScenarioType): void;
}

export type DemoScenarioType =
  | 'PRISTINE'          // Normal operation, stable ~200A, nominal force & temp
  | 'LOOSENING'         // Progressive bolt relaxation (F drops to 7000 N, then 4200 N)
  | 'OXIDATION'         // Interfacial copper oxidation (F stable, R climbs to 0.085 mΩ)
  | 'OVERLOAD'          // High load current spike (290 A, rapid heating)
  | 'LOW_LOAD'          // Sub-1A current (< 0.5 A) triggering Near-Zero Guard
  | 'SENSOR_FAULT'      // DS18B20 disconnect (-127°C) or negative ADC reading
  | 'THERMAL_RUNAWAY';  // High temp rise (> 45 °C) under steady current
