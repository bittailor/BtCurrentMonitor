#include "application.h"
#include "MQTT.h"
#include "adafruit-ina219.h"

#define MQTT_SERVER             "piOne"
#define MQTT_SERVERPORT         1883                   
#define MQTT_USERNAME           ""
#define MQTT_PASSWORD           ""
#define MQTT_sMqttCLIENT_NAME   "BtCurrentMonitor"

#define STATE_TOPIC     "/bt/multimeter/state"
#define SENSORS_TOPIC   "/bt/multimeter/sensors"
#define COMMAND_TOPIC   "/bt/multimeter/command"

#define MAX_MESSAGE_LENGTH 100

SYSTEM_THREAD(ENABLED);

template<typename T, size_t n> size_t arrayLength(T(&)[n]) { return n; }

typedef void (*CommandFunction)();
struct Command {
  const char* name;
  CommandFunction function;
};

void mqttCallback(char* topic, byte* payload, unsigned int length);
bool mqttConnect();
void measure();
void publishState(const char* state);
void onCommandStart();
void onCommandStop();
CommandFunction findCommandFunction(const char* name);

MQTT sMqttClient(MQTT_SERVER, MQTT_SERVERPORT, mqttCallback);
Adafruit_INA219 sCurrentSensor;

bool sMeasure = false;
unsigned long sLoopCounter = 0;
unsigned long sMillisLastMeasureLoop;

Command sCommands[] = {
  {"start",onCommandStart},
  {"stop",onCommandStop}
}; 

void setup() {
  Serial.begin(115200);
  Wire.setSpeed(CLOCK_SPEED_400KHZ);
  sCurrentSensor.begin();
  sCurrentSensor.setCalibration_16V_400mA();
  sMillisLastMeasureLoop = millis();
}

void loop() {
  bool connected = mqttConnect();
  if (connected && sMeasure) {
    measure();
  }
}

void measure(){
  unsigned long now = millis();
  unsigned long loop = now - sMillisLastMeasureLoop;
  sMillisLastMeasureLoop = now;
  float current = sCurrentSensor.getCurrent_mA();
  float voltage = sCurrentSensor.getBusVoltage_V();
  
  char messageBuffer[MAX_MESSAGE_LENGTH] = {0};
  snprintf(messageBuffer, MAX_MESSAGE_LENGTH, "{\"l\":%lu,\"c\":%f,\"v\":%f,\"t\":%lu}", loop, current, voltage, now);
  sMqttClient.publish(SENSORS_TOPIC,messageBuffer);
}

bool mqttConnect() {
  if (sMqttClient.isConnected()) {
    sLoopCounter++;
    if((sLoopCounter % 200) == 0) {
      sMqttClient.loop();
    }     
    return true;
  }

  int8_t connectRetries = 3;
  while (!sMqttClient.connect(MQTT_sMqttCLIENT_NAME, MQTT_USERNAME, MQTT_PASSWORD, STATE_TOPIC, MQTT::QOS1, 1, "{\"state\":\"offline\"}")) {
    sMqttClient.disconnect();
    delay(5000); 
    connectRetries--;
    if (connectRetries < 0) {
      return false;
    }
  }

  int8_t subscribeRetries = 3;
  while(!sMqttClient.subscribe(COMMAND_TOPIC)) {
    delay(200); 
    subscribeRetries--; 
    if (subscribeRetries < 0) {
      sMqttClient.disconnect();
      return false;
    } 
  }
  publishState("idle");
  return true;
}

void publishState(const char* state) {
  char messageBuffer[MAX_MESSAGE_LENGTH] = {0};
  snprintf(messageBuffer, MAX_MESSAGE_LENGTH, "{\"state\":\"%s\",\"version\":\"%s\"}", state, System.version().c_str());
  sMqttClient.publish(STATE_TOPIC, (const uint8_t *)messageBuffer
  , strlen(messageBuffer), 1, MQTT::QOS1);
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  char messageBuffer[MAX_MESSAGE_LENGTH] = {0};
  memcpy(messageBuffer,payload,length);
  messageBuffer[length] = 0;  
  CommandFunction function = findCommandFunction(messageBuffer); 
  if(function != nullptr) {
    function();
  }
}

void onCommandStart() {
  sMeasure = true;
  publishState("measure");  
}

void onCommandStop() {
  sMeasure = false;
  publishState("idle"); 
}

CommandFunction findCommandFunction(const char* name) {
  for(size_t i = 0 ; i < arrayLength(sCommands) ; i++) {
    if(strcmp(sCommands[i].name, name) == 0) {
      return sCommands[i].function;
    }
  }
  return nullptr;
} 
