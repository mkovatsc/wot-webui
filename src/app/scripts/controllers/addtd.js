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
function AddtdCtrl ($scope, $modal) {
  $scope.$parent.isCurrentThing = false;
}
AddtdCtrl.$inject = ['$scope', '$uibModal'];
module.exports = AddtdCtrl;
