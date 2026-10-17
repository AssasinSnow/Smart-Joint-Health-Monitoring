import { AlertItem } from '../types/alerts';

interface DebounceState {
  consecutiveTriggerCount: number;
  consecutiveClearCount: number;
  activeAlert: AlertItem | null;
}

export class AlertDebouncer {
  private states = new Map<string, DebounceState>();
  private readonly triggerSamplesRequired: number;
  private readonly clearSamplesRequired: number;

  constructor(triggerSamples: number = 3, clearSamples: number = 3) {
    this.triggerSamplesRequired = triggerSamples;
    this.clearSamplesRequired = clearSamples;
  }

  /**
   * Evaluates raw detected faults through debounce/hysteresis pipeline.
   * Returns alerts that have satisfied debounce trigger threshold.
   */
  public process(
    detectedFaults: AlertItem[],
    existingAlerts: AlertItem[]
  ): {
    confirmedNewAlerts: AlertItem[];
    resolvedAlertIds: string[];
    activeAlerts: AlertItem[];
  } {
    const detectedFaultCodes = new Set(detectedFaults.map(f => f.faultCode));
    const confirmedNewAlerts: AlertItem[] = [];
    const resolvedAlertIds: string[] = [];

    // Check newly or persistently detected faults
    for (const fault of detectedFaults) {
      let state = this.states.get(fault.faultCode);
      if (!state) {
        state = { consecutiveTriggerCount: 0, consecutiveClearCount: 0, activeAlert: null };
        this.states.set(fault.faultCode, state);
      }

      state.consecutiveTriggerCount += 1;
      state.consecutiveClearCount = 0;

      // Has it exceeded trigger debounce samples?
      if (state.consecutiveTriggerCount >= this.triggerSamplesRequired && !state.activeAlert) {
        state.activeAlert = fault;
        confirmedNewAlerts.push(fault);
      }
    }

    // Check previously active faults that might now be clearing
    for (const [code, state] of this.states.entries()) {
      if (!detectedFaultCodes.has(code as any)) {
        state.consecutiveTriggerCount = 0;
        state.consecutiveClearCount += 1;

        if (state.consecutiveClearCount >= this.clearSamplesRequired && state.activeAlert) {
          resolvedAlertIds.push(state.activeAlert.id);
          state.activeAlert = null;
        }
      }
    }

    // Compute updated active alerts list
    const activeAlerts = existingAlerts
      .filter(a => !resolvedAlertIds.includes(a.id))
      .concat(confirmedNewAlerts);

    return {
      confirmedNewAlerts,
      resolvedAlertIds,
      activeAlerts
    };
  }

  public reset() {
    this.states.clear();
  }
}
