'use strict';

/**
 * @ngdoc function
 * @name wotwebui.controller:AddtdCtrl
 * @description
 * # AddtdCtrl
 * Controller of the wotwebui
 */
/* angular.module('wotwebui')
  .controller('AddtdCtrl', function () { */
function AddtdCtrl ($scope) {
  $scope.awesomeThings = [
    'HTML5 Boilerplate',
    'AngularJS',
    'Karma'
  ];
}
AddtdCtrl.$inject = ['$scope'];
module.exports = AddtdCtrl;
