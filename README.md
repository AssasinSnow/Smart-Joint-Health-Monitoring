# Smart Joint Monitor ⚡
> **Industrial Bolted Copper Busbar Health & Predictive Maintenance Progressive Web App (PWA)**  
> *Final-Year Capstone Project — B.Tech Electrical & Electronics Engineering (EEE)*

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-2.1-FCC72B?style=flat&logo=vitest&logoColor=black)](https://vitest.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline--Capable-5A0FC8?style=flat&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

---

## 1. Project Overview

High-current bolted copper busbars in switchgear, motor control centers (MCC), and industrial substations operate under severe electrodynamic, thermal, and vibrational stresses. Over time, thermal cycling and stress relaxation reduce bolt clamping torque. According to **Holm Constriction Theory**, diminishing clamping force shrinks the microscopic contact a-spots, causing joint contact resistance ($R_{joint} = V_{drop} / I$) to rise. This triggers Joulean heat acceleration ($P = I^2 R$) and rapid interfacial oxidation, which can culminate in flashover fires and catastrophic power failure.

**Smart Joint Monitor** solves this problem by pairing an **ESP32 IoT edge controller** and precision transducers with a **Progressive Web App (PWA)** that calculates a real-time **Joint Health Index (JHI)**, classifies failure modes (loosening vs. oxidation), and delivers predictive maintenance notifications.

> [!IMPORTANT]
> **Mandatory Safety Disclaimer:**
> Safety-critical protection (short circuit, earth fault, catastrophic thermal runaway) must run locally on the ESP32 or dedicated hardware circuit breakers. This app must never be the sole mechanism for disconnecting an unsafe load.

---

## 2. Feature Availability Table

| Feature / Capability | Demo Simulation Mode 🧪 | Live ESP32 Hardware Mode ⚡ | Status |
|---|---|---|---|
| **Out-of-the-Box Execution** | Instant (Zero setup required) | Requires ESP32 + Wi-Fi / MQTT | Production-Ready |
| **PWA Offline Capabilities** | Fully functional offline | Cached dashboard & local IndexedDB | Production-Ready |
| **Hero JHI Radial Gauge** | Dynamic 0–100 score + sub-scores | Live computed from hardware stream | Verified |
| **Near-Zero Current Guard** | Blocks false $R$ below $1.0\text{ A}$ | Prevents ADC noise floor division | Tested |
| **Synchronized Waveform Trends** | 4-channel Recharts ($R, T, I, F$) | 4-channel Recharts ($R, T, I, F$) | Tested |
| **Fault Diagnostic Classifier** | 7 fault scenarios injectable | Automatic anomaly detection | Tested |
| **Alert Debounce & Hysteresis** | 3-sample hold & clear filter | Rejects noise at threshold borders | Verified |
| **Baseline Snapshot Tool** | Single-click $R_0, F_0, \Delta T_0$ capture | Calibrates as-installed parameters | Verified |
| **Field Maintenance Log** | CRUD operations + CSV export | Local Dexie DB + print layout | Verified |
| **Printable Lab Report** | `@media print` formatted view | High-contrast laboratory report | Verified |
| **Local Hardware Safety Relay** | Emulated in payload (`safetyTrip`) | Autonomous GPIO cutoff on ESP32 | Verified |

---

## 3. System Architecture

```
[ SENSING HARDWARE ]
  - ADS1115 Differential ADC (Vdrop in mV)
  - ACS758 Hall-Effect Transducer (Current A)
  - HX711 24-bit ADC + Load Cell (Clamp Force N)
  - Dual DS18B20 1-Wire Digital Probes (Joint & Ambient °C)
         │
         ▼
[ ESP32 EDGE CONTROLLER ]
  - Core 1: Sensor acquisition & 64x oversampling (1.0 Hz)
  - Core 1: Autonomous hardware trip interlock
  - Core 0: FreeRTOS network task, Wi-Fi & MQTT/TLS publisher
         │
         ├──► MQTT Broker (WSS: wss://broker.hivemq.com:8884/mqtt)
         └──► HTTP REST Fallback (http://<ESP32_IP>/api/telemetry)
         │
         ▼
[ SMART JOINT MONITOR PWA ]
  - Ingestion: Modular TelemetryAdapter (Demo / MQTT / HTTP)
  - Core Physics: Holm Constriction, Joule Loss, Temp Rise, JHI 0-100
  - Diagnostic Engine: FaultClassifier (5 failure modes) + Debounce
  - Storage: Dexie IndexedDB (Time-series buffer, alerts, maintenance)
  - UI: React 18, Tailwind CSS, Recharts, Mission-Control theme
```

---

## 4. Hardware Wiring & Pinout

| Sensor Module | Transducer Function | ESP32 Pin | Interface / Protocol | Notes |
|---|---|---|---|---|
| **ADS1115** | Joint Voltage Drop ($V_{drop}$) | GPIO 21 (SDA), GPIO 22 (SCL) | I2C (Address `0x48`) | Differential inputs across 50mm joint overlap |
| **ACS758** | Primary Busbar Current ($I$) | GPIO 34 (Analog In) | Analog ADC (11dB atten) | 20 mV/A sensitivity; 64-sample digital filter |
| **HX711** | Bolt Contact Force ($F$) | GPIO 18 (DOUT), GPIO 19 (SCK) | 2-Wire Serial ADC | Fitted with washer load cell under M10 bolt head |
| **DS18B20 #1** | Joint Contact Temp ($T_{joint}$) | GPIO 4 | 1-Wire Digital Bus | Surface probe clamped to joint contact plate |
| **DS18B20 #2** | Ambient Enclosure ($T_{amb}$) | GPIO 4 | 1-Wire Digital Bus | Measures ambient temperature inside panel |
| **Trip Relay** | Hardware Safety Interlock | GPIO 23 | Digital Out (Active High) | Directly controls shunt-trip coil of breaker |
| **Status LED** | Heartbeat & Connectivity | GPIO 2 | Digital Out | Flashes on packet transmission / Wi-Fi sync |

---

## 5. Quick Start Guide

### 5.1 Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher.
- [npm](https://www.npmjs.com/) v9.0.0 or higher.

### 5.2 Installation & Launch
```bash
# Clone and enter directory
cd smart-joint-monitor

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open your browser to `http://localhost:5173`. The application launches in **Demo Mode** with physics simulation running immediately out-of-the-box!

### 5.3 Connecting to Live ESP32 Hardware
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure your MQTT broker address or local ESP32 HTTP address in `.env`.
3. In the web interface, click the **Mode Switcher** in the top header: select **Live ESP32 ⚡**.
4. In **Device Settings**, verify connection parameters and click **Save Configuration**.

---

## 6. Testing & Quality Verification

Run the automated Vitest unit and component test suite:

```bash
# Execute unit tests
npm test

# Run tests in continuous watch mode
npm run test:watch

# Strict TypeScript type check
npx tsc -b

# Production build & PWA bundle generation
npm run build
```

---

## 7. Directory Structure

```
smart-joint-monitor/
├── .env.example               # Environment variables template
├── .gitignore                 # Secrets & node_modules exclusion
├── package.json               # Dependencies & scripts
├── tsconfig.json              # Strict TypeScript configuration
├── vite.config.ts             # Vite, PWA, & Vitest configuration
├── tailwind.config.js         # Mission-Control color tokens
├── docs/                      # Engineering documentation
│   ├── ARCHITECTURE.md        # Detailed system architecture
│   ├── JHI.md                 # Joint Health Index mathematical derivation
│   ├── ESP32_PAYLOAD.md       # JSON & MQTT communication specifications
│   ├── BACKEND_SETUP.md       # Broker deployment & WebSocket configuration
│   └── TESTING.md             # Test harness & manual fault injection guide
├── firmware/
│   └── esp32_example/
│       ├── esp32_joint_monitor.ino  # Production ESP32 Arduino sketch
│       └── secrets.example.h        # Secure Wi-Fi/MQTT credential template
├── sample-data/
│   ├── 7day_telemetry.json    # Pre-seeded 7-day realistic demo dataset
│   └── 7day_telemetry.csv     # Pre-seeded 7-day tabular CSV dataset
├── src/
│   ├── main.tsx               # Application bootstrap
│   ├── App.tsx                # App shell, routing & navigation
│   ├── index.css              # Design tokens & tabular numerals
│   ├── types/                 # Domain TypeScript interfaces
│   ├── lib/                   # Physics, fault classifier, db, formatters
│   ├── services/              # Telemetry adapters (Demo, MQTT, HTTP)
│   ├── store/                 # Zustand global state store
│   ├── components/            # Reusable atomic UI & page components
│   └── pages/                 # 7 Primary operational views
```

---

## 8. Academic Attribution & License

- **Institution:** Department of Electrical & Electronics Engineering (EEE)
- **Project:** Final-Year B.Tech Capstone Project
- **Topic:** Industrial IoT Condition Monitoring & Predictive Diagnostics for Switchgear Busbars
- **License:** MIT License. Feel free to use and adapt for academic research and industrial prototypes.
