'use strict';

/**
 * @ngdoc function
 * @name wotwebui.controller:RendertdtechnicianCtrl
 * @description
 * # RendertdtechnicianCtrl
 * Controller of the wotwebui
 */

/* angular.module('wotwebui')
  .controller('RendertdtechnicianCtrl', function ($scope, $http, $state, $stateParams) {
    /*$scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ]; */
function RendertdtechnicianCtrl ($scope, $http, $state, $stateParams, $window, thingClient, $interval, $log) {
  $('.active').removeClass('active');
  $('a:contains(Technician)').parent('li').addClass('active');
  $('#errorDivTech').hide();
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
    $scope.propertyValues = {};
    $scope.actionValues = {};
    $scope.autoReloaded = [];

    $http({
      method: 'get',
      url   : $scope.widgetResource
    }).then(function (response) {
      $scope.content = response.data;
      for (let i = 0; i < $scope.parsedTD.interaction.length; i++) {
        if ($scope.parsedTD.interaction[i].semanticTypes[0] === 'Property') {
          $scope.readProperty($scope.parsedTD.interaction[i]);
          $scope.properties.push($scope.parsedTD.interaction[i]);
          /* let value = 0;
            $http({
            method: 'get',
            url: $scope.parsedTD.interaction[i].link[0].href
          }).then(function (response2) {
            $scope.parsedTD.interaction[i].value = response2.data;
            $scope.properties.push($scope.parsedTD.interaction[i]);
          }, function (error) {
            $('#errorDivTech').show();
            $scope.parsedTD.interaction[i].value = value;
            $scope.properties.push($scope.parsedTD.interaction[i]);
            $log.log(error, 'cannot get data.');
          }); */
        } else if ($scope.parsedTD.interaction[i].semanticTypes[0] === 'Action') {
          $scope.actions.push($scope.parsedTD.interaction[i]);
        }
      }
    }, function (error) {
      $log.log(error, 'cannot get data.');
    });
  }
  $scope.showRestError = function showRestError (errorObj) {
    let msg = '';
    if (errorObj.config) {
      msg = errorObj.config.method + ' to ' + errorObj.config.url + ' failed.<br/>';
      msg += errorObj.status + ' ' + errorObj.statusText;
    } else {
      msg = JSON.stringify(errorObj);
    }
    $('#errorDivTech').show();
    $scope.showError(msg);
  };

  $scope.showError = function showError (errorMsg) {
    $log.log('Error:' + errorMsg);
  };

  $scope.updateState = function updateState () {
    $scope.properties.forEach(function (property) {
      let inputDiv = document.querySelectorAll('div#' + property.name);
      for (let i = 0; i < inputDiv.length; i++) {
        if (inputDiv[i].className.indexOf('ng-hide') < 0) {
          if (inputDiv[i].children[0].className.indexOf('editted') < 0) {
            if (inputDiv[i].children[0].className.indexOf('polling') < 0) {
              inputDiv[i].children[0].className = inputDiv[i].children[0].className + ' polling';
            }
          } else {
            inputDiv[i].children[0].className = inputDiv[i].children[0].className.replace(/editted/g, 'polling');
          }
        }
      }
      thingClient.readProperty($scope.parsedTD, property).catch($scope.showRestError);
    });
  };

  $scope.readProperty = function readProperty (property) {
    thingClient.readProperty($scope.parsedTD, property).catch($scope.showRestError);
    let inputDiv = document.querySelectorAll('div#' + property.name);
    for (let i = 0; i < inputDiv.length; i++) {
      if (inputDiv[i].className.indexOf('ng-hide') < 0) {
        if (inputDiv[i].children[0].className.indexOf('editted') < 0) {
          if (inputDiv[i].children[0].className.indexOf('polling') < 0) {
            inputDiv[i].children[0].className = inputDiv[i].children[0].className + ' polling';
          }
        } else {
          inputDiv[i].children[0].className = inputDiv[i].children[0].className.replace(/editted/g, 'polling');
        }
      }
    }
  };

  $scope.writeProperty = function writeProperty (property) {
    thingClient.writeProperty($scope.parsedTD, property).catch($scope.showRestError);
    let inputDiv = document.querySelectorAll('div#' + property.name);
    for (let i = 0; i < inputDiv.length; i++) {
      if (inputDiv[i].className.indexOf('ng-hide') < 0) {
        if (inputDiv[i].children[0].className.indexOf('editted') < 0) {
          if (inputDiv[i].children[0].className.indexOf('polling') < 0) {
            inputDiv[i].children[0].className = inputDiv[i].children[0].className + ' polling';
          }
        } else {
          inputDiv[i].children[0].className = inputDiv[i].children[0].className.replace(/editted/g, 'polling');
        }
      }
    }
  };

  $scope.callAction = function callAction (action, param) {
    thingClient.callAction($scope.parsedTD, action, param).catch($scope.showRestError);
  };

  $scope.toggleAuto = function toggleAuto (property) {
    let inputDiv = document.querySelectorAll('div#' + property.name);
    for (let i = 0; i < inputDiv.length; i++) {
      if (inputDiv[i].className.indexOf('ng-hide') < 0) {
        if (inputDiv[i].children[0].className.indexOf('editted') < 0) {
          if (inputDiv[i].children[0].className.indexOf('polling') < 0) {
            inputDiv[i].children[0].className = inputDiv[i].children[0].className + ' polling';
          }
        } else {
          inputDiv[i].children[0].className = inputDiv[i].children[0].className.replace(/editted/g, 'polling');
        }
      }
    }
    // let inputList = inputDiv.getElementsByTagName('input');
    property.autoUpdate = !property.autoUpdate;
    if (property.autoUpdate) {
      $scope.autoReloaded.push(property);
    } else {
      let idx = $scope.autoReloaded.indexOf(property);
      if (idx > -1) {
        $scope.autoReloaded.splice(idx, 1); // remove property
      }
    }
  };

  $scope.reloadAuto = function reloadAuto () {
    $scope.autoReloaded.forEach(function (property) {
      let inputDiv = document.querySelectorAll('div#' + property.name);
      for (let i = 0; i < inputDiv.length; i++) {
        if (inputDiv[i].className.indexOf('ng-hide') < 0) {
          if (inputDiv[i].children[0].className.indexOf('editted') < 0) {
            if (inputDiv[i].children[0].className.indexOf('polling') < 0) {
              inputDiv[i].children[0].className = inputDiv[i].children[0].className + ' polling';
            }
          } else {
            inputDiv[i].children[0].className = inputDiv[i].children[0].className.replace(/editted/g, 'polling');
          }
        }
      }
      thingClient.readProperty($scope.parsedTD, property).catch($scope.showRestError);
    });
  };

  $scope.minMax = function minMax (min, max) {
    if (min !== undefined && max !== undefined && min !== null && max !== null) {
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
  };

  $scope.editClass = function (event) {
    let property = {};
    for (let i = 0; i < $scope.properties.length; i++) {
      if ($scope.properties[i].name === event.srcElement.parentElement.id) {
        property = $scope.properties[i];
      }
    }
    property.autoUpdate = false;
    let idx = $scope.autoReloaded.indexOf(property);
    if (idx > -1) {
      $scope.autoReloaded.splice(idx, 1); // remove property
    }
    event.srcElement.className = event.srcElement.className.replace(/polling/g, 'editted');
  };

  $interval($scope.reloadAuto, 1000);

}

RendertdtechnicianCtrl.$inject = ['$scope', '$http', '$state', '$stateParams', '$window', 'thingClient', '$interval', '$log'];
module.exports = RendertdtechnicianCtrl;
/* For adding borders
      .error {
  border:2px solid red;
}
document.getElementById("fName").className = document.getElementById("fName").className + " error";  // this adds the error class

document.getElementById("fName").className = document.getElementById("fName").className.replace(" error", ""); // this removes the error class
*/
