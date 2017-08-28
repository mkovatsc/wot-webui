'use strict';

/**
 * @ngdoc function
 * @name wotwebui.controller:RendertdUserCtrl
 * @description
 * # RendertdUserCtrl
 * Controller of the wotwebui
 */
/* angular.module('wotwebui')
  .controller('RendertdUserCtrl', function ($scope, $http, $state, $stateParams) {
    /*$scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ]; */
function RendertdUserCtrl ($scope, $http, $state, $stateParams, $window) {
  $('.active').removeClass('active');
  $('a:contains(User)').parent('li').addClass('active');
  let parser = require('../../../../parser/node-wot/packages/node-wot-td-tools/dist/td-parser');
  // console.log(typeof($stateParams.TD));
  $scope.TD = $stateParams.TD;
  $scope.isValid = true;
  /* $('.active').removeClass('active');
  $('li:first').next().addClass('active'); */
  if ($scope.TD === '') {
    $state.go('addTD');
  } else {
    try {
      $scope.parsedTD = parser.parseTDObject($scope.TD);
    }
    catch (exception) {
      alert('Invalid JSON.');
      $scope.isValid = false;
      $state.go('addTD');
    }
    if ($scope.isValid) {
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

      $http({
        method: 'get',
        url   : $scope.widgetResource
      }).then(function (response) {
        $scope.content = response.data;
        for (let i = 0; i < $scope.parsedTD.interaction.length; i++) {
          /* for(var j=0;j<Object.keys($scope.content.widgets).length;j++){ */
          if ($scope.parsedTD.interaction[i].semanticTypes[0] === 'Property') {
            $scope.properties.push($scope.parsedTD.interaction[i]);
          } else if ($scope.parsedTD.interaction[i].semanticTypes[0] === 'Action') {
            $scope.actions.push($scope.parsedTD.interaction[i]);
          }
          /* } */
        }
      }, function (error) {
        console.log(error, 'cannot get data.');
      });
    }
  }
  $scope.minMax = function minMax (min, max) {
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
  };
}
RendertdUserCtrl.$inject = ['$scope', '$http', '$state', '$stateParams', '$window'];
module.exports = RendertdUserCtrl;