import Dexie, { Table } from 'dexie';
import { ProcessedTelemetryPoint } from '../types/telemetry';
import { AlertItem } from '../types/alerts';
import { MaintenanceRecord } from '../types/maintenance';
import { JointBaselines } from '../types/config';

export interface SavedBaseline {
  id: string;
  capturedAt: number;
  label: string;
  baselines: JointBaselines;
}

export class SmartJointDatabase extends Dexie {
  telemetry!: Table<ProcessedTelemetryPoint, number>;
  alerts!: Table<AlertItem, string>;
  maintenance!: Table<MaintenanceRecord, string>;
  baselines!: Table<SavedBaseline, string>;

  constructor() {
    super('SmartJointMonitorDB');
    this.version(1).stores({
      telemetry: '++id, timestamp, jhi, status',
      alerts: 'id, timestamp, severity, faultCode, acknowledged, resolved',
      maintenance: 'id, timestamp, priorityAtService, inspectorName',
      baselines: 'id, capturedAt, label'
    });
  }
}

export const db = new SmartJointDatabase();

/**
 * Trims older telemetry to keep the database responsive (max 20,000 points)
 */
export async function pruneOldTelemetry(maxPoints: number = 20000): Promise<void> {
  const count = await db.telemetry.count();
  if (count > maxPoints) {
    const excess = count - maxPoints;
    const oldestKeys = await db.telemetry.orderBy('id').limit(excess).primaryKeys();
    await db.telemetry.bulkDelete(oldestKeys);
  }
}
