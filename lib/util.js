const path = require('path');
const moment = require('moment-timezone');
const config = require('../config');

function currentLogPath () {
  return logPath(Date.now());
}

function logPath (logDate) {
  logDate = (moment.isMoment(logDate)) ? logDate : moment(logDate);
  const tzDate = logDate.tz(config.TIMEZONE);
  const logFilename = `${tzDate.format(config.LOGFILE_NAME_FORMAT)}`;
  return path.join(config.BASEDIR, logFilename);
}

module.exports = {
  currentLogPath: currentLogPath,
  logPath: logPath
};
