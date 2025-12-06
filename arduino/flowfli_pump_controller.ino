/*
 * FlowFli Arduino Mega Pump Controller
 * Controls water pumps via relays for FlowFli AI water management system
 */

// Pin definitions
#define PUMP1_RELAY_PIN 7
#define PUMP2_RELAY_PIN 8
#define STATUS_LED_PIN 13

// Pump states
bool pump1_active = false;
bool pump2_active = false;
unsigned long pump1_stop_time = 0;
unsigned long pump2_stop_time = 0;

void setup() {
  Serial.begin(9600);
  
  // Initialize relay pins (LOW = relay off, HIGH = relay on)
  pinMode(PUMP1_RELAY_PIN, OUTPUT);
  pinMode(PUMP2_RELAY_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);
  
  // Ensure pumps start OFF
  digitalWrite(PUMP1_RELAY_PIN, LOW);
  digitalWrite(PUMP2_RELAY_PIN, LOW);
  digitalWrite(STATUS_LED_PIN, HIGH);
  
  Serial.println("FlowFli Pump Controller Ready");
  Serial.println("Commands: PUMP1_ON:duration, PUMP1_OFF, PUMP2_ON:duration, PUMP2_OFF, STATUS");
}

void loop() {
  // Check for serial commands from FlowFli backend
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    processCommand(command);
  }
  
  // Auto-stop pumps when duration expires
  checkPumpTimers();
  
  // Blink status LED when pumps are active
  updateStatusLED();
  
  delay(100);
}

void processCommand(String cmd) {
  if (cmd.startsWith("PUMP1_ON:")) {
    int duration = cmd.substring(9).toInt();
    activatePump(1, duration);
  }
  else if (cmd == "PUMP1_OFF") {
    deactivatePump(1);
  }
  else if (cmd.startsWith("PUMP2_ON:")) {
    int duration = cmd.substring(9).toInt();
    activatePump(2, duration);
  }
  else if (cmd == "PUMP2_OFF") {
    deactivatePump(2);
  }
  else if (cmd == "STATUS") {
    sendStatus();
  }
  else {
    Serial.println("ERROR: Unknown command");
  }
}

void activatePump(int pumpId, int durationMinutes) {
  if (pumpId == 1) {
    digitalWrite(PUMP1_RELAY_PIN, HIGH);
    pump1_active = true;
    pump1_stop_time = millis() + (durationMinutes * 60000UL);
    Serial.println("PUMP1_ACTIVATED:" + String(durationMinutes));
  }
  else if (pumpId == 2) {
    digitalWrite(PUMP2_RELAY_PIN, HIGH);
    pump2_active = true;
    pump2_stop_time = millis() + (durationMinutes * 60000UL);
    Serial.println("PUMP2_ACTIVATED:" + String(durationMinutes));
  }
}

void deactivatePump(int pumpId) {
  if (pumpId == 1) {
    digitalWrite(PUMP1_RELAY_PIN, LOW);
    pump1_active = false;
    pump1_stop_time = 0;
    Serial.println("PUMP1_DEACTIVATED");
  }
  else if (pumpId == 2) {
    digitalWrite(PUMP2_RELAY_PIN, LOW);
    pump2_active = false;
    pump2_stop_time = 0;
    Serial.println("PUMP2_DEACTIVATED");
  }
}

void checkPumpTimers() {
  unsigned long currentTime = millis();
  
  // Auto-stop pump1
  if (pump1_active && currentTime >= pump1_stop_time) {
    deactivatePump(1);
    Serial.println("PUMP1_AUTO_STOPPED");
  }
  
  // Auto-stop pump2
  if (pump2_active && currentTime >= pump2_stop_time) {
    deactivatePump(2);
    Serial.println("PUMP2_AUTO_STOPPED");
  }
}

void sendStatus() {
  Serial.print("STATUS:");
  Serial.print("PUMP1=" + String(pump1_active ? "ON" : "OFF"));
  Serial.print(",PUMP2=" + String(pump2_active ? "ON" : "OFF"));
  
  if (pump1_active) {
    int remaining1 = (pump1_stop_time - millis()) / 60000;
    Serial.print(",PUMP1_TIME=" + String(remaining1));
  }
  
  if (pump2_active) {
    int remaining2 = (pump2_stop_time - millis()) / 60000;
    Serial.print(",PUMP2_TIME=" + String(remaining2));
  }
  
  Serial.println();
}

void updateStatusLED() {
  static unsigned long lastBlink = 0;
  static bool ledState = false;
  
  if (pump1_active || pump2_active) {
    // Blink LED when pumps active
    if (millis() - lastBlink > 500) {
      ledState = !ledState;
      digitalWrite(STATUS_LED_PIN, ledState);
      lastBlink = millis();
    }
  } else {
    // Solid LED when idle
    digitalWrite(STATUS_LED_PIN, HIGH);
  }
}
