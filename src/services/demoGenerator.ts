import { RawTelemetryPacket } from '../types/telemetry';
import { ITelemetryAdapter, DemoScenarioType, TelemetryDataListener, TelemetryStatusListener } from './telemetryAdapter';

export class DemoTelemetryGenerator implements ITelemetryAdapter {
  public readonly id = 'demo-generator';
  private timer: NodeJS.Timeout | null = null;
  private listeners: Set<TelemetryDataListener> = new Set();
  private statusListeners: Set<TelemetryStatusListener> = new Set();
  private connected: boolean = false;
  private scenario: DemoScenarioType = 'PRISTINE';
  private tickCount: number = 0;

  // Internal state parameters that evolve realistically
  private current_A: number = 205.0;
  private force_N: number = 11950.0;
  private tempAmbient_C: number = 31.0;
  private tempJoint_C: number = 39.5;
  private contactResistance_mOhm: number = 0.040; // 40 micro-ohms baseline

  constructor(private intervalMs: number = 1000) {}

  public async connect(): Promise<void> {
    if (this.connected) return;
    this.connected = true;
    this.notifyStatus('CONNECTED');
    this.startGenerating();
  }

  public async disconnect(): Promise<void> {
    this.connected = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.notifyStatus('DISCONNECTED');
  }

  public onData(listener: TelemetryDataListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onStatusChange(listener: TelemetryStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public injectFaultScenario(scenario: DemoScenarioType) {
    this.scenario = scenario;
    this.tickCount = 0;
  }

  public getCurrentScenario(): DemoScenarioType {
    return this.scenario;
  }

  private startGenerating() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.tick();
    }, this.intervalMs);
  }

  private tick() {
    this.tickCount++;
    const noise = () => (Math.random() - 0.5) * 0.02; // ±1% noise

    switch (this.scenario) {
      case 'PRISTINE':
        // Nominal load profile with mild diurnal/current wobble
        this.current_A = 200.0 + Math.sin(this.tickCount * 0.1) * 15.0 + noise() * 10;
        this.force_N = 12000.0 + noise() * 100;
        this.contactResistance_mOhm = 0.040 + noise() * 0.002;
        this.tempAmbient_C = 30.5 + Math.sin(this.tickCount * 0.02) * 1.5;
        this.tempJoint_C = this.tempAmbient_C + 8.5 + (this.current_A / 200.0) * 1.5;
        break;

      case 'LOOSENING':
        // Progressive clamping force loss
        this.current_A = 210.0 + noise() * 5;
        // Force decays steadily from 11000 down to 4200
        this.force_N = Math.max(4200, 11000 - this.tickCount * 250 + noise() * 50);
        // As force drops, micro-constriction resistance increases slightly
        this.contactResistance_mOhm = 0.040 + (12000 - this.force_N) * 0.000003;
        this.tempAmbient_C = 31.0;
        this.tempJoint_C = this.tempAmbient_C + 9.0 + (this.tickCount * 0.3);
        break;

      case 'OXIDATION':
        // Force is intact, but contact resistance climbs sharply
        this.force_N = 11900.0 + noise() * 50;
        this.current_A = 215.0 + noise() * 5;
        this.contactResistance_mOhm = Math.min(0.088, 0.042 + this.tickCount * 0.002);
        this.tempAmbient_C = 31.0;
        // Thermal rise ΔT climbs due to P = I^2 * R
        const jouleFactor = (this.contactResistance_mOhm / 0.040);
        this.tempJoint_C = this.tempAmbient_C + 8.5 * jouleFactor;
        break;

      case 'OVERLOAD':
        // Load current ramps to 290 A (exceeds 275 A trip rating)
        this.current_A = Math.min(292.0, 220.0 + this.tickCount * 8.0 + noise() * 4);
        this.force_N = 11800.0 + noise() * 50;
        this.contactResistance_mOhm = 0.042;
        this.tempAmbient_C = 32.0;
        this.tempJoint_C = Math.min(94.0, 45.0 + this.tickCount * 4.0);
        break;

      case 'LOW_LOAD':
        // Sub-1A current (< 0.5 A) to trigger near-zero guard
        this.current_A = 0.45 + (Math.random() - 0.5) * 0.15;
        this.force_N = 12050.0 + noise() * 50;
        this.contactResistance_mOhm = 0.040;
        this.tempAmbient_C = 29.5;
        this.tempJoint_C = 30.0;
        break;

      case 'SENSOR_FAULT':
        // DS18B20 disconnected (returns -127°C) or negative ADC reading
        this.current_A = 200.0;
        this.force_N = 11900.0;
        this.contactResistance_mOhm = 0.040;
        this.tempAmbient_C = 30.0;
        this.tempJoint_C = -127.0; // DS18B20 disconnect error code
        break;

      case 'THERMAL_RUNAWAY':
        this.current_A = 245.0 + noise() * 5;
        this.force_N = 9500.0;
        this.contactResistance_mOhm = 0.075;
        this.tempAmbient_C = 38.0; // Enclosure ambient heat wave
        this.tempJoint_C = Math.min(98.0, 70.0 + this.tickCount * 2.5);
        break;
    }

    // Compute Vdrop (mV) = R (mΩ) * I (A)
    let vDrop_mV = this.contactResistance_mOhm * this.current_A;
    if (this.scenario === 'LOW_LOAD') {
      vDrop_mV = 0.02 + (Math.random() - 0.5) * 0.01; // Noise floor
    }

    const packet: RawTelemetryPacket = {
      timestamp: Date.now(),
      vDrop_mV: Number(vDrop_mV.toFixed(3)),
      current_A: Number(this.current_A.toFixed(2)),
      force_N: Math.round(this.force_N),
      tempJoint_C: Number(this.tempJoint_C.toFixed(1)),
      tempAmbient_C: Number(this.tempAmbient_C.toFixed(1))
    };

    for (const listener of this.listeners) {
      listener(packet);
    }
  }

  private notifyStatus(status: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'ERROR', message?: string) {
    for (const listener of this.statusListeners) {
      listener(status, message);
    }
  }
}

export const demoTelemetryGenerator = new DemoTelemetryGenerator();
