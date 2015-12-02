angular.module('MyApp')
.controller('MainCtrl', ['$rootScope', '$scope', '$location', 'Auth', 'growl', function($rootScope, $scope, $location, Auth, growl) {

    $scope.testMsg = 'Test message';

    $scope.loggedIn = Auth.isLoggedIn();

    $rootScope.$on('$routeChangeStart', function() {
        $scope.loggedIn = Auth.isLoggedIn();
        Auth.getUser()
            .then(function(data) {
                $scope.user = data.data;
            });
    });

    $scope.doLogin = function() {
        Auth.login($scope.loginData.email, $scope.loginData.password)
          .success(function(data) {
              Auth.getUser()
                  .then(function(data) {
                      $scope.user = data.data;
                  });
              if(data.success)
                  $location.path('/albums');
              else
                  growl.error(data.message, {});
          });

    }; // end doLogin

    $scope.doLogout = function() {
        Auth.logout();
        $location.path('/logout');
    }; // end doLogout

}]);
