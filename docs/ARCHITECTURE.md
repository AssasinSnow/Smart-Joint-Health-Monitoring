# Smart Joint Monitor - System Architecture Specification

## 1. Executive Architecture Overview

**Smart Joint Monitor** is a condition-monitoring and predictive telemetry Progressive Web App (PWA) specifically architected for high-current bolted copper busbars in switchgear, motor control centers (MCC), and industrial distribution panels.

The system adopts an edge-to-client decoupled architecture:
1. **Edge Sensing Layer:** ESP32 Dual-Core microcontroller sampling hardware transducers (ADS1115, HX711, ACS758, Dual DS18B20) with a local autonomous hardware watchdog.
2. **Transport Layer:** Dual-protocol transport supporting MQTT over WebSockets (WSS/TLS) and HTTP REST polling.
3. **PWA Layer:** Offline-capable single-page application built on React 18, TypeScript, Tailwind CSS, Zustand, Recharts, and Dexie (IndexedDB).

---

## 2. End-to-End System Block Diagram

```
+-----------------------------------------------------------------------------------+
|                            PHYSICAL BUSBAR JOINT TESTBED                          |
|  Phase A Copper Busbar (50x6mm)  =====[ M10 Bolted Overlap Joint ]=====> Load     |
+-----------------------------------------------------------------------------------+
           |                          |                 |                  |
           v                          v                 v                  v
     [ACS758 Hall]             [HX711 Washer]     [ADS1115 ADC]     [Dual DS18B20]
      (Current A)              (Clamp Force N)    (Vdrop in mV)      (T_joint, T_amb)
           |                          |                 |                  |
+-----------------------------------------------------------------------------------+
|                        EDGE LAYER: ESP32 MICROCONTROLLER                          |
|  - Core 1: Sensor Acquisition Task (1 Hz sampling, oversampling & digital filter) |
|  - Core 1: Local Autonomous Safety Interlock (Trips hardware relay if I/T exceed) |
|  - Core 0: Network & Telemetry Task (Wi-Fi STA, TLS handshake, MQTT/HTTP pub)    |
+-----------------------------------------------------------------------------------+
                                      |
                       +--------------+--------------+
                       | (WSS / TLS)                 | (HTTP REST)
                       v                             v
           +-----------------------+     +------------------------+
           | MQTT Broker           |     | Local Web Server       |
           | (HiveMQ / Mosquitto)  |     | (ESP32 /api/telemetry) |
           +-----------------------+     +------------------------+
                       |                             |
                       +--------------+--------------+
                                      v
+-----------------------------------------------------------------------------------+
|                       SMART JOINT MONITOR PROGRESSIVE WEB APP                     |
|                                                                                   |
|  +--------------------+   +---------------------+   +--------------------------+  |
|  | Telemetry Adapters |   | Physics Engine      |   | Fault Classifier         |  |
|  | - DemoGenerator    |-->| - Holm Resistance   |-->| - FLT_LOOSENING          |  |
|  | - MqttAdapter      |   | - Low-Current Guard |   | - FLT_OXIDATION          |  |
|  | - HttpAdapter      |   | - Temp Rise (ΔT)    |   | - FLT_OVERLOAD           |  |
|  +--------------------+   | - JHI Calculation   |   | - FLT_SENSOR_DROPOUT     |  |
|                           +---------------------+   | - FLT_TEMP_RISE          |  |
|                                                     +--------------------------+  |
|                                                                  |                |
|  +--------------------+   +---------------------+                v                |
|  | Local Dexie DB     |   | Zustand State Store |<----+ [Alert Debounce Engine]   |
|  | - Telemetry Points |<--| - Live Point        |                                 |
|  | - Alerts & Events  |   | - Rolling Buffer    |                                 |
|  | - Maintenance Logs |   | - Active Faults     |                                 |
|  +--------------------+   +---------------------+                                 |
|                                      |                                            |
|                                      v                                            |
|  +-----------------------------------------------------------------------------+  |
|  | Presentation Layer (React 18 + Tailwind CSS + Recharts + Lucide Icons)      |  |
|  | [Dashboard] [Live Trends] [Predictive Health] [Alerts] [Settings] [Records] |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Layer Breakdown

### 3.1 Edge Microcontroller Layer (ESP32)
- **Xtensa LX6 Dual-Core @ 240 MHz:**
  - **Core 1 (Real-time task):** Executes `taskSensorAcquisition` at 1.0 Hz with FreeRTOS mutex synchronization. Computes ADC oversampling (64 samples per reading) on analog lines to reject 50/60 Hz electromagnetic hum from adjacent busbars.
  - **Local Hardware Safety Interlock:** If current exceeds $285\text{ A}$ or surface temperature exceeds $88^\circ\text{C}$, GPIO 23 is immediately latched HIGH to de-energize the main line contactor. This ensures safety without network dependence.
  - **Core 0 (Networking task):** Executes `taskMqttTelemetry`, maintaining Wi-Fi station connectivity, TLS session keep-alives, and serialization of telemetry into standard JSON packets.

### 3.2 Ingestion & Adapter Layer (`src/services/`)
- Unified `ITelemetryAdapter` interface allows runtime switching between:
  1. `DemoTelemetryGenerator`: Self-contained 7-scenario physics simulation engine.
  2. `MqttTelemetryAdapter`: Production MQTT over Secure WebSockets (`wss://`) using `mqtt.js`.
  3. `HttpTelemetryAdapter`: Periodic polling of local micro-server endpoints (`/api/telemetry`).
- The user interface is completely decoupled from the data transport; page components consume state via the unified Zustand store regardless of source.

### 3.3 Domain Physics & Rule Engine (`src/lib/`)
- **Near-Zero Current Guard:** When current $I < 1.0\text{ A}$, contact resistance calculation is blocked to prevent asymptotic mathematical division errors from ADC thermal drift.
- **Joint Health Index (JHI):** Composite physical score from 0 (Failed/Critical) to 100 (Pristine), computed through normalized sub-indices ($S_R, S_T, S_F, S_P$).
- **Rule Classifier (`FaultClassifier`):** Deterministic diagnostic rules detecting clamping force decay, interfacial oxidation, current overload, and 1-wire probe hardware dropouts.
- **Temporal Debounce (`AlertDebouncer`):** Implements a 3-sample hysteresis filter preventing alert chatter across borderline threshold transitions.

### 3.4 Local Persistence Layer (`src/lib/db.ts`)
- Powered by **Dexie.js (IndexedDB)**:
  - `telemetry`: Rolling ring-buffer storing up to 20,000 processed telemetry points for longitudinal trend analysis.
  - `alerts`: Historical log of all triggered, acknowledged, and resolved fault events.
  - `maintenance`: CRUD logs of physical torque wrench inspections and part replacements.
  - `baselines`: Stored calibration snapshots of as-installed reference parameters.

---

## 4. Security & Safety Posture

1. **Local Interlock Primacy:** All life-safety and fault-clearing actions must reside in dedicated hardware trip circuits and local ESP32 firmware logic.
2. **Secrets Hygiene:** All Wi-Fi credentials, broker tokens, and keys are separated into `.env` (PWA) and `secrets.h` (Firmware), both explicitly gitignored. Public templates (`.env.example` and `secrets.example.h`) provide placeholders only.
3. **Encrypted Transport:** MQTT connections over public networks use TLS (port 8883 / 8884) with WebSocket encapsulation.
