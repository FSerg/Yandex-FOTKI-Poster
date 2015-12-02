angular.module('MyApp')
.factory('User', ['$http', function($http) {
    var userFactory = {};

    userFactory.create = function(userData) {
        return $http.post('/api/signup', userData);
    };

    userFactory.update = function(userData) {
        return $http.post('/api/update', userData);
    };

    userFactory.getYaToken = function(code) {
        return $http.get('/api/yatoken', {params: {code: code}});
    };


    userFactory.all = function() {
        return $http.get('/api/users');
    };

    return userFactory;

}]);
