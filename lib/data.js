/**
 * This module should handle retrieving and parsing the right sets of data
 * for different requests
 */
const io = require('./io');
const binary = require('./binary');
const util = require('./util');
const config = require('../config');

function parseTemperature (dataObj) {
  // Always favor MCP sensor data over MPL for precision
  const temperature = {};
  if (dataObj.capabilities & config.CAPABILITIES.MCP) {
    temperature.raw = dataObj.mcp_temperature;
  } else if (dataObj.capabilities & config.CAPABILITIES.MPL) {
    temperature.raw = dataObj.mpl_temperature;
  }
  if (temperature.raw) {
    temperature.c = temperature.raw;
    temperature.f = temperature.raw * (9 / 5) + 32;
  }
  return temperature;
}

function parsePressure (dataObj) {
  const pressure = {};
  if (dataObj.capabilities & config.CAPABILITIES.MPL) {
    pressure.raw = dataObj.mpl_pressure;
  }
  if (pressure.raw) {
    pressure.kPa = pressure.raw;
    pressure.mBar = pressure.raw / 100;
  }
  return pressure;
}

function parseData (dataObj) {
  return {
    date: new Date(dataObj.date),
    device: {
      id: dataObj.deviceID,
      capabilities: dataObj.capabilities
    },
    raw: {
      mcp_temperature: dataObj.mcp_temperature,
      mpl_temperature: dataObj.mpl_temperature,
      mpl_pressure: dataObj.mpl_pressure
    },
    temperature: parseTemperature(dataObj),
    pressure: parsePressure(dataObj)
  };
}

/**
 * Return all logged data from today
 */
function today () {
  const filePath = util.currentLogPath();
  return io.read(filePath).then(chunks => {
    const dataObjs = binary.parseChunks(chunks);
    return dataObjs.map(dataObj => parseData(dataObj));
  });
}

module.exports = {
  today: today
};
