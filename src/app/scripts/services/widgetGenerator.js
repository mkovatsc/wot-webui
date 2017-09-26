'use strict';

/**
 * @ngdoc service
 * @name wotwebui.service:widgetGenerator
 * @description
 * # widgetGenerator
 */
function widgetGenerator () {
  let jqueryKnob = require('../../../../node_modules/jquery-knob/dist/jquery.knob.min.js');
  let canvasGauge = require('../../../../node_modules/canvas-gauges/gauge.min.js');
  this.generateKnob = function (div, value, min, max, width, height) {
  // min, max, width, height, value are integers
  // div is the class of the div where this knob would be rendered
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
      width : knobWidth,
      height: knobHeight,
      min   : min,
      max   : max,
      change: function (v) {
        /* gauge.value = v;
        gauge.grow(); */
      }
    });
  };
  this.generateCanvasThermometer = function (div, value, min, max) {
    // div is the id of the canvas
    // value, min and max are integers or floats
    let range = [];
    let i = min;
    while (i <= max) {
      range.push(i);
      i += 5;
    }
    let temperatureGauge = new canvasGauge.LinearGauge({
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
    temperatureGauge.draw();

    function onclickcanvas (e) {
      if (e.offsetX > 45 && e.offsetX < 110 && e.offsetY > 85 && e.offsetY < 430) {
        let temp = (e.offsetY - 85) / (345 / (temperatureGauge.options.maxValue - temperatureGauge.options.minValue));
        temperatureGauge.value = temperatureGauge.options.maxValue - temp;
      }
    }

    let canvasTemp = document.getElementById(div);  // get canvas element
    canvasTemp.addEventListener('click', onclickcanvas, false); // register event
  };
  this.generateRGraphThermometer = function (div, value, min, max) {
    // div is the id of the canvas
    // value, min and max are integers or floats
    new RGraph.Thermometer({
      id     : div, // 'cvsThermometer'
      min    : min,
      max    : max,
      value  : value,
      options: {
        adjustable: true
      }
    }).grow();
  };
  this.generateRGraphGauge = function (div, value, min, max) {
    // div is the id of the canvas
    // value, min and max are integers or floats
    let newValue = '';
    let gauge = new RGraph.Gauge({
      id     : div, // 'cvs'
      min    : min,
      max    : max,
      value  : value,
      options: {
        radius: 100
        // adjustable: true
      }
    }).grow();

    gauge.canvas.onclick = function (e) {
      newValue = gauge.getValue(e);

      if (typeof newValue === 'number') {
        gauge.value = newValue;
        gauge.grow();
      }
    };
  };

}
module.exports = widgetGenerator;
