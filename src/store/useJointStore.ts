import { create } from 'zustand';
import { RawTelemetryPacket, ProcessedTelemetryPoint } from '../types/telemetry';
import { AlertItem, FaultClassificationResult } from '../types/alerts';
import { MaintenanceRecord, MaintenanceChecklistItem } from '../types/maintenance';
import { AppConfig, DemoScenarioType, TelemetryMode, LiveProtocol } from '../types/config';
import {
  processTelemetryPacket,
  DEFAULT_BASELINES,
  DEFAULT_THRESHOLDS,
  DEFAULT_WEIGHTS
} from '../lib/physics';
import { FaultClassifier } from '../lib/faultClassifier';
import { AlertDebouncer } from '../lib/debounce';
import { db, pruneOldTelemetry } from '../lib/db';
import { demoTelemetryGenerator } from '../services/demoGenerator';
import { MqttTelemetryAdapter } from '../services/mqttService';
import { HttpTelemetryAdapter } from '../services/httpService';
import { ITelemetryAdapter } from '../services/telemetryAdapter';

const INITIAL_CONFIG: AppConfig = {
  mode: 'demo',
  liveProtocol: 'mqtt',
  mqtt: {
    brokerUrl: 'wss://broker.hivemq.com:8884/mqtt',
    topic: 'busbar/joint1/telemetry',
    commandTopic: 'busbar/joint1/commands',
    clientId: `joint_web_${Math.random().toString(16).slice(2, 8)}`,
    keepAlive: 30
  },
  http: {
    endpointUrl: 'http://192.168.1.50/api/telemetry',
    pollIntervalMs: 1000
  },
  calibration: {
    hx711ScaleFactor: 420.5,
    hx711ZeroOffset_N: 0,
    ads1115Gain: '16x',
    vDropZeroOffset_mV: 0.0,
    tempJointOffset_C: 0.0,
    tempAmbientOffset_C: 0.0
  },
  baselines: DEFAULT_BASELINES,
  thresholds: DEFAULT_THRESHOLDS,
  weights: DEFAULT_WEIGHTS
};

const INITIAL_CHECKLIST: MaintenanceChecklistItem[] = [
  {
    id: 'chk-1',
    category: 'MECHANICAL',
    task: 'Bolt Clamping Torque & Belleville Washers',
    detail: 'Verify M10 Grade 8.8 bolt torque is calibrated to 45.0 N·m. Check disc spring deflection is approx 75% flat.',
    completed: true
  },
  {
    id: 'chk-2',
    category: 'THERMAL',
    task: 'Infrared Thermography Hot-Spot Scan',
    detail: 'Perform calibrated IR camera scan at rated load. Ensure interfacial temperature gradient is < 5°C across overlap.',
    completed: false
  },
  {
    id: 'chk-3',
    category: 'ELECTRICAL',
    task: 'Micro-Ohmmeter Ductor Joint Measurement',
    detail: 'De-energize and measure 4-wire DC resistance across 50mm joint span. Confirm R < 0.045 mΩ.',
    completed: false
  },
  {
    id: 'chk-4',
    category: 'ENVIRONMENTAL',
    task: 'Oxidation & Contact Compound Inspection',
    detail: 'Check for green verdigris tarnish or tin plating wear. Apply synthetic antioxidant paste (Penetrox A).',
    completed: true
  }
];

const INITIAL_RECORDS: MaintenanceRecord[] = [
  {
    id: 'rec-01',
    timestamp: Date.now() - 86400000 * 2, // 2 days ago
    inspectorName: 'EEE Capstone Team 04',
    priorityAtService: 'P4_ROUTINE',
    torqueApplied_Nm: 45.0,
    contactForceBefore_N: 11200,
    contactForceAfter_N: 12050,
    resistanceBefore_mOhm: 0.044,
    resistanceAfter_mOhm: 0.040,
    actionsTaken: ['Cleaned copper contact faces with Scotch-Brite', 'Applied electrical joint compound', 'Torqued M10 bolt to 45 N·m'],
    componentsReplaced: ['Belleville Disc Spring Washer (DIN 6796)'],
    findingsNotes: 'Initial laboratory commissioning and baseline calibration run. Contact surfaces pristine.'
  }
];

export interface JointStoreState {
  // App Config & Mode
  config: AppConfig;
  isDarkMode: boolean;
  isStreamingPaused: boolean;

  // Telemetry status
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'ERROR';
  connectionMessage: string;
  lastPacketTime: number | null;
  activeScenario: DemoScenarioType;

  // Live Data
  currentPoint: ProcessedTelemetryPoint | null;
  rollingHistory: ProcessedTelemetryPoint[]; // max 120 live points for real-time charts
  activeFaults: FaultClassificationResult;

