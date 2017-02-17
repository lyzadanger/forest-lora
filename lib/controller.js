const tessel = require('tessel');
const util = require('util');
const EventEmitter = require('events').EventEmitter;

const config = require('../config');

// TODO Move these two functions elsewhere; add a hashing function
function readDeviceID (packetBuffer) {
  return packetBuffer.readUInt8(16);
}

function readOffset (packetBuffer) {
  return packetBuffer.readUInt32LE(0);
}

const isFreshPacket = (function () {
  var lastHash;
  return function (packetBuffer) {
    const hash = `${readOffset(packetBuffer)}${readDeviceID(packetBuffer)}`;
    if (hash !== lastHash) {
      lastHash = hash;
      return true;
    }
    return false;
  };
})();

function requestReadings (i2c) {
  i2c.read(config.PACKET_LENGTH, (err, data) => {
    if (isFreshPacket(data)) {
      this.emit('data', data);
    }
  });
}

const GatewayController = function () {
  this.i2c = new tessel.port.A.I2C(config.GATEWAY_ADDRESS);
};

util.inherits(GatewayController, EventEmitter);

GatewayController.prototype.start = function () {
  const pollFn = requestReadings.bind(this, this.i2c);
  this.poller = setInterval(pollFn, 250);
};

GatewayController.prototype.stop = function () {
  clearInterval(this.poller);
};

module.exports = GatewayController;
