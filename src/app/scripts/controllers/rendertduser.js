'use strict';

/**
 * @ngdoc function
 * @name wotwebui.controller:RendertdUserCtrl
 * @description
 * # RendertdUserCtrl
 * Controller of the wotwebui
 */
function RendertdUserCtrl($scope, $http, $state, $stateParams, $window, widgetGenerator, $compile, $interval, $log) {
  $('.active').removeClass('active');
  $('a:contains(User)').parent('li').addClass('active');
  $('#errorDivUser').hide();
  $scope.errorMessage = [];
  let reloader;
  // let parser = require('../../../../parser/node-wot/packages/node-wot-td-tools/dist/td-parser');
  let parser = require('../../../../parser/bundle-parser');
  // $log.log(typeof($stateParams.TD));
  $scope.TD = $stateParams.TD;
  /* $('.active').removeClass('active');
  $('li:first').next().addClass('active'); */
  if ($scope.TD === '') {
    $state.go('addTD');
  } else {
    try {
      $scope.parsedTD = parser.parseTDObject($scope.TD);
    } catch (exception) {
      $scope.errorMessage.push(exception);
      $state.go('addTD');
    }
    let temp = $window.sessionStorage.getItem($scope.parsedTD.name);
    if (temp !== null) {
      $window.sessionStorage.removeItem($scope.parsedTD.name);
    }
    $window.sessionStorage.setItem($scope.parsedTD.name, JSON.stringify($scope.TD));
    $scope.$parent.$parent.updateThings();
    $scope.$parent.$parent.isCurrentThing = true;
    let parentScope = $scope.$parent.$parent;
    parentScope.child = $scope;
    // let type = '@type';
    $scope.thingName = '';
    $scope.newValue = '';
    $scope.widgetResource = 'http://www.kovatsch.net/wot-webui/widgets.json';
    $scope.actions = [];
    let propertyValues = {name: '', value: '', propertyName: '' };
    let actionValues = {name: '', value: '', propertyName: '' };

    $scope.updateWidgets = function () {
      for (let m = 0; m < $scope.properties.length; m++) {
        // Use till you get a TD with updating values
        if ($scope.properties[m].name === 'ui-knob') {
          widgetGenerator.updateKnob($scope.properties[m].divClass, Math.ceil(Math.random() * 100));
        } else if ($scope.properties[m].name === 'canvas-thermometer') {
          widgetGenerator.updateCanvasThermometer($scope.properties[m].divClass, Math.floor(Math.random() * 30) + 20);
        }
        /* $http({
          method: 'get',
          url: $scope.properties[m].url
        }).then(function (response2) {
          $scope.properties[m].value = response2.data;
          if ($scope.properties[m].name === 'ui-knob') {
            widgetGenerator.updateKnob($scope.properties[m].divClass, $scope.properties[m].value);
          } else if ($scope.properties[m].name === 'rgraph-thermometer') {
            widgetGenerator.updateRGraph($scope.properties[m].divClass, $scope.properties[m].value);
          } else if ($scope.properties[m].name === 'canvas-thermometer') {
            widgetGenerator.updateCanvasThermometer($scope.properties[m].divClass, $scope.properties[m].value);
          } else if ($scope.properties[m].name === 'gauge') {
            widgetGenerator.updateRGraph($scope.properties[m].divClass, $scope.properties[m].value);
          }  else if ($scope.properties[m].name === 'modifiedCheckbox') {
            widgetGenerator.updateModifiedCheckbox($scope.properties[m].divClass, $scope.properties[m].value);
          }  else if ($scope.properties[m].name === 'modifiedSpinner') {
            widgetGenerator.updateModifiedSpinner($scope.properties[m].divClass, $scope.properties[m].value);
          }  else if ($scope.properties[m].name === 'rangeSlider') {
            widgetGenerator.updateSlider($scope.properties[m].divClass, $scope.properties[m].value);
          }  else if ($scope.properties[m].name === 'multiMode') {
            widgetGenerator.updateRGraph($scope.properties[m].divClass, $scope.properties[m].value);
          }

        }, function (error) {
          $('#errorDivUser').show();
          $log.log(error, 'cannot get data.');
        }); */
      }
    };
    $scope.renderWidgets = function () {
      let classID = '';
      let canvas_html = '';
      let groupNumber = '';
      let groupId = '';
      let element = '';
      let div_html = '';
      let divelement = '';
      let oldGroupId = '';
      let oldGroupNumber = '';
      let min = 0;
      let max = 0;
      for (let m = 0; m < $scope.properties.length; m++) {
        let errorMsg = '';

        $http({
          method: 'get',
          url   : $scope.properties[m].url
        }).then(function (response2) {
          $scope.properties[m].value = response2.data;
          min = $scope.properties[m].value - 10;
          max = $scope.properties[m].value + 10;
          classID = 'classID' + m;
          $scope.properties[m].divClass = classID;
          if ($scope.properties[m].name === 'ui-knob') {
            canvas_html = '<div class="tile-large bg-white"><div class="tile-content"><h3>' + $scope.properties[m].propertyName + '</h3><input type="text" class="' + classID + '"> </div></div>';
          } else if ($scope.properties[m].name === 'rgraph-thermometer') {
            canvas_html = '<div class="tile-large bg-white"><div class="tile-content"><h3>' + $scope.properties[m].propertyName + '</h3> <canvas id="' + classID + '"width="100" height="400"> [No canvas support] </canvas> </div></div>';
          } else if ($scope.properties[m].name === 'canvas-thermometer') {
            canvas_html = '<div class="tile-large tile-super-y bg-white"><div class="tile-content"><h3>' + $scope.properties[m].propertyName + '</h3> <canvas id="' + classID + '"></canvas> </div></div>';
          } else if ($scope.properties[m].name === 'gauge') {
            canvas_html = '<div class="tile-large bg-white"><div class="tile-content"><h3>' + $scope.properties[m].propertyName + '</h3> <canvas id="' + classID + '" width="250" height="250">[No canvas support]</canvas> </div></div>';
          } else if ($scope.properties[m].name === 'modifiedCheckbox') {
            canvas_html = '<div class="tile bg-white"><div class="tile-content"><h3>' + $scope.properties[m].propertyName + '</h3> <div class="ui fitted toggle checkbox"><input type="checkbox" checked ng-disabled="' + $scope.properties[m].writable + '" id="' + classID + '"></div></div>';
          } else if ($scope.properties[m].name === 'modifiedSpinner') {
            canvas_html = '<div class="tile bg-white"><div class="tile-content"><h3>' + $scope.properties[m].propertyName + '</h3> <input id="' + classID + '" min="' + min + '" max="' + max + '" ng-disabled="' + $scope.properties[m].writable + '" class="modifiedSpinner" type="number" value="' + $scope.properties[m].value + '"></div></div>';
          } else if ($scope.properties[m].name === 'rangeSlider') {
            canvas_html = '<div class="tile tile-xtra-large-x bg-white"><div class="tile-content"><h3>' + $scope.properties[m].propertyName + '</h3><input type="text" class="' + classID + '"> </div></div>';
          } else if ($scope.properties[m].name === 'multiMode') {
            canvas_html = '<div class="tile tile-big-y tile-super-x bg-white"><div class="tile-content"><h3>' + $scope.properties[m].propertyName + '</h3> <canvas id="' + classID + '" width="600" height="300">[No canvas support]</canvas> </div></div>';
          }
          element = angular.element(canvas_html);
          $compile(element)($scope);
          $('.tile-container').append(element);
          /* groupNumber = Math.floor(m / 2);
          groupId = 'group' + groupNumber;
          element = angular.element(canvas_html);
          $compile(element)($scope);
          if (m > 0 && m % 2 === 0) {
            div_html = '<div id="' + groupId + '" class="ui horizontal segments"></div>';
            divelement = angular.element(div_html);
            $compile(divelement)($scope);
            oldGroupNumber = groupNumber - 1;
            oldGroupId = 'group' + oldGroupNumber;
            $('#' + oldGroupId).after(divelement);
            $('#' + groupId).append(element);
          } else {
            $('#' + groupId).append(element);
          } */
          if ($scope.properties[m].name === 'ui-knob') {
            widgetGenerator.generateKnob($scope.properties[m].url, classID, $scope.properties[m].value, min, max, $scope.properties[m].writable);
          } else if ($scope.properties[m].name === 'rgraph-thermometer') {
            widgetGenerator.generateRGraphThermometer($scope.properties[m].url, classID, $scope.properties[m].value, $scope.properties[m].value - 10, $scope.properties[m].value + 10, $scope.properties[m].writable);
          } else if ($scope.properties[m].name === 'canvas-thermometer') {
            widgetGenerator.generateCanvasThermometer($scope.properties[m].url, classID, $scope.properties[m].value, -30, 40, $scope.properties[m].writable);
          } else if ($scope.properties[m].name === 'gauge') {
            widgetGenerator.generateRGraphGauge($scope.properties[m].url, classID, $scope.properties[m].value, min, max, $scope.properties[m].writable);
          } else if ($scope.properties[m].name === 'rangeSlider') {
            widgetGenerator.generateSlider($scope.properties[m].url, classID, $scope.properties[m].value, min, max, $scope.properties[m].writable);
          } else if ($scope.properties[m].name === 'multiMode') {
            widgetGenerator.generateRGraphMeter($scope.properties[m].url, classID, $scope.properties[m].value, $scope.properties[m].writable, $scope.properties[m].propertyName);
          }
        }, function (error) {
          $('#errorDivUser').show();
          if (error.config) {
            errorMsg = error.config.method + ' to ' + error.config.url + ' failed.';
            errorMsg += error.status + ' ' + error.statusText;
          } else {
            errorMsg = JSON.stringify(error);
          }
          $scope.errorMessage.push(errorMsg);
          $log.log(error, 'cannot get data.');
        });

      }

      reloader = $interval($scope.updateWidgets, 1000);
    };
    $scope.properties = JSON.parse($window.sessionStorage.getItem('ListOfWidgets'));
    if ($scope.properties === null) {
      $scope.properties = [];
      $http({
        method: 'get',
        url   : $scope.widgetResource
      }).then(function (response) {
        $scope.content = response.data;
        for (let i = 0; i < $scope.parsedTD.interaction.length; i++) {
          let breakIndicator = false;
          for (let j = 0; j < $scope.content.widgets.length; j++) {
            for (let k = 0; k < $scope.parsedTD.interaction[i].semanticTypes.length; k++) {
              for (let l = 0; l < $scope.content.widgets[j].types.length; l++) {
                propertyValues = { name: '', value: '', url: '' };
                actionValues = { name: '', value: '', url: '' };
                if ($scope.parsedTD.interaction[i].semanticTypes[k].toLowerCase() === $scope.content.widgets[j].types[l]) {
                  propertyValues.name = $scope.content.widgets[j].widget_name;
                  propertyValues.url = $scope.parsedTD.interaction[i].link[0].href;
                  propertyValues.propertyName = $scope.parsedTD.interaction[i].name;
                  propertyValues.writable = $scope.parsedTD.interaction[i].writable;
                  $scope.properties.push(propertyValues);
                  breakIndicator = true;
                  break;
                }
                /* else if ($scope.parsedTD.interaction[i].semanticTypes[0] === 'Action') {
                                  $scope.actions.push($scope.parsedTD.interaction[i]);
                                } */

                /* if ($scope.parsedTD.interaction[i].semanticTypes[0] === 'Property') {
                  $scope.properties.push($scope.parsedTD.interaction[i]);
                } else if ($scope.parsedTD.interaction[i].semanticTypes[0] === 'Action') {
                  $scope.actions.push($scope.parsedTD.interaction[i]);
                } */
              }
              if (breakIndicator) {
                break;
              }
            }
          }
        }
        $log.log($scope.properties);
        $scope.renderWidgets();
      }, function (error) {
        $log.log(error, 'cannot get data.');
      });
    } else {
      $scope.renderWidgets();
    }
  }
  $('div[id^="group"]').click(function () {
    $interval.cancel(reloader);
  });

  /* $scope.$on('$destroy', function () {
    if (angular.isDefined(reloader)) {
      $interval.cancel(reloader);
    }
  }); */
}

RendertdUserCtrl.$inject = ['$scope', '$http', '$state', '$stateParams', '$window', 'widgetGenerator', '$compile', '$interval', '$log'];
module.exports = RendertdUserCtrl;
