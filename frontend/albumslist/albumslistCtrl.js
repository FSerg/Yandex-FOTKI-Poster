angular.module('MyApp')
    .controller('AlbumsListCtrl', ['$scope', '$http', 'growl', 'Fotki', 'ngDialog', function($scope, $http, growl, Fotki, ngDialog) {

        var GetAlbums = function() {
            $scope.AlbumsList = Fotki.query();
        };
        GetAlbums();

        $scope.syncAlbums = function() {
            growl.info("Getting Albums was started...", {});
            $http.get('/api/sync/albums')
                .success(function(answer) {
                    growl.success(answer.message, { title: "Getting Albums was finished!", ttl: 5000 });
                    GetAlbums(); // refresh list of Albums
                })
                .error(function(error) {
                    growl.error(error.message, { title: "Error getting Albums!", ttl: 5000 });
                });
        }; // end syncAlbums

        $scope.delAlbum = function(index) {
            ngDialog.openConfirm({
                template: 'Are you sure, you want delete Album: <br /> <b>' + $scope.AlbumsList[index].title + '</b><br /><br />' +
                    '<div class="text-right"><button class="btn btn-danger" ng-click="confirm(1)">Yes</button> ' +
                    '<button class="btn btn-primary" ng-click="closeThisDialog(0)">No</button></div>',
                plain: true
            }).then(function(value) {
                // if pressed Yes
                growl.info("Deleting Album...", {});
                $http.delete('/api/albums/' + $scope.AlbumsList[index]._id)
                    .success(function(answer) {
                        growl.success("Album deleted successful!", { ttl: 2000 });
                        $scope.AlbumsList.splice(index, 1);
                    })
                    .error(function(error) {
                        growl.error(error.message, { title: "Error delete Album!", ttl: 5000 });
                    });
            }, function(reject) {
                // console.log(reject);
                // нет подтверждения - ничего не делаем
            });
        }; // end delAlbum

        $scope.saveAlbum = function(data, _id) {
            angular.extend(data, { _id: _id });
            return $http.post('/api/saveAlbum', data);
        }; // end saveAlbum

        $scope.getPicClass = function(index) {
            return 'pic-' + index;
        };

        $scope.newAlbum = function() {
            growl.info("Adding new Album...", {});
            $http.post('/api/newAlbum', { data: $scope.album })
                .success(function(answer) {
                    $scope.album = { title: '' };
                    growl.success("New Album added successful!", { ttl: 2000 });
                    GetAlbums();
                })
                .error(function(error) {
                    growl.error(error.message, { title: "Error add new Album!", ttl: 5000 });
                });
        };

    }]);
