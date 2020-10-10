// const Sequelize = require('sequelize');
// console.log(process.env.DB)
// console.log(process.env.USERT)
// console.log(process.env.PASSWORD)
// console.log(process.env.HOST)
// const sequelize = new Sequelize(process.env.DB, process.env.USERT, process.env.PASSWORD, {
//     dialect: 'mysql',
//     host: process.env.HOST
// });

// module.exports = sequelize;

const util = require('util');

require('util.promisify').shim();

const mysql = require('mysql');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.HOST,
  user: process.env.USERT,
  password: process.env.PASSWORD,
  database: process.env.DB,
  port: '3306'
})


// Ping database to check for common exception errors.
pool.getConnection((err, connection) => {
  if (err) {
    console.log(err);
  }
  if (connection) {

    console.log("db connected");
    connection.release()

  }

})

pool.query = util.promisify(pool.query)

module.exports = pool