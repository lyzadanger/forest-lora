/* global $, Highcharts */
// TODO make this better
var knownNodes = {
  34: 'Out Back',
  254: 'Porch',
  159: 'Inside'
};
function temperatureNodeData (chartData) {
  var parsedData = {};
  var seriesData = [];
  chartData.forEach(entry => {
    var deviceID = entry.device.id;
    if (typeof parsedData[deviceID] === 'undefined') {
      parsedData[deviceID] = {
        name: deviceID,
        data: []
      };
    }
    parsedData[deviceID].data.push(
      [
        new Date(entry.date).getTime(),
        entry.temperature.f
      ]
    );
  });
  for (var nodeEntry in parsedData) {
    var name = nodeEntry;
    if (typeof knownNodes[nodeEntry] !== 'undefined') {
      name = knownNodes[nodeEntry];
    }
    seriesData.push({
      name: name,
      data: parsedData[nodeEntry].data
    });
  }
  return seriesData;
}

function pressureNodeData (chartData) {
  var parsedData = {};
  var seriesData = [];
  chartData.forEach(entry => {
    if (!entry.pressure || !entry.pressure.mBar) {
      return;
    }
    var deviceID = entry.device.id;
    if (typeof parsedData[deviceID] === 'undefined') {
      parsedData[deviceID] = {
        name: deviceID,
        data: []
      };
    }
    parsedData[deviceID].data.push(
      [
        new Date(entry.date).getTime(),
        entry.pressure.mBar
      ]
    );
  });
  for (var nodeEntry in parsedData) {
    var name = nodeEntry;
    if (typeof knownNodes[nodeEntry] !== 'undefined') {
      name = knownNodes[nodeEntry];
    }
    seriesData.push({
      name: name,
      data: parsedData[nodeEntry].data
    });
  }
  return seriesData;
}

function showTemperatures () {
  $.getJSON('/data/today', function (chartData) {
    var parsed = temperatureNodeData(chartData);
    displayChart(parsed);
  });
}

function showPressures () {
  $.getJSON('/data/today', function (chartData) {
    var parsed = pressureNodeData(chartData);
    displayChart(parsed, {
      type: 'Pressure',
      units: 'mBar'
    });
  });
}

function displayChart (parsed, options) {
  var opts = Object.assign({}, {
    type: 'Temperature',
    units: 'Degrees (F)'
  }, options || {});
  Highcharts.setOptions({                                            // This is for all plots, change Date axis to local timezone
    global : {
      useUTC : false
    }
  });
  Highcharts.chart('chartContainer', {
    chart: {
      type: 'line',
      zoomType: 'x'
    },
    title: {
      text: "Today's " + opts.type + ' Readings'
    },
    xAxis: {
      type: 'datetime',
      title: {
        text: 'Time'
      }
    },
    yAxis: {
      title: {
        text: opts.units
      }
    },
    series: parsed
  });
}

$(function () {
  showTemperatures();
  $('.showData').click(function (event) {
    $('.showData').removeClass('active');
    //$(this).addClass('active');
    event.preventDefault();
    switch ($(this).attr('id')) {
      case 'showPressures':
        showPressures();
        break;
      default:
      case 'showTemperatures':
        showTemperatures();
        break;
    }
  });
});
