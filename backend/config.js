
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

  "port": process.env.PORT || 80, // usually 3000, but for Tutum service need 80
  "secretKey": process.env.SECRETKEY || "My super secret key"

};
