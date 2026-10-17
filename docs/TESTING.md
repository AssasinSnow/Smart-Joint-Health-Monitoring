# Testing & Verification Guide

This document details the test harness, automated test suites, quality gates, and manual fault injection procedures for **Smart Joint Monitor**.

---

## 1. Automated Testing Framework

- **Test Runner:** [Vitest](https://vitest.dev/) with `jsdom` virtual environment.
- **Assertion & Component Testing:** React Testing Library (`@testing-library/react`) and `@testing-library/jest-dom`.
- **Execution Script:** `npm test` (or `npm run test:watch` for interactive development).

---

## 2. Test Suite Inventory

### 2.1 Physics & Mathematics (`src/lib/__tests__/physics.test.ts`)
Validates core electrical contact mechanics and safety algorithms:
- **Contact Resistance Calculation:** Verifies $R = \frac{V_{drop}}{I}$ accuracy ($8.0\text{ mV}$ at $200\text{ A} \to 0.040\text{ m}\Omega$).
- **Near-Zero Current Guard:** Ensures currents below $1.0\text{ A}$ (e.g. $0.4\text{ A}$) or at $0\text{ A}$ trigger `INSUFFICIENT_CURRENT` instead of asymptotic resistance blowup.
- **Sensor Fault Detection:** Asserts that negative voltage drop ($V_{drop} < -0.2\text{ mV}$) returns `SENSOR_FAULT`.
- **Joulean Power Loss & Thermal Rise:** Verifies $P_{loss} = \frac{V_{drop} \times I}{1000}$ and $\Delta T = T_{joint} - T_{ambient}$.
- **JHI Sub-score Normalization:** Validates pristine baseline returns 100 JHI score, degraded force triggers score decay, and factor weight sum equals 1.00.

### 2.2 Fault Classification Engine (`src/lib/__tests__/faultClassifier.test.ts`)
Verifies deterministic rule classification across all physical failure modes:
- **Pristine Operating Conditions:** Asserts no false alarms are raised when telemetry is nominal.
- **Bolt Loosening Warning (`FLT_LOOSENING`):** Triggers when force drops below $8,500\text{ N}$.
- **Critical Clamping Force Loss (`FLT_LOOSENING`):** Triggers critical alarm when force drops below $5,000\text{ N}$.
- **Interfacial Oxidation (`FLT_OXIDATION`):** Detects resistance surge ($> 0.065\text{ m}\Omega$) while clamping force remains intact ($\ge 8,500\text{ N}$).
- **Overcurrent & Thermal Overload (`FLT_OVERLOAD`):** Asserts critical priority when current exceeds $275\text{ A}$ or temperature exceeds $85^\circ\text{C}$.
- **Hardware Sensor Dropout (`FLT_SENSOR_DROPOUT`):** Detects DS18B20 1-Wire error code ($-127^\circ\text{C}$) and flags sensor integrity as `FAULT`.

### 2.3 PWA Shell & Layout (`src/__tests__/App.test.tsx`)
Validates UI component rendering:
- Application header, B.Tech EEE project badge, and navigation tabs.
- Hero Joint Health Index (JHI) radial gauge rendering.
- 4-column responsive sensor card telemetry displays ($V_{drop}, I, F, T_{joint}$).

---

## 3. Running Test Commands

```bash
# Run full test suite once
npm test

# Run tests in continuous watch mode
npm run test:watch

# Type check across all TypeScript modules
npx tsc -b

# Run production build and PWA service worker generation
npm run build
```

---

## 4. Manual Fault Injection Verification

In **Demo Mode**, you can immediately test the entire system's diagnostic and alert response using the **Diagnostic & Test Controls** widget on the Dashboard:

| Injected Scenario | Simulated Physics | Expected UI Behavior |
|---|---|---|
| **Pristine Joint** | $F = 12,000\text{ N}, R = 0.040\text{ m}\Omega, I = 200\text{ A}$ | JHI = 100, Status: `Healthy ✔`, Green sparklines, no active alerts. |
| **Bolt Loosening** | Clamping force decays from $11,000\text{ N} \to 4,200\text{ N}$ | JHI drops $< 80$, `FLT_LOOSENING` warning (then critical at $< 5,000\text{ N}$), prescriptive torque check alert. |
| **Oxidation / Fretting** | Force intact ($11,900\text{ N}$), resistance climbs to $0.088\text{ m}\Omega$ | `FLT_OXIDATION` alert triggers, Joule power loss climbs, JHI degrades, contact face buffing advised. |
| **Current Overload** | Current ramps to $292\text{ A}$, temp reaches $94^\circ\text{C}$ | `FLT_OVERLOAD` critical alert, red gauge arc, priority elevates to `P1_CRITICAL`. |
| **Near-Zero Load** | Current drops to $0.45\text{ A}$ ($< 1.0\text{ A}$ threshold) | Resistance card renders: `"Insufficient current (I = 0.45 A < 1.0 A)"`, avoiding false alarms. |
| **Sensor Dropout** | DS18B20 returns $-127^\circ\text{C}$ error | `FLT_SENSOR_DROPOUT` critical alert, hardware pull-up inspection recommendation. |
| **Thermal Stress** | Enclosure ambient reaches $38^\circ\text{C}$, $\Delta T > 45^\circ\text{C}$ | `FLT_TEMP_RISE` warning, thermal runaway risk meter climbs on Predictive page. |
