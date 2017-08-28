'use strict';

/**
 * @ngdoc function
 * @name wotwebui.controller:RendertdCtrl
 * @description
 * # RendertdCtrl
 * Controller of the wotwebui
 */
/* angular.module('wotwebui')
  .controller('RendertdCtrl', function ($scope, $http, $state, $stateParams) {
    /*$scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ]; */
function RendertdCtrl ($scope, $http, $state, $stateParams) {
  $state.go('renderTDUser', $stateParams.TD);
}
RendertdCtrl.$inject = ['$scope', '$http', '$state', '$stateParams'];
module.exports = RendertdCtrl;
