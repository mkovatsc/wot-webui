/* global process */
import $ from 'jquery';

window.$ = $;
window.jQuery = $;
import sticky from 'jquery-sticky';
import angular from 'angular';
import ngAnimate from 'angular-animate';
import ngAria from 'angular-aria';
import ngCookies from 'angular-cookies';
import ngMessages from 'angular-messages';
import ngSanitize from 'angular-sanitize';
import ngTouch from 'angular-touch';
import ngBootstrap from 'angular-ui-bootstrap';
import ngTranslate from 'angular-translate';
import ngTranslateLoaderStaticFiles from 'angular-translate-loader-static-files';
import uiRouter from 'angular-ui-router';
import brace from 'brace';
import 'brace/mode/json';
import 'brace/theme/idle_fingers';

import '../styles/main.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'semantic-ui/dist/semantic.css';
import 'font-awesome/css/font-awesome.min.css';

import config from 'app.config';

import appConfig from './app.config';
import appRoute from './app.route';
import appComponent from './app.component';
import Base from './controllers/base';
import Main from './controllers/main';
import AddTd from './controllers/addtd';
import AddTdFile from './controllers/addtdfile';
import AddTdRepo from './controllers/addtdrepo';
import AddTdUri from './controllers/addtduri';
import RenderTd from './controllers/rendertd';
import ViewWidgets from './controllers/viewwidgets';
import RenderTdUser from './controllers/rendertduser';
import RenderTdTechnician from './controllers/rendertdtechnician';
import RenderTdManager from './controllers/rendertdmanager';
import Editor from './controllers/editor';
import header from './directives/header/header';
import widgetGenerator from './services/widgetGenerator';
// import sidebar from './directives/sidebar/sidebar';
// import typedjson from '../../../other_components/node-wot/packages/node-wot-td-tools/node_modules/typedjson-npm/js/typed-json.js';
// import parseTDObject from '../../../other_components/node-wot/packages/node-wot-td-tools/dist/td-parser';
// import parseTDObject from '../../../other_components/node-wot/packages/node-wot-td-tools/src/td-parser.ts';

export default angular.module('wotwebui', [
  ngAnimate,
  ngAria,
  ngCookies,
  ngMessages,
  ngSanitize,
  ngTouch,
  ngBootstrap,
  ngTranslate,
  ngTranslateLoaderStaticFiles,
  uiRouter
])
.config(appConfig)
.config(appRoute)
.constant('CONFIG', config)
.constant('ENVIRONNEMENT', process.env.ENV_NAME)
.component('app', appComponent)
.controller('MainCtrl', Main)
.controller('AddtdCtrl', AddTd)
.controller('AddtdfileCtrl', AddTdFile)
.controller('AddtdrepoCtrl', AddTdRepo)
.controller('AddtduriCtrl', AddTdUri)
.controller('RendertdCtrl', RenderTd)
.controller('ViewwidgetsCtrl', ViewWidgets)
.controller('BaseCtrl', Base)
.controller('RendertduserCtrl', RenderTdUser)
.controller('RendertdtechnicianCtrl', RenderTdTechnician)
.controller('RendertdmanagerCtrl', RenderTdManager)
.controller('EditorCtrl', Editor)
.directive('header', header)
.service('widgetGenerator', widgetGenerator)
.name;
