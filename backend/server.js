var express = require('../node_modules/express');
var request = require('../node_modules/request');
var mongoose = require('../node_modules/mongoose');
var path = require('../node_modules/path');
var logger = require('../node_modules/morgan');
var bodyParser = require('../node_modules/body-parser');
var config = require('./config');

mongoose.connect(config.database, {auth: {authdb: 'admin'}}, function(err) {
    console.log('Connection string: '+config.database); // for debugging only
    if (err) {
        console.log(err);
    } else {
        console.log("Connected to MongoDB!");
    }
});


var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger('dev'));

app.use(express.static(path.join(__dirname, '../frontend')));

var api = require('./api')(app, express);
app.use('/api', api);

app.listen(config.port, function(err) {
  if(err) {
      console.log(err);
  } else {
      console.log('Server work! port ' + config.port);
  }
});

/*
app.post('/saveAlbum', function(req, res) {
  var album_id = req.body._id;
  Album.findById(album_id, function(err, myalbum) {
    if (err) {
      console.log('Error Album.findById(): ' + err);
      res.status(404).send('Не удалось найти альбом в БД по ID!');
    } else {
      myalbum.title = req.body.title;
      // save to DB
      myalbum.save(function(err) {
        if (err) {
          res.status(409).send(err);
        } else {
          res.status(200).send({status: 'ok'});
        }
      }); // конец сохранения в БД
    }
  }); // конец поиска альбома в БД

}); // конец АПИ обновления имени альбома в БД

app.post('/savePhoto', function(req, res) {
  console.log('_id: '+req.body._id);
  var photo_id = req.body._id;
  Album.findOne({ 'photos._id': photo_id }, function(err, myalbum) {
    if (err){
      res.status(409).send(err);
    }
    else {
      //console.log('myalbum before: '+myalbum);
      _.each(myalbum.photos, function(myphoto) {

          if( myphoto.id == photo_id ) {
            console.log('Нашли фото: '+myphoto);
            myphoto.title = req.body.title;
          }

        }); // конец перебора фоток
      //console.log('myalbum after: '+myalbum);

      // save to DB
      myalbum.save(function(err) {
        if (err) {
          res.status(409).send(err);
        } else {
          res.status(200).send({status: 'ok'});
        }
      }); // конец сохранения в БД

    }
  }); // конец поиска альбома в БД по ID фотки

}); // конец АПИ обновления имени фото в БД

app.delete('/api/photo/:id', function(req, res, next) {
  var photo_id = req.params.id;
  var photo_index = req.query.index;
  Album.findOne({
    'photos._id': photo_id
  }, function(err, myalbum) {
    if (err) {
      console.log('Error Album.findOne(): '+err);
      res.status(409).send('Не удалось получить данные в БД по ID фото!');
    } else {

      // console.log('del link: '+myalbum.photos[photo_index].linkself);
      // удаляем в яндексе
      var options = {
        method: 'DELETE',
        url: myalbum.photos[photo_index].linkself,
        headers: {
          'Accept': 'application/json',
          authorization: 'OAuth 309647031b8c4261858188269332a7a5'
        }
      };
      request(options, function(error, response, body) {
        if (!error) {

          //console.log('myalbum before: '+myalbum);
          myalbum.photos.splice(photo_index, 1);
          // console.log('myalbum after: '+myalbum);

          // save to DB
          myalbum.save(function(err) {
            if (err) {
              console.log('Error myalbum.save((): '+err);
              res.status(404).send('Не удалось сохранить изменения в БД!');
              //res.status(409).send(err);
            } else {
              res.status(200).send({status: 'ok'});
            }
          }); // конец сохранения в БД
        }
        else {
            //res.status(409).send(error);
            console.log('Error request(Ya DELETE): '+error);
            res.status(404).send('Не удалось удалить фотографию в Яндексе!');
        }
      }); // конец запроса к яндексу!

    }
  });
}); // конец АПИ удаления фотоки

app.get('/api/albums', function(req, res, next) {
  var query = Album.find();
  //query.limit(7); // ограничивал для отладки
  query.exec(function(err, albums) {
    if (err) return next(err);
    res.send(albums);
  });
}); // конец АПИ получения всех альбомов из БД

app.get('/api/albums/:id', function(req, res, next) {
  Album.findById(req.params.id, function(err, album) {
    if (err) return next(err);
    res.send(album);
  });
}); // конец АПИ получения алибома из БД

app.delete('/api/albums/:id', function(req, res, next) {

  Album.findById(req.params.id, function(err, myalbum) {
    if (err) {
      console.log('Error Album.findById(): ' + err);
      res.status(404).send('Не удалось найти альбом в БД по ID!');
    } else {

      // сначала удаляем в яндексе, потом в БД
      var options = {
        method: 'DELETE',
        url: myalbum.linkself,
        headers: {
          'Accept': 'application/json',
          authorization: 'OAuth 309647031b8c4261858188269332a7a5'
        }
      };
      request(options, function(error, response, body) {
        if (!error) {

          myalbum.remove(function(err) {
            if (err) {
              console.log('Error Album.findByIdAndRemove(): ' + err);
              res.status(404).send('Не удалось удалить альбом в БД!');
            } else {
              res.status(200).send({status: 'ok'});
            }
          }); // конец удаления альбома в БД
        }
        else {
            console.log('Error request(Ya album DELETE): '+error);
            res.status(404).send('Не удалось удалить альбом в Яндексе!');
        }
      }); // конец запроса к яндексу!
    }
  }); // конец поиска альбома в БД

}); // конец АПИ удаления альбома

app.get('/api/sync/albums', function(req, res, next) {
  var options = {
    method: 'GET',
    url: 'http://api-fotki.yandex.ru/api/users/sergfserg/albums/published/?limit=10',
    headers: {
      'Accept': 'application/json',
      authorization: 'OAuth 309647031b8c4261858188269332a7a5'
    }
  };

  request(options, function(error, response, body) {
    if (!error) {
      // запрос к яндексу выполнился без ошибок!
      //console.log('get albums ok: ', body);

      var info = JSON.parse(body);
      var albums = info.entries;

      var totalAlbums = 0;
      var totalNewAlbums = 0;
      var totalSkippedAlbums = 0;

      async.each(albums,
        function(item, callback) {
          // console.log(item); // выводили все альбомы в консоль для отладки

          // у альбово без фоток нет картинки обложки, поэтому добавляем проверку
          // и оставляем это поле пустым (особым), если фоток нет
          var AlbumImage = 'https://placeholdit.imgix.net/~text?w=75&h=75';
          if (item.imageCount > 0) {
            AlbumImage = item.img.XXS.href;
          }
          var album = new Album({
            _id: item.id,
            title: item.title,
            summary: item.summary,
            img: AlbumImage,
            link: item.links.alternate,
            linkjson: item.links.photos,
            linkself: item.links.self,
            imageCount: item.imageCount,
            photos: []
          });

          totalAlbums = totalAlbums + 1;
          album.save(function(err) {
            if (err) {
              // 11000 - это штатная ошибка, дули просто пропускаем
              if (err.code == 11000) {
                totalSkippedAlbums = totalSkippedAlbums + 1;
                // console.log(album.title + ' already exists!');
                callback();
                return;
              }
              else {
                // остальные ошибки работы с БД выводим пока в консоль
                console.log('Error when try to save Albums to DB: '+err);
              }
              callback();
              return next(err);
            } else {
              totalNewAlbums = totalNewAlbums + 1;
              callback();
            }
          }); // конец сохранения в БД

        },
        // 3rd param is the function to call when everything's done
        function(err) {
          if (err) {
            //return next(err);
            console.log('Error sync Albums (waterfall): '+err);
            res.status(409).send('Ошибка синхронизации альбомов на сервере!');
          }
          else {
            // info for sending to client
            var message = 'Всего альбомов: ' + totalAlbums + '<br />из них новых: ' + totalNewAlbums + '<br />пропущено: ' + totalSkippedAlbums;
            var answer = {
              body: body,
              message: message
            };
            res.status(200).send(answer);
          }
        }
      ); // конец асинхронного цикла

    } else {
      // при запросе к яндексу произошла ошибка!
      console.log('Error get Albums (request Ya GET): '+error);
      res.status(response.statusCode).send('Ошибка при получении альбов от Яндекса!');
    }
  }); // конец запроса к яндексу!


}); // конец АПИ синхронизации альбомов

function PhotoExist(id_photo, array)
{
    for(var i = 0; i < array.length; i++)
    {
        if(array[i]._id == id_photo) return true;
    }
    return false;
}

app.get('/api/sync/photos', function(req, res, next) {

  var totalPhotos = 0;
  var totalNewPhotos = 0;
  var totalSkippedPhotos = 0;

  async.waterfall([
    function(callback) {
      // сначала получаем альбом из БД и передаем ее след.функции
      Album.findById(req.query.id, function(err, myalbum) {
        if (err) return next(err);
        //console.log('finded album: '+myalbum);
        callback(err, myalbum);
      });
    },
    function(myalbum, callback) {
      // теперь получаем данные из яндекса и передаем альбом и картинки в след.функцию
        request({method: 'GET', url: myalbum.linkjson}, function(error, response, body) {
          if (!error) {
            var yadata = JSON.parse(body);
            // console.log('yandex data: '+yadata);
            var myphotos = yadata.entries;
            callback(null, myalbum, myphotos);
          } else {
            console.log('Error get album photos: ', error);
            callback(error, myalbum);
          }
        });

    },
    function(myalbum, myphotos, callback) {
      // сохраняем все в БД
      _.each(myphotos, function(myphoto) {
          totalPhotos = totalPhotos + 1;
          // добавлять в массив нужно только новые фотки
          // нужно проверять, что такой фотки нет
          if( PhotoExist(myphoto.id, myalbum.photos) ) {
            totalSkippedPhotos = totalSkippedPhotos + 1;
            console.log('Photo: '+myphoto.id+' is already exists in DB (skiping...)');
          }
          else {
            totalNewPhotos = totalNewPhotos + 1;
            myalbum.photos.push({
              _id: myphoto.id,
              title: myphoto.title,
              link: myphoto.links.alternate,
              linkself: myphoto.links.self,
              images: myphoto.img
            });
          }

        }); // конец перебора фоток из данных яндекса

      // save to DB
      myalbum.save(function(err) {
        if (err) {
          console.log('Error when try to save Photos to DB: '+err);
          callback(err);
        } else {
          // console.log('Сохранили фотки в БД!');
          callback(err, myalbum);
        }
      }); // конец сохранения в БД
      //callback(err, album);

    }
    ], function (err, myalbum) {
      if (err) {
        console.log('Error sync Photos (waterfall): '+err);
        res.status(409).send('Ошибка при синхронизации фоток на сервере');
      }
      else {
        //console.log('Отправляем сообщение, что синхронизация фоток выполнена!');
        var message = 'Всего фотографий: ' + totalPhotos + '<br />из них новых: ' + totalNewPhotos + '<br />пропущено: ' + totalSkippedPhotos;
        var answer = {
          body: myalbum,
          message: message
        };
        res.status(200).send(answer);
      }

    }); // конец waterfall'а по синхронизации фоток


}); // конец АПИ синхронизации фоток
*/


app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.send(500, {
    message: err.message
  });
});

app.get('*', function(req, res) {
  res.redirect('/#' + req.originalUrl);
});
