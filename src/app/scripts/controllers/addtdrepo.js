'use strict';

/**
 * @ngdoc function
 * @name wotwebui.controller:AddtdrepoCtrl
 * @description
 * # AddtdrepoCtrl
 * Controller of the wotwebui
 */
function AddtdrepoCtrl ($scope, $log, $http, $state) {
  /* let GitHub = require('../../../../node_modules/github-api/dist/GitHub.bundle');
  const gh = new GitHub();
  let repo = gh.getRepo('w3c', 'wot-thing-description');
  let tree = repo.getTree('master');
  tree.then(function (response) {
    $log.log(response);
  }); */
  // $scope.repoURL = ''https://api.github.com/repos/w3c/wot-thing-description/git/trees/f337855b0280c2d5bda7e8c09b2d04413e9e9965?recursive=2'';
  // $scope.repoURL = 'https://api.github.com/repos/w3c/wot-thing-description/git/trees/243da957272891e37dfec2a9145b3ede36274f1b';
  $scope.repoURL = 'https://api.github.com/repos/w3c/wot-thing-description/contents/test-bed/data/plugfest/2017-duesseldorf';
  $scope.repository = [];
  $http({
    method: 'get',
    url   : $scope.repoURL
  }).then(function (response) {
    for (let i = 0; i < response.data.length; i++) {
      let entry = { name: '', url: '' };
      entry.name = response.data[i].name.substring(0, response.data[i].name.indexOf('.'));
      entry.url = response.data[i].download_url;
      $scope.repository.push(entry);
    }
    $log.log($scope.repository);
  }, function (error) {
    $log.log(error, 'cannot get data.');
  });

  $scope.submit = function (event) {

    if (event.target.title !== undefined) {
      $http({
        method: 'get',
        url   : event.target.title
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
}
AddtdrepoCtrl.$inject = ['$scope', '$log', '$http', '$state'];
module.exports = AddtdrepoCtrl;
