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
  $scope.autoReloaded = [];
  $scope.errorMessage = [];
  $scope.parseError = false;
  // let parser = require('../../../../parser/node-wot/packages/node-wot-td-tools/dist/td-parser');
  let parser = require('../../../../parser/bundle-parser');
  // $log.log(typeof($stateParams.TD));
  $scope.TD = $stateParams.TD;
  $scope.interval = Number($window.sessionStorage.getItem('interval'));
  /* $('.active').removeClass('active');
  $('li:first').next().addClass('active'); */
  $scope.showError = function showError (errorMsg) {
    $scope.errorMessage.push(errorMsg);
    $log.log('Error:' + errorMsg);
  };

  $scope.showRestError = function showRestError (errorObj) {
    let msg = '';
    if (errorObj.config) {
      msg = errorObj.config.method + ' to ' + errorObj.config.url + ' failed.';
      msg += errorObj.status + ' ' + errorObj.statusText;
    } else if (errorObj.message) {
      msg = 'TD parse error: ' + errorObj.message;
    } else {
      msg = JSON.stringify(errorObj);
    }
    $('#errorDivTech').show();
    $scope.showError(msg);
  };
  if ($scope.TD === '') {
    $state.go('addTD');
  } else {
    try {
      $scope.parsedTD = parser.parseTDObject($scope.TD);
    } catch (exception) {
      $scope.showRestError(exception);
      $scope.parseError = true;
    }
    if(!$scope.parseError) {
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
      $scope.widgets = [];

      $http({
        method: 'get',
        url: $scope.widgetResource
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
            $scope.actionValues[$scope.parsedTD.interaction[i].name] = '';
            $scope.actions.push($scope.parsedTD.interaction[i]);
          }
        }
      }, function (error) {
        $log.log(error, 'cannot get data.');
      });

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
                $scope.propertyValues = {name: '', value: '', url: '', propertyName: '', writable: ''};
                if ($scope.parsedTD.interaction[i].semanticTypes[k].toLowerCase() === $scope.content.widgets[j].types[l].toLowerCase()) {
                  $scope.propertyValues.name = $scope.content.widgets[j].widget_name;
                  $scope.propertyValues.url = $scope.parsedTD.interaction[i].link[0].href;
                  $scope.propertyValues.propertyName = $scope.parsedTD.interaction[i].name;
                  $scope.propertyValues.writable = $scope.parsedTD.interaction[i].writable;
                  $scope.widgets.push($scope.propertyValues);
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
        $log.log($scope.widgets);
        if ($scope.widgets.length === 0) {
          $scope.$parent.$parent.widgetAvailable = false;
        } else {
          $window.sessionStorage.setItem('ListOfWidgets', JSON.stringify($scope.widgets));
          $scope.$parent.$parent.widgetAvailable = true;
        }
      }, function (error) {
        $log.log(error, 'cannot get data.');
      });
    }
  }

  $scope.updateState = function updateState () {
    $scope.properties.forEach(function (property) {
      property.autoUpdate = true;
      let inputDiv = document.querySelectorAll('div#' + property.name);
      for (let i = 0; i < inputDiv.length; i++) {
        if (inputDiv[i].className.indexOf('ng-hide') < 0) {
          if (inputDiv[i].children[0].className.indexOf('editted') < 0 && inputDiv[i].children[0].className.indexOf('read') < 0) {
            if (inputDiv[i].children[0].className.indexOf('polling') < 0) {
              inputDiv[i].children[0].className = inputDiv[i].children[0].className + ' polling';
            }
          } else {
            inputDiv[i].children[0].className = inputDiv[i].children[0].className.replace(/editted/g, 'polling');
            inputDiv[i].children[0].className = inputDiv[i].children[0].className.replace(/read/g, 'polling');
          }
        }
      }
	  $scope.autoReloaded.push(property);
      thingClient.readProperty($scope.parsedTD, property).catch($scope.showRestError);
    });
  };

  $scope.readProperty = function readProperty (property) {
    thingClient.readProperty($scope.parsedTD, property).catch($scope.showRestError);
    let inputDiv = document.querySelectorAll('div#' + property.name);
    for (let i = 0; i < inputDiv.length; i++) {
      if (inputDiv[i].className.indexOf('ng-hide') < 0) {
        if (property.autoUpdate) {
          if (inputDiv[i].children[0].className.indexOf('editted') < 0 && inputDiv[i].children[0].className.indexOf('read') < 0) {
            if (inputDiv[i].children[0].className.indexOf('polling') < 0) {
              inputDiv[i].children[0].className = inputDiv[i].children[0].className + ' polling';
            }
          } else {
            inputDiv[i].children[0].className = inputDiv[i].children[0].className.replace(/editted/g, 'polling');
            inputDiv[i].children[0].className = inputDiv[i].children[0].className.replace(/read/g, 'polling');
          }
        } else {
          if (inputDiv[i].children[0].className.indexOf('editted'  && inputDiv[i].children[0].className.indexOf('polling') < 0) < 0) {
            if (inputDiv[i].children[0].className.indexOf('read') < 0) {
              inputDiv[i].children[0].className = inputDiv[i].children[0].className + ' read';
            }
          } else {
            inputDiv[i].children[0].className = inputDiv[i].children[0].className.replace(/editted/g, 'read');
            inputDiv[i].children[0].className = inputDiv[i].children[0].className.replace(/polling/g, 'read');
          }
        }
      }
    }
  };
