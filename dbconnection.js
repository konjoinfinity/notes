const mongoose = require("mongoose");
mongoose.Promise = Promise;

if (process.env.NODE_ENV == "production") {
  //connect to production database via mongo url connect string
  mongoose.connect(process.env.DB_URL, {
  }, function(err) {
    if (err) {throw err;
    } else {console.log("Production Database Connection Successful");}
    })
} else {
  //connect to local database (mongod)
  mongoose.connect("mongodb://localhost/konjomusic", {
  }, function(err) {
    if (err) {throw err;
    } else {console.log("Development Database Connection Successful")}
    });
}

module.exports = mongoose;
