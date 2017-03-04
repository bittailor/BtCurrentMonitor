#include "application.h"
#include "MQTT.h"
#include "adafruit-ina219.h"

#define MQTT_SERVER      "piOne"
#define MQTT_SERVERPORT  1883                   
#define MQTT_USERNAME    ""
#define MQTT_PASSWORD    ""
#define MQTT_CLIENT_NAME "BtCurrentMonitor"

#define STATE_TOPIC   "/bt/multimeter/state"
#define SENSORS_TOPIC "/bt/multimeter/sensors"
#define COMMAND_TOPIC "/bt/multimeter/command"

SYSTEM_THREAD(ENABLED);

void callback(char* topic, byte* payload, unsigned int length);
void MQTT_connect();

MQTT client(MQTT_SERVER, MQTT_SERVERPORT, callback);
Adafruit_INA219 currentSensor;
unsigned long lastLoop;
unsigned long loopCounter = 0;

void setup() {
  Serial.begin(115200);
  delay(10);

  Wire.setSpeed(CLOCK_SPEED_400KHZ);
  currentSensor.begin();
  currentSensor.setCalibration_16V_400mA();

  lastLoop = millis();
}

static const size_t MAX_MESSAGE_LENGTH = 100;

void loop() {
  MQTT_connect();
  unsigned long now = millis();
  unsigned long loop = now - lastLoop;
  lastLoop = now;
  float current = currentSensor.getCurrent_mA();
  float voltage = currentSensor.getBusVoltage_V();
  
  char messageBuffer[MAX_MESSAGE_LENGTH] = {0};
  snprintf(messageBuffer, MAX_MESSAGE_LENGTH, "{\"l\":%lu,\"c\":%f,\"v\":%f,\"t\":%lu}", loop, current, voltage, now);
  Serial.print(F("\nSending photocell val "));
  Serial.print(messageBuffer);
  Serial.print("... ");
  ;
  if (! client.publish(SENSORS_TOPIC,messageBuffer)) {
    Serial.println(F("Failed"));
  } else {
    Serial.println(F("OK!"));
  }
}

void MQTT_connect() {
  if (client.isConnected()) {
    loopCounter++;
    if((loopCounter % 200) == 0) {
      client.loop();
    }     
    return;
  }

  Serial.print("Connecting to MQTT... ");

  uint8_t retries = 3;
  while (!client.connect(MQTT_CLIENT_NAME, MQTT_USERNAME, MQTT_PASSWORD)) {
       client.disconnect();
       delay(5000); 
       retries--;
       if (retries == 0) {
         return;
       }
  }
  if(client.subscribe(COMMAND_TOPIC)) {
    client.publish(STATE_TOPIC,"subscribe OK");
  } else {
    client.publish(STATE_TOPIC,"subscribe FAILED");
  }
  Serial.println("MQTT Connected!");
}

void callback(char* topic, byte* payload, unsigned int length) {
  char messageBuffer[MAX_MESSAGE_LENGTH] = {0};
  memcpy(messageBuffer,payload,length);
  messageBuffer[length] = 0;
  
  client.publish(STATE_TOPIC, messageBuffer);
}
