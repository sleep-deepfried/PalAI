/**
 * PalAI thesis IoT — ESP32
 *
 * - Polls Supabase REST for iot_pump.pump_is_on (default row) every 1s.
 * - Drives relay on GPIO 4 (pump). Invert RELAY_ACTIVE_HIGH if your module is active-LOW.
 * - RS485 NPK sensor on Serial2 (RX=16, TX=17), RE/DE on GPIO 5 (GPIO 4 reserved for relay).
 * - Posts readings to iot_npk_readings via REST.
 *
 * Dependencies: ArduinoJson (v6+), ESP32 board support.
 * Copy secrets.example.h → secrets.h
 */

#include <Arduino.h>
#include <cstdio>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#include "secrets.h"

#ifndef WIFI_SSID
#error "Create secrets.h from secrets.example.h"
#endif

// --- Pin map (relay on 4 per wiring; RS485 direction moved off 4) ---
static const int PIN_RELAY = 4;
static const int PIN_RS485_DE_RE = 5;
static const int PIN_SERIAL2_RX = 16;
static const int PIN_SERIAL2_TX = 17;

// Set false if relay energizes when IN is LOW.
static const bool RELAY_ACTIVE_HIGH = true;

static const unsigned long PUMP_POLL_MS = 1000;
static const unsigned long NPK_INTERVAL_MS = 5000;
static const unsigned long WIFI_RECONNECT_MS = 5000;
static const uint16_t HTTP_TIMEOUT_MS = 4000;

// Modbus read holding registers 0x001E, 3 registers (same frame as legacy sketch).
static const byte NPK_REQUEST[] = {0x01, 0x03, 0x00, 0x1E, 0x00, 0x03, 0x65, 0xCD};
static byte npkResponse[11];

static unsigned long lastPumpPoll = 0;
static unsigned long lastNpkMs = 0;
static unsigned long lastWifiAttempt = 0;
static bool pumpState = false;

static void setRelay(bool on) {
  bool level = RELAY_ACTIVE_HIGH ? on : !on;
  digitalWrite(PIN_RELAY, level ? HIGH : LOW);
}

static bool ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) {
    return true;
  }
  unsigned long now = millis();
  if (now - lastWifiAttempt < WIFI_RECONNECT_MS) {
    return false;
  }
  lastWifiAttempt = now;
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true);
  delay(100);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  return false;
}

static bool httpGetJson(const String &url, DynamicJsonDocument &outDoc, int *httpCode) {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  https.setTimeout(HTTP_TIMEOUT_MS);
  if (!https.begin(client, url)) {
    *httpCode = -1;
    return false;
  }
  https.addHeader("apikey", SUPABASE_ANON_KEY);
  https.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  https.addHeader("Accept", "application/json");

  *httpCode = https.GET();
  if (*httpCode != HTTP_CODE_OK) {
    https.end();
    return false;
  }

  String payload = https.getString();
  https.end();

  DeserializationError err = deserializeJson(outDoc, payload);
  return !err;
}

static bool httpPostJson(const String &url, const String &jsonBody, int *httpCode) {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  https.setTimeout(HTTP_TIMEOUT_MS);
  if (!https.begin(client, url)) {
    *httpCode = -1;
    return false;
  }
  https.addHeader("apikey", SUPABASE_ANON_KEY);
  https.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  https.addHeader("Content-Type", "application/json");
  https.addHeader("Prefer", "return=minimal");

  *httpCode = https.POST(jsonBody);
  https.end();
  return *httpCode >= 200 && *httpCode < 300;
}

static void pollPumpFromSupabase() {
  String url = String(SUPABASE_URL) + "/rest/v1/iot_pump?select=pump_is_on&id=eq.default";

  DynamicJsonDocument doc(512);
  int code = 0;
  if (!httpGetJson(url, doc, &code)) {
    Serial.printf("Pump poll failed HTTP %d\n", code);
    return;
  }

  if (!doc.is<JsonArray>() || doc.as<JsonArray>().size() < 1) {
    Serial.println("Pump poll: empty or unexpected JSON");
    return;
  }

  bool desired = doc[0]["pump_is_on"].as<bool>();
  if (desired != pumpState) {
    pumpState = desired;
    setRelay(pumpState);
    Serial.printf("Pump -> %s\n", pumpState ? "ON" : "OFF");
  }
}

static bool readNpk(int *n, int *p, int *k) {
  digitalWrite(PIN_RS485_DE_RE, HIGH);
  delay(10);
  Serial2.write(NPK_REQUEST, sizeof(NPK_REQUEST));
  Serial2.flush();
  digitalWrite(PIN_RS485_DE_RE, LOW);

  delay(100);

  if (Serial2.available() < 11) {
    while (Serial2.available()) {
      Serial2.read();
    }
    return false;
  }

  Serial2.readBytes(npkResponse, 11);
  if (npkResponse[0] != 0x01 || npkResponse[1] != 0x03 || npkResponse[2] != 0x06) {
    return false;
  }

  *n = (npkResponse[3] << 8) | npkResponse[4];
  *p = (npkResponse[5] << 8) | npkResponse[6];
  *k = (npkResponse[7] << 8) | npkResponse[8];
  return true;
}

static void postNpkToSupabase(int n, int p, int k) {
  char json[160];
  snprintf(json, sizeof(json),
           "[{\"nitrogen_ppm\":%d,\"phosphorus_ppm\":%d,\"potassium_ppm\":%d}]",
           n, p, k);

  String url = String(SUPABASE_URL) + "/rest/v1/iot_npk_readings";
  int code = 0;
  if (!httpPostJson(url, String(json), &code)) {
    Serial.printf("NPK POST failed HTTP %d\n", code);
    return;
  }
  Serial.printf("NPK posted N=%d P=%d K=%d\n", n, p, k);
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_RELAY, OUTPUT);
  pinMode(PIN_RS485_DE_RE, OUTPUT);
  digitalWrite(PIN_RS485_DE_RE, LOW);
  setRelay(false);

  Serial2.begin(4800, SERIAL_8N1, PIN_SERIAL2_RX, PIN_SERIAL2_TX);
  delay(500);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  lastWifiAttempt = millis();

  Serial.println("PalAI ESP32: pump poll + NPK (Supabase REST)");
}

void loop() {
  if (!ensureWifi()) {
    delay(200);
    return;
  }

  unsigned long now = millis();

  if (now - lastPumpPoll >= PUMP_POLL_MS) {
    lastPumpPoll = now;
    pollPumpFromSupabase();
  }

  if (now - lastNpkMs >= NPK_INTERVAL_MS) {
    lastNpkMs = now;
    int n = 0, p = 0, k = 0;
    if (readNpk(&n, &p, &k)) {
      postNpkToSupabase(n, p, k);
    } else {
      Serial.println("NPK read failed (timeout or bad frame)");
    }
  }
}
