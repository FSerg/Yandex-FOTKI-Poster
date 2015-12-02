angular.module('MyApp')
  .controller('UserCtrl', ['$scope', '$routeParams', '$location', '$window', 'Auth', 'User', 'growl', function($scope, $routeParams, $location, $window, Auth, User, growl) {

      $scope.getAll = function() {
          User.all()
          .success(function(data) {
              $scope.users = data;
          });
      }; // end getAll users

      $scope.signUp = function() {
          User.create($scope.userData)
          .then(function(response) {
              $scope.userData = {};
              $window.localStorage.setItem('token', response.data.token);
              $location.path('/profile');
          });
      }; // end signUp

      $scope.save = function() {
          User.update($scope.userData)
          .then(function(response) {
              $window.localStorage.setItem('token', response.data.token);
              growl.success("User information updated!", {});
          });
      }; // end save


      if($routeParams.code) {
          // if we get special code from URL
          // thats we must try to get Yandex token
          growl.info("Waiting token from Yandex", {});
          User.getYaToken($routeParams.code)
          .success(function(response) {
              $window.localStorage.setItem('token', response.token);
              $location.url('/profile');
              growl.success("Yandex token obtained!", {});

          });
      }

      Auth.getUser()
          .then(function(data) {
              $scope.userData = data.data;
          });

  }]);
