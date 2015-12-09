
// Production specific configuration
// =================================
var MONGODB_ADDR = process.env.MONGODB_PORT_27017_TCP_ADDR || 'localhost';
var MONGODB_PORT = process.env.MONGODB_PORT_27017_TCP_PORT || 27017;

module.exports = {

  // example database config string
  // "database": "mongodb://<dbuser>:<dbpassword>@xxx.mongolab.com:xxxxx/dbname",
  // "database": process.env.MONGODB || "localhost",
  // MongoDB connection options
  database: 'mongodb://' + MONGODB_ADDR + ':' + MONGODB_PORT + '/yandex-fotki-poster',

  "port": process.env.PORT || 3000, // usually 3000, but for Tutum service need 80
  "secretKey": process.env.SECRETKEY || "My super secret key"

};
