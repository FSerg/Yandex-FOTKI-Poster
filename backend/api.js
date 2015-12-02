var config = require('./config');
var User = require('./models/users');
var Album = require('./models/albums');
var secretKey = config.secretKey;

var request = require('request');
var jsonwebtoken = require('jsonwebtoken');
var async = require('async');
var _ = require('lodash');
var fs = require('fs');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

function createToken(user) {
    var token = jsonwebtoken.sign({
        id: user._id,
        yaname: user.yaname,
        yatoken: user.yatoken,
        email: user.email
    }, secretKey, {
        expiresIn: "10d"
    });
    return token;
}

module.exports = function(app, express) {

    var api = express.Router();

    // =========================================================================
    // SIGN UP (REGISTERING NEW USER)
    api.post('/signup', function(req, res) {
        var user = new User({
            email: req.body.email,
            yaname: req.body.yaname,
            yatoken: '---',
            password: req.body.password
        });

        user.save(function(err) {
            if (err) {
                console.log("Error save new user in database (Sign Up): " + err);
                res.json({
                    success: false,
                    message: err
                });
                return;
            }

            var token = createToken(user);
            res.json({
                success: true,
                message: 'User has been created!',
                token: token
            });
        });
    }); // END SIGN UP (REGISTERING NEW USER)


    // =========================================================================
    // LOGIN
    api.post('/login', function(req, res) {
        User.findOne({
            email: req.body.email
        }).select('_id email yaname yatoken password').exec(function(err, user) {
            if (err) throw err;

            if (!user) {
                res.send({
                    message: "User does not exist!"
                });
            } else if (user) {
                var validPassword = user.comparePassword(req.body.password);

                if (!validPassword) {
                    res.send({
                        message: "Invalid password!"
                    });
                } else {
                    // token
                    var token = createToken(user);

                    res.json({
                        success: true,
                        message: "Successfully login!",
                        token: token
                    });
                }
            }
        });
    }); // END LOGIN

    // =========================================================================
    // chek token every request
    api.use(function(req, res, next) {
        // console.log('Sombody came to app!');

        var token = req.body.token || req.param('token') || req.headers['x-access-token'];
        // chek if token exist
        if (token) {
            jsonwebtoken.verify(token, secretKey, function(err, decoded) {
                if (err) {
                    res.status(403).send({
                        success: false,
                        message: "Failed to authenticate user!"
                    });
                } else {
                    req.decoded = decoded;
                    next();
                }
            });
        } else {
            res.status(403).send({
                success: false,
                message: "No Token provided!"
            });
        }
    });


    // =========================================================================
    // AUTHORIZED ZONE START
    // =========================================================================


    // =========================================================================
    // UPDATE USER PROFILE
    api.post('/update', function(req, res) {
        User.findById(req.body.id, function(err, user) {
            if (err) {
                console.log("Error find user by ID in database (Update): " + err);
                res.json({
                    success: false,
                    message: err
                });
                return;
            }

            user.email = req.body.email;
            user.yaname = req.body.yaname;
            user.yatoken = req.body.yatoken;
            user.password = req.body.password;

            user.save(function(err) {
                if (err) {
                    console.log("Error save user profile in database (Update): " + err);
                    res.json({
                        success: false,
                        message: err
                    });
                    return;
                }

                var token = createToken(user);
                res.json({
                    success: true,
                    message: 'User has been updated!',
                    token: token
                });
            });

        });
    }); // END UPDATE USER PROFILE


    // =========================================================================
    // GET USERS LIST
    // DEV ONLY
    // api.get('/users', function(req, res) {
    //     User.find({}, function(err, users) {
    //         if (err) {
    //             res.send(err);
    //             return;
    //         }
    //         res.send(users);
    //     });
    // });
    // END GET USERS LIST


    // =========================================================================
    // GET YANDEX TOKEN
    api.get('/yatoken', function(req, res) {
        // create request structure to Yandex
        var my_request = {
            method: 'POST',
            url: 'https://oauth.yandex.ru/token',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            form: {
                grant_type: 'authorization_code',
                code: req.query.code,
                client_id: '55b76b040b2f4b60a01fa9c7143123a2',
                client_secret: 'd8e2e4568f7b41baba4727dc894896df'
            }
        };

        // execute the query to Yandex
        request(my_request, function(error, response, body) {
            if (error) {
                console.log('Error getting the Yandex token: ' + error);
                res.status(400).send('Error getting the Yandex token');
            } else {
                // now try find user to update profile with token
                User.findById(req.decoded.id, function(err, user) {
                    if (err) {
                        console.log('Error find user by database (getting the Yandex token): ' + err);
                        res.send(err);
                        return;
                    }

                    user.yatoken = JSON.parse(body).access_token;
                    user.save(function(err) {
                        if (err) {
                            console.log('Error save user in database (getting the Yandex token): ' + err);
                            res.send(err);
                            return;
                        }

                        var token = createToken(user);
                        // console.log('Yandex token was saved: '+user.yatoken);
                        res.json({
                            success: true,
                            message: 'User got Yandex token Successfully!',
                            token: token
                        });
                    }); // end save
                }); // end find by ID
            } // end else if
        }); // end request
    }); // END GET YANDEX TOKEN


    // =========================================================================
    // GET ALBUMS LIST FROM database
    api.get('/albums', function(req, res) {
        Album.find({
            owner: req.decoded.id
        }).sort( '-updated_at' ).exec( function(err, albums) {
            if (err) {
                console.log('Error getting Albums list from database: ' + err);
                res.status(404).send(err);
                return;
            }
            res.json(albums);
        });
    }); // END GET ALBUMS LIST FROM database


    // =========================================================================
    // GET ONE ALBUM FROM database
    api.get('/albums/:id', function(req, res, next) {
        Album.findById(req.params.id, function(err, album) {
            if (err) {
                console.log('Error find Album by ID in database: ' + err);
                return next(err);
            }
            res.send(album);
        });
    }); // END GET ONE ALBUM FROM database


    // =========================================================================
    // GET ALL ALBUMS FROM YANDEX
    api.get('/sync/albums', function(req, res) {

        // create request structure to Yandex
        var my_request = {
            method: 'GET',
            url: 'http://api-fotki.yandex.ru/api/users/' + req.decoded.yaname + '/albums/published/?limit=10',
            headers: {
                'Accept': 'application/json',
                authorization: 'OAuth ' + req.decoded.yatoken
            }
        };

        // execute the query to Yandex
        request(my_request, function(error, response, body) {
            if (error) {
                console.log('Error execute request to get all Albums from Yandex: ' + error);
                res.status(response.statusCode).send({ message: 'Error execute request to get all Albums from Yandex!' });
            }
            else {
                // console.log('Got albums from Yandex: ', body);

                var info = JSON.parse(body);
                var albums = info.entries;

                var totalAlbums = 0;
                var totalNewAlbums = 0;
                var totalSkippedAlbums = 0;

                async.each(albums,
                    function(item, callback) {
                        // console.log(item); // only for debugging

                        // if album from Yandex have not title image
                        // we add special empty image
                        var AlbumImage = 'https://placeholdit.imgix.net/~text?w=75&h=75';

                        // Checking - is props 'item.img.XXS.href' realy exist in object
                        if (item.img) {
                            if (item.img.XXS)
                                if (item.img.XXS.href)
                                    AlbumImage = item.img.XXS.href;
                        }
                        var album = new Album({
                            _id: item.id,
                            owner: req.decoded.id,
                            title: item.title,
                            summary: item.summary,
                            img: AlbumImage,
                            link: item.links.alternate,
                            linkjson: item.links.photos,
                            linkself: item.links.self,
                            imageCount: item.imageCount,
                            photos: [],
                            updated_at : Date.now()
                        });

                        totalAlbums = totalAlbums + 1;
                        album.save(function(err) {
                            if (err) {
                                // 11000 - special code about existing object in MongoDB
                                if (err.code == 11000) {
                                    totalSkippedAlbums = totalSkippedAlbums + 1;
                                    // console.log(album.title + ' already exists!');
                                    callback();
                                    return;
                                } else {
                                    // some other erros write to console
                                    console.log('Error save Album in database: ' + err);
                                }
                                callback();
                                return next(err);
                            } else {
                                totalNewAlbums = totalNewAlbums + 1;
                                callback();
                            }
                        }); // end save to MongoDB

                    },
                    // 3rd param is the function to call when everything's done
                    function(err) {
                        if (err) {
                            // return next(err);
                            console.log('Error getting Albums from Yandex (in async waterfall): ' + err);
                            res.status(404).send({ message: 'Error getting Albums from Yandex!' });
                        } else {
                            // prepare info for sending to client
                            var message = 'Total albums: ' + totalAlbums + '<br />including new: ' + totalNewAlbums + '<br />skipped: ' + totalSkippedAlbums;
                            var answer = {
                                // body: body, // only for debugging
                                message: message
                            };
                            res.status(200).send(answer);
                        }
                    }
                ); // end async
            } // end if else errors
        }); // end request
    }); // END GET ALL ALBUMS FROM YANDEX

    // =========================================================================
    // SAVE ALBUM IN database
    api.post('/saveAlbum', function(req, res) {
        var album_id = req.body._id;
        // Album.find({ owner: req.decoded.id, _id: album_id }, function(err, myalbum) {
        Album.findById(album_id, function(err, myalbum) {
            if (err) {
                console.log('Error find Album by ID in database: ' + err);
                res.status(404).send({ message: 'Error find Album by ID in database!' });
            } else {
                myalbum.title = req.body.title;
                myalbum.updated_at = Date.now();
                // save to DB
                myalbum.save(function(err) {
                    if (err) {
                        console.log('Error save Album in database: ' + err);
                        res.status(409).send(err);
                    } else {
                        res.status(200).send({ status: 'ok' });
                    }
                }); // end save
            } // end else if err
        });
    }); // END SAVE ALBUM IN database


    // =========================================================================
    // DELETE ALBUM from database and Yandex
    api.delete('/albums/:id', function(req, res, next) {
        Album.findById(req.params.id, function(err, myalbum) {
            if (err) {
                console.log('Error find Album by ID in database: ' + err);
                res.status(404).send({ message: 'Error find Album by ID in database!' });
            } else {
                // first of all - deleting album from Yandex
                var my_request = {
                    method: 'DELETE',
                    url: myalbum.linkself,
                    headers: {
                        'Accept': 'application/json',
                        authorization: 'OAuth ' + req.decoded.yatoken
                    }
                };
                request(my_request, function(error, response, body) {
                    if (error) {
                        console.log('Error execute request to Yandex for deleting Album: ' + error);
                        res.status(404).send({ message: 'Error execute request to Yandex for deleting Album!' });
                    } else {
                        // if request was success - remove Album from database
                        myalbum.remove(function(err) {
                            if (err) {
                                console.log('Error remove Album from database: ' + error);
                                res.status(404).send({ message: 'Error remove Album from database!' });
                            } else {
                                res.status(200).send({
                                    status: 'ok'
                                });
                            }
                        }); // end remove
                    } // end if else error
                }); // end request to Yandex
            } // end if else error
        }); // end find album by ID
    }); // END DELETE ALBUM from database and Yandex


    // =========================================================================
    // ADD NEW ALBUM to database and Yandex
    api.post('/newAlbum', function(req, res) {
        var title = req.body.data.title;
        var my_request = {
            method: 'POST',
            url: 'http://api-fotki.yandex.ru/api/users/'+ req.decoded.yaname +'/albums/',
            headers: {
                'content-type': 'application/atom+xml; charset=utf-8; type=entry',
                'Accept': 'application/json',
                authorization: 'OAuth ' + req.decoded.yatoken
            },
            body: '<entry xmlns="http://www.w3.org/2005/Atom" xmlns:f="yandex:fotki">\n  <title>' + title + '</title>\n</entry>'
        };
        // first of all create new Album in Yandex
        request(my_request, function(error, response, body) {
            if (!error && response.statusCode == 201) {
                // console.log('New Album: '+body); // debugging only
                newYandexAlbum = JSON.parse(body);

                // now save to database
                var album = new Album({
                    _id: newYandexAlbum.id,
                    owner: req.decoded.id,
                    title: newYandexAlbum.title,
                    summary: newYandexAlbum.summary,
                    img: 'https://placeholdit.imgix.net/~text?w=75&h=75',
                    link: newYandexAlbum.links.alternate,
                    linkjson: newYandexAlbum.links.photos,
                    linkself: newYandexAlbum.links.self,
                    imageCount: newYandexAlbum.imageCount,
                    photos: [],
                    updated_at : Date.now()
                });

                album.save(function(err) {
                    if (err) {
                        console.log('Error save new Album in database: ' + err);
                        res.status(404).send({ message: 'Error save new Album in database!' });
                    } else {
                        res.status(200).send(album);
                    }
                }); // end save to MongoDB
            } else {
                console.log('Error execute request to create new Album in Yandex: ' + error);
                res.status(response.statusCode).send({ message: 'Error execute request to create new Album in Yandex!' });
            }

        });

    }); // END ADD NEW ALBUM to database and Yandex

    ////////////////////
    // SYNC PHOTOS START
    function PhotoExist(id_photo, array) {
        for (var i = 0; i < array.length; i++) {
            if (array[i]._id === id_photo)
                return true;
        }
        return false;
    }

    // =========================================================================
    // GET PHOTOS OF ALBUM FROM YANDEX
    api.get('/sync/photos', function(req, res, next) {

        var totalPhotos = 0;
        var totalNewPhotos = 0;
        var totalSkippedPhotos = 0;

        async.waterfall([
            function(callback) {
                // firstof all - get album from database
                Album.findById(req.query.id, function(err, myalbum) {
                    if (err) {
                        console.log('Error find Album by ID in database: ' + err);
                        return next(err);
                    }
                    callback(err, myalbum);
                });
            },
            function(myalbum, callback) {
                // Now - get photos from Yandex and go to the next function
                request({ method: 'GET', qs: {format: 'json'}, url: myalbum.linkjson }, function(error, response, body) {
                    if (error) {
                        console.log('Error execute request Album photos from Yandex: ', error);
                        callback(error, myalbum);
                    } else {
                        console.log('Get photos! '+body);
                        var yadata = JSON.parse(body);
                        // console.log('yandex data: ' + yadata); // only for debugging
                        var myphotos = yadata.entries;
                        callback(null, myalbum, myphotos);
                    }
                }); // end request

            },
            function(myalbum, myphotos, callback) {
                // save all photos information in MongoDB
                _.each(myphotos, function(myphoto) {
                    totalPhotos = totalPhotos + 1;
                    // we will save to MongoDB only new photos
                    // check existing photo by ID
                    if (PhotoExist(myphoto.id, myalbum.photos)) {
                        totalSkippedPhotos = totalSkippedPhotos + 1;
                        console.log('Photo: ' + myphoto.id + ' is already exists in database (skiping...)');
                    } else {
                        totalNewPhotos = totalNewPhotos + 1;
                        myalbum.photos.push({
                            _id: myphoto.id,
                            title: myphoto.title,
                            link: myphoto.links.alternate,
                            linkself: myphoto.links.self,
                            images: myphoto.img
                        });
                    }

                }); // end each

                // before save - update numbers of photos in Yandex
                myalbum.imageCount = totalPhotos;
                myalbum.updated_at = Date.now();

                // save photos array in MongoDB
                myalbum.save(function(err) {
                    if (err) {
                        console.log('Error save Album (Photos array) in database: ' + err);
                        callback(err);
                    } else {
                        callback(err, myalbum);
                    }
                }); // end save

            }
        ], function(err, myalbum) {
            if (err) {
                console.log('Error getting Photos from Yandex (in async waterfall): ' + err);
                res.status(404).send({ message: 'Error getting Photos from Yandex!' });
            } else {
                var message = 'Total photos: ' + totalPhotos + '<br />including new: ' + totalNewPhotos + '<br />skipped: ' + totalSkippedPhotos;
                var answer = {
                    // body: myalbum, // only for debugging
                    message: message
                };
                res.status(200).send(answer);
            }

        }); // end waterfall

    }); // END GET PHOTOS OF ALBUM FROM YANDEX


    // =========================================================================
    // UPDATE PHOTO IN database
    api.post('/savePhoto', function(req, res) {
        var photo_id = req.body._id;
        Album.findOne({
            'photos._id': photo_id
        }, function(err, myalbum) {
            if (err) {
                console.log('Error find Album by ID in database: ' + err);
                res.status(404).send({ message: 'Error find Album by ID in database!' });
            } else {
                _.each(myalbum.photos, function(myphoto) {
                    if (myphoto.id === photo_id) {
                        myphoto.title = req.body.title;
                    }
                });

                myalbum.updated_at = Date.now();
                // save to DB
                myalbum.save(function(err) {
                    if (err) {
                        console.log('Error save Album (Photos array) in database: ' + err);
                        res.status(404).send({ message: 'Error save Album (Photos array) in database!' });
                    } else {
                        res.status(200).send({ message: 'ok' });
                    }
                }); // end save
            } // end if else error
        }); // end find by ID
    }); // END UPDATE PHOTO IN database


    // =========================================================================
    // UPDATE ALL PHOTOS IN database
    api.post('/saveAllPhotos', function(req, res) {
        var album_id = req.body._id;
        console.log('Album id: ' + album_id);
        Album.findById(album_id, function(err, myalbum) {
            if (err) {
                console.log('Error find Album by ID in database: ' + err);
                res.status(404).send({ message: 'Error find Album by ID in database!' });
            } else {
                // _.each(myalbum.photos, function(myphoto) {
                //     if (myphoto.id === photo_id) {
                //         myphoto.title = req.body.title;
                //     }
                // });
                myalbum.photos = req.body.photos;

                myalbum.updated_at = Date.now();
                // save to DB
                myalbum.save(function(err) {
                    if (err) {
                        console.log('Error save Album (All Photos array) in database: ' + err);
                        res.status(404).send({ message: 'Error save Album (All Photos array) in database!' });
                    } else {
                        res.status(200).send({ message: 'ok' });
                    }
                }); // end save
            } // end if else error
        }); // end find by ID
    }); // END UPDATE ALL PHOTOS IN database


    // =========================================================================
    // DELETE PHOTO
    api.delete('/photo/:id', function(req, res, next) {
        var photo_id = req.params.id;
        var photo_index = req.query.index;
        Album.findOne({
            'photos._id': photo_id
        }, function(err, myalbum) {
            if (err) {
                console.log('Error find Album by photo ID in database: ' + err);
                res.status(404).send({ message: 'Error find Album by photo ID in database!' });
            } else {
                // first of all - deleting photo from Yandex
                var my_request = {
                    method: 'DELETE',
                    url: myalbum.photos[photo_index].linkself,
                    headers: {
                        'Accept': 'application/json',
                        authorization: 'OAuth ' + req.decoded.yatoken
                    }
                };
                request(my_request, function(error, response, body) {
                    if (error) {
                        console.log('Error execute request to delete photo in Yandex: ' + error);
                        res.status(404).send({ message: 'Error execute request to delete photo in Yandex!' });
                    } else {
                        // deleting photo from array by index
                        myalbum.photos.splice(photo_index, 1);
                        myalbum.updated_at = Date.now();

                        // save to DB
                        myalbum.save(function(err) {
                            if (err) {
                                console.log('Error save Album in database (after deleting photo): ' + err);
                                res.status(409).send({ message: 'Error save Album in database (after deleting photo)!' });
                            } else {
                                res.status(200).send({
                                    status: 'ok'
                                });
                            }
                        }); // end save
                    } // end else if error request
                }); // end request to Yandex
            } // end else if error finding
        }); // end finding
    }); // END DELETE PHOTO

// =========================================================================
// UPLOAD FILES
api.post('/uploadphotos', multipartMiddleware, function(req, res) {
    // console.log(req.body);
    // console.log(req.files);

    var MyFile = req.files.file;
    var MyFileName = MyFile.originalFilename;
    var AlbumID = req.headers['album-id'];

    Album.findById(AlbumID, function(err, myalbum) {
        if (err) {
            console.log('Error find Album by ID in database: ' + err);
            res.status(404).send({ message: 'Error find Album by ID in database!' });
        } else {

            var AlbumUrl = myalbum.linkjson.replace("?format=json", "");
            var my_request1 = {
                method: 'POST',
                url: AlbumUrl,
                headers: {
                    'content-type': 'image/jpeg',
                    'Content-Length': MyFile.size,
                    authorization: 'OAuth ' + req.decoded.yatoken
                },
                body: fs.readFileSync(MyFile.path)
            };

            request(my_request1, function(error, response, body) {
                if (error) {
                    console.log('Error upload photo to Yandex: ' + error);
                    res.status(404).send({ message: 'Error upload photo to Yandex!' });
                }
                else {
                    // console.log('***********************************************');
                    // console.log('body from yandex: ' + body);
                    var AtomText = body;
                    // преобразуем в атом тексте некоторые поля
                    AtomText = AtomText.replace('private', 'public');
                    AtomText = AtomText.replace('Фотка', MyFileName);
                    var UrlPhoto = AtomText.match(/<link href="(.*?)" rel="self" \/>/)[1];

                    //console.log('============');
                    //console.log('UrlPhoto: ['+UrlPhoto+']');
                    //console.log(AtomText);

                    ////////////////////////
                    // ВТОРОЙ ЗАППРОС
                    var my_request2 = {
                        method: 'PUT',
                        url: UrlPhoto,
                        headers: {
                            'content-type': 'application/atom+xml; charset=utf-8; type=entry',
                            'Accept': 'application/json',
                            authorization: 'OAuth ' + req.decoded.yatoken
                        },
                        body: AtomText
                    };
                    request(my_request2, function(error, response, body) {
                        if (error) {
                            console.log('Error update access photo in Yandex: ' + error);
                            res.status(404).send({ message: 'Error update access photo in Yandex!' });
                        } else {
                            //console.log('final answer from Yandex; '+body);
                            // and save new foto in database
                            myphoto = JSON.parse(body);
                            myalbum.photos.push({
                                _id: myphoto.id,
                                title: myphoto.title,
                                link: myphoto.links.alternate,
                                linkself: myphoto.links.self,
                                images: myphoto.img
                            });
                            myalbum.updated_at = Date.now();

                            myalbum.save(function(err) {
                                if (err) {
                                    console.log('Error save Album (new photo) in database: ' + err);
                                    res.status(404).send({ message: 'Error save Album (new photo) in database!' });
                                } else {
                                    res.status(200).send("OK");
                                }
                            }); // end save in database
                        }
                    }); // end second request to Yandex

                } // end else id error first request

            }); // end first request to Yandex

        } // end if else error
    }); // end find album by ID

    // don't forget to delete all req.files when done
});

    // =========================================================================
    // GET USER PROFILE
    api.get('/me', function(req, res) {
        // console.log(req.decoded);
        res.send(req.decoded);
    });

    return api;

};
