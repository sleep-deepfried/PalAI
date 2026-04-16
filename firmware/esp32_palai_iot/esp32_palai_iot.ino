/**
 * PalAI thesis IoT — ESP32 (4-Channel Relay)
 *
 * - Polls Supabase REST for iot_pump (pump_1_on, pump_2_on, pump_3_on, pump_4_on) every 1s.
 * - Drives 4-channel relay module. Invert RELAY_ACTIVE_HIGH if your module is active-LOW.
 * - RS485 NPK sensor on Serial2 (RX=25, TX=26), RE/DE on GPIO 27.
 * - Posts readings to iot_npk_readings via REST.
 *
 * Pin Configuration (4-channel relay):
 *   GPIO 4  → Relay 1 (Pump 1 - Spray Treatment)
 *   GPIO 16 → Relay 2 (Pump 2 - Fertilizer)
 *   GPIO 17 → Relay 3 (Pump 3 - Water)
 *   GPIO 18 → Relay 4 (Pump 4 - Pesticide)
 *   GPIO 25 → Serial2 RX (NPK sensor)
 *   GPIO 26 → Serial2 TX (NPK sensor)
 *   GPIO 27 → RS485 DE/RE control
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

// ===== HARDCODED CREDENTIALS =====
#define WIFI_SSID "Daisuke_2.4G"
#define WIFI_PASSWORD "@Earlxdpldt14"
#define SUPABASE_URL "https://oxdmwhxbubmbthprjrdw.supabase.co"
#define SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZG13aHhidWJtYnRocHJqcmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzOTc5MjUsImV4cCI6MjA3Nzk3MzkyNX0.4KmuZaiscFeurgbSUgK3Qlw-IDzBOexMwgRkCTROFdA"
// =================================

// --- Pin map for 4-channel relay ---
static const int PIN_RELAY_1 = 4;   // Pump 1 - Spray Treatment
static const int PIN_RELAY_2 = 16;  // Pump 2 - Fertilizer
static const int PIN_RELAY_3 = 17;  // Pump 3 - Water
static const int PIN_RELAY_4 = 18;  // Pump 4 - Pesticide

// RS485 NPK sensor pins (moved to avoid relay conflicts)
static const int PIN_RS485_DE_RE = 27;
static const int PIN_SERIAL2_RX = 25;
static const int PIN_SERIAL2_TX = 26;

// Set false if relay energizes when IN is LOW (most 4-channel modules are active-LOW).
static const bool RELAY_ACTIVE_HIGH = false;

static const unsigned long PUMP_POLL_MS = 1000;
static const unsigned long NPK_INTERVAL_MS = 5000;
static const unsigned long WIFI_RECONNECT_MS = 5000;
static const uint16_t HTTP_TIMEOUT_MS = 4000;

// Modbus read holding registers 0x001E, 3 registers (N, P, K).
static const byte NPK_REQUEST[] = {0x01, 0x03, 0x00, 0x1E, 0x00, 0x03, 0x65, 0xCD};
static byte npkResponse[11];

static unsigned long lastPumpPoll = 0;
static unsigned long lastNpkMs = 0;
static unsigned long lastWifiAttempt = 0;

// Track state for all 4 pumps
static bool pumpState[4] = {false, false, false, false};

static void setRelay(int channel, bool on) {
  int pin;
  switch (channel) {
    case 0: pin = PIN_RELAY_1; break;
    case 1: pin = PIN_RELAY_2; break;
    case 2: pin = PIN_RELAY_3; break;
    case 3: pin = PIN_RELAY_4; break;
    default: return;
  }
  bool level = RELAY_ACTIVE_HIGH ? on : !on;
  digitalWrite(pin, level ? HIGH : LOW);
}

static void setAllRelays(bool states[4]) {
  for (int i = 0; i < 4; i++) {
    setRelay(i, states[i]);
  }
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
  
  Serial.printf("WiFi connecting to: %s\n", WIFI_SSID);
  
  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);
  delay(100);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  // Wait up to 10 seconds for connection
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.printf("WiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
    return true;
  } else {
    Serial.println();
    Serial.printf("WiFi failed, status: %d\n", WiFi.status());
    return false;
  }
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

static void pollPumpsFromSupabase() {
  String url = String(SUPABASE_URL) + "/rest/v1/iot_pump?select=pump_1_on,pump_2_on,pump_3_on,pump_4_on&id=eq.default";

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

  JsonObject row = doc[0];
  bool desired[4] = {
    row["pump_1_on"].as<bool>(),
    row["pump_2_on"].as<bool>(),
    row["pump_3_on"].as<bool>(),
    row["pump_4_on"].as<bool>()
  };

  // Always log the current state from Supabase
  Serial.printf("Supabase states: [%d, %d, %d, %d]\n", desired[0], desired[1], desired[2], desired[3]);

  // Check for changes and update relays
  bool changed = false;
  for (int i = 0; i < 4; i++) {
    if (desired[i] != pumpState[i]) {
      pumpState[i] = desired[i];
      setRelay(i, pumpState[i]);
      Serial.printf("Pump %d -> %s\n", i + 1, pumpState[i] ? "ON" : "OFF");
      changed = true;
    }
  }
  
  if (changed) {
    Serial.printf("Relay states: [%d, %d, %d, %d]\n", 
      pumpState[0], pumpState[1], pumpState[2], pumpState[3]);
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
  delay(1000); // Give serial time to initialize
  
  // Initialize all relay pins
  pinMode(PIN_RELAY_1, OUTPUT);
  pinMode(PIN_RELAY_2, OUTPUT);
  pinMode(PIN_RELAY_3, OUTPUT);
  pinMode(PIN_RELAY_4, OUTPUT);
  
  // RS485 direction control
  pinMode(PIN_RS485_DE_RE, OUTPUT);
  digitalWrite(PIN_RS485_DE_RE, LOW);
  
  // Start with all relays OFF
  for (int i = 0; i < 4; i++) {
    setRelay(i, false);
  }

  Serial2.begin(4800, SERIAL_8N1, PIN_SERIAL2_RX, PIN_SERIAL2_TX);
  delay(500);

  Serial.println();
  Serial.println("=================================");
  Serial.println("PalAI ESP32: 4-Channel Pump Control");
  Serial.println("=================================");
  Serial.printf("Relay pins: %d, %d, %d, %d\n", PIN_RELAY_1, PIN_RELAY_2, PIN_RELAY_3, PIN_RELAY_4);
  Serial.printf("RS485: RX=%d, TX=%d, DE/RE=%d\n", PIN_SERIAL2_RX, PIN_SERIAL2_TX, PIN_RS485_DE_RE);
  Serial.printf("Relay mode: %s\n", RELAY_ACTIVE_HIGH ? "Active-HIGH" : "Active-LOW");
  Serial.println("=================================");
  Serial.printf("WiFi SSID: %s\n", WIFI_SSID);
  Serial.printf("Supabase URL: %s\n", SUPABASE_URL);
  Serial.println("=================================");

  // Initial WiFi connection (blocking)
  Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.printf("WiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println();
    Serial.printf("WiFi FAILED! Status code: %d\n", WiFi.status());
    Serial.println("Will keep retrying in loop...");
  }
  
  lastWifiAttempt = millis();
}

void loop() {
  if (!ensureWifi()) {
    delay(200);
    return;
  }

  unsigned long now = millis();

  // Poll pump states from Supabase
  if (now - lastPumpPoll >= PUMP_POLL_MS) {
    lastPumpPoll = now;
    pollPumpsFromSupabase();
  }

  // Read and post NPK sensor data
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
