
// Production specific configuration
// =================================
var MONGODB_ADDR = process.env.MONGODB_ENV_TUTUM_IP_ADDRESS || process.env.MONGODB_ADDRESS || 'localhost';
var MONGODB_PORT = process.env.MONGODB_PORT || 27017;
var MONGODB_USER = process.env.MONGODB_USER || 'admin';
var MONGODB_PASS = process.env.MONGODB_ENV_MONGODB_PASS || process.env.MONGODB_PASS || '123456';

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

    "port": process.env.PORT || 3000, // usually 3000, but for Tutum service need 80
    "secretKey": process.env.SECRETKEY || "My super secret key"

};
