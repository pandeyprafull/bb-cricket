
const util = require('util');
require('util.promisify').shim();
const mysql = require('mysql');
const config = require('../config');
//  const pool = mysql.createPool(config.football_db);
 const pool = {  }


/**
 *
 *
 * pool.getConnection((err, connection) => {
    if (err)
        console.log(err);
    if (connection) {
        console.log("footbal_db connected....");
        connection.release()
    }
});
pool.on('acquire', function(connection) {
    // console.log('Connection %d acquired', connection.threadId);
});
// pool.on('connection', function(connection) {
//     connection.query('SET SESSION auto_increment_increment=1')
// });
pool.on('enqueue', function() {
    console.log('Waiting for available connection slot');
});


pool.query = util.promisify(pool.query)
*/


module.exports = pool