'use strict';

/**
 * @ngdoc function
 * @name wotwebui.controller:ViewwidgetsCtrl
 * @description
 * # ViewwidgetsCtrl
 * Controller of the wotwebui
 */
function ViewwidgetsCtrl ($scope, $http) {
  $scope.$parent.isCurrentThing = false;
  let jqueryKnob = require('../../../../node_modules/jquery-knob/dist/jquery.knob.min.js');
  let canvasGauge = require('../../../../node_modules/canvas-gauges/gauge.min.js');
  $scope.value = 4;
  $scope.options = {
    size: 250,
    min : 0,
    max : 10
    // other options
  };

  function knobfunction (value1) {
    $('.dial')
      .val(value1)
      .trigger('change');
  }

  knobfunction(4);

  $('.dial').knob({
    width : 250,
    height: 250,
    min   : 0,
    max   : 10,
    change: function (v) {
      /* gauge.value = v;
      gauge.grow(); */
    }
  });


  let temperatureGauge = new canvasGauge.LinearGauge({
    renderTo               : 'gauge-id',
    colorNumbers           : 'black',
    width                  : 160,
    height                 : 600,
    minValue               : -30,
    maxValue               : 40,
    value                  : 36.6,
    valueInt               : 2,
    valueDec               : 1,
    barWidth               : '5',
    borderRadius           : '20',
    borders                : '0',
    barStrokeWidth         : '0',
    minorTicks             : 4,
    majorTicks             : [-30, -25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30, 35, 40],
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
    /* $scope.newValue = gauge.getValue(e);

    if (typeof $scope.newValue === 'number') {
      gauge.value = $scope.newValue;
      gauge.grow();
      $scope.value = $scope.newValue;
    } */
  }

  let canvasTemp = document.getElementById('gauge-id');  // get canvas element
  canvasTemp.addEventListener('click', onclickcanvas, false); // register event

  angular.element(document).ready(function () {
    // $scope.thingName = json.name;
    let gauge = new RGraph.Gauge({
      id     : 'cvs',
      min    : 0,
      max    : 10,
      value  : 4,
      options: {
        radius: 100
        // adjustable: true
      }
    }).grow();

    gauge.canvas.onclick = function (e) {
      $scope.newValue = gauge.getValue(e);

      if (typeof $scope.newValue === 'number') {
        gauge.value = $scope.newValue;
        gauge.grow();
        $scope.value = $scope.newValue;
      }
    };
  });

  new RGraph.Thermometer({
    id     : 'cvsThermometer',
    min    : 0,
    max    : 40,
    value  : 23,
    options: {
      adjustable: true
    }
  }).grow();
}
ViewwidgetsCtrl.$inject = ['$scope', '$http'];
module.exports = ViewwidgetsCtrl;