  // Alerts & Records
  alerts: AlertItem[];
  checklist: MaintenanceChecklistItem[];
  maintenanceRecords: MaintenanceRecord[];

  // Actions
  toggleTheme: () => void;
  togglePauseStream: () => void;
  setTelemetryMode: (mode: TelemetryMode) => Promise<void>;
  setLiveProtocol: (protocol: LiveProtocol) => Promise<void>;
  updateConfig: (updater: (prev: AppConfig) => AppConfig) => void;
  setDemoScenario: (scenario: DemoScenarioType) => void;

  // Telemetry Ingestion
  ingestPacket: (raw: RawTelemetryPacket) => Promise<void>;

  // Alerts Actions
  acknowledgeAlert: (alertId: string) => void;
  acknowledgeAllAlerts: () => void;
  clearResolvedAlerts: () => void;

  // Maintenance & Checklist Actions
  toggleChecklistItem: (id: string) => void;
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id' | 'timestamp'>) => Promise<void>;
  deleteMaintenanceRecord: (id: string) => Promise<void>;

  // Baseline Action
  snapshotCurrentAsBaseline: () => Promise<void>;

  // Lifecycle
  initStore: () => Promise<void>;
}

// Singletons for physics evaluation
const faultClassifier = new FaultClassifier(DEFAULT_BASELINES, DEFAULT_THRESHOLDS);
const alertDebouncer = new AlertDebouncer(3, 3);
let currentAdapter: ITelemetryAdapter = demoTelemetryGenerator;
let unsubscribeAdapterData: (() => void) | null = null;
let unsubscribeAdapterStatus: (() => void) | null = null;

