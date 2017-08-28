'use strict';

/**
 * @ngdoc function
 * @name wotwebui.controller:AddtdfileCtrl
 * @description
 * # AddtdfileCtrl
 * Controller of the wotwebui
 */

function AddtdfileCtrl ($scope, $http, $state, $window) {
  let json;
  $scope.newContent = '';
  $scope.content = '';

  document.getElementById('files').addEventListener('change', handleFileSelect, false);

  /* $scope.file_changed = function(element) {

    $scope.$apply(function(scope) {
      var td = element.files[0];
      var reader = new FileReader();
      reader.onload = function(e) {
        // handle onload
        console.log(e);
      };
      reader.readAsDataURL(td);
    });
  }; */
 /* $scope.showContent = function ($fileContent) {
    // $scope.content = $fileContent;
  }; */
  $scope.print = function (content) {
    $state.go('renderTD', { TD: content });
  };

  function handleFileSelect (evt) {
    let files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    // var output = [];
    for (let i = 0, f; f = files[i]; i++) {
      let reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function () {
        return function (e) {
          try {
            json = JSON.parse(e.target.result);
            $scope.content = json;
            $scope.$digest();
            $scope.print($scope.content);
          } catch (ex) {
            console.log('exception when trying to parse json = ' + ex);
          }
        };
      })(f);
      reader.readAsText(f);
    }

  }

  document.getElementById('files').addEventListener('change', handleFileSelect, false);

}
AddtdfileCtrl.$inject = ['$scope', '$http', '$state' , '$window'];
module.exports = AddtdfileCtrl;
