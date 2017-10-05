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
function AddtdCtrl ($scope, $log, $http) {
  $scope.$parent.isCurrentThing = false;
  $scope.coapAvailable = true;
  $scope.loading = false;
  $scope.checkPolyfill = function () {
	$scope.loading = true;
	$http({
      method: 'post',
      url   : 'http://localhost:8080/request'
    }).then(function (response) {
      $scope.loading = false;
	  $scope.coapAvailable = true;
    }, function (response) {
      $scope.loading = false;
	  if (response.status === -1) {
        $scope.coapAvailable = false;
        $log.log(response.status);
      } else if (response.status === 500) {
        $scope.coapAvailable = true;
        $log.log(response.status);
      }
    });
  };
  $scope.checkPolyfill();
}
AddtdCtrl.$inject = ['$scope', '$log', '$http'];
module.exports = AddtdCtrl;
