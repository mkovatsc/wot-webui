'use strict';

/**
 * @ngdoc function
 * @name wotwebui.controller:EditorCtrl
 *
 * @description
 * # EditorCtrl
 *
 * Controller of the wotwebui
 */
function EditorCtrl ($scope, $http, $state, $window, $stateParams) {
  $scope.$parent.isCurrentThing = false;
  let TD = JSON.parse($window.sessionStorage.getItem($stateParams.thing));
  let editor = ace.edit('editor');
  editor.getSession().setMode('ace/mode/json');
  editor.setTheme('ace/theme/idle_fingers');
  if (TD !== null) {
    editor.setValue(JSON.stringify(TD, null, '\t')
    );
  } else {
    editor.setValue([
      '{'
      , ' "language": "JSON",'
      , ' "foo": "bar",'
      , ' "trailing": "comma"'
      , '}'
      ].join('\n')
    );
  }

  editor.clearSelection();
  $scope.submit = function () {
    $scope.json = editor.getValue();
    $scope.json = JSON.parse($scope.json);
    $state.go('renderTD', { TD: $scope.json });
  };
}
EditorCtrl.$inject = ['$scope', '$http', '$state', '$window', '$stateParams'];
module.exports = EditorCtrl;
