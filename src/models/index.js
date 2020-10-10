var fs = require("fs");
var path = require("path");
var Sequelize = require("sequelize");
var sequelize = new Sequelize(process.env.DB, process.env.USERT, process.env.PASSWORD, {
    host: process.env.HOST,
    dialect: 'mysql',
    // operatorsAliases: false
});
var db = {};

fs.readdirSync(__dirname).filter(function(file) {
    return (file.indexOf(".") !== 0) && (file !== "index.js");
}).forEach(function(file) {
    var model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
});

Object.keys(db).forEach(function(modelName) {
    if ("associate" in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.rawQuery = (sql)=>{
    return new Promise((resolve,reject)=>{
      sequelize.query(sql).spread(function(results, metadata) {
          resolve({
            results : results,
            metadata : metadata
          });
      }).catch(err=>{
        reject(err);
      });
    });
  }

  db.rawQuery1 = async(sql, arr = [])=>{
    console.log("arr is >>>>", arr);
   return await sequelize.query(sql, arr).then(results => resolve(results)).catch(err=> err);
  }

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;