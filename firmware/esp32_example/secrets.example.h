/**
 * Smart Joint Monitor - ESP32 Firmware Secrets Template
 * 
 * SECURITY WARNING:
 * 1. Copy this file to "secrets.h" in the same directory.
 * 2. Fill in your actual Wi-Fi and MQTT credentials.
 * 3. NEVER commit "secrets.h" to version control (it is ignored in .gitignore).
 */

#ifndef SECRETS_H
#define SECRETS_H

// 2.4 GHz Wi-Fi Station Credentials
#define WIFI_SSID           "YOUR_WIFI_SSID"
#define WIFI_PASSWORD       "YOUR_WIFI_PASSWORD"

// MQTT Broker Credentials (HiveMQ / EMQX / AWS IoT Core / Local Mosquitto)
#define MQTT_BROKER_HOST    "broker.hivemq.com"
#define MQTT_BROKER_PORT    8883                   // 8883 for MQTTS (TLS), 1883 for plain MQTT
#define MQTT_CLIENT_ID      "esp32-joint-monitor-01"
#define MQTT_USERNAME       ""                     // Optional: broker username
#define MQTT_PASSWORD       ""                     // Optional: broker password

// Telemetry Pub/Sub Topics
#define MQTT_PUB_TOPIC      "busbar/joint1/telemetry"
#define MQTT_SUB_CMD_TOPIC  "busbar/joint1/commands"

#endif // SECRETS_H