export const useJointStore = create<JointStoreState>((set, get) => ({
  config: INITIAL_CONFIG,
  isDarkMode: true,
  isStreamingPaused: false,

  connectionStatus: 'DISCONNECTED',
  connectionMessage: '',
  lastPacketTime: null,
  activeScenario: 'PRISTINE',

  currentPoint: null,
  rollingHistory: [],
  activeFaults: {
    hasActiveFaults: false,
    primaryFault: null,
    detectedFaults: [],
    indicators: {
      looseningRisk: 0,
      oxidationRisk: 0,
      thermalRunawayRisk: 0,
      sensorIntegrity: 'OK'
    }
  },

  alerts: [],
  checklist: INITIAL_CHECKLIST,
  maintenanceRecords: INITIAL_RECORDS,

  toggleTheme: () => {
    set(state => {
      const next = !state.isDarkMode;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { isDarkMode: next };
    });
  },

  togglePauseStream: () => {
    set(state => ({ isStreamingPaused: !state.isStreamingPaused }));
  },

  setTelemetryMode: async (mode: TelemetryMode) => {
    const { config } = get();
    if (config.mode === mode) return;

    // Disconnect old adapter
    if (unsubscribeAdapterData) unsubscribeAdapterData();
    if (unsubscribeAdapterStatus) unsubscribeAdapterStatus();
    await currentAdapter.disconnect();

    // Select new adapter
    if (mode === 'demo') {
      currentAdapter = demoTelemetryGenerator;
    } else {
      if (config.liveProtocol === 'mqtt') {
        currentAdapter = new MqttTelemetryAdapter(config.mqtt);
      } else {
        currentAdapter = new HttpTelemetryAdapter(config.http);
      }
    }

    set(state => ({
      config: { ...state.config, mode }
    }));

    // Attach listeners and connect
    unsubscribeAdapterData = currentAdapter.onData(packet => {
      get().ingestPacket(packet);
    });
    unsubscribeAdapterStatus = currentAdapter.onStatusChange((status, message) => {
      set({ connectionStatus: status, connectionMessage: message || '' });
    });
    await currentAdapter.connect();
  },

  setLiveProtocol: async (protocol: LiveProtocol) => {
    const { config, setTelemetryMode } = get();
    set(state => ({
      config: { ...state.config, liveProtocol: protocol }
    }));
    if (config.mode === 'live') {
      await setTelemetryMode('live');
    }
  },

  updateConfig: (updater) => {
    set(state => {
      const nextConfig = updater(state.config);
      faultClassifier.updateConfig(nextConfig.baselines, nextConfig.thresholds);
      return { config: nextConfig };
    });
  },

  setDemoScenario: (scenario: DemoScenarioType) => {
    set({ activeScenario: scenario });
    if (currentAdapter.injectFaultScenario) {
      currentAdapter.injectFaultScenario(scenario);
    }
  },

  ingestPacket: async (raw: RawTelemetryPacket) => {
    const state = get();
    if (state.isStreamingPaused) return;

    const processed = processTelemetryPacket(
      raw,
      state.config.baselines,
      state.config.thresholds,
      state.config.weights
    );

    // Fault classification
    const classification = faultClassifier.classify(raw);

    // Debounce & hysteresis
    const { confirmedNewAlerts, resolvedAlertIds, activeAlerts } = alertDebouncer.process(
      classification.detectedFaults,
      state.alerts
    );

    // Rolling buffer update (keep last 120 points for smooth charts)
    const nextRolling = [...state.rollingHistory, processed].slice(-120);

    // Update Zustand state
    set({
      currentPoint: processed,
      rollingHistory: nextRolling,
      lastPacketTime: raw.timestamp,
      activeFaults: classification,
      alerts: activeAlerts
    });

    // Asynchronously persist point and new alerts in Dexie
    try {
      await db.telemetry.add(processed);
      if (confirmedNewAlerts.length > 0) {
        await db.alerts.bulkAdd(confirmedNewAlerts);
      }
      if (resolvedAlertIds.length > 0) {
        await db.alerts.where('id').anyOf(resolvedAlertIds).modify({ resolved: true, resolvedAt: Date.now() });
      }
      // Periodically prune old telemetry
      if (Math.random() < 0.05) {
        pruneOldTelemetry(10000);
      }
    } catch {
      // IndexedDB write errors should not block live stream
    }
  },

  acknowledgeAlert: (alertId: string) => {
    set(state => {
      const updated = state.alerts.map(a =>
        a.id === alertId ? { ...a, acknowledged: true, acknowledgedAt: Date.now() } : a
      );
      db.alerts.update(alertId, { acknowledged: true, acknowledgedAt: Date.now() }).catch(() => {});
      return { alerts: updated };
    });
  },

  acknowledgeAllAlerts: () => {
    set(state => {
      const now = Date.now();
      const updated = state.alerts.map(a => ({ ...a, acknowledged: true, acknowledgedAt: now }));
      db.alerts.toCollection().modify({ acknowledged: true, acknowledgedAt: now }).catch(() => {});
      return { alerts: updated };
    });
  },

  clearResolvedAlerts: () => {
    set(state => ({
      alerts: state.alerts.filter(a => !a.resolved)
    }));
  },

  toggleChecklistItem: (id: string) => {
    set(state => ({
      checklist: state.checklist.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    }));
  },

  addMaintenanceRecord: async (recordData) => {
    const record: MaintenanceRecord = {
      ...recordData,
      id: `rec-${Date.now()}`,
      timestamp: Date.now()
    };
    await db.maintenance.add(record);
    set(state => ({
      maintenanceRecords: [record, ...state.maintenanceRecords]
    }));
  },

  deleteMaintenanceRecord: async (id: string) => {
    await db.maintenance.delete(id);
    set(state => ({
      maintenanceRecords: state.maintenanceRecords.filter(r => r.id !== id)
    }));
  },

  snapshotCurrentAsBaseline: async () => {
    const { currentPoint, config, updateConfig } = get();
    if (!currentPoint) return;

    const newBaselines = {
      ...config.baselines,
      baselineResistance_mOhm: currentPoint.resistance_mOhm ?? config.baselines.baselineResistance_mOhm,
      baselineForce_N: currentPoint.force_N,
      baselineTempRise_C: currentPoint.tempRise_C,
      nominalCurrent_A: currentPoint.current_A,
      nominalPowerLoss_W: currentPoint.powerLoss_W
    };

    updateConfig(c => ({
      ...c,
      baselines: newBaselines
    }));

    await db.baselines.add({
      id: `baseline-${Date.now()}`,
      capturedAt: Date.now(),
      label: `Snapshot at ${new Date().toLocaleTimeString()}`,
      baselines: newBaselines
    });
  },

  initStore: async () => {
    // Hydrate from Dexie
    try {
      const records = await db.maintenance.orderBy('timestamp').reverse().toArray();
      if (records.length > 0) {
        set({ maintenanceRecords: records });
      } else {
        await db.maintenance.bulkAdd(INITIAL_RECORDS);
      }

      const dbAlerts = await db.alerts.where('resolved').equals(0).toArray();
      if (dbAlerts.length > 0) {
        set({ alerts: dbAlerts });
      }
    } catch {
      // IndexedDB hydration fallback
    }

    // Connect to demo adapter out-of-the-box
    unsubscribeAdapterData = currentAdapter.onData(packet => {
      get().ingestPacket(packet);
    });
    unsubscribeAdapterStatus = currentAdapter.onStatusChange((status, message) => {
      set({ connectionStatus: status, connectionMessage: message || '' });
    });

    await currentAdapter.connect();
  }
}));
