angular.module('MyApp', ['ngResource', 'ngRoute', 'mgcrea.ngStrap', 'angular-growl',
                         'ngDialog', 'ngAnimate', 'xeditable', '720kb.tooltips',
                         'angularFileUpload', 'as.sortable'])
  .config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
    $locationProvider.html5Mode(true);
    //$locationProvider.html5Mode({enabled: true, requireBase: false});

    $routeProvider
      .when('/', {
        templateUrl: 'main/home.html',
        controller: 'MainCtrl'
      })
      .when('/albums', {
        templateUrl: 'albumslist/albumslist.html',
        controller: 'AlbumsListCtrl'
      })
      .when('/albums/:id', {
        templateUrl: 'album/album.html',
        controller: 'AlbumCtrl'
      })
      .when('/login', {
        templateUrl: 'user/login.html',
        controller: 'MainCtrl'
      })
      .when('/signup', {
        templateUrl: 'user/signup.html',
        controller: 'UserCtrl'
      })
      .when('/profile', {
        templateUrl: 'user/profile.html',
        controller: 'UserCtrl'
      })

      .when('/yandex', {
            templateUrl: 'user/profile.html',
            controller: 'UserCtrl'
      })

      .otherwise({
        redirectTo: '/'
      });

  }])

  .config(['$httpProvider',function($httpProvider) {
     $httpProvider.interceptors.push('AuthInterceptor');
  }]);

angular.module('MyApp').config(['growlProvider', function (growlProvider) {
  growlProvider.globalTimeToLive(3000);
}]);

angular.module('MyApp').filter('unsafe', function($sce) {
    return function(val) {
        return $sce.trustAsHtml(val);
    };
});
