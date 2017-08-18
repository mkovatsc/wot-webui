/**
 * Application route definition.
 */
export default function ($stateProvider, $urlRouterProvider/* , $ocLazyLoadProvider */) {
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
      .state('about', {
        url  : '/view',
        views: {
          'content@': {
            template    : require('../views/about.html'),
            controller  : 'AboutCtrl',
            controllerAs: 'about'
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
        parent: 'addTD',
        views : {
          'content@': {
            template    : require('../views/addtduri.html'),
            controller  : 'AddtduriCtrl',
            controllerAs: 'addTDURI'
          }
        }
      })
      .state('addTDFile', {
        parent: 'addTD',
        views : {
          'content@': {
            template    : require('../views/addtdfile.html'),
            controller  : 'AddtdfileCtrl',
            controllerAs: 'addTDFile'
          }
        }
      })
      .state('addTDRepo', {
        parent: 'addTD',
        views : {
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
