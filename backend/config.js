
// Production specific configuration
// =================================
var MONGO_ADDR = process.env.MONGO_PORT_27017_TCP_ADDR || 'localhost';
var MONGO_PORT = process.env.MONGO_PORT_27017_TCP_PORT || 27017;

module.exports = {

  // example database config string
  // "database": "mongodb://<dbuser>:<dbpassword>@xxx.mongolab.com:xxxxx/dbname",
  // "database": process.env.MONGODB || "localhost",
  // MongoDB connection options
  database: 'mongodb://' + MONGO_ADDR + ':' + MONGO_PORT + '/yandex-fotki-poster',

  "port": process.env.PORT || 3000,
  "secretKey": process.env.SECRETKEY || "My super secret key"

};
