
const util = require('util');
require('util.promisify').shim();
const mysql = require('mysql');
const config = require('../config');
 const pool = [];
//  const pool = mysql.createPool(config.Ballebaazi_quiz_db);
//  pool.getConnection((err, connection) => {
//     if (err)
//         console.log(err);
//     if (connection) {
//         console.log("Ballebaazi_quiz connected....");
//         connection.release()
//     }
// });
// pool.query = util.promisify(pool.query);
module.exports = pool