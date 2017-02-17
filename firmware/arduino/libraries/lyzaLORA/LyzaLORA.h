// ensure this library description is only included once
#ifndef LyzaLORA_h
#define LyzaLORA_h

#define GATEWAY_ADDRESS 0x08
#define I2C_ADDRESS 0x09
#define CLIENT_TX_FREQ_MS 30000 // Every 5 minutes

#define COMMAND_READ 0x00
#define COMMAND_OFFSET 0x01

#define CAPABILITY_MCP 0x01
#define CAPABILITY_MPL 0x02

typedef struct {
  uint32_t offset;
  float mcp_temperature;
  float mpl_pressure;
  float mpl_temperature;
  uint8_t deviceID;
  uint8_t capabilities;
} ClientPacket;

typedef struct {
  uint8_t code;
} ServerPacket;

#endif
