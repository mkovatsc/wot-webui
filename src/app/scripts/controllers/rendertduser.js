'use strict';

/**
 * @ngdoc function
 * @name wotwebui.controller:RendertdUserCtrl
 * @description
 * # RendertdUserCtrl
 * Controller of the wotwebui
 */
function RendertdUserCtrl($scope, $http, $state, $stateParams, $window, widgetGenerator, $compile) {
  $('.active').removeClass('active');
  $('a:contains(User)').parent('li').addClass('active');
  $('#errorDivUser').hide();
  // let parser = require('../../../../parser/node-wot/packages/node-wot-td-tools/dist/td-parser');
  let parser = require('../../../../parser/bundle-parser');
  // console.log(typeof($stateParams.TD));
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
      console.log($scope.properties);
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
              widgetGenerator.generateKnob(classID, $scope.properties[m].value, min, max);
            } else if ($scope.properties[m].name === 'rgraph-thermometer') {
              widgetGenerator.generateRGraphThermometer(classID, $scope.properties[m].value, $scope.properties[m].value - 10, $scope.properties[m].value + 10);
            } else if ($scope.properties[m].name === 'canvas-thermometer') {
              widgetGenerator.generateCanvasThermometer(classID, $scope.properties[m].value, -30, 40);
            } else if ($scope.properties[m].name === 'gauge') {
              widgetGenerator.generateRGraphGauge(classID, $scope.properties[m].value, min, max);
            }
          }, function (error) {
            $('#errorDivUser').show();
            console.log(error, 'cannot get data.');
          });

      }

    }, function (error) {
      console.log(error, 'cannot get data.');
    });
  }
  /* $scope.minMax = function minMax (min, max) {
    if (min !== null && max !== null) {
      return '(min=' + min + ',max=' + max + ')';
    } else {
      return null;
    }
  };
  $scope.setType = function setType (type) {
    if (type === 'number' || type === 'integer') {
      return 'number';
    } else if (type === 'string') {
      return 'text';
    } else if (type === 'boolean') {
      return 'checkbox';
    }
  }; */
}

RendertdUserCtrl.$inject = ['$scope', '$http', '$state', '$stateParams', '$window', 'widgetGenerator', '$compile'];
module.exports = RendertdUserCtrl;
