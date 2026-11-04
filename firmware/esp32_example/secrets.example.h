/**
 * Smart Joint Monitor - ESP32 Firmware Secrets Template
 * 
 * SECURITY WARNING:
 * 1. Fill in your actual Wi-Fi SSID and password below.
 * 2. Keep this template safe.
 */

#ifndef SECRETS_H
#define SECRETS_H

// Wi-Fi Configuration
#define WIFI_SSID           "YOUR_HOME_OR_LAB_WIFI"
#define WIFI_PASSWORD       "YOUR_WIFI_PASSWORD"

// MQTT Broker Configuration (Free public HiveMQ broker)
#define MQTT_BROKER_HOST    "broker.hivemq.com"
#define MQTT_BROKER_PORT    1883                    // 1883 for plain MQTT (ESP32)
#define MQTT_CLIENT_ID      "esp32-joint-monitor-01"

// Topic Configuration
#define MQTT_PUB_TOPIC      "busbar/joint1/telemetry"
#define MQTT_SUB_CMD_TOPIC  "busbar/joint1/commands"

#endif // SECRETS_H
