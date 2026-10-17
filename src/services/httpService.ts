import { RawTelemetryPacket } from '../types/telemetry';
import { HttpConfig } from '../types/config';
import { ITelemetryAdapter, TelemetryDataListener, TelemetryStatusListener } from './telemetryAdapter';

export class HttpTelemetryAdapter implements ITelemetryAdapter {
  public readonly id = 'http-adapter';
  private timer: NodeJS.Timeout | null = null;
  private listeners: Set<TelemetryDataListener> = new Set();
  private statusListeners: Set<TelemetryStatusListener> = new Set();
  private connected: boolean = false;
  private failureCount: number = 0;

  constructor(private config: HttpConfig) {}

  public updateConfig(config: HttpConfig) {
    this.config = config;
    if (this.connected) {
      this.disconnect().then(() => this.connect());
    }
  }

  public async connect(): Promise<void> {
    if (this.connected) return;
    this.connected = true;
    this.failureCount = 0;
    this.notifyStatus('CONNECTED', `Polling ESP32 at ${this.config.endpointUrl}`);
    this.startPolling();
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

  private startPolling() {
    if (this.timer) clearInterval(this.timer);
    
    // Immediate first fetch
    this.fetchData();

    this.timer = setInterval(() => {
      this.fetchData();
    }, this.config.pollIntervalMs || 1000);
  }

  private async fetchData() {
    if (!this.connected) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(this.config.endpointUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }

      const payload = await res.json();
      this.failureCount = 0;

      if (
        typeof payload.vDrop_mV === 'number' &&
        typeof payload.current_A === 'number' &&
        typeof payload.force_N === 'number' &&
        typeof payload.tempJoint_C === 'number'
      ) {
        const packet: RawTelemetryPacket = {
          timestamp: payload.timestamp || Date.now(),
          vDrop_mV: Number(payload.vDrop_mV),
          current_A: Number(payload.current_A),
          force_N: Number(payload.force_N),
          tempJoint_C: Number(payload.tempJoint_C),
          tempAmbient_C: typeof payload.tempAmbient_C === 'number' ? Number(payload.tempAmbient_C) : 30.0
        };

        for (const listener of this.listeners) {
          listener(packet);
        }
      }
    } catch (err: any) {
      this.failureCount++;
      if (this.failureCount >= 3) {
        this.notifyStatus('ERROR', `HTTP poll failed: ${err.message}`);
      }
    }
  }

  private notifyStatus(status: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'ERROR', message?: string) {
    for (const listener of this.statusListeners) {
      listener(status, message);
    }
  }
}
