/**
 * Application route definition.
 */
function appRoute ($stateProvider, $urlRouterProvider/* , $ocLazyLoadProvider */) {
  'ngInject';

  /* $ocLazyLoadProvider.config({
     debug:false,
     events:true,
   }); */
  $stateProvider
    .state('home', {
      url  : '/home',
      views: {
        'content@': {
          template    : require('../views/main.html'),
          controller  : 'MainCtrl',
          controllerAs: 'main'
        }
      }
    })
    .state('configuration', {
      url  : '/configuration',
      views: {
        'content@': {
          template    : require('../views/configuration.html'),
          controller  : 'ConfigurationCtrl',
          controllerAs: 'configuration'
        }
      }
    })
    .state('renderTD', {
      url  : '/render',
      views: {
        'content@': {
          template    : require('../views/rendertd.html'),
          controller  : 'RendertdCtrl',
          controllerAs: 'renderTD'
        }
      },
      params: {
        TD: ''
      }
    })
    .state('renderTDUser', {
      parent: 'renderTD',
      views : {
        'rendertd@renderTD': {
          template    : require('../views/rendertduser.html'),
          controller  : 'RendertduserCtrl',
          controllerAs: 'renderTDuser'
        }
      }
    })
    .state('renderTDTechnician', {
      parent: 'renderTD',
      views : {
        'rendertd@renderTD': {
          template    : require('../views/rendertdtechnician.html'),
          controller  : 'RendertdtechnicianCtrl',
          controllerAs: 'renderTDtechnician'
        }
      }
    })
    .state('renderTDManager', {
      parent: 'renderTD',
      views : {
        'rendertd@renderTD': {
          template    : require('../views/rendertdmanager.html'),
          controller  : 'RendertdmanagerCtrl',
          controllerAs: 'renderTDmanager'
        }
      }
    })
    .state('viewWidgets', {
      url  : '/viewWidgets',
      views: {
        'content@': {
          template    : require('../views/viewwidgets.html'),
          controller  : 'ViewwidgetsCtrl',
          controllerAs: 'viewWidgets'
        }
      }
    })
    .state('addTD', {
      url  : '/add',
      views: {
        'content@': {
          template    : require('../views/addtd.html'),
          controller  : 'AddtdCtrl',
          controllerAs: 'addTD'
        }
      }
    })
    .state('addTDURI', {
      url  : '/uri',
      views: {
        'content@': {
          template    : require('../views/addtduri.html'),
          controller  : 'AddtduriCtrl',
          controllerAs: 'addTDURI'
        }
      }
    })
    .state('editor', {
      url  : '/editor',
      views: {
        'content@': {
          template    : require('../views/editor.html'),
          controller  : 'EditorCtrl',
          controllerAs: 'editor'
        }
      },
      params: {
        thing: ''
      }
    })
    .state('addTDFile', {
      url  : '/file',
      views: {
        'content@': {
          template    : require('../views/addtdfile.html'),
          controller  : 'AddtdfileCtrl',
          controllerAs: 'addTDFile'
        }
      }
    })
    .state('addTDRepo', {
      url  : '/repo',
      views: {
        'content@': {
          template    : require('../views/addtdrepo.html'),
          controller  : 'AddtdrepoCtrl',
          controllerAs: 'addTDRepo'
        }
      }
    });
  /* $stateProvider
    .state('app', {
      url      : '/',
      component: 'app'
    }); */
  $urlRouterProvider.otherwise('add');


  /* $urlRouterProvider.otherwise('home');
   */

}

appRoute.$inject = ['$stateProvider', '$urlRouterProvider'];
module.exports = appRoute;
