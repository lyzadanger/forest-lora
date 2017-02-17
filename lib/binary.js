/**
 * This module should handle all conversions between binary <-> JS objects
 * and reading from/writing to buffers
 */
const config = require('../config');

/**
 * This function takes a buffer from the gateway and formats it for
 * logging. It prepends an 8-byte timestamp and returns a buffer padded
 * to the length determined by LOGFILE_CHUNK_LENGTH
 */
function formatChunk (packetBuffer, timestamp) {
  const timeBuffer = Buffer.allocUnsafe(8);
  timestamp = (timestamp && typeof timestamp === 'number') ?
    timestamp : Date.now();
  timeBuffer.writeDoubleLE(timestamp);
  return Buffer.concat([timeBuffer, packetBuffer],
    config.LOGFILE_CHUNK_LENGTH);
}

/**
 * Convert a binary chunk into a JS object
 * @Buffer chunk  Binary buffer of config.LOGFILE_CHUNK_LENGTH bytes
 */
function parseChunk (chunk) {
  // First 8 bytes are 64-bit timestamp
  // Next 4 bytes are 32-bit offset (millis from gateway), which can be ignored
  // 4 bytes of mcp_temperature
  // 4 bytes of mpl_pressure
  // 4 bytes of mpl_temperature
  // 1 byte deviceID
  // 1 byte deviceCapabilities
  const parsedChunk = {
    date           : chunk.readDoubleLE(0),
    offset         : chunk.readUInt32LE(8),
    mcp_temperature: chunk.readFloatLE(12),
    mpl_pressure   : chunk.readFloatLE(16),
    mpl_temperature: chunk.readFloatLE(20),
    deviceID       : chunk.readUInt8(24),
    capabilities   : chunk.readUInt8(25)
  };
  return parsedChunk;
}

function parseChunks (chunks) {
  return chunks.map(chunk => parseChunk(chunk));
}

module.exports = {
  formatChunk: formatChunk,
  parseChunk: parseChunk,
  parseChunks: parseChunks
};
