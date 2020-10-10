const db = require('../utils/ballebaaziQuiz_db');
const Mysql_dt = require('../utils/mySql_dateTime');
const Utils = require('../utils');
const Constants = require('../utils/Constants');
const Bluebird = require('bluebird');
var moment = require('moment');
let currentDateTime = moment().format('YYYY-MM-DD h:mm:ss')

module.exports = {
    getActiveQuizes: async(quizId = false) =>{

        let query = `SELECT
        t1.*,
        CASE
            WHEN t1.start_date_unix IS NOT NULL THEN (start_date_unix - UNIX_TIMESTAMP() + (closing_ts * 60))
            ELSE 1
        END AS closed
    FROM
        qb_matches AS t1 where `

        let Values = []

        if(quizId){
            query += `  t1.match_key = ? and `
            Values.push(quizId)
        }

        query += ` t1.active = ? and play_type = ? and t1.admin_status = ? having closed >= ?  `;

        console.log("Query is >>>", query)
        Values = [...Values, 1, Constants.PLAY_TYPE.CRICKET, 1, 1]
        console.log("Values are  >>>>", Values)

        return db.query(query, Values);
    }

}