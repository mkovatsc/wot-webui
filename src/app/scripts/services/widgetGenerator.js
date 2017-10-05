'use strict';

/**
 * @ngdoc service
 * @name wotwebui.service:widgetGenerator
 * @description
 * # widgetGenerator
 */
function widgetGenerator (thingClient) {
  let jqueryKnob = require('../../../../node_modules/jquery-knob/dist/jquery.knob.min.js');
  let canvasGauge = require('../../../../node_modules/canvas-gauges/gauge.min.js');
  this.generateKnob = function (url, div, value, min, max, width, height) {
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
        // thingClient.restcall('PUT', url, { value: v });
        // alert('changed');
      }
    });
  };
  this.updateKnob = function (div, value) {
    $('input.' + div).val(value);
    // $('input.' + div).trigger('change');
  };
  let gauge = {};
  // let temperatureGauge = {};
  this.generateCanvasThermometer = function (url, div, value, min, max) {
    // div is the id of the canvas
    // value, min and max are integers or floats
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
        thingClient.restcall('PUT', url, { value: gauge[div].value });
      }
    }
    let canvasTemp = {};
    canvasTemp[div] = document.getElementById(div);  // get canvas element
    canvasTemp[div].addEventListener('click', onclickcanvas, false); // register event
  };
  this.updateCanvasThermometer = function (div, value) {
    gauge[div].value = value;
  };
  this.generateRGraphThermometer = function (url, div, value, min, max) {
    // div is the id of the canvas
    // value, min and max are integers or floats
    let newValue = '';
    new RGraph.Thermometer({
      id     : div, // 'cvsThermometer'
      min    : min,
      max    : max,
      value  : value,
      options: {
        // adjustable: true
      }
    }).grow();
    gauge[div].canvas.onclick = function (e) {
      newValue = gauge[div].getValue(e);

      if (typeof newValue === 'number') {
        gauge[div].value = newValue;
        gauge[div].grow();
        thingClient.restcall('PUT', url, { value: gauge[div].value });
      }
    };
  };
  this.generateRGraphGauge = function (url, div, value, min, max) {
    // div is the id of the canvas
    // value, min and max are integers or floats
    let newValue = '';
    gauge[div] = new RGraph.Gauge({
      id     : div, // 'cvs'
      min    : min,
      max    : max,
      value  : value,
      options: {
        radius: 100
        // adjustable: true
      }
    }).grow();

    gauge[div].canvas.onclick = function (e) {
      newValue = gauge[div].getValue(e);

      if (typeof newValue === 'number') {
        gauge[div].value = newValue;
        gauge[div].grow();
        thingClient.restcall('PUT', url, { value: gauge[div].value });
      }
    };
  };
  this.updateRGraph = function (div, value) {
    gauge[div].value = value;
    gauge[div].grow();
    // RGraph.Redraw();
  };

}
widgetGenerator.$inject = ['thingClient'];
module.exports = widgetGenerator;
