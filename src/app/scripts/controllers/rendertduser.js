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
  // let parser = require('../../../../parser/node-wot/packages/node-wot-td-tools/dist/td-parser');
  let parser = require('../../../../parser/bundle-parser');
  // $log.log(typeof($stateParams.TD));
  $scope.TD = $stateParams.TD;
  /* $('.active').removeClass('active');
  $('li:first').next().addClass('active'); */
  if ($scope.TD === '') {
    $state.go('addTD');
  } else {
    $scope.parsedTD = parser.parseTDObject($scope.TD);
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
    $scope.properties = [];
    $scope.actions = [];
    let propertyValues = {name: '', value: '', propertyName: '' };
    let actionValues = {name: '', value: '', propertyName: '' };

    $http({
      method: 'get',
      url: $scope.widgetResource
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

          $http({
            method: 'get',
            url: $scope.properties[m].url
          }).then(function (response2) {
            $scope.properties[m].value = response2.data;
            classID = 'classID' + m;
            $scope.properties[m].divClass = classID;
            if ($scope.properties[m].name === 'ui-knob') {
              canvas_html = '<div class="ui text container raised segment"><h3>' + $scope.properties[m].propertyName + '</h3><input type="text" class="' + classID + '"> </div>';
            } else if ($scope.properties[m].name === 'rgraph-thermometer') {
              canvas_html = '<div class="ui text container raised segment"><h3>' + $scope.properties[m].propertyName + '</h3> <canvas id="' + classID + '"width="100" height="400"> [No canvas support] </canvas> </div>';
            } else if ($scope.properties[m].name === 'canvas-thermometer') {
              canvas_html = '<div class="ui text container raised segment"><h3>' + $scope.properties[m].propertyName + '</h3> <canvas id="' + classID + '"></canvas> </div>';
            } else if ($scope.properties[m].name === 'gauge') {
              canvas_html = '<div class="ui text container raised segment"><h3>' + $scope.properties[m].propertyName + '</h3> <canvas id="' + classID + '" width="600" height="250">[No canvas support]</canvas> </div>';
            }

            groupNumber = Math.floor(m / 2);
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
            }
            min = $scope.properties[m].value - 10;
            max = $scope.properties[m].value + 10
            if ($scope.properties[m].name === 'ui-knob') {
              widgetGenerator.generateKnob($scope.properties[m].url, classID, $scope.properties[m].value, min, max);
            } else if ($scope.properties[m].name === 'rgraph-thermometer') {
              widgetGenerator.generateRGraphThermometer($scope.properties[m].url, classID, $scope.properties[m].value, $scope.properties[m].value - 10, $scope.properties[m].value + 10);
            } else if ($scope.properties[m].name === 'canvas-thermometer') {
              widgetGenerator.generateCanvasThermometer($scope.properties[m].url, classID, $scope.properties[m].value, -30, 40);
            } else if ($scope.properties[m].name === 'gauge') {
              widgetGenerator.generateRGraphGauge($scope.properties[m].url, classID, $scope.properties[m].value, min, max);
            }
          }, function (error) {
            $('#errorDivUser').show();
            $log.log(error, 'cannot get data.');
          });

      }

      $scope.reloader = $interval($scope.updateWidgets, 1000);

    }, function (error) {
      $log.log(error, 'cannot get data.');
    });
  }
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
        }

      }, function (error) {
        $('#errorDivUser').show();
        $log.log(error, 'cannot get data.');
      }); */
    }
  };
  $('div[id^="group"]').click(function () {
    $interval.cancel($scope.reloader);
  });

  $scope.$on('$destroy', function () {
    if (angular.isDefined($scope.reloader)) {
      $interval.cancel($scope.reloader);
    }
  });
}

RendertdUserCtrl.$inject = ['$scope', '$http', '$state', '$stateParams', '$window', 'widgetGenerator', '$compile', '$interval', '$log'];
module.exports = RendertdUserCtrl;
/* To update Jquery Knob
      $("input.dial").val('80%');
      $("input.dial").trigger('change');
   To update Canvas Thermometer
      widgetGenerator.updateCanvasThermometer(div, value);
   For RGraph
      widgetGenerator.updateRGraph(div, value);
   */
