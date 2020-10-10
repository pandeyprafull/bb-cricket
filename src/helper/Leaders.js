let Models = require('../models');
let moment = require('moment');
let currentDateUtc = moment().subtract(330, 'minutes').format('YYYY-MM-DD HH:mm:ss');

module.exports = {
    getLeaders: async (lid, userId, offset = false, limit = false, self = false, table) => {
        let columns = ``,
            where, joinTable, On, order, sql;
        table = ` ${table} as t1 `;
        columns += ` t1.* `;
        joinTable = ` bb_users as t2 `;
        On = ` t1.user_id=t2.user_id `;
        columns += ` , t2.name as name, t2.image as image `;
        limit = 0;
        offset = 0;

        if (self) {
            where = ` t1.user_id = ${userId} and t1.leaderboard_id = ${lid} `;
            sql = `select ${columns} from ${table} left join ${joinTable} on ${On}  where ${where}`;
        } else {
            where = ` leaderboard_id = ${lid} `;
            order = ` rank ASC, leader_id ASC `;
            if (limit) {
                offset = offset;
                limit = limit;
                sql = `select ${columns} from ${table} left join ${joinTable} on ${On}  where ${where} order by ${order} limit ${limit} offset ${offset} `;
            }
            sql = `select ${columns} from ${table} left join ${joinTable} on ${On}  where ${where} order by ${order} `;
        }
        try {
            console.log("query .....", sql);
            return await Models.rawQuery(sql)

        } catch (e) {
            console.log("ERROR is>>>>", e);
            return e
        }

    },
}