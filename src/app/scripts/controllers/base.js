'use strict';

/**
 * @ngdoc function
 * @name wotwebui.controller:BaseCtrl
 * @description
 * # BaseCtrl
 * Controller of the wotwebui
 */
/* angular.module('wotwebui')
  .controller('BaseCtrl', function () { */
/* $scope.awesomeThings = [
  'HTML5 Boilerplate',
  'AngularJS',
  'Karma'
]; */
function BaseCtrl ($scope, $window, $state) {
  $scope.things = [];
  $scope.child = {};
  $scope.widgetAvailable = false;
  $scope.updateThings = function () {
    $.each($window.sessionStorage, function (index, value) {
      let item = index;
      let add = true;

      if (item !== 'ListOfWidgets') {
        for (let i = 0; i < $scope.things.length; i++) {
          if ($scope.things[i] === item) {
          // clickId[i].val = item.val;
          add = false;
          }
        }

        if (add) {
          $scope.things.push(item);
        }
      }
    });
  };
  $scope.updateThings();
  $scope.isCurrentThing = false;
 /* for (let i = 0; i < $window.sessionStorage.length; i++) {
    $scope.things.push($window.sessionStorage.key(i));
  } */
  $scope.openEditor = function () {
    $state.go('editor', { thing: $scope.child.parsedTD.name });
  };
  $scope.deleteThing = function () {
    $window.sessionStorage.removeItem($scope.child.parsedTD.name);
    let index = $scope.things.indexOf($scope.child.parsedTD.name);
    $scope.things.splice(index, 1);
    $state.go('addTD');
  }
  $scope.openThing = function (x) {
    let content = JSON.parse($window.sessionStorage.getItem(x));
    $state.go('renderTD', { TD: content });
  };
}
BaseCtrl.$inject = ['$scope', '$window', '$state'];
module.exports = BaseCtrl;
