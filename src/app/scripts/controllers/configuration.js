'use strict';

/**
 * @ngdoc function
 * @name wotwebui.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the wotwebui
 */
/* angular.module('wotwebui')
  .controller('AboutCtrl', function () {
    /* $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ]; */
function ConfigurationCtrl ($scope, $window) {
  $scope.$parent.isCurrentThing = false;
  $scope.interval = Number($window.sessionStorage.getItem('interval'));
  $scope.successMessage = false;

  $scope.submit = function () {
    $scope.successMessage = true;
    $window.sessionStorage.setItem('interval', $scope.interval);
  };
}
ConfigurationCtrl.$inject = ['$scope', '$window'];
module.exports = ConfigurationCtrl;
