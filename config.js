const config = {
  LOCAL_DEBUG: false,
  GATEWAY_ADDRESS: 0x09,
  PACKET_LENGTH: 18,
  CAPABILITIES: {
    MCP: 0x01,
    MPL: 0x02
  },
  LOGFILE_NAME_FORMAT: 'YYYY-MM-DD',
  LOGFILE_CHUNK_LENGTH: 64,
  TIMEZONE: 'America/New_York'
};

config.BASEDIR = (config.LOCAL_DEBUG) ?
  `${__dirname}/test/` : '/mnt/sda1/lora/';

module.exports = config;
