import mqtt, { MqttClient } from 'mqtt';
import { RawTelemetryPacket } from '../types/telemetry';
import { MqttConfig } from '../types/config';
import { ITelemetryAdapter, TelemetryDataListener, TelemetryStatusListener } from './telemetryAdapter';

export class MqttTelemetryAdapter implements ITelemetryAdapter {
  public readonly id = 'mqtt-adapter';
  private client: MqttClient | null = null;
  private listeners: Set<TelemetryDataListener> = new Set();
  private statusListeners: Set<TelemetryStatusListener> = new Set();
  private connected: boolean = false;

  constructor(private config: MqttConfig) {}

  public updateConfig(config: MqttConfig) {
    this.config = config;
    if (this.connected) {
      this.disconnect().then(() => this.connect());
    }
  }

  public async connect(): Promise<void> {
    if (this.client) {
      this.client.end(true);
      this.client = null;
    }

    this.notifyStatus('RECONNECTING', `Connecting to MQTT broker: ${this.config.brokerUrl}...`);

    try {
      this.client = mqtt.connect(this.config.brokerUrl, {
        clientId: this.config.clientId || `joint_monitor_${Math.random().toString(16).substring(2, 8)}`,
        username: this.config.username || undefined,
        password: this.config.password || undefined,
        keepalive: this.config.keepAlive || 30,
        reconnectPeriod: 3000,
        connectTimeout: 5000,
      });

      this.client.on('connect', () => {
        this.connected = true;
        this.notifyStatus('CONNECTED', 'Connected to MQTT broker');
        this.client?.subscribe(this.config.topic, { qos: 0 }, (err) => {
          if (err) {
            this.notifyStatus('ERROR', `Failed to subscribe to topic ${this.config.topic}: ${err.message}`);
          }
        });
      });

      this.client.on('message', (_topic, message) => {
        try {
          const payload = JSON.parse(message.toString());
          // Validate minimum fields
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
        } catch {
          // Ignore malformed JSON packets without crashing
        }
      });

      this.client.on('error', (err) => {
        this.notifyStatus('ERROR', err.message);
      });

      this.client.on('close', () => {
        this.connected = false;
        this.notifyStatus('DISCONNECTED', 'MQTT connection closed');
      });

      this.client.on('offline', () => {
        this.connected = false;
        this.notifyStatus('RECONNECTING', 'MQTT client offline, reconnecting...');
      });
    } catch (err: any) {
      this.notifyStatus('ERROR', err.message || 'Failed to initialize MQTT connection');
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
    this.connected = false;
    this.notifyStatus('DISCONNECTED', 'Disconnected');
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

  private notifyStatus(status: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'ERROR', message?: string) {
    for (const listener of this.statusListeners) {
      listener(status, message);
    }
  }
}
