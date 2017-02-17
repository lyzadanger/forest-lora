'use strict';
const Promise = require('bluebird');
const fsp = require('fs-promise');
const fs = require('fs');
const binary = require('./binary');
const util = require('./util');
const config = require('../config');

/**
 * Log buffer `packetBuffer` to log file
 * @return Promise
 */
function log (packetBuffer) {
  // Timestamp the buffer and format it for logging
  const now       = Date.now();
  const logBuffer = binary.formatChunk(packetBuffer, now);
  const logPath   = util.logPath(now);
  return fsp.appendFile(logPath, logBuffer);
}

/**
 * Read log file at path `logPath` into array of 32-byte buffers
 */
function read (logPath) {
  return Promise.all([
    fsp.open(logPath, 'r'), // Open the log file
    fsp.stat(logPath) // get stats on the log file
  ]).then(things => {
    return new Promise((resolve, reject) => {
      const fd         = things[0]; // File descriptor
      const stats      = things[1]; // Stats

      const byteLength  = stats.size; // Size of file we're reading in bytes
      const chunkLength = config.LOGFILE_CHUNK_LENGTH;
      const chunkCount  = byteLength / chunkLength; // How many chunks we need to read

      const chunks     = new Array(chunkCount);

      // Keep track of bytes we've read (for offsetting)
      // And how many chunks we've read (to know when we're done)
      let bytesRead    = 0;
      let chunksRead    = 0;
      while (bytesRead < byteLength) { // This while loop is synchronous
        // Read chunkLength bytes into `buffer` at `buffer` position 0
        // Offset by `bytesRead` i the file
        const buffer     = new Buffer(chunkLength);
        const index = bytesRead / chunkLength;
        fs.read(fd, buffer, 0, chunkLength, bytesRead,
          (err, readBytes, readBuffer) => {
            // Our chunks array should be in read order even if the
            // reads do not finish consecutively
            chunks[index] = readBuffer;
            chunksRead++;
            if (chunksRead >= chunkCount) { // If we've read as many chunks as we expect...
              resolve(chunks); // We're done. Resolve the containing Promise
            }
          }
        );
        bytesRead += chunkLength;
      } // We're done kicking off reads, but we aren't done reading
      fs.close(fd);
    });
  });
}

/**
 * Read binary from log file and then parse into JS
 */
function parse (logPath) {

}

module.exports = {
  log: log,
  read: read,
  parse: parse
};
