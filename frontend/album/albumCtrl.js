angular.module('MyApp')
    .controller('AlbumCtrl', ['$scope', '$http', '$routeParams', 'growl',
    'Fotki', 'ngDialog', 'FileUploader', 'AuthToken',
    function($scope, $http, $routeParams, growl, Fotki, ngDialog, FileUploader, AuthToken) {

        $scope.size = 1;
        $scope.previewSize = 800;

        var GetPhotos = function() {
            Fotki.get({
                _id: $routeParams.id
            }, function(album) {
                $scope.Album = album;
                $scope.Photos = album.photos;
            });
        };
        GetPhotos();

        $scope.syncPhotos = function() {
            growl.info("Getting photos was started...", {});
            $http.get('/api/sync/photos', { params: { id: $routeParams.id } })
                .success(function(answer) {
                    growl.success(answer.message, { title: "Getting photos was finished!", ttl: 5000 });
                    GetPhotos(); // refresh list of photos
                })
                .error(function(error) {
                    growl.error(error.message, { title: "Error getting photos!", ttl: 5000 });
                });
        }; // end syncPhotos

        $scope.savePhoto = function(data, _id) {
            angular.extend(data, { _id: _id });
            return $http.post('/api/savePhoto', data);
        }; // end savePhoto

        $scope.removePhoto = function(index) {
            ngDialog.openConfirm({
                template: 'Are you sure, you want delete photo: <br /> <b>' + $scope.Photos[index].title + '</b><br /><br />' +
                    '<div class="text-right"><button class="btn btn-danger" ng-click="confirm(1)">Yes</button> ' +
                    '<button class="btn btn-primary" ng-click="closeThisDialog(0)">No</button></div>',
                plain: true
            }).then(function(value) {
                // if pressed Yes
                growl.info("Deleting photo...", {});
                $http.delete('/api/photo/' + $scope.Photos[index]._id, { params: { index: index } })
                    .success(function(answer) {
                        growl.success("Photo deleted successful!", {});
                        $scope.Photos.splice(index, 1);
                    })
                    .error(function(error) {
                        growl.error(error.message, { title: "Error delete photo", ttl: 5000 });
                    });

            }, function(reject) {
                // console.log(reject);
                // if pressed No - do nothing
            });
        }; // end removePhoto


        var uploader = $scope.uploader = new FileUploader({
            url: '/api/uploadphotos',
            // removeAfterUpload: true,
            headers: {
                'x-access-token': AuthToken.getToken(),
                'album-id': $routeParams.id
            }
        });
        // FILTERS
        uploader.filters.push({
            name: 'imageFilter',
            fn: function(item /*{File|FileLikeObject}*/, options) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        });

        uploader.onCompleteAll = function() {
            uploader.clearQueue();
            GetPhotos();
            growl.success("All photos uploaded Successfully!", {ttl: 5000});
        };

        $scope.sortableOptions = {
            orderChanged: function(event) {
                // console.log("Order changed!");
                // save curent index to sort_index

                for (var i = 0; i < $scope.Photos.length; i++) {
                    $scope.Photos[i].sort_index = i;
                }

                var NewOrderData = {
                    _id: $scope.Album._id,
                    photos: $scope.Photos
                };

                $http.post('/api/saveAllPhotos', NewOrderData)
                    .success(function(answer) {
                        growl.success("Ordering of photos was updated!", {ttl: 2000});
                    })
                    .error(function(error) {
                        growl.error(error.message, { title: "Error saving ordering of photos!", ttl: 5000 });
                    });
            }
        };

        var addPhotoToPost = function(myPhoto, myIndex, myFormat, previewSize) {
            var myText = "";
            var previewUrl = "";
            var origUrl = myPhoto.images.orig.href;
            if (angular.isUndefined(myPhoto.images.L)) {
                previewSize = 100;
            }

            switch (previewSize) {
                case 100:
                    previewUrl = myPhoto.images.XXS.href;
                    break;
                case 500:
                    previewUrl = myPhoto.images.L.href;
                    break;
                case 800:
                    previewUrl = myPhoto.images.XL.href;
                    break;
                default:
                    previewUrl = myPhoto.images.XXS.href;
            }

            switch (myFormat) {
                case 'BB':
                    myText = myIndex + ". " + myPhoto.title + "\n"+
                    "[url="+origUrl+"]"+"[img]"+previewUrl+".jpg[/img][/url]\n\n";
                    break;
                case 'HTML':
                    myText = myIndex + ". " + myPhoto.title + "<br/>\n"+
                    "<a href="+origUrl+">"+"<img src="+previewUrl+"></a><br/><br/>\n\n";
                    break;
                default:

            }
            return myText;
        };

        $scope.makePost = function(myFormat, previewSize) {
            $scope.postText = "";
            var myIndex = 1;
            for (var i = 0; i < $scope.Photos.length; i++) {
                if ($scope.Photos[i].cheked) {
                    $scope.postText = $scope.postText +
                        addPhotoToPost($scope.Photos[i], myIndex, myFormat, previewSize);
                    myIndex = myIndex + 1;
                }
            }

        };

        $scope.markAllPhotos = function(markState) {
            for (var i = 0; i < $scope.Photos.length; i++) {
                $scope.Photos[i].cheked = markState;
            }

        };


    }]);
