module.exports = {

  // example database config string
  // "database": "mongodb://<dbuser>:<dbpassword>@xxx.mongolab.com:xxxxx/dbname",
  "database": process.env.MONGODB || "localhost",
  "port": process.env.PORT || 3000,
  "secretKey": process.env.SECRETKEY || "My super secret key"

};
