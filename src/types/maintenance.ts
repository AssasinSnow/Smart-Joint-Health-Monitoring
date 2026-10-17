export type MaintenancePriority = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_ROUTINE';

export interface MaintenanceChecklistItem {
  id: string;
  category: 'MECHANICAL' | 'THERMAL' | 'ELECTRICAL' | 'ENVIRONMENTAL';
  task: string;
  detail: string;
  completed: boolean;
  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  timestamp: number;
  inspectorName: string;
  priorityAtService: MaintenancePriority;
  torqueApplied_Nm: number;
  contactForceBefore_N: number;
  contactForceAfter_N: number;
  resistanceBefore_mOhm: number;
  resistanceAfter_mOhm: number;
  actionsTaken: string[];
  componentsReplaced: string[];
  findingsNotes: string;
}

export interface BaselineComparison {
  baselineResistance_mOhm: number;
  currentResistance_mOhm: number | null;
  resistanceDeltaPct: number | null;
  
  baselineForce_N: number;
  currentForce_N: number;
  forceDeltaPct: number;

  baselineTempRise_C: number;
  currentTempRise_C: number;
  tempRiseDelta_C: number;

  baselinePowerLoss_W: number;
  currentPowerLoss_W: number;
  powerLossDelta_W: number;
}
