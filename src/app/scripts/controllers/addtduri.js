'use strict';

/**
 * @ngdoc function
 * @name wotwebui.controller:AddtduriCtrl
 * @description
 * # AddtduriCtrl
 * Controller of the wotwebui
 */
/* angular.module('wotwebui')
  .controller('AddtduriCtrl', function ($scope, $http, $state) {
    /* $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ]; */
function AddtduriCtrl ($scope, $http, $state) {
  /*  $(".active").removeClass("active");
    $("li:first").addClass("active"); */

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
            console.log("We will render $scope..");
            $scope.thingName = data.name;
          } */
      }, function (error) {
        console.log(error, 'cannot get data.');
      });
    } else {
      alert('invalid');
    }
  };
}
AddtduriCtrl.$inject = ['$scope', '$http', '$state'];
module.exports = AddtduriCtrl;
