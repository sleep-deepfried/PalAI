#define RE_DE_PIN 4

// FIXED: Start register changed from 0x0000 to 0x001E
// CRC is recalculated accordingly (0x65CD)
const byte npk_inquiry[] = {0x01, 0x03, 0x00, 0x1E, 0x00, 0x03, 0x65, 0xCD};

byte sensor_response[11];

void setup() {
  Serial.begin(9600);
  Serial2.begin(4800, SERIAL_8N1, 16, 17);
  pinMode(RE_DE_PIN, OUTPUT);
  digitalWrite(RE_DE_PIN, LOW);
  delay(1000);
  Serial.println("ESP32 NPK Sensor Test Started...");
}

void loop() {
  // --- SEND REQUEST ---
  digitalWrite(RE_DE_PIN, HIGH);
  delay(10);
  Serial2.write(npk_inquiry, sizeof(npk_inquiry));
  Serial2.flush();
  digitalWrite(RE_DE_PIN, LOW);

  // --- WAIT FOR RESPONSE ---
  delay(100);

  // --- READ & PARSE ---
  if (Serial2.available() >= 11) {
    Serial2.readBytes(sensor_response, 11);

    // Raw hex dump for debugging
    Serial.print("Raw bytes: ");
    for (int i = 0; i < 11; i++) {
      if (sensor_response[i] < 0x10) Serial.print("0");
      Serial.print(sensor_response[i], HEX);
      Serial.print(" ");
    }
    Serial.println();

    // Validate response header before trusting the data
    // Expected: 01 03 06 ...
    if (sensor_response[0] == 0x01 &&
        sensor_response[1] == 0x03 &&
        sensor_response[2] == 0x06) {

      int nitrogen   = (sensor_response[3] << 8) | sensor_response[4];
      int phosphorus = (sensor_response[5] << 8) | sensor_response[6];
      int potassium  = (sensor_response[7] << 8) | sensor_response[8];

      Serial.print("Nitrogen   (N): "); Serial.print(nitrogen);   Serial.println(" mg/kg");
      Serial.print("Phosphorus (P): "); Serial.print(phosphorus); Serial.println(" mg/kg");
      Serial.print("Potassium  (K): "); Serial.print(potassium);  Serial.println(" mg/kg");
      Serial.println("-------------------------");

    } else {
      Serial.println("Bad response header. Wrong register or sensor model.");
      Serial.println("Try the alternate 0x0000 frame if 0x001E keeps failing.");
    }

  } else {
    Serial.print("Timeout — bytes received: ");
    Serial.println(Serial2.available());
    Serial.println("Check wiring, baud rate, or 12V power supply.");
    while (Serial2.available()) Serial2.read(); // flush garbage
  }

  delay(2000);
}