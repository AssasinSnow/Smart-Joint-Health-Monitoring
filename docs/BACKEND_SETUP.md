# Backend & Telemetry Broker Setup Guide

This guide describes how to configure an MQTT broker with **WebSocket support** (required for browser-based PWA clients) and TLS encryption.

---

## 1. Cloud Broker (Recommended for Quick Lab Testing)

### Option A: HiveMQ Cloud (Free Public Sandbox)
For academic demonstrations and laboratory testing, you can use HiveMQ's public WebSocket broker:
- **Broker WebSocket URL:** `wss://broker.hivemq.com:8884/mqtt`
- **Native MQTT (ESP32):** `broker.hivemq.com:1883` (or port `8883` with TLS)
- **Topic:** `busbar/joint1/telemetry`
- **Authentication:** None required for public test broker.

### Option B: EMQX Cloud (Production-Grade Free Tier)
1. Register for a free tier deployment at [emqx.com](https://www.emqx.com/).
2. Enable the **WebSocket (WSS)** listener on port `8084` or `8083`.
3. Create client credentials under **Authentication > Password-Based**:
   - Username: `esp32_device`
   - Password: `[YOUR_SECURE_PASSWORD]`
4. Fill credentials in your `.env` and `firmware/esp32_example/secrets.h`.

---

## 2. On-Premise Local Mosquitto Setup (Raspberry Pi / Linux / Windows)

To run a secure on-premise broker inside a substation or laboratory:

### 2.1 Installation
```bash
# Ubuntu / Debian / Raspberry Pi OS
sudo apt update
sudo apt install mosquitto mosquitto-clients
```

### 2.2 Configuration (`/etc/mosquitto/conf.d/smart_joint.conf`)
Create a custom configuration file enabling standard TCP and WebSocket listeners:

```conf
# Standard MQTT listener for ESP32
listener 1883 0.0.0.0
protocol mqtt

# WebSocket listener for PWA Browser Clients
listener 9001 0.0.0.0
protocol websockets

# Persistence & Logging
persistence true
persistence_location /var/lib/mosquitto/
log_dest file /var/log/mosquitto/mosquitto.log

# Authentication
allow_anonymous false
password_file /etc/mosquitto/passwd
```

### 2.3 User Creation & Service Start
```bash
# Create user 'busbar_admin'
sudo mosquitto_passwd -c /etc/mosquitto/passwd busbar_admin

# Restart Mosquitto service
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto
```

### 2.4 Enabling TLS / SSL for HTTPS PWA Compliance
Modern browsers require Progressive Web Apps running on `https://` to connect exclusively to `wss://` (encrypted WebSockets):

```conf
# Secure WebSocket listener (TLS)
listener 8884 0.0.0.0
protocol websockets
certfile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
keyfile /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

---

## 3. Verifying Broker Ingestion

Verify that messages published by the ESP32 reach the broker using the command-line client:

```bash
# Subscribe to telemetry stream
mosquitto_sub -h broker.hivemq.com -p 1883 -t "busbar/joint1/telemetry" -v
```

Expected output:
```json
busbar/joint1/telemetry {"timestamp":1728912450000,"vDrop_mV":8.042,"current_A":201.50,"force_N":11980,"tempJoint_C":41.2,"tempAmbient_C":31.5,"safetyTrip":false}
```
