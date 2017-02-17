#include <RHReliableDatagram.h>
#include <RH_RF95.h>
#include <SPI.h>
#include <Wire.h>
#include "Adafruit_MCP9808.h"
#include <Adafruit_MPL3115A2.h>
#include "LyzaLORA.h"

#define DEBUG false

/**
 * Radio configuration
 */
#define RFM95_CS 6
#define RFM95_RST 11
#define RFM95_INT 12
#define RF95_FREQ 915.0

/**
 * Initialize radio driver and messaging/network manager
 */
RH_RF95 driver(RFM95_CS, RFM95_INT);
RHReliableDatagram manager(driver);

/**
 *  Instantiate sensors, etc.
 *  We'll instantiate all of 'em, but this
 *  client might not have 'em all
 *  TODO: Is this stupid for memory?
 */
Adafruit_MCP9808 mcp = Adafruit_MCP9808();
Adafruit_MPL3115A2 mpl = Adafruit_MPL3115A2();
uint8_t capabilities = 0x00;
uint8_t deviceID; // Unique Device ID of the MCU

ClientPacket packet;

/**
 *  Return most significant 8 bits of the first 32 bits of
 *  this MCU's device ID for use as a device address.
 *  This is for SAMD MCUs only
 */
uint8_t getID() {
  volatile uint32_t val1;
  volatile uint32_t *ptr1 = (volatile uint32_t *)0x0080A00C;
  val1 = *ptr1;
  return val1 >> 24;
}

void initSensors () {
  if (mcp.begin()) {
    capabilities = capabilities | CAPABILITY_MCP;
  }
  if (mpl.begin()) {
    capabilities = capabilities | CAPABILITY_MPL;
  }
  if (DEBUG) {
    Serial.print("MCP temp sensor?: ");
    Serial.println(capabilities & CAPABILITY_MCP);
    Serial.print("MPL multi sensor?: ");
    Serial.println(capabilities & CAPABILITY_MPL);
    Serial.print("Capabilities: ");
    Serial.println(capabilities, HEX);
  }
}

float read_mcp() {
  float temperature = 0.00;
  if (capabilities & CAPABILITY_MCP) {
    mcp.shutdown_wake(0);
    delay(100);
    temperature = mcp.readTempC();
    delay(250);
    mcp.shutdown_wake(1);
    if (DEBUG) {
      Serial.print("Read MCP temperature (C): ");
      Serial.println(temperature);
    }
  } else if (DEBUG) {
     Serial.println("No MCP temperature device to read");
  }
  return temperature;
}

float read_mpl_pressure() {
  float pressure = 0.00;
  if (capabilities & CAPABILITY_MPL) {
    pressure = mpl.getPressure();
    if (DEBUG) {
      Serial.print("Read MPL pressure (pascals): ");
      Serial.println(pressure);
    }
  } else if (DEBUG) {
     Serial.println("No MPL barometric device to read");
  }
  return pressure;
}

void setup() {
  
  /* Kick up debug */
  if (DEBUG) {
    Serial.begin(9600);
    while (!Serial) ; // Wait for serial to be ready
  }

  /* Additional manager config */
  deviceID = getID();
  manager.setThisAddress(deviceID); // Set address based on hardware ID
  manager.setTimeout(1000);

  /* Initialize manager */
  if (!manager.init()) {
    if (DEBUG)
     Serial.println("init failure for LoRA client");
  } else {
    if (DEBUG) {
      Serial.print("Client initialized at address: 0x");
      Serial.println(manager.thisAddress(), HEX);
    }
  }

  initSensors();
  /* TODO: Additional driver config */
  // driver.setTxPower(23, false); // dBm, useRFO
  // driver.setCADTimeout(10000); // Wait for channel to clear

}

void loop() {

  uint8_t buf[RH_RF95_MAX_MESSAGE_LEN];
  
  packet.deviceID = deviceID;
  packet.capabilities = capabilities;
  packet.offset = millis();
  packet.mcp_temperature = read_mcp();
  packet.mpl_pressure = read_mpl_pressure();
  packet.mpl_temperature = 00.00; // TODO
  
  if (DEBUG) {
    Serial.print("MCP Temperature (C): ");
    Serial.println(packet.mcp_temperature);
    Serial.print("MPL Pressure (Pascals): ");
    Serial.println(packet.mpl_pressure);
    Serial.println("Sending readings packet to server");
  }

  uint8_t data[sizeof(packet)];
  memcpy(data, &packet, sizeof(packet));
  Serial.print("Size of data buffer: ");
  Serial.println(sizeof(data));
  Serial.println("Size of packet: ");
  Serial.println(sizeof(packet));

  if (manager.sendtoWait(data, sizeof(data), GATEWAY_ADDRESS))
  {
    if (DEBUG) {
      Serial.print("Sent: ");
      for(int i = 0; i < sizeof(data); i++)
      {
         Serial.print(data[i], HEX);
         Serial.print(" ");
      }
      Serial.println(" ");
    }
    // Now wait for a reply from the server
    uint8_t len = sizeof(buf);
    Serial.print("Buffer size: ");
    uint8_t from;
    if (manager.recvfromAckTimeout(buf, &len, 2000, &from))
    {
      if (DEBUG) {
        Serial.print("got reply from : 0x");
        Serial.print(from, HEX);
        Serial.print(": ");
        Serial.println((char*)buf);
        RH_RF95::printBuffer("Received: ", buf, len);
        
      }
      delay(200);
    }
    else
    {
      if (DEBUG) {
        Serial.println("No reply, is rf95_reliable_datagram_server running?");
      }
    }
  }
  else {
    if (DEBUG)
      Serial.println("sendtoWait failed");
  }
  if (!driver.sleep()) {
    if (DEBUG) {
      Serial.println("Could not sleep radio");
    }
  } else if (DEBUG) {
    Serial.println("Radio in sleep");
  }
  //delay(2000);
  delay(CLIENT_TX_FREQ_MS + deviceID);
}
