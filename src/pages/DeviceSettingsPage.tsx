import React, { useState } from 'react';
import { useJointStore } from '../store/useJointStore';
import { SafetyBanner } from '../components/layout/SafetyBanner';
import { validateWeights } from '../lib/physics';
import { Sliders, Camera, Save, Check, Wifi, Cpu, Settings2 } from 'lucide-react';

export const DeviceSettingsPage: React.FC = () => {
  const {
    config,
    updateConfig,
    setTelemetryMode,
    setLiveProtocol,
    snapshotCurrentAsBaseline
  } = useJointStore();

  const [formConfig, setFormConfig] = useState(config);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);

  // Check if JHI weights sum to 1.0
  const isWeightsValid = validateWeights(formConfig.weights);
  const weightsSum = (
    formConfig.weights.resistance +
    formConfig.weights.tempRise +
    formConfig.weights.force +
    formConfig.weights.powerLoss
  ).toFixed(2);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(() => formConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSnapshot = async () => {
    await snapshotCurrentAsBaseline();
    setFormConfig(prev => ({
      ...prev,
      baselines: useJointStore.getState().config.baselines
    }));
    setSnapshotSuccess(true);
    setTimeout(() => setSnapshotSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Mandatory Safety Notice */}
      <SafetyBanner />

      {/* Page Header */}
      <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-5 h-5 text-copper-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Device, Hardware &amp; Physics Configuration
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure telemetry ingestion transports, ADC amplifier gains, threshold alarms, and JHI weighting matrix.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs font-mono font-bold text-emerald-500 flex items-center gap-1">
              <Check className="w-4 h-4" /> Settings Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!isWeightsValid}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              isWeightsValid
                ? 'bg-copper-500 hover:bg-copper-600 text-white'
                : 'bg-slate-300 dark:bg-navy-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: Telemetry Data Source Mode */}
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Wifi className="w-4 h-4 text-copper-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Telemetry Ingestion Source
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => {
                setFormConfig(c => ({ ...c, mode: 'demo' }));
                setTelemetryMode('demo');
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                formConfig.mode === 'demo'
                  ? 'bg-purple-500/10 border-purple-500 shadow-sm'
                  : 'bg-slate-50 dark:bg-navy-900 border-slate-200 dark:border-navy-700 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Demo Simulation Mode 🧪
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">
                  OFFLINE READY
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Synthetic physics generator with 7 fault injection modes. Requires zero physical hardware.
              </p>
            </div>

            <div
              onClick={() => {
                setFormConfig(c => ({ ...c, mode: 'live' }));
                setTelemetryMode('live');
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                formConfig.mode === 'live'
                  ? 'bg-copper-500/10 border-copper-500 shadow-sm'
                  : 'bg-slate-50 dark:bg-navy-900 border-slate-200 dark:border-navy-700 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Live ESP32 Telemetry ⚡
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-copper-500/20 text-copper-400 font-bold">
                  HARDWARE STREAM
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receives telemetry directly from edge microcontroller via MQTT WebSockets or HTTP REST.
              </p>
            </div>
          </div>

          {/* Protocol selection if Live */}
          {formConfig.mode === 'live' && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-navy-700 space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Live Protocol:
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormConfig(c => ({ ...c, liveProtocol: 'mqtt' }));
                      setLiveProtocol('mqtt');
                    }}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                      formConfig.liveProtocol === 'mqtt'
                        ? 'bg-copper-500 text-white'
                        : 'bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    MQTT (WebSocket)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormConfig(c => ({ ...c, liveProtocol: 'http' }));
                      setLiveProtocol('http');
                    }}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                      formConfig.liveProtocol === 'http'
                        ? 'bg-copper-500 text-white'
                        : 'bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    HTTP (REST Polling)
                  </button>
                </div>
              </div>

              {formConfig.liveProtocol === 'mqtt' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div>
                    <label className="text-slate-400 block mb-1">Broker WebSocket URL:</label>
                    <input
                      type="text"
                      value={formConfig.mqtt.brokerUrl}
                      onChange={e =>
                        setFormConfig(c => ({
                          ...c,
                          mqtt: { ...c.mqtt, brokerUrl: e.target.value }
                        }))
                      }
                      className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Telemetry Topic:</label>
                    <input
                      type="text"
                      value={formConfig.mqtt.topic}
                      onChange={e =>
                        setFormConfig(c => ({
                          ...c,
                          mqtt: { ...c.mqtt, topic: e.target.value }
                        }))
                      }
                      className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Client ID:</label>
                    <input
                      type="text"
                      value={formConfig.mqtt.clientId}
                      onChange={e =>
                        setFormConfig(c => ({
                          ...c,
                          mqtt: { ...c.mqtt, clientId: e.target.value }
                        }))
                      }
                      className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <label className="text-slate-400 block mb-1">HTTP Endpoint URL:</label>
                    <input
                      type="text"
                      value={formConfig.http.endpointUrl}
                      onChange={e =>
                        setFormConfig(c => ({
                          ...c,
                          http: { ...c.http, endpointUrl: e.target.value }
                        }))
                      }
                      className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Poll Interval (ms):</label>
                    <input
                      type="number"
                      value={formConfig.http.pollIntervalMs}
                      onChange={e =>
                        setFormConfig(c => ({
                          ...c,
                          http: { ...c.http, pollIntervalMs: Number(e.target.value) }
                        }))
                      }
                      className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: Baseline Capture Tool */}
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-copper-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                As-Installed Joint Baseline Reference
              </h3>
            </div>
            {snapshotSuccess && (
              <span className="text-xs font-mono font-bold text-emerald-500 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Baseline Captured!
              </span>
            )}
            <button
              type="button"
              onClick={handleSnapshot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-700 hover:bg-copper-500 hover:text-white text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Snapshot Current Telemetry as Baseline</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-700">
              <label className="text-slate-400 block text-[10px]">Baseline Resistance R0:</label>
              <input
                type="number"
                step="0.001"
                value={formConfig.baselines.baselineResistance_mOhm}
                onChange={e =>
                  setFormConfig(c => ({
                    ...c,
                    baselines: { ...c.baselines, baselineResistance_mOhm: Number(e.target.value) }
                  }))
                }
                className="w-full bg-transparent font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">mΩ</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-700">
              <label className="text-slate-400 block text-[10px]">Nominal Clamp Force F0:</label>
              <input
                type="number"
                step="100"
                value={formConfig.baselines.baselineForce_N}
                onChange={e =>
                  setFormConfig(c => ({
                    ...c,
                    baselines: { ...c.baselines, baselineForce_N: Number(e.target.value) }
                  }))
                }
                className="w-full bg-transparent font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">N</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-700">
              <label className="text-slate-400 block text-[10px]">Baseline Temp Rise ΔT0:</label>
              <input
                type="number"
                step="0.5"
                value={formConfig.baselines.baselineTempRise_C}
                onChange={e =>
                  setFormConfig(c => ({
                    ...c,
                    baselines: { ...c.baselines, baselineTempRise_C: Number(e.target.value) }
                  }))
                }
                className="w-full bg-transparent font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">°C</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-700">
              <label className="text-slate-400 block text-[10px]">Nominal Current Inom:</label>
              <input
                type="number"
                step="10"
                value={formConfig.baselines.nominalCurrent_A}
                onChange={e =>
                  setFormConfig(c => ({
                    ...c,
                    baselines: { ...c.baselines, nominalCurrent_A: Number(e.target.value) }
                  }))
                }
                className="w-full bg-transparent font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">A</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: JHI Weight Allocator & Validator */}
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-copper-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                Joint Health Index (JHI) Factor Weights
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                  isWeightsValid
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    : 'bg-red-500/10 text-red-500 border-red-500/30'
                }`}
              >
                Weight Sum: {weightsSum} {isWeightsValid ? '✔ (Valid = 1.00)' : '⛔ Must Equal 1.00'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Adjust the normalized weight distribution for each physical degradation factor. The sum must strictly equal 1.00.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            {/* wR */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-700">
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Resistance Weight (wR):</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{formConfig.weights.resistance.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={formConfig.weights.resistance}
                onChange={e =>
                  setFormConfig(c => ({
                    ...c,
                    weights: { ...c.weights, resistance: Number(e.target.value) }
                  }))
                }
                className="w-full accent-copper-500"
              />
            </div>

            {/* wT */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-700">
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Thermal Rise (wT):</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{formConfig.weights.tempRise.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={formConfig.weights.tempRise}
                onChange={e =>
                  setFormConfig(c => ({
                    ...c,
                    weights: { ...c.weights, tempRise: Number(e.target.value) }
                  }))
                }
                className="w-full accent-cyan-500"
              />
            </div>

            {/* wF */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-700">
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Bolt Force (wF):</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{formConfig.weights.force.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={formConfig.weights.force}
                onChange={e =>
                  setFormConfig(c => ({
                    ...c,
                    weights: { ...c.weights, force: Number(e.target.value) }
                  }))
                }
                className="w-full accent-emerald-500"
              />
            </div>

            {/* wP */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-700">
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Power Loss (wP):</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{formConfig.weights.powerLoss.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={formConfig.weights.powerLoss}
                onChange={e =>
                  setFormConfig(c => ({
                    ...c,
                    weights: { ...c.weights, powerLoss: Number(e.target.value) }
                  }))
                }
                className="w-full accent-amber-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Safety & Fault Thresholds */}
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-copper-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Alarm &amp; Fault Classification Thresholds
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Low Current Guard (A):</label>
              <input
                type="number"
                step="0.1"
                value={formConfig.thresholds.minCurrentThreshold_A}
                onChange={e =>
                  setFormConfig(c => ({
                    ...c,
                    thresholds: { ...c.thresholds, minCurrentThreshold_A: Number(e.target.value) }
                  }))
                }
                className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Resistance Warn (mΩ):</label>
              <input
                type="number"
                step="0.005"
                value={formConfig.thresholds.resistanceWarn_mOhm}
                onChange={e =>
                  setFormConfig(c => ({
                    ...c,
                    thresholds: { ...c.thresholds, resistanceWarn_mOhm: Number(e.target.value) }
                  }))
                }
                className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Force Relaxation Warn (N):</label>
              <input
                type="number"
                step="100"
                value={formConfig.thresholds.forceWarn_N}
                onChange={e =>
                  setFormConfig(c => ({
                    ...c,
                    thresholds: { ...c.thresholds, forceWarn_N: Number(e.target.value) }
                  }))
                }
                className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Joint Temp Warn (°C):</label>
              <input
                type="number"
                step="1"
                value={formConfig.thresholds.jointTempWarn_C}
                onChange={e =>
                  setFormConfig(c => ({
                    ...c,
                    thresholds: { ...c.thresholds, jointTempWarn_C: Number(e.target.value) }
                  }))
                }
                className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
