#include <RHReliableDatagram.h>
#include <RH_RF95.h>
#include <SPI.h>
#include <Wire.h>
#include "LyzaLORA.h"

#define DEBUG false
#define LED_STATUS true

/**
 * Radio configuration
 */
#define RFM95_CS 10
#define RFM95_RST 9
#define RFM95_INT 2
//#define RF95_FREQ 915.0

/**
 * Status LED pins
 */
#define TX_LED 5
#define RX_LED 4

/**
 * Initialize radio driver and messaging/network manager
 */
RH_RF95 driver(RFM95_CS, RFM95_INT);
RHReliableDatagram manager(driver, GATEWAY_ADDRESS);

ClientPacket lastPacket;
byte lastMasterCommand = 0;

/**
 *  Initialize the manager and kick up debug
 */
void setup() {
  
  /* Kick up debug */
  if (DEBUG) {
    Serial.begin(9600);
    while (!Serial) ; // Wait until Serial ready
  }

  /* Set up LEDs */
  if (LED_STATUS) {
    pinMode(TX_LED, OUTPUT);
    pinMode(RX_LED, OUTPUT);
    // Blink the LEDs to show they're working
    digitalWrite(TX_LED, HIGH);
    digitalWrite(RX_LED, HIGH);
    if (DEBUG) {
      Serial.println("Status LEDs enabled");
    }
    delay(200);
    digitalWrite(TX_LED, LOW);
    digitalWrite(RX_LED, LOW);
  }

  /* TODO: More driver config */
  // driver.setTxPower(23, false); // TODO ... args dBm, useRFO
  // driver.setCADTimeout(10000); // TODO Wait for channel to clear
  // driver.setFrequency(RF95_FREQ); // TODO experiment with this

  /* Initialize the manager */
  if (!manager.init()) {
    if (DEBUG)
      Serial.println("init failure for LoRA server");
  } else if (DEBUG) {
    Serial.print("LoRA gateway initialized at address: 0x");
    Serial.println(GATEWAY_ADDRESS, HEX);
  }

  /* Kick off I2C */
  Wire.begin(I2C_ADDRESS);
  if (DEBUG) {
    Serial.print("Joined Wire as address: ");
    Serial.println(I2C_ADDRESS);
  }
  Wire.onRequest(onRequest);
  Wire.onReceive(receiveCommand);
}

void loop()
{
  uint8_t buf[RH_RF95_MAX_MESSAGE_LEN];

  ServerPacket res; // Struct to hold response to client
  res.code = 0x01;
  
  // Check for messages
  if (manager.available())
  {
    uint8_t len = sizeof(buf);
    uint8_t from;
    if (manager.recvfromAck(buf, &len, &from))
    {
       memcpy(&lastPacket, buf, sizeof(lastPacket));
       lastPacket.deviceID = from;
      /* TODO: Process and store message */
      if (LED_STATUS) {
        digitalWrite(RX_LED, HIGH);
      }
      if (DEBUG) {
        RH_RF95::printBuffer("Received: ", buf, len);
        Serial.print("received data from : 0x");
        Serial.println(from, HEX);
        Serial.print("MCP temperature (C): ");
        Serial.println(lastPacket.mcp_temperature);
        Serial.print("MPL pressure (Pascals): ");
        Serial.println(lastPacket.mpl_pressure);
        Serial.print("Device ID: ");
        Serial.println(lastPacket.deviceID, HEX);
        Serial.print("Capabilities: ");
        Serial.println(lastPacket.capabilities, HEX);
      }
      // Send a reply back to the originator client
      if (LED_STATUS) {
        digitalWrite(TX_LED, HIGH);
      }
      if (!manager.sendtoWait((uint8_t*)&res, sizeof(res), from)) {
        if (DEBUG) {
          Serial.println("sendtoWait failed");
        }
      }
      if (LED_STATUS) {
        delay(100);
        digitalWrite(RX_LED, LOW);
        digitalWrite(TX_LED, LOW);
      }
    }
  }
  if (LED_STATUS) {
    delay(100);
    digitalWrite(TX_LED, HIGH);
    delay(200);
    digitalWrite(TX_LED, LOW);
  }
}

void writeData () {
  if (DEBUG) {
    Serial.println("Sending data packet");
  }
  uint8_t data[sizeof(lastPacket)];
  memcpy(data, &lastPacket, sizeof(lastPacket));
  Wire.write(data, sizeof(data));
}

void writeOffset () {
  unsigned long offset = millis();
  if (DEBUG) {
    Serial.print("Sending offset: ");
    Serial.println(offset);
  }
  uint8_t data[sizeof(offset)];
  memcpy(data, &lastPacket, sizeof(offset));
  Wire.write(data, sizeof(data));  
}

void onRequest () {
  if (DEBUG) {
    Serial.println("---------------------");
    Serial.println("Wire request incoming");
    Serial.println("---------------------");
  }
  switch (lastMasterCommand) {
    case COMMAND_READ: // Default: send data
      writeData();
     break;
     case COMMAND_OFFSET: // Send current millis() value for offset/timestamping
      writeOffset();
     break;
  }

  lastMasterCommand = 0; // Reset command, if any
}

void receiveCommand (int howMany) {
  if (LED_STATUS) {
    digitalWrite(RX_LED, HIGH);
  }
  if (DEBUG) {
    Serial.println("---------------------");
    Serial.println("Wire receive command");
    Serial.println("---------------------");
  }
  lastMasterCommand = Wire.read(); // Always a one-byte command
  if (DEBUG) {
    Serial.println("Command received: 0x");
    Serial.println(lastMasterCommand, HEX);
  }
  if (LED_STATUS) {
    delay(250);
    digitalWrite(RX_LED, LOW);
  }
  
}

