angular.module('MyApp')
  .factory('Fotki', ['$resource', function($resource) {
    return $resource('/api/albums/:_id');
  }]);
