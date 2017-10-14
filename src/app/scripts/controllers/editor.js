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
      , '  "@context": ['
      , '     "http://w3c.github.io/wot/w3c-wot-td-context.jsonld"'
      , '   ],'
      , '  "@type": ['
      , '     "Thing"'
      , '   ],'
      , '  "name": "",'
      , '  "interaction": ['
      , '     {'
      , '      "@type": ['
      , '        "Property"'
      , '      ],'
      , '      "link": ['
      , '        {'
      , '          "href": "",'
      , '          "mediaType": "application/json"'
      , '        },'
      , '        {'
      , '          "href": "",'
      , '          "mediaType": "text/plain"'
      , '        }'
      , '       ],'
      , '       "name": "",'
      , '       "outputData": {'
      , '         "type": ""'
      , '       },'
      , '       "writable": true'
      , '     },'
      , '     {'
      , '       "@type": ['
      , '         "Action"'
      , '       ],'
      , '       "link": ['
      , '         {'
      , '           "href": "",'
      , '           "mediaType": "application/json"'
      , '         },'
      , '         {'
      , '           "href": "",'
      , '           "mediaType": "text/plain"'
      , '         }'
      , '       ],'
      , '       "name": "",'
      , '       "outputData": {'
      , '         "type": ""'
      , '       }'
      , '     }'
      , '   ]'
      , '}'
      ].join('\n')
    );
  };
  editor.clearSelection();
  $scope.submit = function () {
    $scope.json = editor.getValue();
    $scope.json = JSON.parse($scope.json);
    $state.go('renderTD', { TD: $scope.json });
  };
}
EditorCtrl.$inject = ['$scope', '$http', '$state', '$window', '$stateParams'];
module.exports = EditorCtrl;
