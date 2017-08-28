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
function AboutCtrl ($scope) {
  $scope.$parent.isCurrentThing = false;
}
AboutCtrl.$inject = ['$scope'];
module.exports = AboutCtrl;
