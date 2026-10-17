import React from 'react';
import { SafetyBanner } from '../components/layout/SafetyBanner';
import {
  BookOpen,
  Cpu,
  Layers,
  ShieldAlert,
  Zap,
  Activity,
  Brain
} from 'lucide-react';

export const ProjectInfoPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Mandatory Safety Notice */}
      <SafetyBanner />

      {/* Hero Project Banner */}
      <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-copper-500" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-copper-500">
            B.Tech Electrical &amp; Electronics Engineering (EEE) Final-Year Capstone Project
          </span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Smart Joint Monitor: Condition Monitoring &amp; Predictive Diagnostics for Bolted Copper Busbars
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
          High-amperage bolted busbar joints represent the single highest failure point in industrial switchboards,
          substations, and motor control centers (MCCs). This project integrates precision multi-parameter edge sensing
          on an ESP32 microcontroller with physics-based contact theory (Holm Constriction Theory) to calculate a real-time
          Joint Health Index (JHI), classify mechanical and metallurgical failure modes, and provide actionable maintenance intelligence.
        </p>
      </div>

      {/* Interactive Physical Setup Schematic (SVG Architecture) */}
      <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-copper-500" />
              Laboratory Testbed &amp; Sensor Interfacing Schematic
            </h3>
            <p className="text-xs text-slate-400">
              Hardware transducer routing to ESP32 dual-core IoT edge controller
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-navy-900 text-slate-500 font-semibold">
            Phase A: 250 A Continuous Rating
          </span>
        </div>

        {/* SVG Schematic */}
        <div className="bg-slate-50 dark:bg-navy-950 p-3 sm:p-6 rounded-xl border border-slate-200 dark:border-navy-700/80 overflow-x-auto smooth-scroll">
          <div className="text-[11px] font-mono text-copper-500 mb-2 block sm:hidden text-center">
            ← Scroll horizontally to inspect full sensor setup →
          </div>
          <svg viewBox="0 0 900 320" className="w-full min-w-[680px] h-auto font-mono text-xs">
            {/* Background busbar strip */}
            <rect x="50" y="80" width="340" height="40" fill="#B45309" rx="4" />
            <text x="70" y="105" fill="#FFFFFF" fontWeight="bold" fontSize="13">
              Incoming Busbar (Cu 50x6mm)
            </text>

            <rect x="490" y="80" width="360" height="40" fill="#B45309" rx="4" />
            <text x="680" y="105" fill="#FFFFFF" fontWeight="bold" fontSize="13">
              Outgoing Busbar (To Load)
            </text>

            {/* Joint overlap */}
            <rect x="370" y="70" width="140" height="60" fill="#D97706" rx="6" stroke="#F59E0B" strokeWidth="2" />
            <text x="382" y="105" fill="#FFFFFF" fontWeight="bold" fontSize="12">
              Bolted Joint (50mm Overlap)
            </text>

            {/* M10 Clamping Bolt */}
            <rect x="430" y="50" width="20" height="100" fill="#64748B" rx="3" stroke="#334155" strokeWidth="2" />
            <circle cx="440" cy="50" r="14" fill="#94A3B8" stroke="#334155" strokeWidth="2" />
            <text x="405" y="35" fill="#38BDF8" fontWeight="bold" fontSize="11">
              M10 Bolt (45 N·m)
            </text>

            {/* SENSORS */}
            {/* 1. ACS758 Current Transducer */}
            <rect x="180" y="150" width="130" height="45" fill="#0284C7" rx="6" />
            <text x="190" y="177" fill="#FFFFFF" fontWeight="bold">
              ACS758 (Current A)
            </text>
            <line x1="245" y1="120" x2="245" y2="150" stroke="#0284C7" strokeWidth="2" strokeDasharray="3 3" />

            {/* 2. HX711 Load Cell */}
            <rect x="360" y="150" width="160" height="45" fill="#10B981" rx="6" />
            <text x="370" y="177" fill="#FFFFFF" fontWeight="bold">
              HX711 (Bolt Force N)
            </text>
            <line x1="440" y1="130" x2="440" y2="150" stroke="#10B981" strokeWidth="2" strokeDasharray="3 3" />

            {/* 3. ADS1115 Differential Vdrop */}
            <rect x="540" y="150" width="150" height="45" fill="#F59E0B" rx="6" />
            <text x="550" y="177" fill="#FFFFFF" fontWeight="bold">
              ADS1115 (Vdrop mV)
            </text>
            <path d="M 360 80 Q 440 20 540 80" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 4" />

            {/* 4. DS18B20 Temp Probes */}
            <rect x="710" y="150" width="150" height="45" fill="#EF4444" rx="6" />
            <text x="720" y="177" fill="#FFFFFF" fontWeight="bold">
              Dual DS18B20 (°C)
            </text>
            <line x1="785" y1="120" x2="785" y2="150" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 3" />

            {/* ESP32 Controller Hub */}
            <rect x="300" y="240" width="300" height="60" fill="#0F172A" rx="10" stroke="#38BDF8" strokeWidth="2" />
            <text x="325" y="275" fill="#38BDF8" fontWeight="bold" fontSize="14">
              ESP32 Dual-Core MCU (FreeRTOS)
            </text>

            {/* Signal buses to ESP32 */}
            <line x1="245" y1="195" x2="350" y2="240" stroke="#0284C7" strokeWidth="2" />
            <line x1="440" y1="195" x2="440" y2="240" stroke="#10B981" strokeWidth="2" />
            <line x1="615" y1="195" x2="520" y2="240" stroke="#F59E0B" strokeWidth="2" />
            <line x1="785" y1="195" x2="570" y2="240" stroke="#EF4444" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* Physics & Mathematical Derivations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Holm Contact Resistance Theory */}
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-copper-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              1. Holm Electrical Contact Theory
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Electrical current between two overlapping copper conductors flows only through microscopic surface asperities
            called <em>a-spots</em>. Holm&apos;s fundamental equation states that constriction resistance is inversely
            proportional to the square root of the applied contact force:
          </p>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-xs font-mono text-copper-600 dark:text-copper-400">
            R_constriction = ρ / (2 · Σ a) ≈ ρ / (2 · √(F / (ξ · H)))
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Where <em>ρ</em> is resistivity of copper (1.68 × 10⁻⁸ Ω·m), <em>F</em> is clamping force (N),
            <em>H</em> is copper Meyer hardness, and <em>ξ</em> is asperity distribution factor.
            When bolt tension relaxes, <em>a-spot</em> area collapses, driving resistance and temperature exponentially upward.
          </p>
        </div>

        {/* Joint Health Index (JHI) Formulation */}
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              2. Joint Health Index (JHI) Formulation
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            The overall health index JHI ∈ [0, 100] combines four normalized physical sub-scores weighted by critical failure risk:
          </p>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-xs font-mono text-cyan-600 dark:text-cyan-400">
            JHI = wR·S_R + wT·S_T + wF·S_F + wP·S_P
            <br />
            (Default: 0.35·S_R + 0.30·S_T + 0.25·S_F + 0.10·S_P)
          </div>
          <ul className="text-xs space-y-1 text-slate-500 dark:text-slate-400">
            <li>• <strong>S_R (Resistance):</strong> Constriction &amp; oxidation degradation factor</li>
            <li>• <strong>S_T (Thermal Rise):</strong> Joint-to-ambient thermal gradient (ΔT)</li>
            <li>• <strong>S_F (Clamping Force):</strong> Load cell bolt tension retention</li>
            <li>• <strong>S_P (Power Dissipation):</strong> Joulean heat loss in Watts (P = I²R)</li>
          </ul>
        </div>
      </div>

      {/* Sensor Specifications & Hardware Resolution */}
      <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-500" />
          Hardware Instrumentation Specifications
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-700">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">
              ADS1115 (Vdrop ADC)
            </span>
            <ul className="text-slate-500 dark:text-slate-400 space-y-1 font-mono">
              <li>• Resolution: 16-bit (7.8 μV/LSB)</li>
              <li>• Input: Differential PGA (±0.256V)</li>
              <li>• Sample Rate: 128 to 860 SPS</li>
              <li>• Interface: I2C (Address 0x48)</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-700">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">
              HX711 (Contact Force)
            </span>
            <ul className="text-slate-500 dark:text-slate-400 space-y-1 font-mono">
              <li>• Resolution: 24-bit Σ-Δ ADC</li>
              <li>• Transducer: Washer Load Cell</li>
              <li>• Capacity: 20 kN (20,000 N)</li>
              <li>• Gain: 128 (Channel A)</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-700">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">
              DS18B20 (Digital Thermometer)
            </span>
            <ul className="text-slate-500 dark:text-slate-400 space-y-1 font-mono">
              <li>• Resolution: 12-bit (0.0625°C)</li>
              <li>• Accuracy: ±0.5°C (-10°C to +85°C)</li>
              <li>• Bus: 1-Wire Digital (GPIO 4)</li>
              <li>• Error Codes: -127°C (open), 85°C</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-700">
            <span className="font-bold text-slate-900 dark:text-white block mb-1">
              ESP32 Microcontroller
            </span>
            <ul className="text-slate-500 dark:text-slate-400 space-y-1 font-mono">
              <li>• CPU: Xtensa 32-bit Dual-Core 240MHz</li>
              <li>• Connectivity: Wi-Fi 802.11 b/g/n, TLS</li>
              <li>• RTOS: FreeRTOS Preemptive Tasks</li>
              <li>• Protocol: MQTT / WebSockets &amp; HTTP</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Engineering Limitations & Future AI Roadmap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Bounds & Guardrails */}
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              System Bounds &amp; Engineering Guardrails
            </h3>
          </div>
          <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">•</span>
              <span>
                <strong>Near-Zero Current Guard:</strong> When current I &lt; 1.0 A, micro-ohmmeter calculation is disabled to prevent ADC noise floor from generating false resistance alarms.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">•</span>
              <span>
                <strong>No Speculative RUL:</strong> Because busbars experience irregular load cycles and ambient variations, this system avoids unscientific remaining useful life (RUL) projections, focusing strictly on deterministic condition assessment.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">•</span>
              <span>
                <strong>Hardware Interlock Primacy:</strong> Software dashboards are supervisory. Hardware circuit breakers and local analog trip coils maintain sole authority over line isolation.
              </span>
            </li>
          </ul>
        </div>

        {/* Future AI / ML Integration */}
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Future AI / Edge ML Integration Roadmap
            </h3>
          </div>
          <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-purple-500 font-bold">•</span>
              <span>
                <strong>TinyML Autoencoder:</strong> Deployment of TensorFlow Lite for Microcontrollers on ESP32 Core 1 to detect multivariate thermal-resistance anomalies before deterministic thresholds trip.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 font-bold">•</span>
              <span>
                <strong>Thermal Dissipation Modeling:</strong> Physics-Informed Neural Networks (PINNs) modeling Newton&apos;s cooling law and transient thermal impedance Z_th(t).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 font-bold">•</span>
              <span>
                <strong>Multi-Busbar Fleet Scaling:</strong> Fleet-wide aggregation of joint health across multi-phase switchboard arrays with central cloud synchronization.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
