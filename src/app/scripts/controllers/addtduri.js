'use strict';

/**
 * @ngdoc function
 * @name wotwebui.controller:AddtduriCtrl
 * @description
 * # AddtduriCtrl
 * Controller of the wotwebui
 */

function AddtduriCtrl ($scope, $http, $state, $log) {
  $scope.tduri = '';
  $scope.submit = function () {
    if ($scope.tduri !== undefined) {
      $http({
        method: 'get',
        url   : $scope.tduri
      }).then(function (response) {
        $scope.content = response.data;
        $state.go('renderTD', { TD: $scope.content });
          /* if(data[type].indexOf("webUI")>-1){
            $log.log("We will render $scope..");
            $scope.thingName = data.name;
          } */
      }, function (error) {
        $log.log(error, 'cannot get data.');
      });
    } else {
      alert('invalid');
    }
  };

  $scope.check = function (event) {
    if (event.keyCode === 13) {
      $scope.submit();
    }
  }
}
AddtduriCtrl.$inject = ['$scope', '$http', '$state', '$log'];
module.exports = AddtduriCtrl;
