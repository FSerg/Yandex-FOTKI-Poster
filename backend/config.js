
// Production specific configuration
// =================================
var MONGODB_ADDR = process.env.MONGODB_PORT_27017_TCP_ADDR || process.env.MONGODB_ADDRESS || 'localhost';
var MONGODB_PORT = process.env.MONGODB_PORT || 27017;
var MONGODB_USER = process.env.MONGODB_USER;
var MONGODB_PASS = process.env.MONGODB_PASS;

var MONGO_CONNECTION;
if (process.env.NODE_ENV === 'production') {
    MONGO_CONNECTION = 'mongodb://'+ MONGODB_USER +':'+ MONGODB_PASS +'@' + MONGODB_ADDR + ':' + MONGODB_PORT + '/yandex-fotki-poster';
}
else {
    MONGO_CONNECTION = 'mongodb://' + MONGODB_ADDR + ':' + MONGODB_PORT + '/yandex-fotki-poster';
}

module.exports = {
    // example database config string
    // "database": "mongodb://<dbuser>:<dbpassword>@xxx.mongolab.com:xxxxx/dbname",
    "database": MONGO_CONNECTION,

    "port": process.env.PORT || 3000, // usually 3000, but Tutum Nginx proxy container work only with 80
    "secretKey": process.env.SECRETKEY || "My super secret key"

};
