'use strict';

/**
 * @ngdoc function
 * @name wotwebui.controller:RendertdmanagerCtrl
 *
 * @description
 * # RendertdmanagerCtrl
 *
 * Controller of the wotwebui
 */

/* angular.module('wotwebui')
  .controller('RendertdmanagerCtrl
 ', function ($scope, $http, $state, $stateParams) {
    /*$scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ]; */
function RendertdmanagerCtrl($scope, $http, $state, $stateParams, $window) {
  $('.active').removeClass('active');
  $('a:contains(Manager)').parent('li').addClass('active');
  $('#errorDivMan').hide();
  // $('li:first').next().addClass('active');
  // let parser = require('../../../../parser/node-wot/packages/node-wot-td-tools/dist/td-parser');
  let parser = require('../../../../parser/bundle-parser');
  // console.log(typeof($stateParams.TD));
  $scope.TD = $stateParams.TD;
  /* $('.active').removeClass('active');
  $('li:first').next().addClass('active'); */
  if ($scope.TD === '') {
    $state.go('addTD');
  } else {

    $scope.parsedTD = parser.parseTDObject($scope.TD)
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
      url: $scope.widgetResource
    }).then(function (response) {
      $scope.content = response.data;
      for (let i = 0; i < $scope.parsedTD.interaction.length; i++) {
        if ($scope.parsedTD.interaction[i].semanticTypes[0] === 'Property') {let value = 0;
          $http({
            method: 'get',
            url: $scope.parsedTD.interaction[i].link[0].href
          }).then(function (response2) {
            value = response2.data;
            let index = $scope.parsedTD.interaction[i].name;
            $scope.properties.push($scope.parsedTD.interaction[i]);
            $scope.propertyValues[index] = value;
          }, function (error) {
            $('#errorDivMan').show();
            let index = $scope.parsedTD.interaction[i].name;
            $scope.properties.push($scope.parsedTD.interaction[i]);
            $scope.propertyValues[index] = value;
            console.log(error, 'cannot get data.');
          });
        } else if ($scope.parsedTD.interaction[i].semanticTypes[0] === 'Action') {
          $scope.actions.push($scope.parsedTD.interaction[i]);
        }
      }
    }, function (error) {
      console.log(error, 'cannot get data.');
    });
  }
  $scope.minMax = function minMax(min, max) {
    if (min !== null && max !== null) {
      return '(min=' + min + ',max=' + max + ')';
    } else {
      return null;
    }
  };
  $scope.setType = function setType(type) {
    if (type === 'number' || type === 'integer') {
      return 'number';
    } else if (type === 'string') {
      return 'text';
    } else if (type === 'boolean') {
      return 'checkbox';
    }
  };
}

RendertdmanagerCtrl.$inject = ['$scope', '$http', '$state', '$stateParams', '$window'];
module.exports = RendertdmanagerCtrl;
