'use strict';

/**
 * @ngdoc directive
 * @name izzyposWebApp.directive:adminPosHeader
 * @description
 * # adminPosHeader
 */

function sidebar ($http, $state) {
  return {
    template: require('../sidebar/sidebar.html'),
    restrict: 'E',
    replace : true,
    scope   : {
    },
    controller: function ($scope, $http, $state) {
      $scope.openThing = function (x) {
        alert(x);
      };
        /* $scope.multiCheck = function(y){
          if(y==$scope.multiCollapseVar)
            $scope.multiCollapseVar = 0;
          else
            $scope.multiCollapseVar = y;
        }; */
    }
  };
}
sidebar.$inject = ['$http', '$state'];
module.exports = sidebar;
