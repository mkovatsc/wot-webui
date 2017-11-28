'use strict';

/**
 * @ngdoc service
 * @name wotwebui.service:widgetGenerator
 * @description
 * # widgetGenerator
 */
function widgetGenerator (thingClient, $document) {
  let jqueryKnob = require('../../../../node_modules/jquery-knob/dist/jquery.knob.min.js');
  let canvasGauge = require('../../../../node_modules/canvas-gauges/gauge.min.js');
  let gauge = {};
  let sliders = {};
  let meters = {};
  this.generateKnob = function (url, div, value, min, max, writable, width, height) {
  // min, max, width, height, value are integers
  // div is the class of the div where this knob would be rendered
    let property = { link: [ { href: url } ], 'value': value };
    let knobWidth = 0;
    let knobHeight = 0;
    if (width === undefined || width === '') {
      knobWidth = 250;
    } else {
      knobWidth = width;
    }

    if (height === undefined || height === '') {
      knobHeight = 250;
    } else {
      knobHeight = height;
    }
    function knobfunction (value1) {
      $('.' + div)
        .val(value1)
        .trigger('change');
    }

    knobfunction(value);

    $('.' + div).knob({
      width   : knobWidth,
      height  : knobHeight,
      readOnly: !writable,
      min     : min,
      max     : max,
      change  : function (v) {
        property.value = v;
        thingClient.writeProperty('', property);
        // alert('changed');
      }
    });
  };
  this.updateKnob = function (div, value) {
    $('input.' + div).val(value).trigger('change');
    // $('input.' + div).trigger('change');
  };
  // let temperatureGauge = {};
  this.generateCanvasThermometer = function (url, div, value, min, max, writable) {
    // div is the id of the canvas
    // value, min and max are integers or floats
    let property = { link: [ { href: url } ], 'value': value };
    let range = [];
    let i = min;
    while (i <= max) {
      range.push(i);
      i += 5;
    }
    // let temperatureGauge = {};
    gauge[div] = new canvasGauge.LinearGauge({
      renderTo               : div, // 'gauge-id'
      colorNumbers           : 'black',
      width                  : 160,
      height                 : 600,
      minValue               : min,
      maxValue               : max,
      value                  : value,
      valueInt               : 2,
      valueDec               : 1,
      barWidth               : '5',
      borderRadius           : '20',
      borders                : '0',
      barStrokeWidth         : '0',
      minorTicks             : 4,
      majorTicks             : range,
      ticksWidthMinor        : '7.5',
      ticksWidth             : '18',
      title                  : 'Temperature',
      units                  : '°C',
      barBeginCircle         : '25',
      colorValueBoxShadow    : 'true',
      colorValueBoxBackground: 'false'
    });
    gauge[div].draw();

    function onclickcanvas (e) {
      if (e.offsetX > 45 && e.offsetX < 110 && e.offsetY > 85 && e.offsetY < 430) {
        let temp = (e.offsetY - 85) / (345 / (gauge[div].options.maxValue - gauge[div].options.minValue));
        gauge[div].value = gauge[div].options.maxValue - temp;
        property.value = gauge[div].value;
        thingClient.writeProperty('', property);
      }
    }
    if (writable) {
      let canvasTemp = {};
      canvasTemp[div] = document.getElementById(div);  // get canvas element
      canvasTemp[div].addEventListener('click', onclickcanvas, false); // register event
    }
  };
  this.updateCanvasThermometer = function (div, value) {
    gauge[div].value = value;
  };
  this.generateRGraphThermometer = function (url, div, value, min, max, writable) {
    // div is the id of the canvas
    // value, min and max are integers or floats
    let property = { link: [ { href: url } ], 'value': value };
    let newValue = '';
    gauge[div] = new RGraph.Thermometer({
      id     : div, // 'cvsThermometer'
      min    : min - 100,
      max    : max + 100,
      value  : value,
      options: {
        // adjustable: true
      }
    }).grow();
    if (writable) {
      gauge[div].canvas.onclick = function (e) {
        newValue = gauge[div].getValue(e);

        if (typeof newValue === 'number') {
          gauge[div].value = newValue;
          gauge[div].grow();
          property.value = gauge[div].value;
          thingClient.writeProperty('', property);
        }
      };
    }
  };
  this.generateRGraphMeter = function (url, div, value, writable, type) {
    // div is the id of the canvas
    // value, min and max are integers or floats
    let property = { link: [ { href: url } ], 'value': value };
    let newValue = '';
    let labels = '';
    let redEnd = '';
    let yellowEnd = '';
    let finalValue = '';
    switch (type) {
        case 'AC':
          labels = [['Fan', 1], ['Dry', 3], ['Cool', 5]];
          redEnd = 2;
          yellowEnd = 4;
          break;
        case 'carAC':
          labels = [['Face', 1], ['Face and Feet', 3], ['Feet', 5]];
          redEnd = 2;
          yellowEnd = 4;
          break;
        case 'carRoof':
          labels = [['Roof Window', 1], ['Half Open', 3], ['Full Open', 5]];
          redEnd = 2;
          yellowEnd = 4;
          break;
        case 'WashingMachine':
          labels = [['Normal', 1], ['Cotton', 3], ['Wool', 5]];
          redEnd = 2;
          yellowEnd = 4;
          break;
        default:
          labels = [['Low', 1], ['Medium', 3], ['High', 5]];
          redEnd = 2;
          yellowEnd = 4;
          break;
    }
    meters[div] = new RGraph.Meter({
      id     : div,
      min    : 0,
      max    : 6,
      value  : value,
      options: {
        anglesStart       : RGraph.PI + 0.5,
        anglesEnd         : RGraph.TWOPI - 0.5,
        linewidthSegments : 0,
        textSize          : 16,
        strokestyle       : 'black',
        segmentRadiusStart: 205,
        border            : 0,
        tickmarksSmallNum : 0,
        tickmarksBigNum   : 0,
        adjustable        : false,
        labelsSpecific    : labels,
        redEnd            : redEnd,
        yellowEnd         : yellowEnd,
        textAccessible    : false
      }
    }).draw();

    if (writable) {
      meters[div].canvas.onclick = function (e) {
        newValue = meters[div].getValue(e);

        if (typeof newValue === 'number') {
          meters[div].value = newValue;
          meters[div].grow();
          for (let i = 0; i < labels.length; i++) {
            if (labels[i][1] + 1 >= newValue) {
              finalValue = labels[i][0];
              break;
            }
          }
          property.value = finalValue;
          thingClient.writeProperty('', property);
        }
      };
    }
  };
  this.generateRGraphGauge = function (url, div, value, min, max, writable) {
    // div is the id of the canvas
    // value, min and max are integers or floats
    let property = { link: [ { href: url } ], 'value': value };
    let newValue = '';
    let redStart = 0;
    let greenEnd = 0;
    if (value > 300) {
      min -= 3;
      max += 2;
      redStart = max - 5;
      greenEnd = max - 10;
    } else {
      redStart = Math.floor(0.9 * max);
      greenEnd = Math.floor(0.7 * max);
    }
    gauge[div] = new RGraph.Gauge({
      id     : div, // 'cvs'
      min    : min,
      max    : max,
      value  : value,
      options: {
        radius     : 100,
        redStart   : redStart,
        greenEnd: greenEnd
        // adjustable: true
      }
    }).grow();

    if (writable) {
      gauge[div].canvas.onclick = function (e) {
        newValue = gauge[div].getValue(e);

        if (typeof newValue === 'number') {
          gauge[div].value = newValue;
          gauge[div].grow();
          property.value = gauge[div].value;
          thingClient.writeProperty('', property);
        }
      };
    }
  };

  this.generateFuelGauge = function (div, value) {
    // div is the id of the canvas
    // value, min and max are integers or floats
    gauge[div] = new RGraph.Fuel({
      id     : div,
      min    : 0,
      max    : 100,
      value  : value,
      options: {
        textAccessible: true
      }
    }).grow();
  };

  this.generateSlider = function (url, div, value, min, max, writable) {
    // min, max, width, height, value are integers
    // div is the class of the div where this knob would be rendered
    let property = { link: [ { href: url } ], 'value': value };
    sliders[div] = $('.' + div).ionRangeSlider({
      min     : 0,
      max     : 100,
      from    : value,
      disable : !writable,
      onChange: function (data) {
        console.log(data.from);
        property.value = data.from;
        // thingClient.writeProperty('', property);
      }
    });
  };

  this.generateRGraphHumidityMeter = function (url, div, value, writable) {
    // div is the id of the canvas
    // value, min and max are integers or floats
    let property = { link: [ { href: url } ], 'value': value };
    let newValue = '';
    gauge[div] = new RGraph.Meter({
      id     : div,
      min    : 0,
      max    : 100,
      value  : value,
      options: {
        border: false,
        tickmarksSmallNum: 0,
        tickmarksBigNum: 0,
        anglesStart: RGraph.HALFPI + (RGraph.HALFPI / 1.5),
        anglesEnd: RGraph.TWOPI + RGraph.HALFPI - (RGraph.HALFPI / 1.5),
        segmentRadiusStart: 80,
        textSize: 12,
        colorsRanges: [
          [0, 40, 'Gradient(#0c0:#cfc:#0c0)'],
          [40, 80, 'Gradient(yellow:#ffc:yellow)'],
          [80, 100, 'Gradient(red:#fcc:red)']
        ],
        needleRadius: 65,
        gutterBottom: 160
      }
    }).draw();

    if (writable) {
      gauge[div].canvas.onclick = function (e) {
        newValue = gauge[div].getValue(e);

        if (typeof newValue === 'number') {
          gauge[div].value = newValue;
          gauge[div].grow();
          property.value = gauge[div].value;
          thingClient.writeProperty('', property);
        }
      };
    }
  };

  this.updateRGraph = function (div, value) {
    gauge[div].value = value;
    gauge[div].grow();
    // RGraph.Redraw();
  };
  this.updateRGraphMeter = function (div, value) {
    if (typeof value === 'number') {
      meters[div].value = value;
      meters[div].grow();
    } else {
      let name = 'chart.labels.specific';
      for (let i = 0; i < meters[div].properties[name].length; i++) {
        if (meters[div].properties[name][i][0] === value) {
          meters[div].value = meters[div].properties[name][i][1];
          meters[div].grow();
          break;
        }
      }
    }
    // RGraph.Redraw();
  };

  this.updateModifiedSpinner = function (div, value) {
    document.getElementById(div).value = value;
  };
  this.updateModifiedCheckbox = function (div, value) {
    document.getElementById(div).checked = value;
  };

  this.updateSlider = function (div, value) {
    let instance = sliders[div].data('ionRangeSlider');
    instance.update({
      from: value
    });
  };

}
widgetGenerator.$inject = ['thingClient', '$document'];
module.exports = widgetGenerator;
