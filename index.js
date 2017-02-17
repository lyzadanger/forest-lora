'use strict';
const Express = require('express');
const path = require('path');
const os = require('os');
const http = require('http');

const io = require('./lib/io');
const data = require('./lib/data');
const config = require('./config');

let gateway;

// Start controller and data logging
if (!config.LOCAL_DEBUG) {
  const Controller = require('./lib/controller');
  gateway = new Controller();
  gateway.on('data', packet => {
    io.log(packet).then(() => console.log('logged data'));
  });
  gateway.start();
  console.log('gateway started');
} else {
  console.log('Local debug mode');
}

// Spin up web server
var app = new Express();
var server = new http.Server(app);
app.use(Express.static(path.join(__dirname, '/app')));
//app.use('/vendor', Express.static(__dirname + '/node_modules/highcharts/'));

app.get('/data/today', (req, res) => {
  return data.today().then(theData => {
    res.send(theData);
  });
});

var port = 3000;

server.listen(port, () => {
  console.log('Webserver started at port', port);
  if (!config.LOCAL_DEBUG) {
    console.log(`http://${os.networkInterfaces().wlan0[0].address}:${port}`);
  }
});

process.on('SIGINT', () => {
  if (!config.LOCAL_DEBUG) {
    gateway.stop();
  }
  server.close();
  process.exit();
});
