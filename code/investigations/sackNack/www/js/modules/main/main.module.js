(function() {
  'use strict';

  angular
    .module('main', [
      'angular-uuid',
      'monospaced.qrcode',
      'push'
    ])
    .config(function($stateProvider){
      $stateProvider
        .state('main', {
          url: '/main',
          templateUrl: 'js/modules/main/main.html',
          controller: 'mainCtrl as vm'
        });
    });
})();
