'use strict';

/**
 * @ngdoc directive
 * @name izzyposWebApp.directive:adminPosHeader
 * @description
 * # adminPosHeader
 */
function header () {
  let controller = [function () {

    function init () {
      $('.ui.sticky')
        .sticky()
      ;
    }

    init();

  }];
  return {
    template  : require('../header/header.html'),
    restrict  : 'E',
    replace   : true,
    controller: controller
  };
}

module.exports = header;
