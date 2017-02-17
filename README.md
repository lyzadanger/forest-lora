# forest-lora

A little sensor network for the forest, built with LoRA radios.

## Hardware

### Clients

* [Adafruit Feather M0 Basic Proto](https://www.adafruit.com/products/2772)
* [Adafruit LoRa Radio Transceiver Breakout 915MHz](https://www.adafruit.com/products/3072)
* I2C Sensors: [MCP9808 High-Accuracy Temperature](https://www.adafruit.com/products/1782), [BME x80](https://www.adafruit.com/products/2652)

### Gateway

* Arduino Uno
* [Adafruit LoRa Radio Transceiver Breakout 915MHz](https://www.adafruit.com/products/3072)

### Controller

* Tessel 2, connected to gateway over SDA/SCL — Tessel treats the attached gateway as an I2C slave.

## Firmware and Software

### Firmware

Arduino-compatible firmware is run by the (M0) Clients and the (Uno) Gateway. The clients are each flashed with [`client.ino`](firmware/arduino/client/client.ino) and the gateway with [`server.ino`](firmware/arduino/server/server.ino). A [shared header file](firmware/arduino/libraries/LyzaLORA/LyzaLORA.h) is used for constants.

* The `arduino/libraries/LyzaLORA` folder needs to be put in your Arduino `libraries` folder to be seen by the Arduino IDE

### Sofware

To run the front end on a provisioned Tessel 2, `t2 run index.js`

*Note*: `npm install` is not necessary to run the software on Tessel (it'll do that for you).

*Note*: To run locally, set `LOCAL_DEBUG` `true` in [`config.js`](config.js) — that will keep the modules from trying to include `tessel`, which is only available on-board the Tessel itself.

Webserver will run on port `3000` (console will provide Tessel's IP if you're running on a Tessel).

Web assets are in [`app`](app/). Viewing `index.html` will show charted temperature and pressure data from the clients.