// read
  $scope.writeProperty = function writeProperty (property) {
    thingClient.writeProperty($scope.parsedTD, property).catch($scope.showRestError);
    let inputDiv = document.querySelectorAll('div#' + property.name);
    for (let i = 0; i < inputDiv.length; i++) {
      if (inputDiv[i].className.indexOf('ng-hide') < 0) {
        if (inputDiv[i].children[0].className.indexOf('editted') < 0) {
          if (inputDiv[i].children[0].className.indexOf('read') < 0) {
            inputDiv[i].children[0].className = inputDiv[i].children[0].className + ' read';
          }
        } else {
          inputDiv[i].children[0].className = inputDiv[i].children[0].className.replace(/editted/g, 'read');
        }
      }
    }
  };

  $scope.callAction = function callAction (action, param) {
    thingClient.callAction($scope.parsedTD, action, param).catch($scope.showRestError);
  };

  $scope.toggleAuto = function toggleAuto (property) {
    property.autoUpdate = !property.autoUpdate;
    if (property.autoUpdate) {
      $scope.autoReloaded.push(property);
    } else {
      let idx = $scope.autoReloaded.indexOf(property);
      if (idx > -1) {
        $scope.autoReloaded.splice(idx, 1); // remove property
      }
    }
    let inputDiv = document.querySelectorAll('div#' + property.name);
    for (let i = 0; i < inputDiv.length; i++) {
      if (inputDiv[i].className.indexOf('ng-hide') < 0) {
        if (property.autoUpdate) {
          if (inputDiv[i].children[0].className.indexOf('editted') < 0 && inputDiv[i].children[0].className.indexOf('read') < 0) {
            if (inputDiv[i].children[0].className.indexOf('polling') < 0) {
              inputDiv[i].children[0].className = inputDiv[i].children[0].className + ' polling';
            }
          } else {
            inputDiv[i].children[0].className = inputDiv[i].children[0].className.replace(/editted/g, 'polling');
            inputDiv[i].children[0].className = inputDiv[i].children[0].className.replace(/read/g, 'polling');
          }
        } else {
          if (inputDiv[i].children[0].className.indexOf('editted') < 0 && inputDiv[i].children[0].className.indexOf('polling') < 0) {
            if (inputDiv[i].children[0].className.indexOf('read') < 0) {
              inputDiv[i].children[0].className = inputDiv[i].children[0].className + ' read';
            }
          } else {
            inputDiv[i].children[0].className = inputDiv[i].children[0].className.replace(/editted/g, 'read');
            inputDiv[i].children[0].className = inputDiv[i].children[0].className.replace(/polling/g, 'read');
          }
        }
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

  $scope.setTypeArray = function setType (type) {
    if (angular.isNumber(type)) {
      return 'number';
    } else if (angular.isString(type)) {
      return 'text';
    } else if (typeof type === 'boolean') {
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
    event.srcElement.className = event.srcElement.className.replace(/read/g, 'editted');
  };

  $interval($scope.reloadAuto, $scope.interval);
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
