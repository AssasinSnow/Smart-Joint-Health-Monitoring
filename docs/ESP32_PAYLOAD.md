# ESP32 Telemetry & Communication Payload Specification

## 1. Overview
The ESP32 microcontroller publishes real-time sensor measurements over MQTT (JSON payload) or provides them via an HTTP REST endpoint for web clients and SCADA gateways.

---

## 2. MQTT Telemetry Schema

### Topic Structure
| Channel | Direction | Topic Name | QoS | Retain | Description |
|---|---|---|---|---|---|
| Telemetry Stream | ESP32 $\to$ Broker | `busbar/joint1/telemetry` | 0 or 1 | False | Periodic sensor measurements (1 Hz) |
| Device State | ESP32 $\to$ Broker | `busbar/joint1/status` | 1 | True | Last Will & Testament (`online` / `offline`) |
| Commands | Client $\to$ ESP32 | `busbar/joint1/commands` | 1 | False | Remote tare, calibration, and threshold updates |

---

## 3. Telemetry Payload Format (JSON)

Published to `busbar/joint1/telemetry` at 1.0 Hz:

```json
{
  "timestamp": 1728912450000,
  "vDrop_mV": 8.042,
  "current_A": 201.50,
  "force_N": 11980,
  "tempJoint_C": 41.2,
  "tempAmbient_C": 31.5,
  "safetyTrip": false
}
```

### Field Definitions

| Field | Type | Unit | Range | Description |
|---|---|---|---|---|
| `timestamp` | integer | ms | Unix epoch or `millis()` | Timestamp of acquisition in milliseconds |
| `vDrop_mV` | float | $\text{mV}$ | $-0.1 \dots 150.0$ | Differential voltage drop across joint via ADS1115 |
| `current_A` | float | $\text{A}$ | $0.0 \dots 400.0$ | Primary busbar current measured by ACS758 |
| `force_N` | integer | $\text{N}$ | $0 \dots 20000$ | Clamping bolt contact force via HX711 load cell |
| `tempJoint_C` | float | $^\circ\text{C}$ | $-40.0 \dots 125.0$ | DS18B20 1-Wire temperature on contact overlap |
| `tempAmbient_C` | float | $^\circ\text{C}$ | $-40.0 \dots 85.0$ | DS18B20 1-Wire enclosure ambient temperature |
| `safetyTrip` | boolean | flag | `true` / `false` | Status of local autonomous hardware trip relay |

### Hardware Error Codes in Payload
- `tempJoint_C = -127.0`: DS18B20 probe disconnected / open circuit (missing 4.7kΩ pull-up).
- `tempJoint_C = 85.0`: DS18B20 power-on reset state without temperature conversion completion.
- `vDrop_mV < -0.2`: Inverted ADS1115 differential polarity or open analog input.

---

## 4. HTTP REST API Endpoint (Fallback Transport)

For installations where MQTT WebSockets cannot be routed, the ESP32 serves an HTTP endpoint.

### Endpoint: `GET /api/telemetry`
**Request:**
```http
GET /api/telemetry HTTP/1.1
Host: 192.168.1.50
Accept: application/json
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Access-Control-Allow-Origin: *
Cache-Control: no-cache

{
  "timestamp": 1728912450000,
  "vDrop_mV": 8.042,
  "current_A": 201.5,
  "force_N": 11980,
  "tempJoint_C": 41.2,
  "tempAmbient_C": 31.5,
  "safetyTrip": false
}
```

---

## 5. Command Payloads (Client to ESP32)

Published to `busbar/joint1/commands`:

### Tare Load Cell:
```json
{
  "command": "TARE_LOADCELL"
}
```

### Snapshot Baseline:
```json
{
  "command": "CAPTURE_BASELINE",
  "label": "Post-torque calibration"
}
```
