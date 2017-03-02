#include <Adafruit_MQTT.h>
#include <Adafruit_MQTT_SPARK.h>
#include <adafruit-ina219.h>

#define MQTT_SERVER      "piOne"
#define MQTT_SERVERPORT  1883                   
#define MQTT_USERNAME    ""
#define MQTT_KEY         ""

SYSTEM_THREAD(ENABLED);

TCPClient client;
Adafruit_MQTT_SPARK mqtt(&client, MQTT_SERVER, MQTT_SERVERPORT, MQTT_USERNAME, MQTT_KEY);

Adafruit_MQTT_Publish statePublish = Adafruit_MQTT_Publish(&mqtt, "/bt/multimeter/state");
Adafruit_MQTT_Publish senorsPublish = Adafruit_MQTT_Publish(&mqtt, "/bt/multimeter/sensors");

Adafruit_MQTT_Subscribe commandSubscription  = Adafruit_MQTT_Subscribe(&mqtt, "/bt/multimeter/command");

Adafruit_INA219 currentSensor;
unsigned long lastLoop;

void MQTT_connect();

void setup() {
  Serial.begin(115200);
  delay(10);

  Wire.setSpeed(CLOCK_SPEED_400KHZ);
  currentSensor.begin();
  currentSensor.setCalibration_16V_400mA();
  
  //mqtt.subscribe(&onoffbutton);
  //mqtt.subscribe(&slider);

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
  unsigned long read = millis() - now;

  char messageBuffer[MAX_MESSAGE_LENGTH] = {0};
  snprintf(messageBuffer, MAX_MESSAGE_LENGTH, "{\"l\":%lu,\"c\":%f,\"v\":%f,\"t\":%lu}", loop, current, voltage, now);
  Serial.print(F("\nSending photocell val "));
  Serial.print(messageBuffer);
  Serial.print("... ");
  if (! senorsPublish.publish(messageBuffer)) {
    Serial.println(F("Failed"));
  } else {
    Serial.println(F("OK!"));
  }
}

void MQTT_connect() {
  if (mqtt.connected()) {
    return;
  }

  Serial.print("Connecting to MQTT... ");

  uint8_t retries = 3;
  int8_t ret;
  while ((ret = mqtt.connect()) != 0) {
       Serial.println(mqtt.connectErrorString(ret));
       Serial.println("Retrying MQTT connection in 5 seconds...");
       mqtt.disconnect();
       delay(5000); 
       retries--;
       if (retries == 0) {
         return;
       }
  }
  Serial.println("MQTT Connected!");
}
